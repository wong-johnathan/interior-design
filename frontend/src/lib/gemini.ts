'use client';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface DesignBrief {
  room: string;
  style: string;
  colors: string;
  materials: string;
  furniture: string;
  lighting: string;
}

/**
 * Sends messages to the AI chat API route and streams the response.
 * Calls onChunk for each piece of text as it arrives.
 * Returns the full accumulated response text.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  room: string,
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, room }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Chat API error (${response.status}): ${errorBody}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk(chunk);
  }

  return fullText;
}

/**
 * Extracts a structured DesignBrief from a conversation's messages for a given room.
 * Uses basic keyword/pattern matching to pull out style, colors, materials, etc.
 */
export function extractBrief(messages: ChatMessage[], roomId: string): DesignBrief {
  const allText = messages.map((m) => m.content).join('\n').toLowerCase();

  const brief: DesignBrief = {
    room: roomId,
    style: '',
    colors: '',
    materials: '',
    furniture: '',
    lighting: '',
  };

  // Style keywords
  const styleKeywords: [string, string][] = [
    ['japandi', 'Japandi'],
    ['minimalist', 'Minimalist'],
    ['industrial', 'Industrial'],
    ['coastal', 'Coastal / Beach'],
    ['scandinavian', 'Scandinavian'],
    ['modern', 'Modern'],
    ['contemporary', 'Contemporary'],
    ['mid-century', 'Mid-Century Modern'],
    ['bohemian', 'Bohemian / Boho'],
    ['boho', 'Bohemian / Boho'],
    ['traditional', 'Traditional'],
    ['rustic', 'Rustic'],
    ['wabi-sabi', 'Wabi-Sabi'],
    ['art deco', 'Art Deco'],
    ['maximalist', 'Maximalist'],
    ['vintage', 'Vintage / Retro'],
    ['industrial', 'Industrial'],
  ];

  for (const [keyword, label] of styleKeywords) {
    if (allText.includes(keyword)) {
      brief.style = label;
      break;
    }
  }

  if (!brief.style) {
    brief.style = 'Contemporary (to be confirmed)';
  }

  // Colors – look for color names or "color" mentions
  const colorPatterns = [
    /(?:colour|color)s?\s*(?:are|:|\s+is)?\s*([^.!?]+)/i,
    /(?:colour|color)\s+scheme\s*(?:is|:)?\s*([^.!?]+)/i,
    /palette\s*(?:is|:)?\s*([^.!?]+)/i,
    /(?:shades?\s+of\s+)?(white|beige|cream|brown|black|grey|gray|navy|blue|green|teal|emerald|sage|olive|terracotta|rust|pink|blush|purple|lavender|yellow|mustard|gold|red|burgundy|coral|charcoal|warm\s+white|cool\s+white|off\s+white|wood\s+tone)/gi,
  ];

  for (const pattern of colorPatterns) {
    const match = allText.match(pattern);
    if (match) {
      brief.colors = match[1] || match[0];
      break;
    }
  }

  const colorWords = allText.match(/(white|beige|cream|brown|black|grey|gray|navy|blue|green|teal|emerald|sage|terracotta|blush|mustard|charcoal|warm\s+white)/gi);
  if (!brief.colors && colorWords) {
    brief.colors = [...new Set(colorWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)))].slice(0, 4).join(', ');
  }

  // Materials
  const materialPatterns = [
    /(?:material|texture|finish|surface)s?\s*(?:are|:|\s+is)?\s*([^.!?]+)/i,
    /(?:wood|oak|walnut|laminate|vinyl|tile|marble|quartz|concrete|brick|stone|glass|mirror|metal|steel|brass|copper|fabric|linen|cotton|velvet|leather|rattan|cane|bamboo|jute|wool)s?(?:\s+(?:floor|wall|cabinet|counter|backsplash|finish|texture))?/gi,
  ];

  for (const pattern of materialPatterns) {
    const match = allText.match(pattern);
    if (match) {
      brief.materials = match[1] || match[0];
      break;
    }
  }

  const materialWords = allText.match(/(oak|walnut|laminate|vinyl|porcelain|ceramic|marble|quartz|concrete|brass|copper|linen|velvet|leather|rattan|cane|bamboo|jute|glass|steel)/gi);
  if (!brief.materials && materialWords) {
    brief.materials = [...new Set(materialWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)))].slice(0, 4).join(', ');
  }

  // Furniture
  const furniturePatterns = [
    /(?:furniture|furnishing|cabinet|shelf|sofa|table|chair|bed|wardrobe|storage|fixture)s?\s*(?:are|:|\s+is)?\s*([^.!?]+)/i,
    /(?:sofa|cabinet|shelving|wardrobe|dresser|nightstand|coffee\s+table|dining\s+table|console|bench|stool|desk|bed\s+frame|headboard|bookshelf)/gi,
  ];

  for (const pattern of furniturePatterns) {
    const match = allText.match(pattern);
    if (match) {
      brief.furniture = match[1] || match[0];
      break;
    }
  }

  const furnitureWords = allText.match(/(?:open|closed|floating|built-in|modular|custom|minimal|sleek|storage)\s+(?:shelving|cabinet|wardrobe|unit)/gi);
  if (!brief.furniture && furnitureWords) {
    brief.furniture = furnitureWords.slice(0, 2).join(', ');
  }

  // Lighting
  const lightingPatterns = [
    /(?:lighting|light|illumination|lamp|pendant|chandelier|sconce|downlight|track\s+light|ambient|task|accent)s?\s*(?:is|are|:)?\s*([^.!?]+)/i,
    /(?:pendant|chandelier|sconce|downlight|track\s+light|floor\s+lamp|table\s+lamp|recessed|dim|warm\s+light|cool\s+light)/gi,
  ];

  for (const pattern of lightingPatterns) {
    const match = allText.match(pattern);
    if (match) {
      brief.lighting = match[1] || match[0];
      break;
    }
  }

  const lightingWords = allText.match(/(pendant|chandelier|sconce|downlight|track\s+light|floor\s+lamp|ambient|task\s+lighting|accent\s+lighting|warm\s+light|cool\s+light|dimmable)/gi);
  if (!brief.lighting && lightingWords) {
    brief.lighting = [...new Set(lightingWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)))].slice(0, 3).join(', ');
  }

  return brief;
}
