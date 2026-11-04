import { Router } from 'express';
import { getRoutingRules, updateRoutingRule } from '../controllers/routing.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateProjectOwnership } from '../middleware/projectOwnership.middleware.js';

const router = Router();

router.use(authenticate);
router.use(validateProjectOwnership);

router.get('/', getRoutingRules);
router.put('/', updateRoutingRule);

export const routingRoutes = router;
