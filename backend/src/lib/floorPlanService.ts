/**
 * Floor Plan Service — HDB flat type definitions & geometry utilities
 *
 * Provides:
 * - Default wall segments for common HDB flat types (3-room, 4-room, 5-room, etc.)
 * - Room detection from wall segments (polygon walk algorithm)
 * - Room area calculation (Shoelace formula)
 */

export interface WallSegmentData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  height: number;
  wallType: 'internal' | 'external' | 'party';
  isLoadBearing: boolean;
  sortOrder: number;
  doorOpenings?: Array<{
    position: number; // 0.0–1.0 along the wall
    width: number;
    height: number;
    swing: 'in' | 'out';
  }>;
  windowOpenings?: Array<{
    position: number;
    width: number;
    height: number;
    sillHeight: number;
    windowType: string;
  }>;
}

export interface RoomDefData {
  label: string;
  roomType: string;
  defaultWallColor: string;
  defaultFloorType: string;
  defaultFloorColor: string;
  sortOrder: number;
  polygon: number[][]; // [[x,y], ...] in clockwise order
}

export interface FloorPlanData {
  flatType: string;
  totalArea: number;
  roomCount: number;
  walls: WallSegmentData[];
  rooms: RoomDefData[];
}

// ─── Default Floor Plans ─────────────────────────────────────────────

