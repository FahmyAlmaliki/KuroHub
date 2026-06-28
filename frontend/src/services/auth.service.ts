import api from './api';
import type { ApiResponse, User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function register(data: RegisterData): Promise<ApiResponse<AuthResult>> {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function login(data: LoginData): Promise<ApiResponse<AuthResult>> {
  const res = await api.post('/auth/login', data);
  return res.data;
}

export async function refresh(): Promise<ApiResponse<{ accessToken: string }>> {
  const res = await api.post('/auth/refresh');
  return res.data;
}

export async function logout(): Promise<ApiResponse<void>> {
  const res = await api.post('/auth/logout');
  return res.data;
}

export async function getMe(): Promise<ApiResponse<User>> {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function updateMe(data: Partial<User>): Promise<ApiResponse<User>> {
  const res = await api.put('/auth/me', data);
  return res.data;
}

export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> {
  const res = await api.put('/auth/password', data);
  return res.data;
}
