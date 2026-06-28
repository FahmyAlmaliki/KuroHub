import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import type { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from './auth.schema';

function sendSuccess(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

function extractRefreshCookie(req: Request, res: Response): string | null {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
    });
    return null;
  }
  return token;
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as RegisterInput;
    const result = await authService.register(input);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as LoginInput;
    const result = await authService.login(input);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Coba dari cookie dulu, fallback ke request body
    let token = extractRefreshCookie(req, res);
    if (!token && req.body?.refreshToken) {
      token = req.body.refreshToken;
    }
    if (!token) return;
    const result = await authService.refreshToken(token);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.userId!);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as UpdateProfileInput;
    const user = await authService.updateMe(req.userId!, input);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as ChangePasswordInput;
    await authService.changePassword(req.userId!, input.currentPassword, input.newPassword);
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}
