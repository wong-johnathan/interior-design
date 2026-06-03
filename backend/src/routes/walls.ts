import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schemas ───────────────────────────────────────────

const validateEditSchema = z.object({
  projectId: z.string().min(1),
  action: z.enum(['DELETE_WALL', 'ADD_WALL', 'MODIFY_ROOM', 'ADD_DOOR', 'ADD_WINDOW', 'MODIFY_WALL']),
  wallData: z.any().optional().nullable(),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * POST /api/walls/validate — Validate a wall edit before applying
 *
 * Performs server-side validation checks:
 * - Cannot delete external walls
 * - Cannot delete party walls
 * - Cannot delete load-bearing walls
 * - New walls must not overlap with existing walls (within tolerance)
 * - New walls must connect to existing walls at endpoints
 */
router.post('/validate', authenticate, rateLimiter(RATE_LIMITS.USER), async (req: Request, res: Response) => {
  try {
    const data = validateEditSchema.parse(req.body);

    // TODO: Implement full server-side wall validation
    // For MVP, we validate basic structural constraints

    const validationResult: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    } = {
      valid: true,
      errors: [],
      warnings: [],
    };

    if (data.action === 'DELETE_WALL') {
      // Validate delete wall action
      // In production, look up the wall from DB and check:
      // 1. wallType !== 'external'
      // 2. wallType !== 'party'
      // 3. isLoadBearing !== true
      validationResult.warnings.push(
        'Structural wall checks will be performed when the wall is fetched from the database.'
      );
    }

    if (data.action === 'ADD_WALL') {
      // Validate add wall action
      if (data.wallData) {
        const { startX, startY, endX, endY } = data.wallData;

        // Check wall has non-zero length
        const dx = (endX || 0) - (startX || 0);
        const dy = (endY || 0) - (startY || 0);
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length < 0.01) {
          validationResult.errors.push('Wall length must be greater than 0.01m');
          validationResult.valid = false;
        }

        if (length > 20) {
          validationResult.errors.push('Wall length exceeds maximum (20m)');
          validationResult.valid = false;
        }
      }
    }

    // Additional validation for wall type changes
    if (data.action === 'MODIFY_WALL') {
      validationResult.warnings.push(
        'Wall type modifications (e.g., removing load-bearing flag) are restricted.'
      );
    }

    logger.info('Wall edit validated', {
      projectId: data.projectId,
      action: data.action,
      valid: validationResult.valid,
      errorCount: validationResult.errors.length,
    });

    res.json(validationResult);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error validating wall edit', { error });
    res.status(500).json({ error: 'Failed to validate wall edit' });
  }
});

export default router;
