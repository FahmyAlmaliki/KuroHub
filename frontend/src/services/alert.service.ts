import api from './api';
import type { ApiResponse, AlertRule, AlertHistory } from '../types';

export interface CreateAlertData {
  deviceId: string;
  pinNumber: number;
  name: string;
  operator: string;
  threshold: number;
}

export interface UpdateAlertData {
  name?: string;
  operator?: string;
  threshold?: number;
}

export async function getAlerts(): Promise<ApiResponse<{ rules: AlertRule[] }>> {
  const res = await api.get('/alerts');
  return res.data;
}

export async function createAlert(data: CreateAlertData): Promise<ApiResponse<{ rule: AlertRule }>> {
  const res = await api.post('/alerts', data);
  return res.data;
}

export async function updateAlert(id: string, data: UpdateAlertData): Promise<ApiResponse<{ rule: AlertRule }>> {
  const res = await api.put(`/alerts/${id}`, data);
  return res.data;
}

export async function deleteAlert(id: string): Promise<ApiResponse<void>> {
  const res = await api.delete(`/alerts/${id}`);
  return res.data;
}

export async function toggleAlert(id: string): Promise<ApiResponse<AlertRule>> {
  const res = await api.post(`/alerts/${id}/toggle`);
  return res.data;
}

export async function getAlertHistory(ruleId: string): Promise<ApiResponse<AlertHistory[]>> {
  const res = await api.get(`/alerts/${ruleId}/history`);
  return res.data;
}
