import type { Request } from 'express';
import type WebSocket from 'ws';

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  location: string | null;
  groupName: string | null;
  firmwareVersion: string | null;
  apiKey: string;
  status: 'online' | 'offline';
  lastSeen: string | null;
  pinCount: number;
  widgetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VirtualPin {
  id: string;
  deviceId: string;
  pinNumber: number;
  label: string;
  direction: 'read' | 'write' | 'readwrite';
  dataType: 'number' | 'string' | 'color';
  unit: string;
  minValue: number;
  maxValue: number;
  lastValue: string | null;
  lastUpdated: string | null;
  createdAt: string;
}

export interface Widget {
  id: string;
  deviceId: string;
  userId: string;
  type: string;
  pinNumber: number | null;
  label: string;
  config: Record<string, unknown>;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  deviceId: string;
  userId: string;
  pinNumber: number;
  name: string;
  operator: '>' | '<' | '>=' | '<=' | '=';
  threshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  deviceId: string;
  pinNumber: number;
  value: number;
  message: string | null;
  triggeredAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface DeviceConnection {
  ws: WebSocket;
  userId: string;
  name: string;
}

export interface DashboardSubscriber {
  ws: WebSocket;
  userId: string;
}

export type WsClientMessage =
  | { type: 'auth'; api_key: string }
  | { type: 'auth'; token: string }
  | { type: 'pin_write'; pin: number; value: string }
  | { type: 'pin_write'; device_id: string; pin: number; value: string }
  | { type: 'subscribe'; device_id: string }
  | { type: 'ping' };

export type WsServerMessage =
  | { type: 'auth_ok'; device_id?: string; name?: string; user_id?: string }
  | { type: 'auth_error'; message: string }
  | { type: 'pong' }
  | { type: 'subscribed'; device_id: string }
  | { type: 'device_status'; device_id: string; status: string; last_seen?: string }
  | { type: 'pin_update'; device_id?: string; pin: number; value: string; timestamp: number }
  | { type: 'alert_triggered'; rule_id: string; device_id: string; pin: number; value: number; threshold: number; operator: string; message: string };
