import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireProjectOwner, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import { getGeminiClient } from '../lib/gemini';
import { bucketName, generateDownloadUrl } from '../lib/r2';
import { buildRenderPrompt } from '../lib/prompts';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const sampleRenderSchema = z.object({
  projectId: z.string().min(1),
  roomType: z.string().min(1),
  resolution: z.enum(['1024x1024', '2048x2048']).default('1024x1024'),
});

const finalRenderSchema = z.object({
  projectId: z.string().min(1),
  resolution: z.enum(['1024x1024', '2048x2048']).default('1024x1024'),
});

const saveAngleSchema = z.object({
  projectId: z.string().min(1),
  roomType: z.string().min(1),
  label: z.string().min(1).max(200),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  target: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * POST /api/render/sample — Generate sample render for one room
 *
 * TODO: Implement actual Imagen generation.
 * Currently creates a placeholder render record with "pending" status.
 * Actual flow: client sends 3D viewport screenshot -> base64 image ->
 * sent to Gemini Imagen -> result uploaded to R2 -> status updated.
 */
router.post('/sample', authenticate, rateLimiter(RATE_LIMITS.RENDER_SAMPLE), async (req: Request, res: Response) => {
  try {
    const data = sampleRenderSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, userId: true, designBrief: true, flatModelId: true },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const currentUser = (req as any).user;
    if (project.userId && project.userId !== currentUser.id) {
      res.status(403).json({ error: 'You do not own this project' });
      return;
    }

    // Get room label
    const roomDef = await prisma.roomDef.findFirst({
      where: { flatModelId: project.flatModelId!, roomType: data.roomType },
    });

    const roomLabel = roomDef?.label || data.roomType;
    const designBrief = project.designBrief as any;

    // Build render prompt
    const prompt = buildRenderPrompt(
      data.roomType,
      designBrief || {},
      { label: roomLabel, roomType: data.roomType }
    );

    // Create render record with pending status
    const render = await prisma.render.create({
      data: {
        projectId: data.projectId,
        roomType: data.roomType,
        roomLabel,
        angleLabel: 'Sample View',
        angleType: 'auto',
        imageUrl: '', // Will be filled when render completes
        prompt,
        resolution: data.resolution,
        tier: 'sample',
        status: 'pending',
      },
    });

    // TODO: Trigger async Imagen generation
    // 1. Client sends 3D viewport screenshot as base64
    // 2. Call Imagen: await ai.models.generateContent({ model: "imagen-3.0-generate-001", ... })
    // 3. Upload result image to R2: renders/project-{id}/{roomType}_{resolution}.png
    // 4. Update render record with imageUrl and status="completed"
    logger.info('Sample render created (pending)', { renderId: render.id, projectId: data.projectId });

    res.status(201).json({
      renderId: render.id,
      status: 'pending',
      roomType: data.roomType,
      roomLabel,
      prompt,
      resolution: data.resolution,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error creating sample render', { error });
    res.status(500).json({ error: 'Failed to create sample render' });
  }
});

/**
 * POST /api/render/final — Generate final renders for all rooms
 *
 * TODO: Implement batch Imagen generation.
 * Creates render records for all rooms at all auto-calculated angles,
 * then triggers batch processing.
 */
router.post('/final', authenticate, rateLimiter(RATE_LIMITS.RENDER_FINAL), async (req: Request, res: Response) => {
  try {
    const data = finalRenderSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, userId: true, designBrief: true, flatModelId: true },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const currentUser = (req as any).user;
    if (project.userId && project.userId !== currentUser.id) {
      res.status(403).json({ error: 'You do not own this project' });
      return;
    }

    // Get all room definitions
    const roomDefs = await prisma.roomDef.findMany({
      where: { flatModelId: project.flatModelId! },
    });

    if (roomDefs.length === 0) {
      res.status(400).json({ error: 'No rooms found for this flat model' });
      return;
    }

    // Get custom angles for this project
    const customAngles = await prisma.customAngle.findMany({
      where: { projectId: data.projectId },
    });

    // Default auto-angles per room type
    const autoAngles: Record<string, string[]> = {
      living: ['Corner View', 'Entrance View', 'Window View'],
      bedroom_master: ['Bed View', 'Entrance View', 'Window View'],
      bedroom: ['Bed View', 'Entrance View'],
      kitchen: ['Counter View', 'Entrance View'],
      dining: ['Table View', 'Corner View'],
      toilet: ['Entrance View'],
      bomb_shelter: ['Entrance View'],
      service_yard: ['Entrance View'],
      hallway: ['Corridor View'],
      balcony: ['Outdoor View'],
    };

    const designBrief = project.designBrief as any;
    const renders = [];

    // Create render records for each room and each angle
    for (const room of roomDefs) {
      const angles = [
        ...(autoAngles[room.roomType] || ['Standard View']),
        ...customAngles
          .filter(a => a.roomType === room.roomType)
          .map(a => a.label),
      ];

      // Deduplicate angles
      const uniqueAngles = [...new Set(angles)];

      for (const angleLabel of uniqueAngles) {
        const prompt = buildRenderPrompt(room.roomType, designBrief || {}, room);
        const isCustom = !(autoAngles[room.roomType] || ['Standard View']).includes(angleLabel);

        const render = await prisma.render.create({
          data: {
            projectId: data.projectId,
            roomType: room.roomType,
            roomLabel: room.label,
            angleLabel,
            angleType: isCustom ? 'custom' : 'auto',
            imageUrl: '',
            prompt,
            resolution: data.resolution,
            tier: 'final',
            status: 'pending',
          },
        });

        renders.push(render);
      }
    }

    // TODO: Trigger batch Imagen processing
    logger.info('Final renders created (pending)', {
      projectId: data.projectId,
      renderCount: renders.length,
    });

    res.status(201).json({
      renders: renders.map(r => ({
        renderId: r.id,
        roomType: r.roomType,
        roomLabel: r.roomLabel,
        angleLabel: r.angleLabel,
        status: r.status,
      })),
      totalCount: renders.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error creating final renders', { error });
    res.status(500).json({ error: 'Failed to create final renders' });
  }
});

/**
 * GET /api/render/:id — Get render result
 */
router.get('/:id', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const render = await prisma.render.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!render) {
      res.status(404).json({ error: 'Render not found' });
      return;
    }

    // Check ownership
    const currentUser = (req as any).user;
    if (render.project.userId && render.project.userId !== currentUser.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      renderId: render.id,
      status: render.status,
      imageUrl: render.imageUrl,
      roomType: render.roomType,
      roomLabel: render.roomLabel,
      angleLabel: render.angleLabel,
      prompt: render.prompt,
      resolution: render.resolution,
      tier: render.tier,
      errorMsg: render.errorMsg,
      createdAt: render.createdAt,
    });
  } catch (error) {
    logger.error('Error getting render', { error, renderId: req.params.id });
    res.status(500).json({ error: 'Failed to get render' });
  }
});

/**
 * POST /api/render/angles — Save custom camera angle
 */
router.post('/angles', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = saveAngleSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const currentUser = (req as any).user;
    if (project.userId && project.userId !== currentUser.id) {
      res.status(403).json({ error: 'You do not own this project' });
      return;
    }

    const angle = await prisma.customAngle.create({
      data: {
        projectId: data.projectId,
        roomType: data.roomType,
        label: data.label,
        position: data.position,
        target: data.target,
      },
    });

    logger.info('Custom angle saved', { angleId: angle.id, projectId: data.projectId });
    res.status(201).json(angle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error saving custom angle', { error });
    res.status(500).json({ error: 'Failed to save custom angle' });
  }
});

/**
 * GET /api/render/angles — List auto + custom angles for a project
 */
router.get('/angles/list', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      res.status(400).json({ error: 'projectId query parameter is required' });
      return;
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const currentUser = (req as any).user;
    if (project.userId && project.userId !== currentUser.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const customAngles = await prisma.customAngle.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(customAngles);
  } catch (error) {
    logger.error('Error listing angles', { error });
    res.status(500).json({ error: 'Failed to list angles' });
  }
});

export default router;
