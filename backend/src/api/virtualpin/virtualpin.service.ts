import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { query } from '../../db/postgres';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';
import type { VirtualPin } from '../../types/index';
import type { CreatePinInput, UpdatePinInput } from './virtualpin.schema';

const influxClient = new InfluxDB({ url: env.INFLUX_URL, token: env.INFLUX_TOKEN });
const writeApi = influxClient.getWriteApi(env.INFLUX_ORG, env.INFLUX_BUCKET, 'ns');
const queryApi = influxClient.getQueryApi(env.INFLUX_ORG);

function mapPin(row: Record<string, unknown>): VirtualPin {
  return {
    id: row.id as string,
    deviceId: row.device_id as string,
    pinNumber: row.pin_number as number,
    label: row.label as string,
    direction: row.direction as VirtualPin['direction'],
    dataType: row.data_type as VirtualPin['dataType'],
    unit: row.unit as string,
    minValue: Number(row.min_value),
    maxValue: Number(row.max_value),
    lastValue: (row.last_value as string) ?? null,
    lastUpdated: (row.last_updated as Date)?.toISOString() ?? null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function getPins(deviceId: string): Promise<VirtualPin[]> {
  const result = await query(
    'SELECT * FROM virtual_pins WHERE device_id = $1 ORDER BY pin_number ASC',
    [deviceId]
  );
  return result.rows.map(mapPin);
}

export async function upsertPin(deviceId: string, input: CreatePinInput): Promise<VirtualPin> {
  const result = await query(
    `INSERT INTO virtual_pins (device_id, pin_number, label, direction, data_type, unit, min_value, max_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (device_id, pin_number)
     DO UPDATE SET
       label = EXCLUDED.label,
       direction = EXCLUDED.direction,
       data_type = EXCLUDED.data_type,
       unit = EXCLUDED.unit,
       min_value = EXCLUDED.min_value,
       max_value = EXCLUDED.max_value
     RETURNING *`,
    [deviceId, input.pinNumber, input.label, input.direction, input.dataType, input.unit, input.minValue, input.maxValue]
  );

  return mapPin(result.rows[0]);
}

export async function updatePin(deviceId: string, pinNumber: number, input: UpdatePinInput): Promise<VirtualPin> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.label !== undefined) {
    fields.push(`label = $${paramIndex++}`);
    values.push(input.label);
  }
  if (input.direction !== undefined) {
    fields.push(`direction = $${paramIndex++}`);
    values.push(input.direction);
  }
  if (input.dataType !== undefined) {
    fields.push(`data_type = $${paramIndex++}`);
    values.push(input.dataType);
  }
  if (input.unit !== undefined) {
    fields.push(`unit = $${paramIndex++}`);
    values.push(input.unit);
  }
  if (input.minValue !== undefined) {
    fields.push(`min_value = $${paramIndex++}`);
    values.push(input.minValue);
  }
  if (input.maxValue !== undefined) {
    fields.push(`max_value = $${paramIndex++}`);
    values.push(input.maxValue);
  }

  if (fields.length === 0) {
    throw new AppError('NO_FIELDS', 'No fields to update', 400);
  }

  values.push(deviceId, pinNumber);

  const result = await query(
    `UPDATE virtual_pins SET ${fields.join(', ')} WHERE device_id = $${paramIndex} AND pin_number = $${paramIndex + 1} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('PIN_NOT_FOUND', 'Virtual pin not found', 404);
  }

  return mapPin(result.rows[0]);
}

export async function deletePin(deviceId: string, pinNumber: number): Promise<void> {
  const result = await query(
    'DELETE FROM virtual_pins WHERE device_id = $1 AND pin_number = $2 RETURNING id',
    [deviceId, pinNumber]
  );

  if (result.rows.length === 0) {
    throw new AppError('PIN_NOT_FOUND', 'Virtual pin not found', 404);
  }
}

export async function getPinHistory(
  deviceId: string,
  pinNumber: number,
  from: string,
  to?: string,
  resolution = '5m',
  fn: 'mean' | 'max' | 'min' | 'last' = 'mean'
): Promise<{ pinNumber: number; field: string; points: { timestamp: string; value: number }[] }> {
  const rangeTo = to ? `stop: ${to}` : '';
  const fluxQuery = `
    from(bucket: "${env.INFLUX_BUCKET}")
      |> range(start: ${from}${rangeTo ? `, ${rangeTo}` : ''})
      |> filter(fn: (r) => r._measurement == "pin_data")
      |> filter(fn: (r) => r.device_id == "${deviceId}")
      |> filter(fn: (r) => r.pin_number == "V${pinNumber}")
      |> filter(fn: (r) => r._field == "value_num" or r._field == "value_str")
      |> aggregateWindow(every: ${resolution}, fn: ${fn}, createEmpty: false)
      |> yield(name: "result")
  `;

  const result = await queryApi.collectRows(fluxQuery);

  const points: { timestamp: string; value: number }[] = [];
  for (const row of result as Record<string, string>[]) {
    points.push({
      timestamp: row._time,
      value: parseFloat(row._value ?? '0'),
    });
  }

  return {
    pinNumber,
    field: 'value_num',
    points,
  };
}

export async function getPinLatest(deviceId: string, pinNumber: number): Promise<{
  pinNumber: number;
  value: string | null;
  updatedAt: string | null;
}> {
  const result = await query(
    'SELECT last_value, last_updated FROM virtual_pins WHERE device_id = $1 AND pin_number = $2',
    [deviceId, pinNumber]
  );

  if (result.rows.length === 0) {
    throw new AppError('PIN_NOT_FOUND', 'Virtual pin not found', 404);
  }

  const row = result.rows[0];
  return {
    pinNumber,
    value: (row.last_value as string) ?? null,
    updatedAt: (row.last_updated as Date)?.toISOString() ?? null,
  };
}

export async function writePinFromRest(deviceId: string, pinNumber: number, value: string): Promise<void> {
  const pinResult = await query(
    'SELECT direction FROM virtual_pins WHERE device_id = $1 AND pin_number = $2',
    [deviceId, pinNumber]
  );

  if (pinResult.rows.length === 0) {
    throw new AppError('PIN_NOT_FOUND', 'Virtual pin not found', 404);
  }

  const direction = pinResult.rows[0].direction as string;
  if (direction !== 'write' && direction !== 'readwrite') {
    throw new AppError('PIN_DIRECTION_MISMATCH', 'Pin direction does not allow writes', 403);
  }

  await updatePinLastValue(deviceId, pinNumber, value);
  writePinToInflux(deviceId, pinNumber, value);
}

export async function updatePinLastValue(deviceId: string, pinNumber: number, value: string): Promise<void> {
  await query(
    'UPDATE virtual_pins SET last_value = $1, last_updated = NOW() WHERE device_id = $2 AND pin_number = $3',
    [value, deviceId, pinNumber]
  );
}

export function writePinToInflux(deviceId: string, pinNumber: number, value: string): void {
  const numValue = parseFloat(value);
  const point = new Point('pin_data')
    .tag('device_id', deviceId)
    .tag('pin_number', `V${pinNumber}`)
    .timestamp(Date.now() * 1_000_000);

  if (!isNaN(numValue)) {
    point.floatField('value_num', numValue);
  } else {
    point.stringField('value_str', value);
  }

  writeApi.writePoint(point);
  writeApi.flush().catch((err) => {
    logger.error('InfluxDB write failed', { deviceId, pinNumber, value, error: err });
  });
}

export async function exportPinsData(
  deviceId: string,
  from?: string,
  to?: string,
  format: 'csv' | 'json' = 'json',
  pins?: string
): Promise<{ format: string; data: unknown }> {
  const pinNumbers = pins ? pins.split(',').map((p) => parseInt(p.trim(), 10)) : [];

  const pinsResult = pinNumbers.length > 0
    ? await query('SELECT * FROM virtual_pins WHERE device_id = $1 AND pin_number = ANY($2::smallint[]) ORDER BY pin_number', [deviceId, pinNumbers])
    : await query('SELECT * FROM virtual_pins WHERE device_id = $1 ORDER BY pin_number', [deviceId]);

  const pinData = pinsResult.rows.map(mapPin);

  if (format === 'csv') {
    const header = 'pinNumber,label,lastValue,lastUpdated,unit,direction,dataType';
    const rows = pinData.map((p) =>
      `${p.pinNumber},${p.label},${p.lastValue ?? ''},${p.lastUpdated ?? ''},${p.unit},${p.direction},${p.dataType}`
    );
    return { format: 'csv', data: [header, ...rows].join('\n') };
  }

  return { format: 'json', data: pinData };
}
