import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import { getDefaultFloorPlan, getSupportedFlatTypes } from '../lib/floorPlanService';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const saveFloorPlanSchema = z.object({
  projectId: z.string().min(1),
  walls: z.array(z.object({
    startX: z.number(),
    startY: z.number(),
    endX: z.number(),
    endY: z.number(),
    thickness: z.number().default(0.15),
    height: z.number().default(2.8),
    wallType: z.enum(['internal', 'external', 'party']).default('internal'),
    isLoadBearing: z.boolean().default(false),
    sortOrder: z.number().default(0),
    doorOpenings: z.array(z.object({
      position: z.number().min(0).max(1),
      width: z.number().default(0.9),
      height: z.number().default(2.1),
      swing: z.enum(['in', 'out']).default('in'),
    })).optional().default([]),
    windowOpenings: z.array(z.object({
      position: z.number().min(0).max(1),
      width: z.number().default(1.2),
      height: z.number().default(1.2),
      sillHeight: z.number().default(1.0),
      windowType: z.string().default('casement'),
    })).optional().default([]),
  })),
  rooms: z.array(z.object({
    label: z.string(),
    roomType: z.string(),
    defaultWallColor: z.string().default('#F5F5F0'),
    defaultFloorType: z.string().default('parquet'),
    defaultFloorColor: z.string().default('#C4A882'),
    polygon: z.array(z.array(z.number())),
  })).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * GET /api/floor-plans/types — List supported flat types
 */
router.get('/types', rateLimiter(RATE_LIMITS.PUBLIC), (_req: Request, res: Response) => {
  const types = getSupportedFlatTypes();
  res.json({ flatTypes: types });
});

/**
 * GET /api/floor-plans/:idOrType — Get default floor plan or saved project plan
 *
 * Distinguishes between:
 *   - Flat type lookup (e.g. "3-room", "4-room"): returns default wall segments + rooms
 *   - Project ID lookup (cuid): returns merged original + edited floor plan
 *
 * Flat type names are checked first; if no match, falls through to project lookup.
 */
router.get('/:idOrType', rateLimiter(RATE_LIMITS.PUBLIC), async (req: Request, res: Response) => {
  try {
    const idOrType = req.params.idOrType as string;

    // ── First, try as a known flat type ────────────────────────
    const floorPlan = getDefaultFloorPlan(idOrType);

    if (floorPlan) {
      // Also check database for admin-defined FlatModel overrides
      // (non-fatal if DB is unavailable)
      try {
        const flatModels = await prisma.flatModel.findMany({
          where: { flatType: idOrType, published: true },
          include: {
            walls: {
              include: { doorOpenings: true, windowOpenings: true },
              orderBy: { sortOrder: 'asc' },
            },
            roomDefs: { orderBy: { sortOrder: 'asc' } },
          },
          take: 1,
        });

        if (flatModels.length > 0) {
          const model = flatModels[0];
          const walls = model.walls.map(w => ({
            startX: w.startX, startY: w.startY,
            endX: w.endX, endY: w.endY,
            thickness: w.thickness, height: w.height,
            wallType: w.wallType as 'internal' | 'external' | 'party',
            isLoadBearing: w.isLoadBearing, sortOrder: w.sortOrder,
            doorOpenings: w.doorOpenings.map(d => ({
              position: d.position, width: d.width, height: d.height, swing: d.swing as 'in' | 'out',
            })),
            windowOpenings: w.windowOpenings.map(wi => ({
              position: wi.position, width: wi.width, height: wi.height,
              sillHeight: wi.sillHeight, windowType: wi.windowType,
            })),
          }));
          const rooms = model.roomDefs.map(r => ({
            label: r.label, roomType: r.roomType,
            defaultWallColor: r.defaultWallColor, defaultFloorType: r.defaultFloorType,
            defaultFloorColor: r.defaultFloorColor, sortOrder: r.sortOrder,
          }));

          res.json({
            flatType: model.flatType, flatModelId: model.id,
            name: model.name, totalArea: model.totalArea, roomCount: model.roomCount,
            walls, rooms, source: 'db',
          });
          return;
        }
      } catch (_dbErr) {
        logger.warn('Database unavailable for floor plan lookup, using defaults', { flatType: idOrType });
        // Fall through to hardcoded defaults
      }

      res.json({ ...floorPlan, flatModelId: null, source: 'defaults' });
      return;
    }

    // ── Not a flat type — treat as project ID ─────────────────
    let project: any = null;
    try {
      project = await prisma.project.findUnique({
        where: { id: idOrType },
        select: {
          id: true, name: true, flatModelId: true,
          wallEdits: true, designBrief: true, updatedAt: true,
        },
      });
    } catch (_dbErr) {
      logger.warn('Database unavailable for floor plan project lookup', { projectId: idOrType });
    }

    if (!project) {
      res.status(404).json({
        error: 'Not found',
        message: 'No flat type or project matches the given identifier.',
        supportedTypes: getSupportedFlatTypes(),
      });
      return;
    }

    // Fetch original flat model data if available
    let originalWalls: any[] = [];
    let originalRooms: any[] = [];

    if (project.flatModelId) {
      try {
        const flatModel = await prisma.flatModel.findUnique({
          where: { id: project.flatModelId },
          include: {
            walls: {
              include: { doorOpenings: true, windowOpenings: true, positiveRoom: true, negativeRoom: true },
              orderBy: { sortOrder: 'asc' },
            },
            roomDefs: { orderBy: { sortOrder: 'asc' } },
          },
        });
        if (flatModel) {
          originalWalls = flatModel.walls;
          originalRooms = flatModel.roomDefs;
        }
      } catch (_dbErr) {
        logger.warn('Database unavailable for flat model lookup', { flatModelId: project.flatModelId });
      }
    }

    res.json({
      projectId: project.id,
      projectName: project.name,
      flatModelId: project.flatModelId,
      originalWalls,
      originalRooms,
      wallEdits: project.wallEdits || [],
      designBrief: project.designBrief,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    logger.error('Error fetching floor plan', { error, idOrType: req.params.idOrType });
    res.status(500).json({ error: 'Failed to fetch floor plan' });
  }
});

/**
 * POST /api/floor-plans/save — Save edited floor plan to a project
 *
 * Stores the custom wall and room data into the project's wallEdits JSON field.
 * This preserves the original FlatModel reference while overlaying user edits.
 */
router.post('/save', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = saveFloorPlanSchema.parse(req.body);
    const user = (req as any).user;

    // Verify project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, userId: true, wallEdits: true },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.userId && project.userId !== user.id) {
      res.status(403).json({ error: 'You do not own this project' });
      return;
    }

    // Build the wall edit patch list — full replacement for now
    const wallEdits = data.walls.map(w => ({
      action: 'ADD_WALL' as const,
      wallData: {
        startX: w.startX,
        startY: w.startY,
        endX: w.endX,
        endY: w.endY,
        thickness: w.thickness,
        height: w.height,
        wallType: w.wallType,
        isLoadBearing: w.isLoadBearing,
        sortOrder: w.sortOrder,
        doorOpenings: w.doorOpenings || [],
        windowOpenings: w.windowOpenings || [],
      },
    }));

    // Update the project with the wall edits and optional room data
    const updatedProject = await prisma.project.update({
      where: { id: data.projectId },
      data: {
        wallEdits,
        ...(data.rooms ? { designBrief: data.rooms } : {}),
      },
    });

    logger.info('Floor plan saved', {
      projectId: data.projectId,
      wallCount: data.walls.length,
      roomCount: data.rooms?.length || 0,
    });

    res.json({
      success: true,
      projectId: updatedProject.id,
      wallEdits: updatedProject.wallEdits,
      description: 'Floor plan saved successfully. Merge with original FlatModel walls on render.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error saving floor plan', { error });
    res.status(500).json({ error: 'Failed to save floor plan' });
  }
});



export default router;
