import api from './api';
import type { ApiResponse, Device } from '../types';

export interface CreateDeviceData {
  name: string;
  description?: string;
  location?: string;
  groupName?: string;
}

export interface UpdateDeviceData {
  name?: string;
  description?: string | null;
  location?: string | null;
  groupName?: string | null;
}

export async function getDevices(): Promise<ApiResponse<{ devices: Device[] }>> {
  const res = await api.get('/devices');
  return res.data;
}

export async function getDevice(id: string): Promise<ApiResponse<{ device: Device }>> {
  const res = await api.get(`/devices/${id}`);
  return res.data;
}

export async function createDevice(data: CreateDeviceData): Promise<ApiResponse<{ device: Device; apiKey: string }>> {
  const res = await api.post('/devices', data);
  return res.data;
}

export async function updateDevice(id: string, data: UpdateDeviceData): Promise<ApiResponse<{ device: Device }>> {
  const res = await api.put(`/devices/${id}`, data);
  return res.data;
}

export async function deleteDevice(id: string): Promise<ApiResponse<void>> {
  const res = await api.delete(`/devices/${id}`);
  return res.data;
}

export async function regenerateApiKey(id: string): Promise<ApiResponse<{ apiKey: string }>> {
  const res = await api.post(`/devices/${id}/regenerate-key`);
  return res.data;
}
