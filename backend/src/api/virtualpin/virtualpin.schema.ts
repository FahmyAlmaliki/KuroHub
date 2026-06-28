import { z } from 'zod';

export const createPinSchema = z.object({
  pinNumber: z.number().int().min(0).max(255),
  label: z.string().max(100).optional().default(''),
  direction: z.enum(['read', 'write', 'readwrite']).optional().default('read'),
  dataType: z.enum(['number', 'string', 'color']).optional().default('number'),
  unit: z.string().max(20).optional().default(''),
  minValue: z.number().optional().default(0),
  maxValue: z.number().optional().default(1023),
});

export const updatePinSchema = z.object({
  label: z.string().max(100).optional(),
  direction: z.enum(['read', 'write', 'readwrite']).optional(),
  dataType: z.enum(['number', 'string', 'color']).optional(),
  unit: z.string().max(20).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
});

export const historyQuerySchema = z.object({
  from: z.string().datetime({ message: 'Invalid ISO8601 date for from' }),
  to: z.string().datetime({ message: 'Invalid ISO8601 date for to' }).optional(),
  resolution: z.enum(['1m', '5m', '15m', '1h', '1d']).optional().default('5m'),
  fn: z.enum(['mean', 'max', 'min', 'last']).optional().default('mean'),
});

export const writePinSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export const exportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['csv', 'json']).optional().default('json'),
  pins: z.string().optional(),
});

export type CreatePinInput = z.infer<typeof createPinSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type WritePinInput = z.infer<typeof writePinSchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
