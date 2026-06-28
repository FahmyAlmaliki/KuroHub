import { Request, Response, NextFunction } from 'express';
import * as devicesService from './devices.service';
import type { CreateDeviceInput, UpdateDeviceInput } from './devices.schema';

function sendSuccess(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export async function getDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const devices = await devicesService.getDevices(req.userId!);
    sendSuccess(res, { devices });
  } catch (err) {
    next(err);
  }
}

export async function getDeviceById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const device = await devicesService.getDeviceById(req.userId!, req.params.id);
    sendSuccess(res, { device });
  } catch (err) {
    next(err);
  }
}

export async function createDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as CreateDeviceInput;
    const device = await devicesService.createDevice(req.userId!, input);
    sendSuccess(res, { device, apiKey: device.apiKey }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.validatedBody as UpdateDeviceInput;
    const device = await devicesService.updateDevice(req.userId!, req.params.id, input);
    sendSuccess(res, { device });
  } catch (err) {
    next(err);
  }
}

export async function deleteDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await devicesService.deleteDevice(req.userId!, req.params.id);
    sendSuccess(res, { message: 'Device deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function regenerateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { apiKey } = await devicesService.regenerateApiKey(req.userId!, req.params.id);
    sendSuccess(res, { apiKey });
  } catch (err) {
    next(err);
  }
}
