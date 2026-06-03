import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { rateLimiter, RATE_LIMITS } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

/**
 * GET /api/presets — List style presets
 */
router.get('/', rateLimiter(RATE_LIMITS.PUBLIC), async (_req: Request, res: Response) => {
  try {
    const presets = await prisma.stylePreset.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(presets);
  } catch (error) {
    logger.error('Error listing style presets', { error });
    res.status(500).json({ error: 'Failed to list style presets' });
  }
});

export default router;
