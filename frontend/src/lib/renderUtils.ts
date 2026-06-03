import type { DesignBrief } from '@/lib/gemini';
import type { RoomLabel } from '@/lib/defaultRoomData';

/**
 * Maps room types to human-readable labels with approximate dimensions.
 */
const ROOM_INFO: Record<string, { label: string; width: number; depth: number }> = {
  living: { label: 'Living Room', width: 5, depth: 5 },
  mbr: { label: 'Master Bedroom', width: 5, depth: 5 },
  kitchen: { label: 'Kitchen', width: 3.5, depth: 2 },
  'bed2': { label: 'Bedroom 2', width: 5, depth: 3 },
  bedroom: { label: 'Bedroom', width: 5, depth: 3 },
  bathroom: { label: 'Bathroom', width: 2, depth: 1.5 },
};

/**
 * Builds a structured render prompt for Gemini based on the design brief and room data.
 *
 * @param room - The room identifier (e.g. 'living', 'mbr', 'kitchen')
 * @param brief - The structured DesignBrief for this room
 * @param roomLabels - All room labels from the floor plan (used for spatial context)
 * @returns A detailed prompt string describing the desired render
 */
export function buildRenderPrompt(
  room: string,
  brief: DesignBrief,
  roomLabels: RoomLabel[],
): string {
  const roomInfo = ROOM_INFO[room] ?? { label: room, width: 4, depth: 4 };
  const roomLabel = roomLabels.find(
    (rl) => rl.label.toLowerCase().includes(roomInfo.label.toLowerCase().split(' ')[0]?.toLowerCase() ?? room),
  );

  const dimensions = roomLabel
    ? `Approximate position: center at (${roomLabel.x.toFixed(1)}m, ${roomLabel.y.toFixed(1)}m)`
    : `Approximate dimensions: ${roomInfo.width}m × ${roomInfo.depth}m`;

  // Build room context lines
  const parts: string[] = [];

  parts.push(`## Room: ${roomInfo.label}`);
  parts.push(`- ${dimensions}`);
  parts.push(`- Style: ${brief.style || 'Contemporary'}`);

  if (brief.colors) {
    parts.push(`- Colour palette: ${brief.colors}`);
  }
  if (brief.materials) {
    parts.push(`- Materials: ${brief.materials}`);
  }
  if (brief.furniture) {
    parts.push(`- Furniture / Furnishings: ${brief.furniture}`);
  }
  if (brief.lighting) {
    parts.push(`- Lighting: ${brief.lighting}`);
  }

  // Add a general instruction
  parts.push('');
  parts.push(
    'Describe the photorealistic render of this room based on the above design brief. ' +
    'Include details about how the materials, colours, furniture, and lighting come together. ' +
    'Mention the overall atmosphere and how the space feels. ' +
    'If there are any spatial constraints or notable features, address them.',
  );

  return parts.join('\n');
}

/**
 * Generates a fallback placeholder image URL with the room style overlaid.
 */
export function getPlaceholderImageUrl(room: string, style: string): string {
  const roomInfo = ROOM_INFO[room] ?? { label: room, width: 4, depth: 4 };
  const label = encodeURIComponent(`${roomInfo.label} — ${style}`);
  return `https://placehold.co/800x600/1e293b/14b8a6?text=${label}`;
}
