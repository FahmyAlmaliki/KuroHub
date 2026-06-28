import WebSocket from 'ws';
import { query } from '../db/postgres';
import { writePinToInflux } from '../db/influx';
import { logger } from '../config/logger';
import { evaluate } from '../services/alertEngine';
import type { DeviceConnection, DashboardSubscriber, WsServerMessage } from '../types/index';

const deviceConnections = new Map<string, DeviceConnection>();
const dashboardSubscribers = new Map<string, Set<DashboardSubscriber>>();

export async function handlePinFromDevice(
  deviceId: string,
  pin: number,
  value: string,
): Promise<void> {
  const conn = deviceConnections.get(deviceId);
  const userId = conn?.userId ?? 'unknown';

  try {
    await query(
      `UPDATE virtual_pins SET last_value = $1, last_updated = NOW() WHERE device_id = $2 AND pin_number = $3`,
      [value, deviceId, pin],
    );
  } catch (err) {
    logger.error('Failed to update pin last_value in PostgreSQL', { deviceId, pin, error: err });
  }

  writePinToInflux(deviceId, pin, userId, value).catch((err) => {
    logger.error('Failed to write pin data to InfluxDB', { deviceId, pin, error: err });
  });

  try {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      await evaluate(deviceId, pin, numValue);
    }
  } catch (err) {
    logger.error('Failed to evaluate alert rules', { deviceId, pin, error: err });
  }

  const subscribers = dashboardSubscribers.get(deviceId);
  if (!subscribers || subscribers.size === 0) return;

  const message: WsServerMessage = {
    type: 'pin_update',
    device_id: deviceId,
    pin,
    value,
    timestamp: Math.floor(Date.now() / 1000),
  };
  const raw = JSON.stringify(message);

  for (const sub of subscribers) {
    if (sub.ws.readyState === WebSocket.OPEN) {
      sub.ws.send(raw);
    }
  }
}

export async function handlePinFromDashboard(
  userId: string,
  deviceId: string,
  pin: number,
  value: string,
): Promise<void> {
  const result = await query(
    `SELECT id FROM devices WHERE id = $1 AND user_id = $2`,
    [deviceId, userId],
  );
  if (result.rows.length === 0) return;

  const conn = deviceConnections.get(deviceId);
  if (conn && conn.ws.readyState === WebSocket.OPEN) {
    conn.ws.send(JSON.stringify({ type: 'pin_update', pin, value }));
  }

  await query(
    `UPDATE virtual_pins SET last_value = $1, last_updated = NOW() WHERE device_id = $2 AND pin_number = $3`,
    [value, deviceId, pin],
  );
}

export function registerDeviceConnection(
  deviceId: string,
  ws: WebSocket,
  userId: string,
  name: string,
): void {
  deviceConnections.set(deviceId, { ws, userId, name });
  logger.info('Device connected', { deviceId, name });
}

export function unregisterDeviceConnection(deviceId: string): void {
  const conn = deviceConnections.get(deviceId);
  if (conn) {
    logger.info('Device disconnected', { deviceId, name: conn.name });
    deviceConnections.delete(deviceId);
  }
}

export function registerDashboardSubscriber(deviceId: string, ws: WebSocket, userId: string): void {
  let subscribers = dashboardSubscribers.get(deviceId);
  if (!subscribers) {
    subscribers = new Set();
    dashboardSubscribers.set(deviceId, subscribers);
  }
  subscribers.add({ ws, userId });
}

export function unregisterDashboardSubscriber(deviceId: string, ws: WebSocket): void {
  const subscribers = dashboardSubscribers.get(deviceId);
  if (!subscribers) return;

  for (const sub of subscribers) {
    if (sub.ws === ws) {
      subscribers.delete(sub);
      break;
    }
  }

  if (subscribers.size === 0) {
    dashboardSubscribers.delete(deviceId);
  }
}

export function removeAllDashboardSubscriptions(ws: WebSocket): void {
  for (const [deviceId, subscribers] of dashboardSubscribers.entries()) {
    for (const sub of subscribers) {
      if (sub.ws === ws) {
        subscribers.delete(sub);
        break;
      }
    }
    if (subscribers.size === 0) {
      dashboardSubscribers.delete(deviceId);
    }
  }
}

export function broadcastToDeviceSubscribers(
  deviceId: string,
  message: WsServerMessage,
): void {
  const subscribers = dashboardSubscribers.get(deviceId);
  if (!subscribers) return;

  const raw = JSON.stringify(message);
  for (const sub of subscribers) {
    if (sub.ws.readyState === WebSocket.OPEN) {
      sub.ws.send(raw);
    }
  }
}

export function getDeviceConnectionsCount(): number {
  return deviceConnections.size;
}

export function getDashboardConnectionsCount(): number {
  const count = new Set<WebSocket>();
  for (const subscribers of dashboardSubscribers.values()) {
    for (const sub of subscribers) {
      count.add(sub.ws);
    }
  }
  return count.size;
}
