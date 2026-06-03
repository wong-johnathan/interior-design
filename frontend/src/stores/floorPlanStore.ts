import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type ToolMode = 'select' | 'draw' | 'delete';

export interface WallSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
  height: number;
  wallType: 'internal' | 'external' | 'party';
  isLoadBearing: boolean;
  positiveRoomId?: string;
  negativeRoomId?: string;
}

export interface DetectedRoom {
  id: string;
  label: string;
  vertices: { x: number; y: number }[];
  area: number;
}

interface FloorPlanState {
  tool: ToolMode;
  walls: WallSegment[];
  selectedWallId: string | null;
  history: WallSegment[][];
  historyIndex: number;
  gridSnap: boolean;
  gridSize: number;
  rooms: DetectedRoom[];
  hoveredWallId: string | null;

  setTool: (tool: ToolMode) => void;
  setWalls: (walls: WallSegment[]) => void;
  selectWall: (id: string | null) => void;
  setHoveredWall: (id: string | null) => void;
  addWall: (wall: WallSegment) => void;
  removeWall: (id: string) => void;
  updateWall: (id: string, updates: Partial<WallSegment>) => void;
  deleteWall: (id: string) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  toggleGridSnap: () => void;
  reset: () => void;
  setRooms: (rooms: DetectedRoom[]) => void;
}

let wallCounter = 0;
function nextWallId(): string {
  return `wall_${++wallCounter}`;
}

function snapValue(val: number, grid: number): number {
  return Math.round(val / grid) * grid;
}

export function snapPoint(x: number, y: number, gridSize: number): { x: number; y: number } {
  return {
    x: snapValue(x, gridSize),
    y: snapValue(y, gridSize),
  };
}

export { nextWallId };

export const useFloorPlanStore = create<FloorPlanState>()(
  immer((set, get) => ({
    tool: 'select',
    walls: [],
    selectedWallId: null,
    history: [[]],
    historyIndex: 0,
    gridSnap: true,
    gridSize: 0.2,
    rooms: [],
    hoveredWallId: null,

    setTool: (tool) =>
      set((state) => {
        state.tool = tool;
        state.selectedWallId = null;
      }),

    setWalls: (walls) =>
      set((state) => {
        state.walls = walls;
      }),

    selectWall: (id) =>
      set((state) => {
        state.selectedWallId = id;
      }),

    setHoveredWall: (id) =>
      set((state) => {
        state.hoveredWallId = id;
      }),

    addWall: (wall) =>
      set((state) => {
        state.walls.push(wall);
        // Snapshot for undo
        const snapshot = state.walls.map((w) => ({ ...w }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }),

    removeWall: (id) =>
      set((state) => {
        state.walls = state.walls.filter((w) => w.id !== id);
        if (state.selectedWallId === id) state.selectedWallId = null;
      }),

    updateWall: (id, updates) =>
      set((state) => {
        const wall = state.walls.find((w) => w.id === id);
        if (wall) Object.assign(wall, updates);
      }),

    deleteWall: (id) =>
      set((state) => {
        state.walls = state.walls.filter((w) => w.id !== id);
        if (state.selectedWallId === id) state.selectedWallId = null;
        // Snapshot for undo
        const snapshot = state.walls.map((w) => ({ ...w }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.walls = state.history[state.historyIndex].map((w) => ({ ...w }));
          state.selectedWallId = null;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.walls = state.history[state.historyIndex].map((w) => ({ ...w }));
          state.selectedWallId = null;
        }
      }),

    pushHistory: () =>
      set((state) => {
        const snapshot = state.walls.map((w) => ({ ...w }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }),

    toggleGridSnap: () =>
      set((state) => {
        state.gridSnap = !state.gridSnap;
      }),

    reset: () =>
      set({
        walls: [],
        selectedWallId: null,
        history: [[]],
        historyIndex: 0,
        tool: 'select',
        rooms: [],
        hoveredWallId: null,
      }),

    setRooms: (rooms) =>
      set((state) => {
        state.rooms = rooms;
      }),
  }))
);
