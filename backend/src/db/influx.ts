import { InfluxDB, Point, WriteApi, QueryApi, flux } from '@influxdata/influxdb-client';
import { env } from '../config/env';

const influxDB = new InfluxDB({
  url: env.INFLUX_URL,
  token: env.INFLUX_TOKEN,
});

export const writeApi: WriteApi = influxDB.getWriteApi(
  env.INFLUX_ORG,
  env.INFLUX_BUCKET,
  'ns',
);

export const queryApi: QueryApi = influxDB.getQueryApi(env.INFLUX_ORG);

export function createPinPoint(
  deviceId: string,
  pinNumber: number,
  userId: string,
  valueNum?: number,
  valueStr?: string,
): Point {
  const point = new Point('pin_data')
    .tag('device_id', deviceId)
    .tag('pin_number', `V${pinNumber}`)
    .tag('user_id', userId);

  if (valueNum !== undefined) {
    point.floatField('value_num', valueNum);
  }
  if (valueStr !== undefined) {
    point.stringField('value_str', valueStr);
  }

  return point;
}

export async function writePinToInflux(
  deviceId: string,
  pinNumber: number,
  userId: string,
  value: string,
): Promise<void> {
  const num = parseFloat(value);
  const point = createPinPoint(
    deviceId,
    pinNumber,
    userId,
    isNaN(num) ? undefined : num,
    isNaN(num) ? value : undefined,
  );
  writeApi.writePoint(point);
}

export { Point, flux } from '@influxdata/influxdb-client';
