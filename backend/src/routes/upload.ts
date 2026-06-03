import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import { generateUploadUrl, validateUploadRequest, bucketName } from '../lib/r2';
import logger from '../lib/logger';
import { prisma } from '../lib/prisma';

const router = Router();

// ─── Validation Schema ────────────────────────────────────────────

const uploadSchema = z.object({
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1),
  category: z.enum(['floor-plan', 'model-import', 'furniture-model', 'texture', 'render']),
  projectId: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * POST /api/upload — Generate signed URL for file upload to R2
 */
router.post('/', authenticate, rateLimiter(RATE_LIMITS.UPLOAD), async (req: Request, res: Response) => {
  try {
    const data = uploadSchema.parse(req.body);

    // Validate file type
    const validation = validateUploadRequest(data.mimeType, data.category);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // If projectId provided, verify ownership
    if (data.projectId) {
      const currentUser = (req as any).user;
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        select: { userId: true },
      });

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (project.userId && project.userId !== currentUser.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    // Generate R2 key based on category
    const userId = (req as any).user?.id || 'anonymous';
    const timestamp = Date.now();
    const sanitizedFileName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    let key: string;

    switch (data.category) {
      case 'floor-plan':
        key = `floor-plans/${userId}/${timestamp}_${sanitizedFileName}`;
        break;
      case 'model-import':
        key = `imports/${userId}/${timestamp}_${sanitizedFileName}`;
        break;
      case 'furniture-model':
        key = `furniture/models/${timestamp}_${sanitizedFileName}`;
        break;
      case 'texture':
        key = `textures/uploads/${userId}/${timestamp}_${sanitizedFileName}`;
        break;
      case 'render':
        key = `renders/${userId}/${timestamp}_${sanitizedFileName}`;
        break;
      default:
        key = `uploads/${userId}/${timestamp}_${sanitizedFileName}`;
    }

    // Generate signed URL
    try {
      const uploadUrl = await generateUploadUrl(key, data.mimeType);
      const downloadUrl = `https://${bucketName}.r2.cloudflarestorage.com/${key}`;

      res.json({
        uploadUrl,
        downloadUrl,
        key,
        bucket: bucketName,
        expiresIn: 900, // 15 minutes
        mimeType: data.mimeType,
      });
    } catch (r2Error) {
      logger.error('R2 signed URL generation failed', { error: r2Error });
      res.status(502).json({
        error: 'File storage service unavailable. Please try again later.',
        // Provide a local fallback key so the client can retry
        key,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error generating upload URL', { error });
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

export default router;
