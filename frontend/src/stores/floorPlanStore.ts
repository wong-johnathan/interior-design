import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface FloorPlanState {
  tool: 'select' | 'draw' | 'delete';
  walls: WallSegment[];
  selectedWallId: string | null;
  history: WallSegment[][];
  historyIndex: number;
  gridSnap: boolean;
  gridSize: number;

  setTool: (tool: 'select' | 'draw' | 'delete') => void;
  setWalls: (walls: WallSegment[]) => void;
  selectWall: (id: string | null) => void;
  addWall: (wall: WallSegment) => void;
  removeWall: (id: string) => void;
  updateWall: (id: string, updates: Partial<WallSegment>) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: (walls: WallSegment[]) => void;
  toggleGridSnap: () => void;
  reset: () => void;
}

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

export const useFloorPlanStore = create<FloorPlanState>()(
  immer((set) => ({
    tool: 'select',
    walls: [],
    selectedWallId: null,
    history: [[]],
    historyIndex: 0,
    gridSnap: true,
    gridSize: 0.25,

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

    addWall: (wall) =>
      set((state) => {
        state.walls.push(wall);
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

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.walls = state.history[state.historyIndex];
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.walls = state.history[state.historyIndex];
        }
      }),

    pushHistory: (walls) =>
      set((state) => {
        const snapshot = walls.map((w) => ({ ...w }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
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
      }),
  }))
);
