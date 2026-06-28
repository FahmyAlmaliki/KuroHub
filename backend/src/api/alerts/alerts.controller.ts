import { Request, Response, NextFunction } from 'express';
import * as alertsService from './alerts.service';
import type { CreateAlertInput, UpdateAlertInput, HistoryQueryInput } from './alerts.schema';

function sendSuccess(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export async function getAlertRules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rules = await alertsService.getAlertRules(req.userId!);
    sendSuccess(res, { rules });
  } catch (err) {
    next(err);
  }
}

export async function getAlertRuleById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await alertsService.getAlertRuleById(req.userId!, req.params.id);
    sendSuccess(res, { rule });
  } catch (err) {
    next(err);
  }
}

export async function createAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as CreateAlertInput;
    const rule = await alertsService.createAlertRule(req.userId!, input);
    sendSuccess(res, { rule }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as UpdateAlertInput;
    const rule = await alertsService.updateAlertRule(req.userId!, req.params.id, input);
    sendSuccess(res, { rule });
  } catch (err) {
    next(err);
  }
}

export async function deleteAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await alertsService.deleteAlertRule(req.userId!, req.params.id);
    sendSuccess(res, { message: 'Alert rule deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function toggleAlertRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await alertsService.toggleAlertRule(req.userId!, req.params.id);
    sendSuccess(res, { rule });
  } catch (err) {
    next(err);
  }
}

export async function getAlertHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params: HistoryQueryInput = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      deviceId: req.query.deviceId as string | undefined,
      ruleId: req.query.ruleId as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };

    const result = await alertsService.getAlertHistory(req.userId!, params);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
