import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const createBtoSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  location: z.string().min(1).max(100),
  launchYear: z.number().int().min(2020).max(2050),
  developer: z.string().default('HDB'),
  imageUrl: z.string().url().optional().nullable(),
  published: z.boolean().default(false),
});

const updateBtoSchema = createBtoSchema.partial();

const createFlatModelSchema = z.object({
  name: z.string().min(1).max(200),
  flatType: z.enum(['3-room', '4-room', '5-room', 'executive', '2-room-flexi']),
  floorPlanUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  totalArea: z.number().positive().optional().nullable(),
  roomCount: z.number().int().positive().optional().nullable(),
  published: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// ─── Public Routes ────────────────────────────────────────────────

/**
 * GET /api/bto — List published BTO projects
 */
router.get('/', rateLimiter(RATE_LIMITS.PUBLIC), async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.bTOProject.findMany({
      where: { published: true },
      orderBy: { launchYear: 'desc' },
      include: {
        models: {
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            flatType: true,
            thumbnailUrl: true,
            totalArea: true,
            roomCount: true,
          },
        },
      },
    });

    res.json(projects);
  } catch (error) {
    logger.error('Error listing BTO projects', { error });
    res.status(500).json({ error: 'Failed to list BTO projects' });
  }
});

/**
 * GET /api/bto/:slug — Get BTO project detail by slug
 */
router.get('/:slug', rateLimiter(RATE_LIMITS.PUBLIC), async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const project = await prisma.bTOProject.findUnique({
      where: { slug },
      include: {
        models: {
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            flatType: true,
            floorPlanUrl: true,
            thumbnailUrl: true,
            totalArea: true,
            roomCount: true,
          },
        },
      },
    });

    if (!project || !project.published) {
      res.status(404).json({ error: 'BTO project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    logger.error('Error getting BTO project', { error, slug: req.params.slug as string });
    res.status(500).json({ error: 'Failed to get BTO project' });
  }
});

/**
 * GET /api/bto/:id/models — Get flat models for a BTO project
 */
router.get('/:id/models', rateLimiter(RATE_LIMITS.PUBLIC), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const models = await prisma.flatModel.findMany({
      where: {
        btoProjectId: id,
        published: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json(models);
  } catch (error) {
    logger.error('Error listing flat models', { error, btoProjectId: req.params.id as string });
    res.status(500).json({ error: 'Failed to list flat models' });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────

/**
 * POST /api/bto — Create BTO project (admin)
 */
router.post('/', authenticate, requireAdmin, rateLimiter(RATE_LIMITS.ADMIN), async (req: Request, res: Response) => {
  try {
    const data = createBtoSchema.parse(req.body);

    const project = await prisma.bTOProject.create({
      data,
    });

    logger.info('BTO project created', { id: project.id, slug: project.slug });
    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error creating BTO project', { error });
    res.status(500).json({ error: 'Failed to create BTO project' });
  }
});

/**
 * PUT /api/bto/:id — Update BTO project (admin)
 */
router.put('/:id', authenticate, requireAdmin, rateLimiter(RATE_LIMITS.ADMIN), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateBtoSchema.parse(req.body);

    const project = await prisma.bTOProject.update({
      where: { id },
      data,
    });

    logger.info('BTO project updated', { id: project.id });
    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'BTO project not found' });
      return;
    }
    logger.error('Error updating BTO project', { error });
    res.status(500).json({ error: 'Failed to update BTO project' });
  }
});

/**
 * DELETE /api/bto/:id — Delete BTO project (admin)
 */
router.delete('/:id', authenticate, requireAdmin, rateLimiter(RATE_LIMITS.ADMIN_DELETE), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.bTOProject.delete({
      where: { id },
    });

    logger.info('BTO project deleted', { id: req.params.id as string });
    res.status(204).send();
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'BTO project not found' });
      return;
    }
    logger.error('Error deleting BTO project', { error });
    res.status(500).json({ error: 'Failed to delete BTO project' });
  }
});

/**
 * POST /api/bto/:id/models — Create flat model (admin)
 */
router.post('/:id/models', authenticate, requireAdmin, rateLimiter(RATE_LIMITS.ADMIN), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = createFlatModelSchema.parse(req.body);

    // Verify BTO project exists
    const btoProject = await prisma.bTOProject.findUnique({
      where: { id },
    });

    if (!btoProject) {
      res.status(404).json({ error: 'BTO project not found' });
      return;
    }

    const model = await prisma.flatModel.create({
      data: {
        ...data,
        btoProjectId: id,
      },
    });

    logger.info('Flat model created', { id: model.id, btoProjectId: id });
    res.status(201).json(model);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error creating flat model', { error });
    res.status(500).json({ error: 'Failed to create flat model' });
  }
});

export default router;
