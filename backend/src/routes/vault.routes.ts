import { Router } from 'express';
import { getVaultSecrets, saveVaultSecret, deleteVaultSecret } from '../controllers/vault.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateProjectOwnership } from '../middleware/projectOwnership.middleware.js';

const router = Router();

// All vault routes require developer authentication and project ownership verification
router.use(authenticate);
router.use(validateProjectOwnership);

router.get('/', getVaultSecrets);
router.post('/', saveVaultSecret);
router.delete('/:providerId', deleteVaultSecret);

export const vaultRoutes = router;
