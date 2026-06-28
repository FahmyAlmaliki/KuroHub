import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createDeviceSchema, updateDeviceSchema } from './devices.schema';
import * as devicesController from './devices.controller';

const router = Router();

router.use(authenticate);

router.get('/', devicesController.getDevices);
router.post('/', validate(createDeviceSchema), devicesController.createDevice);
router.get('/:id', devicesController.getDeviceById);
router.put('/:id', validate(updateDeviceSchema), devicesController.updateDevice);
router.delete('/:id', devicesController.deleteDevice);
router.post('/:id/regenerate-key', devicesController.regenerateApiKey);

export default router;
