import { z } from 'zod';

export const createWidgetSchema = z.object({
  type: z.enum([
    'value_display', 'line_chart', 'area_chart', 'gauge',
    'button', 'toggle', 'slider', 'led', 'label',
  ]),
  pinNumber: z.number().int().min(0).max(255).nullable().optional(),
  label: z.string().max(100).optional().default(''),
  config: z.record(z.unknown()).optional().default({}),
  layout: z.object({
    x: z.number().int().min(0).default(0),
    y: z.number().int().min(0).default(0),
    w: z.number().int().min(1).default(3),
    h: z.number().int().min(1).default(2),
  }).optional().default({ x: 0, y: 0, w: 3, h: 2 }),
});

export const updateWidgetSchema = z.object({
  pinNumber: z.number().int().min(0).max(255).nullable().optional(),
  label: z.string().max(100).optional(),
  config: z.record(z.unknown()).optional(),
  layout: z.object({
    x: z.number().int().min(0).optional(),
    y: z.number().int().min(0).optional(),
    w: z.number().int().min(1).optional(),
    h: z.number().int().min(1).optional(),
  }).optional(),
});

export const saveLayoutSchema = z.object({
  layouts: z.array(
    z.object({
      widgetId: z.string().uuid(),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1),
      h: z.number().int().min(1),
    })
  ).min(1, 'At least one layout item is required'),
});

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>;
export type SaveLayoutInput = z.infer<typeof saveLayoutSchema>;
