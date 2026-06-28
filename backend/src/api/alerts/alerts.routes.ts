import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createAlertSchema, updateAlertSchema } from './alerts.schema';
import * as alertsController from './alerts.controller';

const router = Router();

router.use(authenticate);

router.get('/history', alertsController.getAlertHistory);
router.get('/', alertsController.getAlertRules);
router.post('/', validate(createAlertSchema), alertsController.createAlertRule);
router.get('/:id', alertsController.getAlertRuleById);
router.put('/:id', validate(updateAlertSchema), alertsController.updateAlertRule);
router.patch('/:id/toggle', alertsController.toggleAlertRule);
router.delete('/:id', alertsController.deleteAlertRule);

export default router;
