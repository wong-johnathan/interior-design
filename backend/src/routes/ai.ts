import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireProjectOwner, rateLimiter, RATE_LIMITS } from '../middleware/auth';
import { getGeminiClient } from '../lib/gemini';
import { getSystemPrompt } from '../lib/prompts';
import logger from '../lib/logger';

const router = Router();

// ─── Validation Schema ────────────────────────────────────────────

const consultSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

// ─── Routes ───────────────────────────────────────────────────────

/**
 * POST /api/ai/consult — Send message to AI consultant
 *
 * This endpoint proxies messages to Gemini 2.5 Pro and returns the response.
 * In production, this should be converted to SSE streaming for better UX.
 *
 * TODO: Implement actual streaming response (Server-Sent Events)
 * The @google/genai SDK supports streaming via generateContentStream().
 */
router.post('/consult', authenticate, rateLimiter(RATE_LIMITS.AI_CONSULT), async (req: Request, res: Response) => {
  try {
    const data = consultSchema.parse(req.body);

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        user: { select: { id: true } },
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

    // Get room definitions for system prompt
    let rooms: { label: string; roomType: string }[] = [];
    if (project.flatModelId) {
      rooms = await prisma.roomDef.findMany({
        where: { flatModelId: project.flatModelId },
        select: { label: true, roomType: true },
      });
    }

    // Get current chat history
    const chatHistory = (project.chatHistory as any[]) || [];
    const currentBrief = project.designBrief;

    // Append user message to chat history
    const userMessage = {
      role: 'user' as const,
      content: data.message,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...chatHistory, userMessage];

    // Call Gemini
    try {
      const ai = getGeminiClient();
      const systemPrompt = getSystemPrompt(rooms);

      // Convert chat history to Gemini format
      const contents = [
        { role: 'user' as const, parts: [{ text: systemPrompt }] },
        { role: 'model' as const, parts: [{ text: 'Understood. I am ready to help design this HDB flat.' }] },
        ...updatedHistory.map(m => ({
          role: (m.role === 'ai' || m.role === 'model' ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.content }],
        })),
      ];

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-pro-exp-03-25',
        contents,
        config: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      });

      // Parse response
      const responseText = result.text || '{}';
      let response;
      try {
        response = JSON.parse(responseText);
      } catch {
        // If Gemini didn't return valid JSON, wrap it
        response = {
          message: responseText,
          brief: currentBrief,
          briefDiff: {},
        };
      }

      // Append AI response to chat history
      const aiMessage = {
        role: 'ai' as const,
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      // Update project with new chat history and design brief
      await prisma.project.update({
        where: { id: data.projectId },
        data: {
          chatHistory: [...updatedHistory, aiMessage],
          designBrief: response.brief || currentBrief,
        },
      });

      res.json({
        message: response.message,
        brief: response.brief || currentBrief,
        briefDiff: response.briefDiff || {},
      });
    } catch (aiError) {
      logger.error('Gemini consultation error', { error: aiError, projectId: data.projectId });

      // Still save user message even if AI fails
      await prisma.project.update({
        where: { id: data.projectId },
        data: {
          chatHistory: updatedHistory,
        },
      });

      res.status(502).json({
        error: 'AI consultation failed. Please try again.',
        message: 'I apologize, but I encountered an issue processing your request. Could you please try again?',
        brief: currentBrief,
        briefDiff: {},
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    logger.error('Error in AI consult route', { error });
    res.status(500).json({ error: 'Failed to process AI consultation' });
  }
});

export default router;
