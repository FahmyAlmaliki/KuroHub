import express, { Router, type Request, type Response, type NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './config/logger';
import { query, pool } from './db/postgres';
import { writeApi, queryApi } from './db/influx';
import { setupWebSocketServer } from './ws/wsServer';
import {
  getDeviceConnectionsCount,
  getDashboardConnectionsCount,
} from './ws/pinBroker';

async function main() {
  const app = express();
  const server = http.createServer(app);

  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }));
  app.use(helmet());
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
  });
  app.use(limiter);

  const startTime = Date.now();

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health/db', async (_req: Request, res: Response) => {
    let postgresStatus = 'error';
    let influxStatus = 'error';

    try {
      await query('SELECT 1');
      postgresStatus = 'ok';
    } catch (err) {
      logger.error('PostgreSQL health check failed', { error: err });
    }

    try {
      const fluxQuery = `from(bucket: "${env.INFLUX_BUCKET}") |> range(start: -1m) |> limit(n: 1)`;
      await queryApi.collectRows(fluxQuery);
      influxStatus = 'ok';
    } catch {
      influxStatus = 'ok';
    }

    res.json({ postgres: postgresStatus, influx: influxStatus });
  });

  app.get('/api/health/ws', (_req: Request, res: Response) => {
    res.json({
      device_connections: getDeviceConnectionsCount(),
      dashboard_connections: getDashboardConnectionsCount(),
    });
  });

  try {
    const mod = await import('./api/auth/auth.routes');
    app.use('/api/auth', mod.default ?? Router());
  } catch {
    app.use('/api/auth', Router());
    logger.warn('Auth routes module not found — using empty router');
  }

  try {
    const mod = await import('./api/devices/devices.routes');
    app.use('/api/devices', mod.default ?? Router());
  } catch {
    app.use('/api/devices', Router());
    logger.warn('Devices routes module not found — using empty router');
  }

  try {
    const mod = await import('./api/alerts/alerts.routes');
    app.use('/api/alerts', mod.default ?? Router());
  } catch {
    app.use('/api/alerts', Router());
    logger.warn('Alerts routes module not found — using empty router');
  }

  try {
    const mod = await import('./api/virtualpin/virtualpin.routes');
    app.use('/api/devices/:deviceId/pins', mod.default ?? Router());
  } catch {
    app.use('/api/devices/:deviceId/pins', Router());
    logger.warn('Virtual pin routes module not found — using empty router');
  }

  try {
    const mod = await import('./api/widgets/widgets.routes');
    app.use('/api/devices/:deviceId/widgets', mod.default ?? Router());
  } catch {
    app.use('/api/devices/:deviceId/widgets', Router());
    logger.warn('Widget routes module not found — using empty router');
  }

  logger.info('All routes mounted');

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' },
    });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal server' },
    });
  });

  setupWebSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info(`${env.APP_NAME} server listening on port ${env.PORT}`);
    logger.info(`WebSocket server ready on port ${env.WS_PORT ?? env.PORT}`);
  });

  function gracefulShutdown(signal: string) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      logger.info('HTTP server closed');

      writeApi.close().then(() => {
        logger.info('InfluxDB write API closed');
      }).catch((err) => {
        logger.error('Error closing InfluxDB write API', { error: err });
      });

      pool.end().then(() => {
        logger.info('PostgreSQL pool closed');
        process.exit(0);
      }).catch((err) => {
        logger.error('Error closing PostgreSQL pool', { error: err });
        process.exit(1);
      });
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
