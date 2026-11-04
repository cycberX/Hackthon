import { z } from 'zod';

export const signupSchema = z
  .object({
    user_id: z.string().trim().optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
    phone_no: z
      .string()
      .trim()
      .min(7, 'Phone number must be at least 7 characters')
      .max(25, 'Phone number cannot exceed 25 characters'),
    email: z.string().trim().email('Invalid email address format').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    terms_accepted: z.boolean().optional(),
    termsAccepted: z.boolean().optional(),
  })
  .refine((data) => data.terms_accepted === true || data.termsAccepted === true, {
    message: 'You must accept the terms & conditions (terms_accepted: true) to register.',
    path: ['terms_accepted'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  otp: z.string().trim().length(6, 'Verification code must be exactly 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  otp: z.string().trim().length(6, 'Reset code must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(2, 'API key name must be at least 2 characters').max(50, 'API key name cannot exceed 50 characters'),
  expiresInDays: z.number().int().positive().max(365).optional(),
  projectId: z.string().optional(),
  scopes: z.array(z.string()).optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().trim().min(2, 'API key name must be at least 2 characters').max(50, 'API key name cannot exceed 50 characters').optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.name !== undefined || data.isActive !== undefined, {
  message: 'At least one field (name or isActive) must be provided to update the API key.',
});

export const validateApiKeySchema = z
  .object({
    apiKey: z.string().trim().min(1, 'API key is required'),
    email: z.string().trim().email('Valid email is required').toLowerCase(),
    userId: z.string().trim().optional(),
    user_id: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.userId || data.user_id), {
    message: 'Either userId or user_id must be provided to validate the API key.',
    path: ['userId'],
  });
