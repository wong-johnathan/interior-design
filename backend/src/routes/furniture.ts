import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireProjectOwner, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const applyFurnitureSchema = z.object({
  projectId: z.string().min(1),
  roomType: z.string().min(1),
  templateId: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * GET /api/furniture/templates — List furniture templates
 * Filters by roomType and/or styleTag if provided as query params.
 */
router.get('/templates', rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const { roomType, styleTag } = req.query;

    const where: any = { published: true };

    if (roomType) {
      where.roomType = roomType as string;
    }

    if (styleTag) {
      where.OR = [
        { styleTag: styleTag as string },
        { styleTag: null },
      ];
    }

    const templates = await prisma.furnitureTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(templates);
  } catch (error) {
    logger.error('Error listing furniture templates', { error });
    res.status(500).json({ error: 'Failed to list furniture templates' });
  }
});

/**
 * POST /api/furniture/apply — Apply a furniture template to a project
 *
 * This applies the furniture items from a template to the project's
 * furnitureState. If no templateId is provided, the system auto-selects
 * the best matching template based on roomType and the project's design brief style.
 */
router.post('/apply', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = applyFurnitureSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: {
        id: true,
        userId: true,
        designBrief: true,
        furnitureState: true,
        furnitureApplied: true,
      },
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

    // Determine style tag from design brief
    const designBrief = project.designBrief as any;
    const overallStyle = designBrief?.overallVibe?.toLowerCase() || '';
    const styleTagMap: Record<string, string> = {
      scandinavian: 'scandinavian',
      scandi: 'scandinavian',
      japandi: 'japandi',
      industrial: 'industrial',
      modern: 'modern',
      minimalist: 'modern',
      contemporary: 'modern',
    };
    const styleTag = styleTagMap[overallStyle] || undefined;

    // Find template
    let template;
    if (data.templateId) {
      template = await prisma.furnitureTemplate.findUnique({
        where: { id: data.templateId },
      });
    } else {
      // Auto-select template
      const candidates = await prisma.furnitureTemplate.findMany({
        where: {
          roomType: data.roomType,
          published: true,
          ...(styleTag ? {
            OR: [
              { styleTag },
              { styleTag: null },
            ],
          } : {}),
        },
        orderBy: { name: 'asc' },
        take: 1,
      });
      template = candidates[0] || null;
    }

    if (!template) {
      res.status(404).json({
        error: 'No matching furniture template found',
        message: `No template available for room type "${data.roomType}"${styleTag ? ` with style "${styleTag}"` : ''}.`,
      });
      return;
    }

    // Apply template furniture to project
    const furnitureState = (project.furnitureState as any[]) || [];
    const templateFurniture = template.furniture as any[];

    // Add template items with source marker
    const newItems = templateFurniture.map((item: any) => ({
      catalogItemId: item.type || `template-${template.id}`,
      label: item.label || template.name,
      position: item.defaultPosition || { x: 0, y: 0, z: 0 },
      rotation: item.defaultRotation || { x: 0, y: 0, z: 0 },
      scale: item.defaultScale || { x: 1, y: 1, z: 1 },
      roomType: data.roomType,
      accepted: true,
      snapped: true,
      source: 'template',
    }));

    const updatedFurnitureState = [...furnitureState, ...newItems];

    await prisma.project.update({
      where: { id: data.projectId },
      data: {
        furnitureState: updatedFurnitureState,
        furnitureApplied: true,
      },
    });

    logger.info('Furniture template applied', {
      projectId: data.projectId,
      templateId: template.id,
      roomType: data.roomType,
      itemsCount: newItems.length,
    });

    res.json({
      template: {
        id: template.id,
        name: template.name,
      },
      furnitureItems: newItems,
      totalItems: updatedFurnitureState.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error applying furniture template', { error });
    res.status(500).json({ error: 'Failed to apply furniture template' });
  }
});

/**
 * GET /api/furniture/catalog — Browse furniture catalog
 * Supports filtering by category, type, and styleTag via query params.
 */
router.get('/catalog', rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const { category, type, styleTag } = req.query;

    const where: any = { published: true };

    if (category) {
      where.category = category as string;
    }
    if (type) {
      where.type = type as string;
    }
    if (styleTag) {
      where.OR = [
        { styleTag: styleTag as string },
        { styleTag: null },
      ];
    }

    const items = await prisma.furnitureCatalogItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    });

    res.json(items);
  } catch (error) {
    logger.error('Error listing furniture catalog', { error });
    res.status(500).json({ error: 'Failed to list furniture catalog' });
  }
});

export default router;
