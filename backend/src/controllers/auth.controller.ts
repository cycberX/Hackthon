import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateNumericOtp, hashToken, generateApiKey, safeCompare } from '../utils/crypto.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { mailService } from '../services/mail.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Extracts client IP safely.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'Unknown IP';
}

/**
 * Extracts client User-Agent.
 */
function getClientUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'Unknown Device/Browser';
}

/**
 * 1. User Signup
 * POST /api/v1/auth/signup
 * Fields: user_id (optional), name, phone_no, email, password, terms_accepted
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user_id, name, phone_no, email, password, terms_accepted, termsAccepted } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);
    const acceptedTerms = terms_accepted === true || termsAccepted === true;

    // Check for existing user
    let existingUser = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires');

    if (existingUser && existingUser.isVerified) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'An account with this email address already exists. Please log in.',
        },
      });
      return;
    }

    const otp = generateNumericOtp(6);
    const hashedOtp = hashToken(otp);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Re-use unverified user account
      existingUser.name = name;
      existingUser.phone_no = phone_no;
      existingUser.terms_accepted = acceptedTerms;
      existingUser.password = password; // pre-save will re-hash
      existingUser.verificationOtp = hashedOtp;
      existingUser.verificationOtpExpires = otpExpires;
      user = await existingUser.save();
    } else {
      user = await User.create({
        ...(user_id && { user_id }),
        name,
        phone_no,
        email,
        password,
        terms_accepted: acceptedTerms,
        verificationOtp: hashedOtp,
        verificationOtpExpires: otpExpires,
        isVerified: false,
      });
    }

    // Send Signup OTP Email using template
    await mailService.sendSignupOtp(email, {
      name,
      otp,
      expiresInMinutes: 10,
    });

    // Audit Log
    await AuditLog.create({
      action: 'USER_SIGNUP',
      userId: user._id,
      userEmail: email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { user_id: user.user_id, phone_no: user.phone_no, terms_accepted: acceptedTerms, isVerified: false },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.',
      data: {
        userId: user._id,
        user_id: user.user_id,
        name: user.name,
        phone_no: user.phone_no,
        email: user.email,
        terms_accepted: user.terms_accepted,
        isVerified: false,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 2. Verify Signup OTP / Email
 * POST /api/v1/auth/verify-otp
 * POST /api/v1/auth/verify-email
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, otp } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const user = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires');
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email address.',
        },
      });
      return;
    }

    if (user.isVerified) {
      res.status(200).json({
        success: true,
        message: 'Account is already verified. You can log in.',
        data: {
          user_id: user.user_id,
          email: user.email,
          isVerified: true,
        },
      });
      return;
    }

    const hashedInputOtp = hashToken(otp);

    if (
      !user.verificationOtp ||
      !safeCompare(user.verificationOtp, hashedInputOtp) ||
      !user.verificationOtpExpires ||
      user.verificationOtpExpires < new Date()
    ) {
      await AuditLog.create({
        action: 'VERIFY_OTP_FAILED',
        userId: user._id,
        userEmail: email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        details: { reason: 'Invalid or expired OTP' },
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OR_EXPIRED_OTP',
          message: 'The verification code provided is invalid or has expired. Please request a new one.',
        },
      });
      return;
    }

    // Mark as verified and clear OTP fields
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    // Send Welcome Email
    await mailService.sendWelcomeVerified(email, { name: user.name });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Audit Log
    await AuditLog.create({
      action: 'EMAIL_VERIFIED',
      userId: user._id,
      userEmail: email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { user_id: user.user_id },
    });

    res.status(200).json({
      success: true,
      message: 'Email successfully verified! Welcome to OneAPI.',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 3. Resend OTP
 * POST /api/v1/auth/resend-otp
 */
