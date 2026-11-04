import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateProjectOwnership } from '../middleware/projectOwnership.middleware.js';
import {
  createProject,
  listProjects,
  getDefaultProject,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/default', getDefaultProject);
router.get('/:projectId', validateProjectOwnership, getProjectById);
router.put('/:projectId', validateProjectOwnership, updateProject);
router.delete('/:projectId', validateProjectOwnership, deleteProject);

export const projectRoutes = router;
