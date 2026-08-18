import { Request, Response, NextFunction } from 'express';
import { logger } from '../observability/logger';

// In-memory store for rate limiting
// In a production environment, you'd want to use Redis or another shared store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // max 5 requests per window

/**
 * Middleware to limit request rate based on IP address
 * @param windowMs Window size in milliseconds
 * @param maxRequests Maximum requests allowed in the window
 */
export function rateLimit(windowMs: number = WINDOW_MS, maxRequests: number = MAX_REQUESTS) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP
    const ip = req.headers['x-forwarded-for'] as string || 
               req.connection.remoteAddress as string || 
               req.socket.remoteAddress as string ||
               'unknown';

    // Create key for this IP and route
    const key = `${ip}:${req.path}`;
    
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
      // First request from this IP in this window
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    // Check if window has expired
    if (now > record.resetTime) {
      // Reset the window
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      logger.warn('system', 'middleware', 'rateLimit', `Rate limit exceeded for IP: ${ip}`, {
        path: req.path,
        count: record.count
      });
      
      return res.status(429).json({
        error: 'Muitas tentativas. Por favor, tente novamente mais tarde.'
      });
    }

    // Increment counter
    record.count++;
    return next();
  };
}

/**
 * Clean up expired rate limit records
 * Should be called periodically in production
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);