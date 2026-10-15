import { Router } from 'express';
import { RulesController } from '../controllers/rulesController.js';

const router = Router();

router.get('/services', RulesController.getBlockedServices);
router.post('/services', RulesController.updateBlockedServices);
router.put('/devices/:id/rules', RulesController.updateDeviceRules);

export default router;
