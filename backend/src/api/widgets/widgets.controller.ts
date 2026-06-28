import { Request, Response, NextFunction } from 'express';
import * as widgetsService from './widgets.service';
import type { CreateWidgetInput, UpdateWidgetInput, SaveLayoutInput } from './widgets.schema';

function sendSuccess(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export async function getWidgets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const widgets = await widgetsService.getWidgets(req.params.deviceId);
    sendSuccess(res, { widgets });
  } catch (err) {
    next(err);
  }
}

export async function createWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as CreateWidgetInput;
    const widget = await widgetsService.createWidget(req.userId!, req.params.deviceId, input);
    sendSuccess(res, { widget }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as UpdateWidgetInput;
    const widget = await widgetsService.updateWidget(req.userId!, req.params.deviceId, req.params.widgetId, input);
    sendSuccess(res, { widget });
  } catch (err) {
    next(err);
  }
}

export async function deleteWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await widgetsService.deleteWidget(req.userId!, req.params.deviceId, req.params.widgetId);
    sendSuccess(res, { message: 'Widget deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function saveLayout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as SaveLayoutInput;
    const result = await widgetsService.saveLayout(req.params.deviceId, input.layouts);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
