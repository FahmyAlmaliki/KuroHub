import WebSocket from 'ws';
import type { Server } from 'http';
import { logger } from '../config/logger';
import { handleDeviceConnection } from './deviceHandler';
import { handleDashboardConnection } from './dashboardHandler';

export function setupWebSocketServer(server: Server): WebSocket.Server {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    if (!req.url) {
      ws.close(4000, 'No path specified');
      return;
    }

    const path = req.url.split('?')[0];

    switch (path) {
      case '/ws/device':
        handleDeviceConnection(ws, req);
        break;

      case '/ws/dashboard':
        handleDashboardConnection(ws, req);
        break;

      default:
        logger.warn('Unknown WebSocket path', { path });
        ws.close(4000, `Unknown path: ${path}`);
    }
  });

  wss.on('error', (err) => {
    logger.error('WebSocket server error', { error: err });
  });

  logger.info('WebSocket server initialized on port 3001');

  return wss;
}
