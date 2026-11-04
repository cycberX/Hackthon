import { Router } from 'express';
import { getDashboardOverview, getDashboardLogs } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateProjectOwnership } from '../middleware/projectOwnership.middleware.js';

const router = Router();

router.use(authenticate);
router.use(validateProjectOwnership);

router.get('/overview', getDashboardOverview);
router.get('/logs', getDashboardLogs);

export const dashboardRoutes = router;
