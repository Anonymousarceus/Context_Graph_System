/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */

import { logger } from '../utils/logger.js';

/**
 * Error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Not found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Request logger middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

/**
 * Validate JSON body middleware
 */
export const validateJsonBody = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body || Object.keys(req.body).length === 0) {
      // Allow empty body for some endpoints
      if (req.path.includes('/query')) {
        return res.status(400).json({
          success: false,
          error: 'Request body is required'
        });
      }
    }
  }
  next();
};

export default {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateJsonBody
};
