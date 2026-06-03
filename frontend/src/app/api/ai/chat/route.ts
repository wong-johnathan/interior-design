import { NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const SYSTEM_PROMPT = `You are an interior design consultant for Singapore HDB flats. Help the user describe their desired style per room. Ask about colors, materials, furniture style, lighting. Be conversational and suggest options. A 4-room HDB typically has: Living Room, Master Bedroom, Bedroom 2, Kitchen, Bathroom 1, Bathroom 2.`;

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface GeminiContent {
  role: string;
  parts: { text: string }[];
}

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, room } = body as { messages: ChatMessage[]; room: string };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const roomContext = `Current room being discussed: ${room}. Focus the conversation on this room's design.`;

    const geminiContents: GeminiContent[] = [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${roomContext}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am your interior design consultant for Singapore HDB flats. I\'ll help you design each room of your home.' }],
      },
      ...messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiRes.status})`, detail: errorText }),
        { status: geminiRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Read Gemini SSE stream and pipe to client
    const geminiReader = geminiRes.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await geminiReader.read();
            if (done) {
              // Flush remaining buffer
              if (buffer.trim()) {
                try {
                  const data = JSON.parse(buffer.trim());
                  const text = extractTextFromCandidate(data);
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch {
                  // ignore parse errors on leftover
                }
              }
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE format: data: {...}\n\n or data: {...}\n
            const parts = buffer.split('\n');
            // Keep the last incomplete chunk in the buffer
            buffer = parts.pop() || '';

            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                if (jsonStr === '[DONE]' || jsonStr === '') continue;
                try {
                  const data: GeminiResponse = JSON.parse(jsonStr);
                  const text = extractTextFromCandidate(data);
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch {
                  // Skip malformed JSON chunks
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function extractTextFromCandidate(data: GeminiResponse): string {
  if (!data.candidates || data.candidates.length === 0) return '';
  const parts = data.candidates[0]?.content?.parts;
  if (!parts || parts.length === 0) return '';
  return parts.map((p) => p.text || '').join('');
}
