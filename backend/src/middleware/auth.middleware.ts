import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../utils/tokens.js';
import { User, type IUser } from '../models/User.js';

// Extend Express Request interface to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

/**
 * Middleware to authenticate requests using JWT Bearer tokens or cookies.
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required to access this resource.',
        },
      });
      return;
    }

    // Verify token
    let decoded: TokenPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token. Please log in again.',
        },
      });
      return;
    }

    // Retrieve user from DB (excluding sensitive fields)
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The account associated with this token no longer exists.',
        },
      });
      return;
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (err: any) {
    next(err);
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...roles: ('user' | 'admin')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        },
      });
      return;
    }
    next();
  };
}
