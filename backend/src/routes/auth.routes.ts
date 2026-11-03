import { Router, type Request, type Response, type NextFunction } from 'express';
import { env } from '../config/env.js';
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
  logout,
  createApiKeyHandler,
  listApiKeys,
  getApiKeyById,
  updateApiKey,
  revokeApiKey,
  validateApiKeyHandler,
  changePassword,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter, sensitiveLimiter } from '../middleware/rateLimiter.js';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createApiKeySchema,
  updateApiKeySchema,
  validateApiKeySchema,
} from '../validations/auth.validation.js';

const router = Router();

/**
 * Helper to wrap GET requests that accept query parameters or return interactive usage instructions
 */
function handleGetOrDoc(options: {
  endpoint: string;
  method: string;
  description: string;
  example: Record<string, any>;
  hasRequiredQuery?: (req: Request) => boolean;
  executeWithQuery?: (req: Request, res: Response, next: NextFunction) => void;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // In production, prohibit executing sensitive actions with credentials via GET query parameters (prevents URL/log leakage & CSRF)
    const isProduction = env.NODE_ENV === 'production';
    if (!isProduction && options.hasRequiredQuery && options.hasRequiredQuery(req) && options.executeWithQuery) {
      return options.executeWithQuery(req, res, next);
    }

    // Return a clear, developer-friendly 200 OK status guide
    res.status(200).json({
      success: true,
      endpoint: options.endpoint,
      method: options.method,
      status: 'active',
      description: options.description,
      note: `This endpoint expects an HTTP ${options.method} request with JSON body.`,
      exampleBody: options.example,
    });
  };
}

/**
 * ---------------------------------------------------------------------------
 * Auth Catalog Root
 * GET /api/v1/auth
 * ---------------------------------------------------------------------------
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'OneAPI Authentication Service',
    status: 'operational',
    basePath: '/api/v1/auth',
    routes: [
      { method: 'POST', path: '/api/v1/auth/signup', description: 'User registration with OTP verification' },
      { method: 'POST', path: '/api/v1/auth/verify-otp', description: 'Verify 6-digit OTP' },
      { method: 'POST', path: '/api/v1/auth/verify-email', description: 'Alias for verify-otp' },
      { method: 'POST', path: '/api/v1/auth/resend-otp', description: 'Resend verification OTP' },
      { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate user and receive JWT tokens' },
      { method: 'POST', path: '/api/v1/auth/forgot-password', description: 'Initiate password recovery' },
      { method: 'POST', path: '/api/v1/auth/reset-password', description: 'Complete password reset with code' },
      { method: 'POST', path: '/api/v1/auth/refresh-token', description: 'Refresh expired access token' },
      { method: 'GET',  path: '/api/v1/auth/me', description: 'Get current user profile (requires Bearer token)' },
      { method: 'POST', path: '/api/v1/auth/logout', description: 'Logout user session' },
      { method: 'POST', path: '/api/v1/auth/create-api-key', description: 'Create new API key' },
      { method: 'GET',  path: '/api/v1/auth/api-keys', description: 'List active API keys' },
      { method: 'POST', path: '/api/v1/auth/api-keys/validate', description: 'AI Agent API key validation' },
    ],
  });
});

/**
 * ---------------------------------------------------------------------------
 * 1. User Signup
 * ---------------------------------------------------------------------------
 */
