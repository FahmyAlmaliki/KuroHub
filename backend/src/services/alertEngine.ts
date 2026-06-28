import { query } from '../db/postgres';
import { logger } from '../config/logger';
import { broadcastToDeviceSubscribers } from '../ws/pinBroker';
import type { AlertRule, WsServerMessage } from '../types/index';

export async function evaluate(
  deviceId: string,
  pin: number,
  value: number,
): Promise<void> {
  try {
    const rules = await getActiveRulesForPin(deviceId, pin);

    for (const rule of rules) {
      if (!checkCondition(value, rule.operator, rule.threshold)) continue;

      await saveAlertHistory(rule, value);

      const message: WsServerMessage = {
        type: 'alert_triggered',
        rule_id: rule.id,
        device_id: deviceId,
        pin,
        value,
        threshold: rule.threshold,
        operator: rule.operator,
        message: `${rule.name}: V${pin} (${value}) ${rule.operator} ${rule.threshold}`,
      };

      broadcastToDeviceSubscribers(deviceId, message);

      logger.warn('Alert triggered', {
        ruleId: rule.id,
        deviceId,
        pin,
        value,
        threshold: rule.threshold,
        operator: rule.operator,
      });
    }
  } catch (err) {
    logger.error('Error evaluating alert rules', { deviceId, pin, error: err });
  }
}

export function checkCondition(
  value: number,
  operator: string,
  threshold: number,
): boolean {
  switch (operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '=':
      return value === threshold;
    default:
      logger.warn('Unknown alert operator', { operator });
      return false;
  }
}

export async function saveAlertHistory(
  rule: AlertRule,
  value: number,
): Promise<void> {
  const message = `${rule.name}: V${rule.pinNumber} (${value}) ${rule.operator} ${rule.threshold}`;

  await query(
    `INSERT INTO alert_history (rule_id, device_id, pin_number, value, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [rule.id, rule.deviceId, rule.pinNumber, value, message],
  );
}

export async function getActiveRulesForPin(
  deviceId: string,
  pin: number,
): Promise<AlertRule[]> {
  const result = await query<AlertRule>(
    `SELECT * FROM alert_rules
     WHERE device_id = $1 AND pin_number = $2 AND is_active = true`,
    [deviceId, pin],
  );

  return result.rows;
}
