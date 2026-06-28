import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createPinSchema, updatePinSchema, writePinSchema } from './virtualpin.schema';
import * as pinController from './virtualpin.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/export', pinController.exportPins);
router.get('/', pinController.getPins);
router.post('/', validate(createPinSchema), pinController.upsertPin);
router.get('/:pinNumber/latest', pinController.getPinLatest);
router.post('/:pinNumber/write', validate(writePinSchema), pinController.writePin);
router.get('/:pinNumber/history', pinController.getPinHistory);
router.put('/:pinNumber', validate(updatePinSchema), pinController.updatePin);
router.delete('/:pinNumber', pinController.deletePin);

export default router;
