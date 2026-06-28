import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createWidgetSchema, updateWidgetSchema, saveLayoutSchema } from './widgets.schema';
import * as widgetsController from './widgets.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', widgetsController.getWidgets);
router.post('/', validate(createWidgetSchema), widgetsController.createWidget);
router.put('/layout', validate(saveLayoutSchema), widgetsController.saveLayout);
router.put('/:widgetId', validate(updateWidgetSchema), widgetsController.updateWidget);
router.delete('/:widgetId', widgetsController.deleteWidget);

export default router;
