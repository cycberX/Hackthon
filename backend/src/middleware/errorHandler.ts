import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log diagnostic error on server
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal error occurred.';

  // Handle Mongoose connection/buffering timeout
  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Database service is currently unreachable. Please ensure MongoDB is running.';
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with this ${field} already exists.`;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_RESOURCE_IDENTIFIER';
    message = `Invalid format for resource identifier: ${err.path}`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'DATABASE_VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Authentication token is invalid.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired. Please log in again.';
  }

  // Prevent internal error details leaking in production
  if (statusCode === 500 && env.NODE_ENV === 'production') {
    message = 'An unexpected internal server error occurred.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
