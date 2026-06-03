import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireProjectOwner, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1).max(200).default('My Project'),
  flatModelId: z.string().optional().nullable(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  designBrief: z.any().optional(),
  furnitureState: z.any().optional(),
  furnitureApplied: z.boolean().optional(),
  modelSnapshot: z.any().optional(),
});

const updateBriefSchema = z.object({
  designBrief: z.any(),
});

const updateWallsSchema = z.object({
  wallEdits: z.array(z.object({
    action: z.enum(['DELETE_WALL', 'ADD_WALL', 'MODIFY_ROOM', 'ADD_DOOR', 'ADD_WINDOW', 'MODIFY_WALL']),
    wallId: z.string().optional(),
    wall: z.any().optional(),
    roomId: z.string().optional(),
    updates: z.any().optional(),
  })),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * POST /api/projects — Create a new project
 */
router.post('/', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const user = (req as any).user;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        flatModelId: data.flatModelId || undefined,
        userId: user.id,
      },
      include: {
        renders: true,
      },
    });

    logger.info('Project created', { id: project.id, userId: user.id });
    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error creating project', { error });
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * GET /api/projects/:id — Get project state
 */
router.get('/:id', authenticate, requireProjectOwner, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        renders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    logger.error('Error getting project', { error, projectId: req.params.id as string });
    res.status(500).json({ error: 'Failed to get project' });
  }
});

/**
 * PUT /api/projects/:id — Update project
 */
router.put('/:id', authenticate, requireProjectOwner, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    logger.info('Project updated', { id: project.id });
    res.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    logger.error('Error updating project', { error });
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * PUT /api/projects/:id/brief — Update design brief
 */
router.put('/:id/brief', authenticate, requireProjectOwner, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateBriefSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        designBrief: data.designBrief,
      },
    });

    res.json({ designBrief: project.designBrief });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    logger.error('Error updating design brief', { error });
    res.status(500).json({ error: 'Failed to update design brief' });
  }
});

/**
 * PUT /api/projects/:id/walls — Save wall edits
 */
router.put('/:id/walls', authenticate, requireProjectOwner, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = updateWallsSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        wallEdits: data.wallEdits,
      },
    });

    logger.info('Wall edits saved', { projectId: id, editCount: data.wallEdits.length });
    res.json({ wallEdits: project.wallEdits });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    logger.error('Error saving wall edits', { error });
    res.status(500).json({ error: 'Failed to save wall edits' });
  }
});

/**
 * GET /api/projects/:id/walls — Get current wall state
 */
router.get('/:id/walls', authenticate, requireProjectOwner, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        flatModelId: true,
        wallEdits: true,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get the original wall segments and room defs from the flat model
    const flatModel = project.flatModelId
      ? await prisma.flatModel.findUnique({
          where: { id: project.flatModelId },
          include: {
            walls: {
              include: {
                doorOpenings: true,
                windowOpenings: true,
                positiveRoom: true,
                negativeRoom: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
            roomDefs: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        })
      : null;

    res.json({
      originalWalls: flatModel?.walls || [],
      originalRooms: flatModel?.roomDefs || [],
      pendingEdits: project.wallEdits || [],
    });
  } catch (error) {
    logger.error('Error getting wall state', { error, projectId: req.params.id as string });
    res.status(500).json({ error: 'Failed to get wall state' });
  }
});

/**
 * GET /api/projects/:id/chat — Get chat history
 */
router.get('/:id/chat', authenticate, requireProjectOwner, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        chatHistory: true,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ chatHistory: project.chatHistory || [] });
  } catch (error) {
    logger.error('Error getting chat history', { error, projectId: req.params.id as string });
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

export default router;
