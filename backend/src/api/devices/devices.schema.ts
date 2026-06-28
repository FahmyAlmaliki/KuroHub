import { z } from 'zod';

export const createDeviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().default(''),
  location: z.string().max(255).optional().default(''),
  groupName: z.string().max(100).optional().default(''),
  firmwareVersion: z.string().max(50).optional().default(''),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  location: z.string().max(255).optional(),
  groupName: z.string().max(100).optional(),
  firmwareVersion: z.string().max(50).optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
