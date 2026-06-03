import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireProjectOwner, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import { generateDownloadUrl, validateUploadRequest } from '../lib/r2';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const exportSchema = z.object({
  projectId: z.string().min(1),
  format: z.enum(['collada', 'obj']).default('collada'),
  includeFurniture: z.boolean().default(true),
});

const importSchema = z.object({
  projectId: z.string().min(1),
  format: z.enum(['collada', 'obj']).default('collada'),
  fileKey: z.string().min(1), // R2 key of uploaded file
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * POST /api/export — Generate Collada/OBJ export
 *
 * TODO: The actual 3D model export is performed client-side in Three.js.
 * This endpoint creates the export record, generates a signed URL for
 * the client to upload the exported file to R2, or orchestrates a
 * server-side export if implemented later.
 */
router.post('/', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = exportSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: {
        id: true,
        userId: true,
        name: true,
        flatModelId: true,
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

    // Get flat model info for filename
    let flatModelName = 'flat';
    if (project.flatModelId) {
      const flatModel = await prisma.flatModel.findUnique({
        where: { id: project.flatModelId },
        select: { name: true },
      });
      if (flatModel) {
        flatModelName = flatModel.name.toLowerCase().replace(/\s+/g, '-');
      }
    }

    const extension = data.format === 'collada' ? 'dae' : 'obj';
    const filename = `${flatModelName}.${extension}`;
    const key = `exports/project-${data.projectId}/${filename}`;

    // Generate a signed URL for the export download
    // TODO: The actual export is done client-side and uploaded to this key
    // For now, we generate the signed URL for the download
    let downloadUrl: string | null = null;
    try {
      downloadUrl = await generateDownloadUrl(key, 900);
    } catch {
      // Export not yet generated — client will generate and upload
    }

    logger.info('Export requested', {
      projectId: data.projectId,
      format: data.format,
      includeFurniture: data.includeFurniture,
    });

    res.json({
      downloadUrl,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      filename,
      sizeBytes: null, // Unknown until generated
      format: data.format,
      key,
      // Provide an upload URL so the client can upload the generated file
      uploadKey: key,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error creating export', { error });
    res.status(500).json({ error: 'Failed to create export' });
  }
});

/**
 * POST /api/import — Upload and parse a Collada/OBJ file
 *
 * TODO: Implement actual file parsing. The client uploads the file to R2,
 * then calls this endpoint with the file key. Server-side parsing would
 * use a library like three-stdlib or a dedicated parser. For MVP, this
 * stores the reference and the client handles the parsing.
 */
router.post('/import', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = importSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, userId: true },
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

    // TODO: Parse the uploaded file and merge furniture into the project
    // For now, return a reference to the uploaded file
    logger.info('Import requested', {
      projectId: data.projectId,
      format: data.format,
      fileKey: data.fileKey,
    });

    res.json({
      status: 'imported',
      projectId: data.projectId,
      fileKey: data.fileKey,
      format: data.format,
      // TODO: In a real implementation, parse the file and return:
      // furnitureItems: [...],
      // wallChanges: [...],
      message: 'File imported. Client-side parsing applies the imported data.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error processing import', { error });
    res.status(500).json({ error: 'Failed to process import' });
  }
});

export default router;
