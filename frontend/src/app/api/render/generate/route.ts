import { NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface DesignBriefInput {
  room: string;
  style: string;
  colors: string;
  materials: string;
  furniture: string;
  lighting: string;
}

interface RoomLabelInput {
  x: number;
  y: number;
  label: string;
}

interface GenerateRequest {
  imageDataUrl: string;
  room: string;
  style: string;
  brief: DesignBriefInput;
  roomLabels: RoomLabelInput[];
  promptOverride?: string;
}

interface GeminiContent {
  role: string;
  parts: { text?: string; inline_data?: { mime_type: string; data: string } }[];
}

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

const ROOM_INFO: Record<string, { label: string; width: number; depth: number }> = {
  living: { label: 'Living Room', width: 5, depth: 5 },
  mbr: { label: 'Master Bedroom', width: 5, depth: 5 },
  kitchen: { label: 'Kitchen', width: 3.5, depth: 2 },
  bed2: { label: 'Bedroom 2', width: 5, depth: 3 },
  bedroom: { label: 'Bedroom', width: 5, depth: 3 },
  bathroom: { label: 'Bathroom', width: 2, depth: 1.5 },
};

function buildPrompt(data: GenerateRequest): string {
  if (data.promptOverride) return data.promptOverride;

  const roomInfo = ROOM_INFO[data.room] ?? { label: data.room, width: 4, depth: 4 };
  const b = data.brief;

  let roomLabelStr = '';
  const matchedLabel = data.roomLabels.find(
    (rl) => rl.label.toLowerCase().includes(roomInfo.label.toLowerCase().split(' ')[0] ?? data.room),
  );
  if (matchedLabel) {
    roomLabelStr = `at position (${matchedLabel.x.toFixed(1)}m, ${matchedLabel.y.toFixed(1)}m)`;
  } else {
    roomLabelStr = `~${roomInfo.width}m × ${roomInfo.depth}m`;
  }

  return `You are an expert interior designer analyzing a 3D floor plan viewport screenshot.

## Render Analysis Request

### Room
**Room**: ${roomInfo.label} (${data.room})
**Location in floor plan**: ${roomLabelStr}
**Design Style**: ${data.style || 'Contemporary'}

### Design Brief for This Room
${b.colors ? `- **Color Palette**: ${b.colors}` : ''}
${b.materials ? `- **Materials & Finishes**: ${b.materials}` : ''}
${b.furniture ? `- **Furniture & Furnishings**: ${b.furniture}` : ''}
${b.lighting ? `- **Lighting Preferences**: ${b.lighting}` : ''}

### Task
1. Analyze the 3D viewport screenshot to understand the room's current structure, layout, and spatial configuration.
2. Describe what the room would look like as a photorealistic interior render based on the design brief above.
3. Provide a **detailed visual description** covering: colors, materials, furniture placement, lighting atmosphere, and overall feel.
4. Format your response as a **rich markdown description** that an interior designer would present to a client.

Be specific and vivid — mention exact materials, how light interacts with surfaces, and how the space would feel.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();

    // Validate inputs
    if (!body.room) {
      return new Response(
        JSON.stringify({ error: 'room is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!body.imageDataUrl) {
      return new Response(
        JSON.stringify({ error: 'imageDataUrl is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build system content + prompt
    const prompt = buildPrompt(body);

    // Strip the data URL prefix to get raw base64
    const base64Image = body.imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

    // Gemini 2.5 Pro request with image understanding
    const geminiContents: GeminiContent[] = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: 'image/png',
              data: base64Image,
            },
          },
        ],
      },
    ];

    if (!GEMINI_API_KEY) {
      // No API key — return a realistic placeholder response
      const roomInfo = ROOM_INFO[body.room] ?? { label: body.room, width: 4, depth: 4 };
      const fallbackDescription = generateFallbackDescription(body.room, body.style, body.brief);

      return new Response(
        JSON.stringify({
          description: fallbackDescription,
          imageUrl: getPlaceholderImageUrl(body.room, body.style, roomInfo.label),
          room: body.room,
          roomLabel: roomInfo.label,
          style: body.style || 'Contemporary',
          isPlaceholder: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents }),
      },
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini render API error:', geminiRes.status, errorText);
      // Fallback to placeholder on API error
      const roomInfo = ROOM_INFO[body.room] ?? { label: body.room, width: 4, depth: 4 };
      return new Response(
        JSON.stringify({
          description: generateFallbackDescription(body.room, body.style, body.brief),
          imageUrl: getPlaceholderImageUrl(body.room, body.style, roomInfo.label),
          room: body.room,
          roomLabel: roomInfo.label,
          style: body.style || 'Contemporary',
          isPlaceholder: true,
          apiError: `Gemini API error (${geminiRes.status})`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const geminiData: GeminiResponse = await geminiRes.json();
    const description = extractText(geminiData) || generateFallbackDescription(body.room, body.style, body.brief);
    const roomInfo = ROOM_INFO[body.room] ?? { label: body.room, width: 4, depth: 4 };

    return new Response(
      JSON.stringify({
        description,
        imageUrl: getPlaceholderImageUrl(body.room, body.style, roomInfo.label),
        room: body.room,
        roomLabel: roomInfo.label,
        style: body.style || 'Contemporary',
        isPlaceholder: false,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Render generation error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

function extractText(data: GeminiResponse): string {
  if (!data.candidates || data.candidates.length === 0) return '';
  const parts = data.candidates[0]?.content?.parts;
  if (!parts || parts.length === 0) return '';
  return parts.map((p) => p.text || '').join('');
}

function generateFallbackDescription(room: string, style: string, brief: DesignBriefInput): string {
  const roomInfo = ROOM_INFO[room] ?? { label: room, width: 4, depth: 4 };
  return `## ${roomInfo.label} — ${style || 'Contemporary'} Render

### Atmosphere & Vibe
A warm, inviting ${style || 'contemporary'} ${roomInfo.label.toLowerCase()} that balances comfort with modern aesthetics. The space feels open and airy, making the most of its ~${roomInfo.width}m × ${roomInfo.depth}m footprint.

### Colour Palette
${brief.colors || 'A harmonious blend of neutral tones with subtle accent colors that complement the natural light.'}

### Materials & Finishes
${brief.materials || 'High-quality materials chosen for both durability and aesthetic appeal. Clean lines and thoughtful textures create visual interest without overwhelming the space.'}

### Furniture & Layout
${brief.furniture || 'Carefully selected pieces that maximize both function and flow. The layout prioritizes natural movement and creates distinct zones for different activities.'}

### Lighting Design
${brief.lighting || 'A layered lighting scheme combining ambient, task, and accent lighting to create depth and highlight key architectural features.'}

### Overall Impression
This ${style || 'contemporary'} ${roomInfo.label.toLowerCase()} feels thoughtfully curated — every element serves a purpose while contributing to a cohesive, lived-in look that reflects the homeowner's personal style.`;
}

function getPlaceholderImageUrl(room: string, style: string, roomLabel: string): string {
  const label = encodeURIComponent(`${roomLabel} — ${style || 'Contemporary'}`);
  return `https://placehold.co/800x600/1e293b/14b8a6?text=${label}`;
}
