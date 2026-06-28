import WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import { query } from '../db/postgres';
import { logger } from '../config/logger';
import { registerDeviceConnection, unregisterDeviceConnection, handlePinFromDevice } from './pinBroker';
import type { Device } from '../types/index';

export async function handleDeviceConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
  let deviceId: string | null = null;
  let authenticated = false;
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      logger.warn('Device auth timeout, closing connection');
      ws.close(4001, 'Auth timeout');
    }
  }, 10000);

  ws.on('message', async (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (!authenticated) {
        if (msg.type !== 'auth' || !msg.api_key) {
          ws.send(JSON.stringify({ type: 'auth_error', message: 'Pesan pertama harus auth dengan api_key' }));
          ws.close(4002, 'Auth required');
          return;
        }

        try {
          const result = await query<Device>(
            `SELECT id, user_id, name FROM devices WHERE api_key = $1 AND status != 'deleted'`,
            [msg.api_key],
          );

          if (result.rows.length === 0) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'API key tidak valid' }));
            ws.close(4003, 'Invalid API key');
            return;
          }

          const device = result.rows[0];
          deviceId = device.id;
          authenticated = true;
          clearTimeout(authTimeout);

          await query(
            `UPDATE devices SET status = 'online', last_seen = NOW() WHERE id = $1`,
            [deviceId],
          );

          registerDeviceConnection(deviceId, ws, device.userId, device.name);

          ws.send(JSON.stringify({
            type: 'auth_ok',
            device_id: deviceId,
            name: device.name,
          }));

          logger.info('Device authenticated via WebSocket', { deviceId, name: device.name });
        } catch (err) {
          logger.error('Device auth error', { error: err });
          ws.send(JSON.stringify({ type: 'auth_error', message: 'Internal server error' }));
          ws.close(4000, 'Internal error');
        }
        return;
      }

      switch (msg.type) {
        case 'pin_write': {
          if (!deviceId) break;
          const pin = parseInt(msg.pin, 10);
          const value = String(msg.value);
          if (isNaN(pin) || pin < 0 || pin > 255) {
            logger.warn('Invalid pin number from device', { deviceId, pin: msg.pin });
            break;
          }
          await handlePinFromDevice(deviceId, pin, value);
          break;
        }

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          logger.warn('Unknown message type from device', { deviceId, type: msg.type });
      }
    } catch (err) {
      logger.error('Error processing device WS message', { deviceId, error: err });
    }
  });

  ws.on('close', async () => {
    clearTimeout(authTimeout);
    if (deviceId) {
      try {
        await query(
          `UPDATE devices SET status = 'offline', last_seen = NOW() WHERE id = $1`,
          [deviceId],
        );
      } catch (err) {
        logger.error('Failed to set device offline', { deviceId, error: err });
      }
      unregisterDeviceConnection(deviceId);
    }
  });

  ws.on('error', (err) => {
    clearTimeout(authTimeout);
    logger.error('Device WebSocket error', { deviceId, error: err });
  });
}