export async function resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const user = await User.findOne({ email }).select('+verificationOtp +verificationOtpExpires');
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email address.',
        },
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Your account is already verified. Please proceed to login.',
        },
      });
      return;
    }

    const otp = generateNumericOtp(6);
    user.verificationOtp = hashToken(otp);
    user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await mailService.sendSignupOtp(email, {
      name: user.name,
      otp,
      expiresInMinutes: 10,
    });

    await AuditLog.create({
      action: 'RESEND_OTP',
      userId: user._id,
      userEmail: email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'A new verification code has been dispatched to your email.',
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 4. User Login
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password combination.',
        },
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({
        action: 'LOGIN_FAILED',
        userId: user._id,
        userEmail: email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        details: { reason: 'Incorrect password' },
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password combination.',
        },
      });
      return;
    }

    // Check email verification status
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before logging in. Use /resend-otp if you need a new code.',
        },
      });
      return;
    }

    // Update last login metadata
    const loginTime = new Date();
    user.lastLogin = loginTime;
    user.lastLoginIp = ipAddress;
    user.lastLoginDevice = userAgent;
    await user.save();

    // Send "Try to login" security alert template notification to user's email
    await mailService.sendTryToLoginAlert(email, {
      name: user.name,
      ipAddress,
      userAgent,
      timestamp: loginTime.toUTCString(),
    });

    // Generate JWT access & refresh tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Audit Log
    await AuditLog.create({
      action: 'USER_LOGIN',
      userId: user._id,
      userEmail: email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { user_id: user.user_id },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 5. Forgot Password
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const user = await User.findOne({ email }).select('+resetPasswordOtp +resetPasswordExpires');

    if (user) {
      const otp = generateNumericOtp(6);
      user.resetPasswordOtp = hashToken(otp);
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      // Dispatch Forgot Password Email with template
      await mailService.sendForgotPasswordOtp(email, {
        name: user.name,
        otp,
        expiresInMinutes: 15,
      });

      await AuditLog.create({
        action: 'FORGOT_PASSWORD_REQUEST',
        userId: user._id,
        userEmail: email,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been dispatched.',
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 6. Reset Password
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const user = await User.findOne({ email }).select('+password +resetPasswordOtp +resetPasswordExpires');
    if (!user) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESET_REQUEST',
          message: 'Invalid password reset code or email.',
        },
      });
      return;
    }

    const hashedInputOtp = hashToken(otp);

    if (
      !user.resetPasswordOtp ||
      !safeCompare(user.resetPasswordOtp, hashedInputOtp) ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      await AuditLog.create({
        action: 'RESET_PASSWORD_FAILED',
        userId: user._id,
        userEmail: email,
        ipAddress,
        userAgent,
        status: 'FAILED',
        details: { reason: 'Invalid or expired reset code' },
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OR_EXPIRED_CODE',
          message: 'The password reset code is invalid or has expired. Please request a new code.',
        },
      });
      return;
    }

    // Update password (pre-save hook will hash)
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await mailService.sendPasswordResetSuccess(email, {
      name: user.name,
      timestamp: new Date().toUTCString(),
    });

    await AuditLog.create({
      action: 'PASSWORD_RESET_SUCCESS',
      userId: user._id,
      userEmail: email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 7. Get Current User Profile
 * GET /api/v1/auth/me
 */
export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 8. Refresh Token
 * POST /api/v1/auth/refresh-token
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required.',
        },
      });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or expired. Please log in again.',
        },
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists.',
        },
      });
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 9. Logout
 * POST /api/v1/auth/logout
 */
export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * =========================================================================
 * API KEY CRUD & VALIDATION OPERATIONS
 * =========================================================================
 */

/**
 * 10. Create API Key
 * POST /api/v1/auth/api-keys
 * POST /api/v1/auth/create-api-key
 */
