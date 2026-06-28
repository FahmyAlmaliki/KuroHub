import { randomBytes } from 'crypto';
import { query } from '../../db/postgres';
import { AppError } from '../../middleware/errorHandler';
import type { Device } from '../../types/index';
import type { CreateDeviceInput, UpdateDeviceInput } from './devices.schema';

function generateApiKey(): string {
  const hex = randomBytes(32).toString('hex');
  return `kurohub_${hex}`;
}

function mapDevice(row: Record<string, unknown>, pinCount = 0, widgetCount = 0): Device {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    location: (row.location as string) ?? null,
    groupName: (row.group_name as string) ?? null,
    firmwareVersion: (row.firmware_version as string) ?? null,
    apiKey: row.api_key as string,
    status: (row.status as 'online' | 'offline') ?? 'offline',
    lastSeen: (row.last_seen as Date)?.toISOString() ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    pinCount,
    widgetCount,
  };
}

export async function getDevices(userId: string): Promise<Device[]> {
  const result = await query(
    `SELECT d.*,
      COALESCE(vp.pin_count, 0)::integer AS pin_count,
      COALESCE(w.widget_count, 0)::integer AS widget_count
    FROM devices d
    LEFT JOIN (SELECT device_id, COUNT(*)::integer AS pin_count FROM virtual_pins GROUP BY device_id) vp ON vp.device_id = d.id
    LEFT JOIN (SELECT device_id, COUNT(*)::integer AS widget_count FROM widgets GROUP BY device_id) w ON w.device_id = d.id
    WHERE d.user_id = $1
    ORDER BY d.created_at DESC`,
    [userId]
  );

  return result.rows.map((row: Record<string, unknown>) =>
    mapDevice(row, row.pin_count as number, row.widget_count as number)
  );
}

export async function getDeviceById(userId: string, deviceId: string): Promise<Device> {
  const result = await query(
    `SELECT d.*,
      COALESCE(vp.pin_count, 0)::integer AS pin_count,
      COALESCE(w.widget_count, 0)::integer AS widget_count
    FROM devices d
    LEFT JOIN (SELECT device_id, COUNT(*)::integer AS pin_count FROM virtual_pins GROUP BY device_id) vp ON vp.device_id = d.id
    LEFT JOIN (SELECT device_id, COUNT(*)::integer AS widget_count FROM widgets GROUP BY device_id) w ON w.device_id = d.id
    WHERE d.id = $1 AND d.user_id = $2`,
    [deviceId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('DEVICE_NOT_FOUND', 'Device not found', 404);
  }

  const row = result.rows[0];
  return mapDevice(row, row.pin_count as number, row.widget_count as number);
}

export async function createDevice(userId: string, input: CreateDeviceInput): Promise<Device> {
  const apiKey = generateApiKey();
  const result = await query(
    `INSERT INTO devices (user_id, name, description, location, group_name, firmware_version, api_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, input.name, input.description, input.location, input.groupName, input.firmwareVersion, apiKey]
  );

  return mapDevice(result.rows[0]);
}

export async function updateDevice(userId: string, deviceId: string, input: UpdateDeviceInput): Promise<Device> {
  const existing = await query('SELECT id FROM devices WHERE id = $1 AND user_id = $2', [deviceId, userId]);
  if (existing.rows.length === 0) {
    throw new AppError('DEVICE_NOT_FOUND', 'Device not found', 404);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.location !== undefined) {
    fields.push(`location = $${paramIndex++}`);
    values.push(input.location);
  }
  if (input.groupName !== undefined) {
    fields.push(`group_name = $${paramIndex++}`);
    values.push(input.groupName);
  }
  if (input.firmwareVersion !== undefined) {
    fields.push(`firmware_version = $${paramIndex++}`);
    values.push(input.firmwareVersion);
  }

  if (fields.length === 0) {
    return getDeviceById(userId, deviceId);
  }

  fields.push('updated_at = NOW()');
  values.push(deviceId);

  const result = await query(
    `UPDATE devices SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return mapDevice(result.rows[0]);
}

export async function deleteDevice(userId: string, deviceId: string): Promise<void> {
  const result = await query(
    'DELETE FROM devices WHERE id = $1 AND user_id = $2 RETURNING id',
    [deviceId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('DEVICE_NOT_FOUND', 'Device not found', 404);
  }
}

export async function regenerateApiKey(userId: string, deviceId: string): Promise<{ apiKey: string }> {
  const existing = await query('SELECT id FROM devices WHERE id = $1 AND user_id = $2', [deviceId, userId]);
  if (existing.rows.length === 0) {
    throw new AppError('DEVICE_NOT_FOUND', 'Device not found', 404);
  }

  const apiKey = generateApiKey();
  await query('UPDATE devices SET api_key = $1, updated_at = NOW() WHERE id = $2', [apiKey, deviceId]);

  return { apiKey };
}

export async function getDeviceByIdAndUser(deviceId: string, userId: string): Promise<Device | null> {
  const result = await query(
    'SELECT * FROM devices WHERE id = $1 AND user_id = $2',
    [deviceId, userId]
  );

  if (result.rows.length === 0) return null;

  return mapDevice(result.rows[0]);
}

export async function updateDeviceStatus(deviceId: string, status: 'online' | 'offline'): Promise<void> {
  await query(
    'UPDATE devices SET status = $1, last_seen = CASE WHEN $1 = $3 THEN NOW() ELSE last_seen END, updated_at = NOW() WHERE id = $2',
    [status, deviceId, 'online']
  );
}
