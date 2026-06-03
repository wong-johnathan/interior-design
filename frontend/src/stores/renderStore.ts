import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface RenderState {
  renders: RenderItem[];
  selectedRoom: string;
  isGenerating: boolean;
  progress: { current: number; total: number };
  angles: Record<string, string[]>;

  setRenders: (renders: RenderItem[]) => void;
  addRender: (render: RenderItem) => void;
  setSelectedRoom: (room: string) => void;
  setIsGenerating: (v: boolean) => void;
  setProgress: (current: number, total: number) => void;
  toggleAngle: (room: string, angle: string) => void;
}

export interface RenderItem {
  id: string;
  roomType: string;
  roomLabel: string;
  imageUrl: string;
  prompt: string;
  resolution: string;
  createdAt: string;
  isStale?: boolean;
}

export const useRenderStore = create<RenderState>()(
  immer((set) => ({
    renders: [],
    selectedRoom: 'living',
    isGenerating: false,
    progress: { current: 0, total: 0 },
    angles: {
      living: ['Corner View', 'Entrance View'],
      mbr: ['Door View', 'Bedside View'],
      kitchen: ['Entrance View'],
      bedroom: ['Door View'],
    },

    setRenders: (renders) =>
      set((state) => {
        state.renders = renders;
      }),

    addRender: (render) =>
      set((state) => {
        state.renders.push(render);
      }),

    setSelectedRoom: (room) =>
      set((state) => {
        state.selectedRoom = room;
      }),

    setIsGenerating: (v) =>
      set((state) => {
        state.isGenerating = v;
      }),

    setProgress: (current, total) =>
      set((state) => {
        state.progress = { current, total };
      }),

    toggleAngle: (room, angle) =>
      set((state) => {
        const angles = state.angles[room];
        if (!angles) {
          state.angles[room] = [angle];
          return;
        }
        const idx = angles.indexOf(angle);
        if (idx >= 0) {
          angles.splice(idx, 1);
        } else {
          angles.push(angle);
        }
      }),
  }))
);