export async function createApiKeyHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, expiresInDays } = req.body;
    const user = req.user!;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const { rawKey, keyPrefix, keyHash } = generateApiKey();

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const newKey = {
      _id: undefined as any,
      name,
      keyPrefix,
      keyHash,
      isActive: true,
      expiresAt,
      createdAt: new Date(),
    };

    user.apiKeys.push(newKey);
    await user.save();

    // Get the newly pushed key document with its generated _id
    const createdKeyDoc = user.apiKeys[user.apiKeys.length - 1];

    // Send API Key Created Email notification
    await mailService.sendApiKeyCreated(user.email, {
      name: user.name,
      keyName: name,
      keyPrefix,
      timestamp: new Date().toUTCString(),
      ipAddress,
    });

    await AuditLog.create({
      action: 'API_KEY_CREATED',
      userId: user._id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { keyId: createdKeyDoc._id, keyName: name, keyPrefix, user_id: user.user_id },
    });

    res.status(201).json({
      success: true,
      message: 'API key successfully created. Make sure to copy your secret key now; it cannot be shown again!',
      data: {
        apiKey: rawKey,
        keyId: createdKeyDoc._id,
        keyPrefix,
        name,
        isActive: true,
        expiresAt,
        user_id: user.user_id,
        email: user.email,
        createdAt: createdKeyDoc.createdAt,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 11. List All API Keys for Authenticated User
 * GET /api/v1/auth/api-keys
 */
export async function listApiKeys(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        apiKeys: user.apiKeys || [],
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 12. Get Single API Key by ID
 * GET /api/v1/auth/api-keys/:keyId
 */
export async function getApiKeyById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { keyId } = req.params;
    const user = req.user!;

    const key = user.apiKeys.find((k) => k._id.toString() === keyId);
    if (!key) {
      res.status(404).json({
        success: false,
        error: {
          code: 'API_KEY_NOT_FOUND',
          message: 'No API key found with the specified ID.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        apiKey: key,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 13. Update API Key (Rename or Toggle Active State)
 * PATCH /api/v1/auth/api-keys/:keyId
 */
export async function updateApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { keyId } = req.params;
    const { name, isActive } = req.body;
    const user = req.user!;

    const key = user.apiKeys.find((k) => k._id.toString() === keyId);
    if (!key) {
      res.status(404).json({
        success: false,
        error: {
          code: 'API_KEY_NOT_FOUND',
          message: 'No API key found with the specified ID.',
        },
      });
      return;
    }

    if (name !== undefined) key.name = name;
    if (isActive !== undefined) key.isActive = isActive;

    await user.save();

    await AuditLog.create({
      action: 'API_KEY_UPDATED',
      userId: user._id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
      userAgent: getClientUserAgent(req),
      status: 'SUCCESS',
      details: { keyId, name, isActive },
    });

    res.status(200).json({
      success: true,
      message: 'API key successfully updated.',
      data: {
        apiKey: key,
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 14. Revoke / Delete API Key
 * DELETE /api/v1/auth/api-keys/:keyId
 */
export async function revokeApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { keyId } = req.params;
    const user = req.user!;

    const initialLength = user.apiKeys.length;
    user.apiKeys = user.apiKeys.filter((key) => key._id.toString() !== keyId);

    if (user.apiKeys.length === initialLength) {
      res.status(404).json({
        success: false,
        error: {
          code: 'API_KEY_NOT_FOUND',
          message: 'No API key found with the specified ID.',
        },
      });
      return;
    }

    await user.save();

    await AuditLog.create({
      action: 'API_KEY_REVOKED',
      userId: user._id,
      userEmail: user.email,
      ipAddress: getClientIp(req),
      userAgent: getClientUserAgent(req),
      status: 'SUCCESS',
      details: { keyId },
    });

    res.status(200).json({
      success: true,
      message: 'API key successfully revoked.',
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 15. AI API Key Validation Endpoint
 * POST /api/v1/auth/api-keys/validate
 * Validates an API key using userId (or user_id) and email.
 */
export async function validateApiKeyHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { apiKey, email, userId, user_id } = req.body;
    const targetUserId = user_id || userId;
    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    const query: Record<string, any> = { email: email.toLowerCase() };
    if (typeof targetUserId === 'string' && targetUserId.startsWith('usr_')) {
      query.user_id = targetUserId;
    } else if (typeof targetUserId === 'string' && mongoose.Types.ObjectId.isValid(targetUserId)) {
      query.$or = [{ user_id: targetUserId }, { _id: targetUserId }];
    } else if (typeof targetUserId === 'string') {
      query.user_id = targetUserId;
    }

    const user = await User.findOne(query).select('+apiKeys.keyHash');
    if (!user) {
      res.status(401).json({
        success: false,
        valid: false,
        error: {
          code: 'USER_MISMATCH',
          message: 'No account matches the provided user ID and email.',
        },
      });
      return;
    }

    const hashedInput = hashToken(apiKey);
    const key = user.apiKeys.find((k) => safeCompare(k.keyHash, hashedInput));

    if (!key) {
      res.status(401).json({
        success: false,
        valid: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'The provided API key does not belong to this user.',
        },
      });
      return;
    }

    if (!key.isActive) {
      res.status(403).json({
        success: false,
        valid: false,
        error: {
          code: 'API_KEY_DEACTIVATED',
          message: 'This API key has been deactivated.',
        },
      });
      return;
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      res.status(403).json({
        success: false,
        valid: false,
        error: {
          code: 'API_KEY_EXPIRED',
          message: 'This API key has expired.',
        },
      });
      return;
    }

    // Update lastUsedAt
    key.lastUsedAt = new Date();
    await user.save();

    await AuditLog.create({
      action: 'API_KEY_VALIDATED',
      userId: user._id,
      userEmail: user.email,
      ipAddress,
      userAgent,
      status: 'SUCCESS',
      details: { keyId: key._id, keyName: key.name, user_id: user.user_id },
    });

    res.status(200).json({
      success: true,
      valid: true,
      message: 'API key is valid and authorized.',
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone_no: user.phone_no,
        keyId: key._id,
        keyName: key.name,
        keyPrefix: key.keyPrefix,
        status: 'ACTIVE',
      },
    });
  } catch (err: any) {
    next(err);
  }
}

/**
 * 14. Change Password for Authenticated User
 * POST /api/v1/auth/change-password
 */
export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!._id;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Current password and new password are required.' },
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters long.' },
      });
      return;
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' },
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_RESET_SUCCESS',
      userId: user._id,
      userEmail: user.email,
      ipAddress: req.ip || '',
      userAgent: (req.headers['user-agent'] as string) || '',
      status: 'SUCCESS',
      details: { reason: 'User initiated password change in Settings' },
    });

    res.status(200).json({
      success: true,
      message: 'Password successfully updated.',
    });
  } catch (err: any) {
    next(err);
  }
}

