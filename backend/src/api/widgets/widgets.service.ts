import { query } from '../../db/postgres';
import { AppError } from '../../middleware/errorHandler';
import type { Widget } from '../../types/index';
import type { CreateWidgetInput, UpdateWidgetInput, SaveLayoutInput } from './widgets.schema';

function mapWidget(row: Record<string, unknown>): Widget {
  return {
    id: row.id as string,
    deviceId: row.device_id as string,
    userId: row.user_id as string,
    type: row.type as string,
    pinNumber: (row.pin_number as number) ?? null,
    label: row.label as string,
    config: row.config as Record<string, unknown>,
    gridX: row.grid_x as number,
    gridY: row.grid_y as number,
    gridW: row.grid_w as number,
    gridH: row.grid_h as number,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export async function getWidgets(deviceId: string): Promise<Widget[]> {
  const result = await query(
    'SELECT * FROM widgets WHERE device_id = $1 ORDER BY grid_y ASC, grid_x ASC',
    [deviceId]
  );
  return result.rows.map(mapWidget);
}

export async function createWidget(userId: string, deviceId: string, input: CreateWidgetInput): Promise<Widget> {
  const deviceResult = await query('SELECT id FROM devices WHERE id = $1 AND user_id = $2', [deviceId, userId]);
  if (deviceResult.rows.length === 0) {
    throw new AppError('DEVICE_NOT_FOUND', 'Device not found or access denied', 404);
  }

  const { layout, ...rest } = input;
  const result = await query(
    `INSERT INTO widgets (device_id, user_id, type, pin_number, label, config, grid_x, grid_y, grid_w, grid_h)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      deviceId,
      userId,
      rest.type,
      rest.pinNumber ?? null,
      rest.label,
      JSON.stringify(rest.config),
      layout.x,
      layout.y,
      layout.w,
      layout.h,
    ]
  );

  return mapWidget(result.rows[0]);
}

export async function updateWidget(userId: string, deviceId: string, widgetId: string, input: UpdateWidgetInput): Promise<Widget> {
  const existing = await query(
    'SELECT id FROM widgets WHERE id = $1 AND device_id = $2 AND user_id = $3',
    [widgetId, deviceId, userId]
  );

  if (existing.rows.length === 0) {
    throw new AppError('WIDGET_NOT_FOUND', 'Widget not found', 404);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.pinNumber !== undefined) {
    fields.push(`pin_number = $${paramIndex++}`);
    values.push(input.pinNumber);
  }
  if (input.label !== undefined) {
    fields.push(`label = $${paramIndex++}`);
    values.push(input.label);
  }
  if (input.config !== undefined) {
    fields.push(`config = $${paramIndex++}`);
    values.push(JSON.stringify(input.config));
  }
  if (input.layout !== undefined) {
    if (input.layout.x !== undefined) {
      fields.push(`grid_x = $${paramIndex++}`);
      values.push(input.layout.x);
    }
    if (input.layout.y !== undefined) {
      fields.push(`grid_y = $${paramIndex++}`);
      values.push(input.layout.y);
    }
    if (input.layout.w !== undefined) {
      fields.push(`grid_w = $${paramIndex++}`);
      values.push(input.layout.w);
    }
    if (input.layout.h !== undefined) {
      fields.push(`grid_h = $${paramIndex++}`);
      values.push(input.layout.h);
    }
  }

  if (fields.length === 0) {
    return getWidgetById(deviceId, widgetId);
  }

  fields.push('updated_at = NOW()');
  values.push(widgetId);

  const result = await query(
    `UPDATE widgets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return mapWidget(result.rows[0]);
}

async function getWidgetById(deviceId: string, widgetId: string): Promise<Widget> {
  const result = await query(
    'SELECT * FROM widgets WHERE id = $1 AND device_id = $2',
    [widgetId, deviceId]
  );

  if (result.rows.length === 0) {
    throw new AppError('WIDGET_NOT_FOUND', 'Widget not found', 404);
  }

  return mapWidget(result.rows[0]);
}

export async function deleteWidget(userId: string, deviceId: string, widgetId: string): Promise<void> {
  const result = await query(
    'DELETE FROM widgets WHERE id = $1 AND device_id = $2 AND user_id = $3 RETURNING id',
    [widgetId, deviceId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('WIDGET_NOT_FOUND', 'Widget not found', 404);
  }
}

export async function saveLayout(deviceId: string, layouts: SaveLayoutInput['layouts']): Promise<{ updated: number }> {
  let updatedCount = 0;

  for (const item of layouts) {
    const result = await query(
      `UPDATE widgets SET grid_x = $1, grid_y = $2, grid_w = $3, grid_h = $4, updated_at = NOW()
       WHERE id = $5 AND device_id = $6`,
      [item.x, item.y, item.w, item.h, item.widgetId, deviceId]
    );

    if (result.rowCount !== null) {
      updatedCount += result.rowCount;
    }
  }

  return { updated: updatedCount };
}