const THREE_ROOM: FloorPlanData = {
  flatType: '3-room',
  totalArea: 68,
  roomCount: 3,
  walls: [
    // External walls — building perimeter (approx 8m x 8.5m)
    { startX: 0, endX: 8, startY: 0, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 0 },
    { startX: 8, endX: 8, startY: 0, endY: 8.5, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 1 },
    { startX: 8, endX: 0, startY: 8.5, endY: 8.5, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 2 },
    { startX: 0, endX: 0, startY: 8.5, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 3 },

    // Internal walls — living room / bedroom divider
    { startX: 0, endX: 4, startY: 4, endY: 4, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 10,
      doorOpenings: [{ position: 0.5, width: 0.9, height: 2.1, swing: 'in' }] },
    { startX: 4, endX: 4, startY: 4, endY: 0, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 11 },

    // Bedroom 1 / Bedroom 2 divider
    { startX: 0, endX: 4, startY: 6.5, endY: 6.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 12 },

    // Kitchen wall
    { startX: 6, endX: 8, startY: 4, endY: 4, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 13,
      doorOpenings: [{ position: 0.5, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bathroom wall
    { startX: 4, endX: 6, startY: 4, endY: 4, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 14 },
    { startX: 6, endX: 6, startY: 4, endY: 8.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 15 },
  ],
  rooms: [
    { label: 'Living / Dining', roomType: 'living', defaultWallColor: '#F5F5F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 0,
      polygon: [[4,0],[8,0],[8,4],[4,4]] },
    { label: 'Kitchen', roomType: 'kitchen', defaultWallColor: '#F5F5F0', defaultFloorType: 'tile', defaultFloorColor: '#E8DCC8', sortOrder: 1,
      polygon: [[6,4],[8,4],[8,8.5],[6,8.5]] },
    { label: 'Bedroom 1', roomType: 'bedroom', defaultWallColor: '#F0F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 2,
      polygon: [[0,0],[4,0],[4,4],[0,4]] },
    { label: 'Bedroom 2', roomType: 'bedroom', defaultWallColor: '#E8F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 3,
      polygon: [[0,4],[4,4],[4,6.5],[0,6.5]] },
    { label: 'Bathroom', roomType: 'toilet', defaultWallColor: '#F0F0F5', defaultFloorType: 'tile', defaultFloorColor: '#D0D0D8', sortOrder: 4,
      polygon: [[4,4],[6,4],[6,6.5],[4,6.5]] },
    { label: 'Master Bedroom', roomType: 'bedroom_master', defaultWallColor: '#F5F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 5,
      polygon: [[0,6.5],[4,6.5],[4,8.5],[0,8.5]] },
  ],
};

const FOUR_ROOM: FloorPlanData = {
  flatType: '4-room',
  totalArea: 93,
  roomCount: 4,
  walls: [
    // External walls — building perimeter
    { startX: 0, endX: 10, startY: 0, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 0 },
    { startX: 10, endX: 10, startY: 0, endY: 9, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 1 },
    { startX: 10, endX: 0, startY: 9, endY: 9, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 2 },
    { startX: 0, endX: 0, startY: 9, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 3 },

    // Living / Bedroom divider
    { startX: 0, endX: 5, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 10,
      doorOpenings: [{ position: 0.6, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bedroom 1 / Bedroom 2 divider
    { startX: 0, endX: 5, startY: 6.75, endY: 6.75, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 11 },

    // Kitchen / Service yard wall
    { startX: 7.5, endX: 10, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 12,
      doorOpenings: [{ position: 0.5, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bathroom walls
    { startX: 5, endX: 7.5, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 13 },
    { startX: 5, endX: 5, startY: 4.5, endY: 9, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 14 },
    { startX: 7.5, endX: 7.5, startY: 4.5, endY: 6.75, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 15 },
  ],
  rooms: [
    { label: 'Living / Dining', roomType: 'living', defaultWallColor: '#F5F5F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 0,
      polygon: [[5,0],[10,0],[10,4.5],[5,4.5]] },
    { label: 'Kitchen', roomType: 'kitchen', defaultWallColor: '#F5F5F0', defaultFloorType: 'tile', defaultFloorColor: '#E8DCC8', sortOrder: 1,
      polygon: [[7.5,4.5],[10,4.5],[10,9],[7.5,9]] },
    { label: 'Bathroom 1', roomType: 'toilet', defaultWallColor: '#F0F0F5', defaultFloorType: 'tile', defaultFloorColor: '#D0D0D8', sortOrder: 2,
      polygon: [[5,4.5],[7.5,4.5],[7.5,6.75],[5,6.75]] },
    { label: 'Bedroom 1', roomType: 'bedroom', defaultWallColor: '#F0F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 3,
      polygon: [[0,0],[5,0],[5,4.5],[0,4.5]] },
    { label: 'Bedroom 2', roomType: 'bedroom', defaultWallColor: '#E8F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 4,
      polygon: [[0,4.5],[5,4.5],[5,6.75],[0,6.75]] },
    { label: 'Master Bedroom', roomType: 'bedroom_master', defaultWallColor: '#F5F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 5,
      polygon: [[0,6.75],[5,6.75],[5,9],[0,9]] },
  ],
};

const FIVE_ROOM: FloorPlanData = {
  flatType: '5-room',
  totalArea: 112,
  roomCount: 5,
  walls: [
    // External perimeter
    { startX: 0, endX: 11, startY: 0, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 0 },
    { startX: 11, endX: 11, startY: 0, endY: 10, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 1 },
    { startX: 11, endX: 0, startY: 10, endY: 10, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 2 },
    { startX: 0, endX: 0, startY: 10, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 3 },

    // Living / bedrooms divider (horizontal corridor wall)
    { startX: 0, endX: 6, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 10,
      doorOpenings: [{ position: 0.5, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bedroom dividers
    { startX: 0, endX: 6, startY: 6.5, endY: 6.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 11 },
    { startX: 0, endX: 6, startY: 8.25, endY: 8.25, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 12 },

    // Kitchen divider
    { startX: 8, endX: 11, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 13,
      doorOpenings: [{ position: 0.5, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bathroom walls
    { startX: 6, endX: 8, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 14 },
    { startX: 6, endX: 6, startY: 4.5, endY: 10, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 15 },
    { startX: 8, endX: 8, startY: 4.5, endY: 7.25, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 16 },
  ],
  rooms: [
    { label: 'Living / Dining', roomType: 'living', defaultWallColor: '#F5F5F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 0,
      polygon: [[6,0],[11,0],[11,4.5],[6,4.5]] },
    { label: 'Kitchen', roomType: 'kitchen', defaultWallColor: '#F5F5F0', defaultFloorType: 'tile', defaultFloorColor: '#E8DCC8', sortOrder: 1,
      polygon: [[8,4.5],[11,4.5],[11,10],[8,10]] },
    { label: 'Bathroom 1', roomType: 'toilet', defaultWallColor: '#F0F0F5', defaultFloorType: 'tile', defaultFloorColor: '#D0D0D8', sortOrder: 2,
      polygon: [[6,4.5],[8,4.5],[8,7.25],[6,7.25]] },
    { label: 'Bedroom 1', roomType: 'bedroom', defaultWallColor: '#F0F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 3,
      polygon: [[0,0],[6,0],[6,4.5],[0,4.5]] },
    { label: 'Bedroom 2', roomType: 'bedroom', defaultWallColor: '#E8F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 4,
      polygon: [[0,4.5],[6,4.5],[6,6.5],[0,6.5]] },
    { label: 'Bedroom 3', roomType: 'bedroom', defaultWallColor: '#F0E8F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 5,
      polygon: [[0,6.5],[6,6.5],[6,8.25],[0,8.25]] },
    { label: 'Master Bedroom', roomType: 'bedroom_master', defaultWallColor: '#F5F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 6,
      polygon: [[0,8.25],[6,8.25],[6,10],[0,10]] },
  ],
};

const TWO_ROOM_FLEXI: FloorPlanData = {
  flatType: '2-room-flexi',
  totalArea: 48,
  roomCount: 2,
  walls: [
    // External perimeter (approx 5.5m x 8.7m)
    { startX: 0, endX: 5.5, startY: 0, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 0 },
    { startX: 5.5, endX: 5.5, startY: 0, endY: 8.7, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 1 },
    { startX: 5.5, endX: 0, startY: 8.7, endY: 8.7, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 2 },
    { startX: 0, endX: 0, startY: 8.7, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 3 },

    // Bedroom divider
    { startX: 0, endX: 5.5, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 10,
      doorOpenings: [{ position: 0.4, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bathroom wall
    { startX: 3.5, endX: 5.5, startY: 4.5, endY: 4.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 11 },
    { startX: 3.5, endX: 3.5, startY: 4.5, endY: 8.7, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 12 },
  ],
  rooms: [
    { label: 'Living / Dining / Kitchen', roomType: 'living', defaultWallColor: '#F5F5F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 0,
      polygon: [[0,0],[5.5,0],[5.5,4.5],[0,4.5]] },
    { label: 'Bedroom', roomType: 'bedroom', defaultWallColor: '#F0F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 1,
      polygon: [[0,4.5],[3.5,4.5],[3.5,8.7],[0,8.7]] },
    { label: 'Bathroom', roomType: 'toilet', defaultWallColor: '#F0F0F5', defaultFloorType: 'tile', defaultFloorColor: '#D0D0D8', sortOrder: 2,
      polygon: [[3.5,4.5],[5.5,4.5],[5.5,8.7],[3.5,8.7]] },
  ],
};

const EXECUTIVE: FloorPlanData = {
  flatType: 'executive',
  totalArea: 145,
  roomCount: 5,
  walls: [
    // External perimeter (approx 12m x 12m)
    { startX: 0, endX: 12, startY: 0, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 0 },
    { startX: 12, endX: 12, startY: 0, endY: 12, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 1 },
    { startX: 12, endX: 0, startY: 12, endY: 12, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 2 },
    { startX: 0, endX: 0, startY: 12, endY: 0, thickness: 0.2, height: 2.8, wallType: 'external', isLoadBearing: true, sortOrder: 3 },

    // Living / bedroom divider
    { startX: 0, endX: 7, startY: 5, endY: 5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 10,
      doorOpenings: [{ position: 0.5, width: 0.9, height: 2.1, swing: 'in' }] },

    // Bedroom dividers
    { startX: 0, endX: 7, startY: 7, endY: 7, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 11 },
    { startX: 0, endX: 7, startY: 9, endY: 9, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 12 },

    // Bathroom walls
    { startX: 9.5, endX: 12, startY: 5, endY: 5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 13,
      doorOpenings: [{ position: 0.6, width: 0.9, height: 2.1, swing: 'in' }] },
    { startX: 7, endX: 9.5, startY: 5, endY: 5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 14 },
    { startX: 7, endX: 7, startY: 5, endY: 12, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 15 },
    { startX: 9.5, endX: 9.5, startY: 5, endY: 8.5, thickness: 0.15, height: 2.8, wallType: 'internal', isLoadBearing: false, sortOrder: 16 },
  ],
  rooms: [
    { label: 'Living / Dining', roomType: 'living', defaultWallColor: '#F5F5F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 0,
      polygon: [[7,0],[12,0],[12,5],[7,5]] },
    { label: 'Kitchen', roomType: 'kitchen', defaultWallColor: '#F5F5F0', defaultFloorType: 'tile', defaultFloorColor: '#E8DCC8', sortOrder: 1,
      polygon: [[9.5,5],[12,5],[12,12],[9.5,12]] },
    { label: 'Bathroom 1', roomType: 'toilet', defaultWallColor: '#F0F0F5', defaultFloorType: 'tile', defaultFloorColor: '#D0D0D8', sortOrder: 2,
      polygon: [[7,5],[9.5,5],[9.5,8.5],[7,8.5]] },
    { label: 'Bedroom 1', roomType: 'bedroom', defaultWallColor: '#F0F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 3,
      polygon: [[0,0],[7,0],[7,5],[0,5]] },
    { label: 'Bedroom 2', roomType: 'bedroom', defaultWallColor: '#E8F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 4,
      polygon: [[0,5],[7,5],[7,7],[0,7]] },
    { label: 'Bedroom 3', roomType: 'bedroom', defaultWallColor: '#F0E8F0', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 5,
      polygon: [[0,7],[7,7],[7,9],[0,9]] },
    { label: 'Master Bedroom', roomType: 'bedroom_master', defaultWallColor: '#F5F0E8', defaultFloorType: 'parquet', defaultFloorColor: '#C4A882', sortOrder: 6,
      polygon: [[0,9],[7,9],[7,12],[0,12]] },
  ],
};

const FLAT_TYPE_MAP: Record<string, FloorPlanData> = {
  '3-room': THREE_ROOM,
  '4-room': FOUR_ROOM,
  '5-room': FIVE_ROOM,
  '2-room-flexi': TWO_ROOM_FLEXI,
  'executive': EXECUTIVE,
};

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Returns default wall segments for a given HDB flat type.
 * Supports: "3-room", "4-room", "5-room", "2-room-flexi", "executive"
 */
export function getDefaultFloorPlan(flatType: string): FloorPlanData | null {
  return FLAT_TYPE_MAP[flatType] ?? null;
}

/**
 * Returns the list of supported flat type keys.
 */
export function getSupportedFlatTypes(): string[] {
  return Object.keys(FLAT_TYPE_MAP);
}

/**
 * Detect rooms from wall segments using connected-wall polygon walking.
 *
 * Algorithm:
 * 1. Build an adjacency map of walls by shared endpoints (within tolerance).
 * 2. For each connected component that forms a closed loop, extract the polygon.
 * 3. Classify the room by position and connected wall types.
 *
 * This is a simplified version for MVP — returns polygons grouped by
 * connectivity analysis. A production version would use a more sophisticated
 * planar graph traversal (e.g., DCEL / winged-edge).
 */
export function detectRooms(walls: WallSegmentData[]): number[][][] {
  const EPSILON = 0.01;

  // Collect all unique points
  interface Point { x: number; y: number; index: number }
  const points: Point[] = [];
  const pointKey = (x: number, y: number) => `${x.toFixed(4)},${y.toFixed(4)}`;

  const pointMap = new Map<string, number>();
  const getPointIndex = (x: number, y: number): number => {
    const key = pointKey(x, y);
    if (pointMap.has(key)) return pointMap.get(key)!;
    const idx = points.length;
    points.push({ x, y, index: idx });
    pointMap.set(key, idx);
    return idx;
  };

  // Build edges as pairs of point indices
  interface Edge { a: number; b: number; wall: WallSegmentData }
  const edges: Edge[] = walls.map(w => ({
    a: getPointIndex(w.startX, w.startY),
    b: getPointIndex(w.endX, w.endY),
    wall: w,
  }));

  // Build adjacency list
  const adj: Map<number, number[]> = new Map();
  for (const e of edges) {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a)!.push(e.b);
    adj.get(e.b)!.push(e.a);
  }

  // Find connected components using BFS
  const visited = new Set<number>();
  const components: number[][] = [];

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    const comp: number[] = [];
    const queue = [i];
    visited.add(i);

    while (queue.length > 0) {
      const v = queue.shift()!;
      comp.push(v);
      for (const n of adj.get(v) || []) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    components.push(comp);
  }

  // For each component, attempt to form a polygon
  const polygons: number[][][] = [];

  for (const comp of components) {
    if (comp.length < 3) continue;

    // Simple approach: sort by angle around centroid for a rough polygon
    const compEdges = edges.filter(e => comp.includes(e.a) && comp.includes(e.b));
    if (compEdges.length < 3) continue;

    const centroidX = comp.reduce((s, idx) => s + points[idx].x, 0) / comp.length;
    const centroidY = comp.reduce((s, idx) => s + points[idx].y, 0) / comp.length;

    // Get unique points in this component
    const uniquePoints = [...new Set(compEdges.flatMap(e => [e.a, e.b]))];

    // Sort by angle around centroid
    uniquePoints.sort((a, b) => {
      const pa = points[a];
      const pb = points[b];
      return Math.atan2(pa.y - centroidY, pa.x - centroidX) -
             Math.atan2(pb.y - centroidY, pb.x - centroidX);
    });

    const polygon = uniquePoints.map(idx => [points[idx].x, points[idx].y]);

    if (polygon.length >= 3) {
      polygons.push(polygon);
    }
  }

  return polygons;
}

/**
 * Calculate area of a polygon using the Shoelace formula.
 * Input: [[x1,y1], [x2,y2], ..., [xn,yn]] in clockwise or counter-clockwise order.
 * Returns area in square metres.
 */
export function calculateArea(roomPolygon: number[][]): number {
  if (roomPolygon.length < 3) return 0;

  let area = 0;
  const n = roomPolygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += roomPolygon[i][0] * roomPolygon[j][1];
    area -= roomPolygon[j][0] * roomPolygon[i][1];
  }

  return Math.abs(area) / 2;
}
