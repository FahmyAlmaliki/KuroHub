import api from './api';
import type { ApiResponse, VirtualPin } from '../types';

export interface UpsertPinData {
  pinNumber: number;
  label: string;
  direction: VirtualPin['direction'];
  dataType: VirtualPin['dataType'];
  unit?: string;
  minValue?: number;
  maxValue?: number;
}

export interface UpdatePinData {
  label?: string;
  direction?: VirtualPin['direction'];
  dataType?: VirtualPin['dataType'];
  unit?: string;
  minValue?: number;
  maxValue?: number;
}

export interface HistoryParams {
  from?: string;
  to?: string;
  resolution?: string;
  fn?: 'mean' | 'max' | 'min' | 'last';
}

export interface ExportParams {
  start?: string;
  end?: string;
  format?: 'json' | 'csv';
}

export interface PinHistoryPoint {
  timestamp: string;
  value: number;
}

export interface HistoryResponse {
  pinNumber: number;
  field: string;
  points: PinHistoryPoint[];
}

export async function getPins(deviceId: string): Promise<ApiResponse<{ pins: VirtualPin[] }>> {
  const res = await api.get(`/devices/${deviceId}/pins`);
  return res.data;
}

export async function upsertPin(deviceId: string, data: UpsertPinData): Promise<ApiResponse<{ pin: VirtualPin }>> {
  const res = await api.post(`/devices/${deviceId}/pins`, data);
  return res.data;
}

export async function updatePin(deviceId: string, pinNumber: number, data: UpdatePinData): Promise<ApiResponse<{ pin: VirtualPin }>> {
  const res = await api.put(`/devices/${deviceId}/pins/${pinNumber}`, data);
  return res.data;
}

export async function deletePin(deviceId: string, pinNumber: number): Promise<ApiResponse<void>> {
  const res = await api.delete(`/devices/${deviceId}/pins/${pinNumber}`);
  return res.data;
}

export async function getHistory(deviceId: string, pinNumber: number, params?: HistoryParams): Promise<ApiResponse<HistoryResponse>> {
  const res = await api.get(`/devices/${deviceId}/pins/${pinNumber}/history`, { params });
  return res.data;
}

export async function getLatest(deviceId: string, pinNumber: number): Promise<ApiResponse<{ value: string; time: string }>> {
  const res = await api.get(`/devices/${deviceId}/pins/${pinNumber}/latest`);
  return res.data;
}

export async function writePin(deviceId: string, pinNumber: number, value: string): Promise<ApiResponse<void>> {
  const res = await api.post(`/devices/${deviceId}/pins/${pinNumber}/write`, { value });
  return res.data;
}

export async function exportPins(deviceId: string, params?: ExportParams): Promise<Blob> {
  const res = await api.get(`/devices/${deviceId}/pins/export`, {
    params,
    responseType: 'blob',
  });
  return res.data;
}
