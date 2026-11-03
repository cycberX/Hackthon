import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProjectById,
  saveVaultSecret,
  listVaultSecrets,
  deleteVaultSecret,
  updateRoutingRule,
  getProjectAnalytics,
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All project management endpoints require user authentication
router.use(authenticate);

// 1. Project Management
router.post('/', createProject);
router.get('/', listProjects);
router.get('/:projectId', getProjectById);

// 2. Encrypted Key Vault Management
router.post('/:projectId/vault', saveVaultSecret);
router.get('/:projectId/vault', listVaultSecrets);
router.delete('/:projectId/vault/:secretId', deleteVaultSecret);

// 3. Routing Rules (Primary & Fallback Configuration)
router.put('/:projectId/routing', updateRoutingRule);

// 4. Analytics & Telemetry Logs
router.get('/:projectId/analytics', getProjectAnalytics);

export const projectRoutes = router;
