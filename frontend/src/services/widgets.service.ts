import api from './api';
import type { ApiResponse, Widget } from '../types';

export interface CreateWidgetData {
  type: Widget['type'];
  pinNumber: number;
  label: string;
  config: Record<string, unknown>;
  layout: { x: number; y: number; w: number; h: number };
}

export interface UpdateWidgetData {
  label?: string;
  config?: Record<string, unknown>;
  layout?: { x: number; y: number; w: number; h: number };
}

export interface LayoutItem {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export async function getWidgets(deviceId: string): Promise<ApiResponse<{ widgets: Widget[] }>> {
  const res = await api.get(`/devices/${deviceId}/widgets`);
  return res.data;
}

export async function createWidget(deviceId: string, data: CreateWidgetData): Promise<ApiResponse<{ widget: Widget }>> {
  const res = await api.post(`/devices/${deviceId}/widgets`, data);
  return res.data;
}

export async function updateWidget(deviceId: string, widgetId: string, data: UpdateWidgetData): Promise<ApiResponse<{ widget: Widget }>> {
  const res = await api.put(`/devices/${deviceId}/widgets/${widgetId}`, data);
  return res.data;
}

export async function deleteWidget(deviceId: string, widgetId: string): Promise<ApiResponse<void>> {
  const res = await api.delete(`/devices/${deviceId}/widgets/${widgetId}`);
  return res.data;
}

export async function saveLayout(deviceId: string, layouts: LayoutItem[]): Promise<ApiResponse<void>> {
  const res = await api.put(`/devices/${deviceId}/widgets/layout`, { layouts });
  return res.data;
}
