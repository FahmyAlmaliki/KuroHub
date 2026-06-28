import { Request, Response, NextFunction } from 'express';
import * as pinService from './virtualpin.service';
import type { CreatePinInput, UpdatePinInput, WritePinInput, ExportQueryInput } from './virtualpin.schema';

function sendSuccess(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export async function getPins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pins = await pinService.getPins(req.params.deviceId);
    sendSuccess(res, { pins });
  } catch (err) {
    next(err);
  }
}

export async function upsertPin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as CreatePinInput;
    const pin = await pinService.upsertPin(req.params.deviceId, input);
    sendSuccess(res, { pin }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as UpdatePinInput;
    const pin = await pinService.updatePin(req.params.deviceId, parseInt(req.params.pinNumber, 10), input);
    sendSuccess(res, { pin });
  } catch (err) {
    next(err);
  }
}

export async function deletePin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pinService.deletePin(req.params.deviceId, parseInt(req.params.pinNumber, 10));
    sendSuccess(res, { message: 'Pin deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getPinHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to, resolution, fn } = req.query as unknown as {
      from: string;
      to?: string;
      resolution?: '1m' | '5m' | '15m' | '1h' | '1d';
      fn?: 'mean' | 'max' | 'min' | 'last';
    };

    if (!from) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAM', message: 'from parameter is required' },
      });
      return;
    }

    const result = await pinService.getPinHistory(
      req.params.deviceId,
      parseInt(req.params.pinNumber, 10),
      from,
      to,
      resolution ?? '5m',
      fn ?? 'mean'
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getPinLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await pinService.getPinLatest(
      req.params.deviceId,
      parseInt(req.params.pinNumber, 10)
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function writePin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as WritePinInput;
    await pinService.writePinFromRest(
      req.params.deviceId,
      parseInt(req.params.pinNumber, 10),
      input.value
    );
    sendSuccess(res, { message: 'Value written successfully' });
  } catch (err) {
    next(err);
  }
}

export async function exportPins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to, format, pins } = req.query as unknown as ExportQueryInput;
    const result = await pinService.exportPinsData(
      req.params.deviceId,
      from,
      to,
      format ?? 'json',
      pins
    );

    if (result.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="pins-export.csv"');
      res.status(200).send(result.data);
      return;
    }

    sendSuccess(res, { pins: result.data });
  } catch (err) {
    next(err);
  }
}
