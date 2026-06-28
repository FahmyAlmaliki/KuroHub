import { z } from 'zod';

export const createAlertSchema = z.object({
  deviceId: z.string().uuid('Invalid device ID'),
  pinNumber: z.number().int().min(0).max(255),
  name: z.string().min(1, 'Name is required').max(255),
  operator: z.enum(['>', '<', '>=', '<=', '=']),
  threshold: z.number(),
});

export const updateAlertSchema = z.object({
  pinNumber: z.number().int().min(0).max(255).optional(),
  name: z.string().min(1).max(255).optional(),
  operator: z.enum(['>', '<', '>=', '<=', '=']).optional(),
  threshold: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const historyQuerySchema = z.object({
  deviceId: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
