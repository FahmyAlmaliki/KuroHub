import { query } from '../../db/postgres';
import { AppError } from '../../middleware/errorHandler';
import type { AlertRule, AlertHistory } from '../../types/index';
import type { CreateAlertInput, UpdateAlertInput, HistoryQueryInput } from './alerts.schema';

function mapAlertRule(row: Record<string, unknown>): AlertRule {
  return {
    id: row.id as string,
    deviceId: row.device_id as string,
    userId: row.user_id as string,
    pinNumber: row.pin_number as number,
    name: row.name as string,
    operator: row.operator as AlertRule['operator'],
    threshold: Number(row.threshold),
    isActive: row.is_active as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function mapAlertHistory(row: Record<string, unknown>): AlertHistory {
  return {
    id: row.id as string,
    ruleId: row.rule_id as string,
    deviceId: row.device_id as string,
    pinNumber: row.pin_number as number,
    value: Number(row.value),
    message: (row.message as string) ?? null,
    triggeredAt: (row.triggered_at as Date).toISOString(),
  };
}

export async function getAlertRules(userId: string): Promise<AlertRule[]> {
  const result = await query(
    'SELECT * FROM alert_rules WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(mapAlertRule);
}

export async function getAlertRuleById(userId: string, ruleId: string): Promise<AlertRule> {
  const result = await query(
    'SELECT * FROM alert_rules WHERE id = $1 AND user_id = $2',
    [ruleId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('ALERT_RULE_NOT_FOUND', 'Alert rule not found', 404);
  }

  return mapAlertRule(result.rows[0]);
}

export async function createAlertRule(userId: string, input: CreateAlertInput): Promise<AlertRule> {
  const deviceResult = await query('SELECT id FROM devices WHERE id = $1 AND user_id = $2', [
    input.deviceId,
    userId,
  ]);

  if (deviceResult.rows.length === 0) {
    throw new AppError('DEVICE_NOT_FOUND', 'Device not found or access denied', 404);
  }

  const pinResult = await query(
    'SELECT id FROM virtual_pins WHERE device_id = $1 AND pin_number = $2',
    [input.deviceId, input.pinNumber]
  );

  if (pinResult.rows.length === 0) {
    throw new AppError('PIN_NOT_FOUND', 'Virtual pin not found on this device', 404);
  }

  const result = await query(
    `INSERT INTO alert_rules (device_id, user_id, pin_number, name, operator, threshold)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.deviceId, userId, input.pinNumber, input.name, input.operator, input.threshold]
  );

  return mapAlertRule(result.rows[0]);
}

export async function updateAlertRule(userId: string, ruleId: string, input: UpdateAlertInput): Promise<AlertRule> {
  const existing = await query(
    'SELECT id FROM alert_rules WHERE id = $1 AND user_id = $2',
    [ruleId, userId]
  );

  if (existing.rows.length === 0) {
    throw new AppError('ALERT_RULE_NOT_FOUND', 'Alert rule not found', 404);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.pinNumber !== undefined) {
    fields.push(`pin_number = $${paramIndex++}`);
    values.push(input.pinNumber);
  }
  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.operator !== undefined) {
    fields.push(`operator = $${paramIndex++}`);
    values.push(input.operator);
  }
  if (input.threshold !== undefined) {
    fields.push(`threshold = $${paramIndex++}`);
    values.push(input.threshold);
  }
  if (input.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(input.isActive);
  }

  if (fields.length === 0) {
    return getAlertRuleById(userId, ruleId);
  }

  values.push(ruleId);

  const result = await query(
    `UPDATE alert_rules SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return mapAlertRule(result.rows[0]);
}

export async function deleteAlertRule(userId: string, ruleId: string): Promise<void> {
  const result = await query(
    'DELETE FROM alert_rules WHERE id = $1 AND user_id = $2 RETURNING id',
    [ruleId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('ALERT_RULE_NOT_FOUND', 'Alert rule not found', 404);
  }
}

export async function toggleAlertRule(userId: string, ruleId: string): Promise<AlertRule> {
  const result = await query(
    'UPDATE alert_rules SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING *',
    [ruleId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('ALERT_RULE_NOT_FOUND', 'Alert rule not found', 404);
  }

  return mapAlertRule(result.rows[0]);
}

export async function getAlertHistory(
  userId: string,
  params: HistoryQueryInput
): Promise<{ history: AlertHistory[]; total: number; page: number; limit: number; totalPages: number }> {
  const conditions: string[] = ['ah.device_id IN (SELECT id FROM devices WHERE user_id = $1)'];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  if (params.deviceId) {
    conditions.push(`ah.device_id = $${paramIndex++}`);
    values.push(params.deviceId);
  }
  if (params.ruleId) {
    conditions.push(`ah.rule_id = $${paramIndex++}`);
    values.push(params.ruleId);
  }
  if (params.from) {
    conditions.push(`ah.triggered_at >= $${paramIndex++}`);
    values.push(params.from);
  }
  if (params.to) {
    conditions.push(`ah.triggered_at <= $${paramIndex++}`);
    values.push(params.to);
  }

  const whereClause = conditions.join(' AND ');
  const offset = (params.page - 1) * params.limit;

  const countResult = await query(
    `SELECT COUNT(*)::integer AS total FROM alert_history ah WHERE ${whereClause}`,
    values
  );

  const total = countResult.rows[0].total as number;

  const dataResult = await query(
    `SELECT ah.* FROM alert_history ah WHERE ${whereClause} ORDER BY ah.triggered_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...values, params.limit, offset]
  );

  return {
    history: dataResult.rows.map(mapAlertHistory),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}
