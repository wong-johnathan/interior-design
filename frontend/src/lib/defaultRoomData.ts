export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'external' | 'loadBearing' | 'internal';
  thickness: number;
  room?: string;
}

export interface RoomLabel {
  x: number;
  y: number;
  label: string;
}

export interface FloorPlanData {
  walls: WallSegment[];
  roomLabels: RoomLabel[];
}

/**
 * Generates a default 4-room HDB-style floor plan within a 10x10 meter grid.
 *
 * Layout (top view, y-up):
 *
 *   (0,10)                    (10,10)
 *     ┌────────────────┬───────────┐
 *     │                │           │
 *     │  LIVING ROOM   │    MBR    │
 *     │                │           │
 *     ├───────┬────────┤           │
 *     │       │  BATH  │           │
 *     │KITCHEN│ (2×1.5)│           │
 *     │       │        │           │
 *     ├───────┴───┬────┴───────────┤
 *     │           │                │
 *     │ BEDROOM 2 │                │
 *     │           │                │
 *     └───────────┴────────────────┘
 *   (0,0)                       (10,0)
 *
 * Rooms:
 *   - Living Room (top-left, ~5×5m)
 *   - Kitchen (bottom-left, ~3.5×5m)
 *   - MBR / Master Bedroom (top-right, ~5×5m)
 *   - Bedroom 2 (bottom-right, ~5×3m)
 *   - Bathroom (between Kitchen and MBR, ~2×1.5m)
 */
export function generateDefaultFloorPlan(): FloorPlanData {
  const walls: WallSegment[] = [];
  const W = 0.2; // external wall thickness
  const L = 0.15; // load-bearing wall thickness
  const I = 0.1; // internal wall thickness

  // ── External walls ──
  walls.push({ x1: 0, y1: 0, x2: 10, y2: 0, type: 'external', thickness: W });
  walls.push({ x1: 10, y1: 0, x2: 10, y2: 10, type: 'external', thickness: W });
  walls.push({ x1: 10, y1: 10, x2: 0, y2: 10, type: 'external', thickness: W });
  walls.push({ x1: 0, y1: 10, x2: 0, y2: 0, type: 'external', thickness: W });

  // ── Load-bearing spine (vertical center) ──
  walls.push({ x1: 5, y1: 0, x2: 5, y2: 10, type: 'loadBearing', thickness: L });

  // ── Internal walls ──
  // Living / Kitchen divider (horizontal, left side)
  walls.push({
    x1: 0, y1: 5, x2: 5, y2: 5,
    type: 'internal', thickness: I, room: 'living',
  });
  // MBR / Bedroom 2 divider (horizontal, right side)
  walls.push({
    x1: 5, y1: 3, x2: 10, y2: 3,
    type: 'internal', thickness: I, room: 'mbr',
  });
  // Bathroom enclosure (top wall)
  walls.push({
    x1: 5, y1: 5, x2: 7, y2: 5,
    type: 'internal', thickness: I, room: 'bathroom',
  });
  // Bathroom enclosure (bottom wall)
  walls.push({
    x1: 5, y1: 3, x2: 7, y2: 3,
    type: 'internal', thickness: I, room: 'bathroom',
  });
  // Bathroom enclosure (left wall)
  walls.push({
    x1: 5, y1: 3, x2: 5, y2: 5,
    type: 'internal', thickness: I, room: 'bathroom',
  });
  // Bathroom enclosure (right wall)
  walls.push({
    x1: 7, y1: 3, x2: 7, y2: 5,
    type: 'internal', thickness: I, room: 'bathroom',
  });
  // Kitchen / Bathroom divider (horizontal stub)
  walls.push({
    x1: 0, y1: 3, x2: 5, y2: 3,
    type: 'internal', thickness: I, room: 'kitchen',
  });

  const roomLabels: RoomLabel[] = [
    { x: 2.5, y: 7.5, label: 'Living Room' },
    { x: 2.5, y: 1.5, label: 'Kitchen' },
    { x: 7.5, y: 7.5, label: 'Master Bedroom' },
    { x: 7.5, y: 1.5, label: 'Bedroom 2' },
    { x: 6, y: 4, label: 'Bathroom' },
  ];

  return { walls, roomLabels };
}
