export type WidgetType = 'value_display' | 'line_chart' | 'area_chart' | 'gauge' | 'button' | 'toggle' | 'slider' | 'led' | 'label';

export interface Widget {
  id: string;
  deviceId: string;
  type: WidgetType;
  pinNumber: number;
  label: string;
  config: Record<string, unknown>;
  layout: { x: number; y: number; w: number; h: number };
  createdAt: string;
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
}

export interface ButtonConfig { onValue: string; offValue: string; color: string; mode: 'push' | 'toggle'; }
export interface SliderConfig { min: number; max: number; step: number; color: string; }
export interface GaugeConfig { min: number; max: number; warningThreshold: number; dangerThreshold: number; unit: string; }
export interface ChartConfig { timeRange: string; color: string; fillOpacity: number; showDots: boolean; }
export interface ValueDisplayConfig { precision: number; fontSize: 'sm' | 'md' | 'xl'; color: string; showTrend: boolean; }

export interface Device {
  id: string;
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
}

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  theme: string;
}

export interface AlertRule {
  id: string;
  deviceId: string;
  pinNumber: number;
  name: string;
  operator: string;
  threshold: number;
  isActive: boolean;
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  deviceId: string;
  pinNumber: number;
  value: number;
  message: string;
  triggeredAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}
