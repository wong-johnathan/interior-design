import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';
import Redis from 'ioredis';

// ─── JWT Verification (NextAuth-compatible) ───────────────────────

/**
 * Extracts and verifies the NextAuth session JWT from the Authorization header.
 * In production, this validates the JWT cryptographically using NextAuth's
 * `unstable_getServerSession` or JWT decode logic.
 *
 * For this Express backend, we parse the Bearer token and look up the session.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    _res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Look up session by session token (NextAuth stores sessions)
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      _res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Attach user to request
    (req as any).user = session.user;
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    _res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth — attaches user if valid token, continues regardless.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });

    if (session && session.expires > new Date()) {
      (req as any).user = session.user;
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }

  next();
}

// ─── Admin Role Guard ─────────────────────────────────────────────

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    _res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

// ─── Project Ownership Guard ──────────────────────────────────────

export async function requireProjectOwner(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).user;
  const projectId = req.params.id as string;

  if (!user) {
    _res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      _res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.userId && project.userId !== user.id) {
      _res.status(403).json({ error: 'You do not own this project' });
      return;
    }

    next();
  } catch (error) {
    logger.error('Project ownership check error', { error });
    _res.status(500).json({ error: 'Authorization check failed' });
  }
}

// ─── Rate Limiter ─────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();
const IN_MEMORY_CLEANUP_INTERVAL = 60_000; // Clean up every minute

// Periodically clean stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}, IN_MEMORY_CLEANUP_INTERVAL);

let redisClient: Redis | null = null;

async function getRedisClient(): Promise<Redis | null> {
  if (redisClient) return redisClient;

  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
      await redisClient.connect();
      logger.info('Redis rate limiter connected');
      return redisClient;
    } catch (error) {
      logger.warn('Redis unavailable, falling back to in-memory rate limiter', { error });
      redisClient = null;
      return null;
    }
  }

  return null;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export function rateLimiter(config: RateLimitConfig) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const key = `${req.ip || req.socket.remoteAddress}:${req.method}:${req.path}`;
    const now = Date.now();

    // Try Redis first
    const redis = await getRedisClient();
    if (redis) {
      try {
        const windowKey = `ratelimit:${key}`;
        const current = await redis.incr(windowKey);
        if (current === 1) {
          await redis.pexpire(windowKey, config.windowMs);
        }
        const ttl = await redis.pttl(windowKey);
        if (current > config.max) {
          _res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil(ttl / 1000),
          });
          return;
        }
        _res.setHeader('X-RateLimit-Limit', config.max);
        _res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - current));
        _res.setHeader('X-RateLimit-Reset', Math.ceil((now + ttl) / 1000));
        next();
        return;
      } catch (error) {
        logger.warn('Redis rate limit failed, falling back to in-memory', { error });
      }
    }

    // In-memory fallback
    let entry = inMemoryStore.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + config.windowMs };
      inMemoryStore.set(key, entry);
    }

    entry.count++;

    if (entry.count > config.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      _res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
      return;
    }

    _res.setHeader('X-RateLimit-Limit', config.max);
    _res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - entry.count));
    _res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));
    next();
  };
}

// Predefined rate limit configs matching the spec
export const RATE_LIMITS = {
  PUBLIC: { windowMs: 60_000, max: 60 },
  USER: { windowMs: 60_000, max: 30 },
  ADMIN: { windowMs: 60_000, max: 10 },
  ADMIN_DELETE: { windowMs: 60_000, max: 5 },
  AI_CONSULT: { windowMs: 60_000, max: 30 },
  RENDER_SAMPLE: { windowMs: 60_000, max: 15 },
  RENDER_FINAL: { windowMs: 60_000, max: 5 },
  UPLOAD: { windowMs: 60_000, max: 10 },
};