router.post('/signup', authLimiter, validateBody(signupSchema), signup);
router.get(
  '/signup',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/signup',
    method: 'POST',
    description: 'User registration. Creates account and dispatches 6-digit OTP email.',
    example: {
      name: 'Alex Rivera',
      phone_no: '+14155552671',
      email: 'alex@example.com',
      password: 'SecurePassword123!',
      terms_accepted: true,
    },
    hasRequiredQuery: (req) => Boolean(req.query.email && req.query.password && req.query.name && req.query.phone_no),
    executeWithQuery: (req, res, next) => {
      req.body = {
        name: req.query.name,
        phone_no: req.query.phone_no,
        email: req.query.email,
        password: req.query.password,
        terms_accepted: req.query.terms_accepted === 'true' || req.query.terms_accepted === '1',
      };
      return signup(req, res, next);
    },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 2. User Login
 * ---------------------------------------------------------------------------
 */
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get(
  '/login',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    description: 'User Login Endpoint. Authenticates credentials and issues JWT tokens.',
    example: {
      email: 'alex@example.com',
      password: 'SecurePassword123!',
    },
    hasRequiredQuery: (req) => Boolean(req.query.email && req.query.password),
    executeWithQuery: (req, res, next) => {
      req.body = {
        email: req.query.email,
        password: req.query.password,
      };
      return login(req, res, next);
    },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 3. Verify OTP / Email
 * ---------------------------------------------------------------------------
 */
router.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/verify-email', authLimiter, validateBody(verifyOtpSchema), verifyOtp);

const verifyHandler = handleGetOrDoc({
  endpoint: '/api/v1/auth/verify-otp',
  method: 'POST',
  description: 'Verify 6-digit verification code sent to your email.',
  example: {
    email: 'alex@example.com',
    otp: '482910',
  },
  hasRequiredQuery: (req) => Boolean(req.query.email && req.query.otp),
  executeWithQuery: (req, res, next) => {
    req.body = {
      email: req.query.email,
      otp: req.query.otp,
    };
    return verifyOtp(req, res, next);
  },
});

router.get('/verify-otp', verifyHandler);
router.get('/verify-email', verifyHandler);

/**
 * ---------------------------------------------------------------------------
 * 4. Resend OTP
 * ---------------------------------------------------------------------------
 */
router.post('/resend-otp', sensitiveLimiter, validateBody(resendOtpSchema), resendOtp);
router.get(
  '/resend-otp',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/resend-otp',
    method: 'POST',
    description: 'Resend a fresh 6-digit verification code to user email.',
    example: { email: 'alex@example.com' },
    hasRequiredQuery: (req) => Boolean(req.query.email),
    executeWithQuery: (req, res, next) => {
      req.body = { email: req.query.email };
      return resendOtp(req, res, next);
    },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 5. Forgot Password
 * ---------------------------------------------------------------------------
 */
router.post('/forgot-password', sensitiveLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.get(
  '/forgot-password',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/forgot-password',
    method: 'POST',
    description: 'Send password recovery code to registered email address.',
    example: { email: 'alex@example.com' },
    hasRequiredQuery: (req) => Boolean(req.query.email),
    executeWithQuery: (req, res, next) => {
      req.body = { email: req.query.email };
      return forgotPassword(req, res, next);
    },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 6. Reset Password
 * ---------------------------------------------------------------------------
 */
router.post('/reset-password', sensitiveLimiter, validateBody(resetPasswordSchema), resetPassword);
router.get(
  '/reset-password',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/reset-password',
    method: 'POST',
    description: 'Reset password using the 6-digit recovery code.',
    example: {
      email: 'alex@example.com',
      otp: '772194',
      newPassword: 'NewPassword123!',
    },
    hasRequiredQuery: (req) => Boolean(req.query.email && req.query.otp && req.query.newPassword),
    executeWithQuery: (req, res, next) => {
      req.body = {
        email: req.query.email,
        otp: req.query.otp,
        newPassword: req.query.newPassword,
      };
      return resetPassword(req, res, next);
    },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 7. Refresh Token
 * ---------------------------------------------------------------------------
 */
router.post('/refresh-token', refreshToken);
router.get(
  '/refresh-token',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/refresh-token',
    method: 'POST',
    description: 'Obtain fresh access token using a valid refresh token.',
    example: { refreshToken: 'eyJhbGciOiJIUzI1Ni...' },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 8. AI API Key Validation Endpoint (Validates using userId + email)
 * ---------------------------------------------------------------------------
 */
router.post('/api-keys/validate', validateBody(validateApiKeySchema), validateApiKeyHandler);
router.get(
  '/api-keys/validate',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/api-keys/validate',
    method: 'POST',
    description: 'AI Agent API key validation. Validates apiKey with userId/user_id and email.',
    example: {
      apiKey: 'sk_live_...',
      userId: 'usr_...',
      email: 'alex@example.com',
    },
    hasRequiredQuery: (req) => Boolean(req.query.apiKey && req.query.email && (req.query.userId || req.query.user_id)),
    executeWithQuery: (req, res, next) => {
      req.body = {
        apiKey: req.query.apiKey,
        email: req.query.email,
        userId: req.query.userId || req.query.user_id,
      };
      return validateApiKeyHandler(req, res, next);
    },
  })
);

/**
 * ---------------------------------------------------------------------------
 * 9. Current User Profile & Logout
 * ---------------------------------------------------------------------------
 */
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);
router.get('/logout', authenticate, logout);

/**
 * ---------------------------------------------------------------------------
 * 10. API Key CRUD Operations
 * ---------------------------------------------------------------------------
 */
router.post('/create-api-key', authenticate, validateBody(createApiKeySchema), createApiKeyHandler);
router.get(
  '/create-api-key',
  handleGetOrDoc({
    endpoint: '/api/v1/auth/create-api-key',
    method: 'POST',
    description: 'Creates a new API Key for authenticated developer (requires Bearer token).',
    example: { name: 'Production AI Key', expiresInDays: 90 },
  })
);

router.post('/api-keys', authenticate, validateBody(createApiKeySchema), createApiKeyHandler);
router.get('/api-keys', authenticate, listApiKeys);
router.get('/api-keys/:keyId', authenticate, getApiKeyById);
router.patch('/api-keys/:keyId', authenticate, validateBody(updateApiKeySchema), updateApiKey);
router.delete('/api-keys/:keyId', authenticate, revokeApiKey);

export const authRoutes = router;
