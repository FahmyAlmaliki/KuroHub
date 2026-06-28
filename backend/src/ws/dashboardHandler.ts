import WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { query } from '../db/postgres';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  registerDashboardSubscriber,
  unregisterDashboardSubscriber,
  removeAllDashboardSubscriptions,
  handlePinFromDashboard,
  broadcastToDeviceSubscribers,
} from './pinBroker';
import type { JwtPayload } from '../types/index';

export async function handleDashboardConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
  let userId: string | null = null;
  let authenticated = false;
  const subscribedDevices = new Set<string>();

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      logger.warn('Dashboard auth timeout, closing connection');
      ws.close(4001, 'Auth timeout');
    }
  }, 10000);

  function send(msg: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  ws.on('message', async (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (!authenticated) {
        if (msg.type !== 'auth' || !msg.token) {
          send({ type: 'auth_error', message: 'Pesan pertama harus auth dengan token JWT' });
          ws.close(4002, 'Auth required');
          return;
        }

        try {
          const payload = jwt.verify(msg.token, env.JWT_ACCESS_SECRET) as JwtPayload;
          userId = payload.userId;
          authenticated = true;
          clearTimeout(authTimeout);

          send({ type: 'auth_ok', user_id: userId });
          logger.info('Dashboard user authenticated', { userId });
        } catch (err) {
          send({ type: 'auth_error', message: 'Token JWT tidak valid atau expired' });
          ws.close(4003, 'Invalid token');
        }
        return;
      }

      switch (msg.type) {
        case 'subscribe': {
          if (!userId || !msg.device_id) {
            send({ type: 'error', message: 'device_id diperlukan' });
            break;
          }

          const result = await query(
            `SELECT id, status, last_seen FROM devices WHERE id = $1 AND user_id = $2`,
            [msg.device_id, userId],
          );

          if (result.rows.length === 0) {
            send({ type: 'error', message: 'Device tidak ditemukan atau bukan milik Anda' });
            break;
          }

          registerDashboardSubscriber(msg.device_id, ws, userId);
          subscribedDevices.add(msg.device_id);

          send({ type: 'subscribed', device_id: msg.device_id });

          const device = result.rows[0];
          send({
            type: 'device_status',
            device_id: msg.device_id,
            status: device.status,
            last_seen: device.last_seen ?? undefined,
          });

          logger.info('Dashboard subscribed to device', { userId, deviceId: msg.device_id });
          break;
        }

        case 'pin_write': {
          if (!userId) break;
          const deviceId = msg.device_id;
          const pin = parseInt(msg.pin, 10);
          const value = String(msg.value);
          if (!deviceId || isNaN(pin) || pin < 0 || pin > 255) break;

          await handlePinFromDashboard(userId, deviceId, pin, value);
          break;
        }

        case 'ping':
          send({ type: 'pong' });
          break;

        default:
          logger.warn('Unknown message type from dashboard', { userId, type: msg.type });
      }
    } catch (err) {
      logger.error('Error processing dashboard WS message', { userId, error: err });
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimeout);
    removeAllDashboardSubscriptions(ws);
    subscribedDevices.clear();
    if (userId) {
      logger.info('Dashboard disconnected', { userId });
    }
  });

  ws.on('error', (err) => {
    clearTimeout(authTimeout);
    removeAllDashboardSubscriptions(ws);
    subscribedDevices.clear();
    logger.error('Dashboard WebSocket error', { userId, error: err });
  });
}
