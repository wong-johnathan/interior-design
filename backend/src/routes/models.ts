import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const updateModelSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  flatType: z.enum(['3-room', '4-room', '5-room', 'executive', '2-room-flexi']).optional(),
  floorPlanUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  totalArea: z.number().positive().optional().nullable(),
  roomCount: z.number().int().positive().optional().nullable(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * GET /api/models/:id — Get flat model detail with walls and rooms
 */
router.get('/:id', rateLimiter(RATE_LIMITS.PUBLIC), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const model = await prisma.flatModel.findUnique({
      where: { id },
      include: {
        walls: {
          include: {
            doorOpenings: true,
            windowOpenings: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        roomDefs: {
          orderBy: { sortOrder: 'asc' },
        },
        btoProject: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!model) {
      res.status(404).json({ error: 'Flat model not found' });
      return;
    }

    res.json(model);
  } catch (error) {
    logger.error('Error getting flat model', { error, modelId: req.params.id as string });
    res.status(500).json({ error: 'Failed to get flat model' });
  }
});

/**
 * GET /api/models/:id/walls — Get wall segments and room definitions
 */
router.get('/:id/walls', rateLimiter(RATE_LIMITS.PUBLIC), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const walls = await prisma.wallSegment.findMany({
      where: { flatModelId: id },
      include: {
        doorOpenings: true,
        windowOpenings: true,
        positiveRoom: {
          select: { id: true, label: true, roomType: true },
        },
        negativeRoom: {
          select: { id: true, label: true, roomType: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const rooms = await prisma.roomDef.findMany({
      where: { flatModelId: id },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ walls, rooms });
  } catch (error) {
    logger.error('Error getting walls', { error, modelId: req.params.id as string });
    res.status(500).json({ error: 'Failed to get walls' });
  }
});

/**
 * PUT /api/models/:id — Update flat model (admin)
 */
router.put('/:id', authenticate, requireAdmin, rateLimiter(RATE_LIMITS.ADMIN), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateModelSchema.parse(req.body);

    const model = await prisma.flatModel.update({
      where: { id },
      data,
    });

    logger.info('Flat model updated', { id: model.id });
    res.json(model);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Flat model not found' });
      return;
    }
    logger.error('Error updating flat model', { error });
    res.status(500).json({ error: 'Failed to update flat model' });
  }
});

/**
 * DELETE /api/models/:id — Delete flat model (admin)
 */
router.delete('/:id', authenticate, requireAdmin, rateLimiter(RATE_LIMITS.ADMIN_DELETE), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.flatModel.delete({
      where: { id },
    });

    logger.info('Flat model deleted', { id: req.params.id as string });
    res.status(204).send();
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Flat model not found' });
      return;
    }
    logger.error('Error deleting flat model', { error });
    res.status(500).json({ error: 'Failed to delete flat model' });
  }
});

export default router;
