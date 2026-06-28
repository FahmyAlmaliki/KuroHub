import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/postgres';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import type { User, AuthTokens } from '../../types/index';
import type { RegisterInput, LoginInput, UpdateProfileInput } from './auth.schema';

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as string,
  } as jwt.SignOptions);
}

async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );
  return token;
}

async function generateTokens(userId: string): Promise<AuthTokens> {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);
  return { accessToken, refreshToken };
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    timezone: row.timezone as string,
    theme: row.theme as User['theme'],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<{ user: User } & AuthTokens> {
  const existing = await query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing.rows.length > 0) {
    throw new AppError('EMAIL_EXISTS', 'Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const result = await query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
    [input.name, input.email, hashedPassword]
  );

  const user = mapUser(result.rows[0]);
  const tokens = await generateTokens(user.id);

  return { user, ...tokens };
}

export async function login(input: LoginInput): Promise<{ user: User } & AuthTokens> {
  const result = await query('SELECT * FROM users WHERE email = $1', [input.email]);
  if (result.rows.length === 0) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const row = result.rows[0];
  const valid = await bcrypt.compare(input.password, row.password as string);
  if (!valid) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }

  const user = mapUser(row);
  const tokens = await generateTokens(user.id);

  return { user, ...tokens };
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  const result = await query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
  }

  const row = result.rows[0];
  const userId = row.user_id as string;

  // Hapus refresh token lama, buat yang baru (rotation)
  await query('DELETE FROM refresh_tokens WHERE id = $1', [row.id]);
  const tokens = await generateTokens(userId);

  return tokens;
}

export async function logout(token: string): Promise<void> {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

export async function getMe(userId: string): Promise<User> {
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }
  return mapUser(result.rows[0]);
}

export async function updateMe(userId: string, input: UpdateProfileInput): Promise<User> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.timezone !== undefined) {
    fields.push(`timezone = $${paramIndex++}`);
    values.push(input.timezone);
  }
  if (input.theme !== undefined) {
    fields.push(`theme = $${paramIndex++}`);
    values.push(input.theme);
  }

  if (fields.length === 0) {
    return getMe(userId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  return mapUser(result.rows[0]);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const result = await query('SELECT password FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('USER_NOT_FOUND', 'User not found', 404);
  }

  const valid = await bcrypt.compare(currentPassword, result.rows[0].password as string);
  if (!valid) {
    throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [
    hashedPassword,
    userId,
  ]);
}
