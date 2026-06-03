import { GoogleGenAI } from '@google/genai';
import logger from './logger';

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
  logger.info('Gemini client initialized');
} else {
  logger.warn('GEMINI_API_KEY not set — AI features will be stubbed');
}

export function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    throw new Error('Gemini client not initialized. Set GEMINI_API_KEY environment variable.');
  }
  return ai;
}

export default ai;
