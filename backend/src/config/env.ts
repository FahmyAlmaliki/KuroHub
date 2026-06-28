import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  PORT: parseInt(process.env.PORT || '3000', 10),
  WS_PORT: parseInt(process.env.WS_PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  APP_NAME: process.env.APP_NAME || 'KuroHub',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret-min-32-chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret-min-32-chars',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
  POSTGRES_PORT: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  POSTGRES_DB: process.env.POSTGRES_DB || 'kurohub',
  POSTGRES_USER: process.env.POSTGRES_USER || 'kurohub_user',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'kurohub_pass',

  INFLUX_URL: process.env.INFLUX_URL || 'http://localhost:8086',
  INFLUX_TOKEN: process.env.INFLUX_TOKEN || '',
  INFLUX_ORG: process.env.INFLUX_ORG || 'kurohub',
  INFLUX_BUCKET: process.env.INFLUX_BUCKET || 'telemetry',

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'change-me-cookie-secret',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  PIN_MAX_NUMBER: parseInt(process.env.PIN_MAX_NUMBER || '255', 10),
  DEVICE_OFFLINE_TIMEOUT_MS: parseInt(process.env.DEVICE_OFFLINE_TIMEOUT_MS || '60000', 10),
  WS_TELEMETRY_RATE_LIMIT_MS: parseInt(process.env.WS_TELEMETRY_RATE_LIMIT_MS || '1000', 10),
} as const;
