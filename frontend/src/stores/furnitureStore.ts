'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface FurnitureItem {
  id: string;
  templateId: string;
  name: string;
  icon: string;
  category: string;
  style: string;
  width: number;
  depth: number;
  height: number;
  x: number;
  y: number;
  rotation: number; // degrees
  roomId?: string;
}

export interface FurnitureTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  style: string;
  width: number;
  depth: number;
  height: number;
}

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  // Living Room
  { id: 'sofa_3seat', name: '3-Seater Sofa', icon: '🛋️', category: 'Living Room', style: 'Modern', width: 2.0, depth: 0.9, height: 0.8 },
  { id: 'sofa_sectional', name: 'Sectional Sofa', icon: '🛋️', category: 'Living Room', style: 'Modern', width: 2.8, depth: 1.2, height: 0.8 },
  { id: 'sofa_loveseat', name: 'Loveseat', icon: '🛋️', category: 'Living Room', style: 'Scandi', width: 1.5, depth: 0.8, height: 0.8 },
  { id: 'chaise', name: 'Chaise Lounge', icon: '🛋️', category: 'Living Room', style: 'Japandi', width: 1.8, depth: 0.7, height: 0.7 },
  { id: 'coffee_table', name: 'Coffee Table', icon: '🪑', category: 'Living Room', style: 'Modern', width: 1.2, depth: 0.7, height: 0.45 },
  { id: 'side_table', name: 'Side Table', icon: '🪑', category: 'Living Room', style: 'Industrial', width: 0.5, depth: 0.5, height: 0.55 },
  { id: 'tv_stand', name: 'TV Console', icon: '📺', category: 'Living Room', style: 'Modern', width: 1.8, depth: 0.4, height: 0.5 },
  { id: 'bookcase', name: 'Bookcase', icon: '📚', category: 'Living Room', style: 'Vintage', width: 0.8, depth: 0.3, height: 1.8 },
  // Bedroom
  { id: 'bed_queen', name: 'Queen Bed', icon: '🛏️', category: 'Bedroom', style: 'Scandi', width: 1.6, depth: 2.0, height: 0.5 },
  { id: 'bed_king', name: 'King Bed', icon: '🛏️', category: 'Bedroom', style: 'Modern', width: 1.8, depth: 2.0, height: 0.5 },
  { id: 'nightstand', name: 'Nightstand', icon: '🪑', category: 'Bedroom', style: 'Japandi', width: 0.5, depth: 0.4, height: 0.55 },
  { id: 'dresser', name: 'Dresser', icon: '🗄️', category: 'Bedroom', style: 'Vintage', width: 1.2, depth: 0.5, height: 0.8 },
  { id: 'wardrobe', name: 'Wardrobe', icon: '🚪', category: 'Bedroom', style: 'Modern', width: 1.5, depth: 0.6, height: 2.4 },
  // Kitchen
  { id: 'dining_table_4', name: '4-Seat Dining Table', icon: '🍽️', category: 'Kitchen', style: 'Japandi', width: 1.2, depth: 0.8, height: 0.75 },
  { id: 'dining_table_6', name: '6-Seat Dining Table', icon: '🍽️', category: 'Kitchen', style: 'Modern', width: 1.8, depth: 0.9, height: 0.75 },
  { id: 'dining_chair', name: 'Dining Chair', icon: '🪑', category: 'Kitchen', style: 'Scandi', width: 0.45, depth: 0.5, height: 0.9 },
  { id: 'kitchen_island', name: 'Kitchen Island', icon: '🍳', category: 'Kitchen', style: 'Industrial', width: 1.5, depth: 0.7, height: 0.9 },
  // Bathroom
  { id: 'bathtub', name: 'Bathtub', icon: '🛁', category: 'Bathroom', style: 'Modern', width: 1.7, depth: 0.8, height: 0.6 },
  { id: 'vanity', name: 'Vanity Unit', icon: '💄', category: 'Bathroom', style: 'Scandi', width: 0.9, depth: 0.5, height: 0.85 },
  { id: 'toilet', name: 'Toilet', icon: '🚽', category: 'Bathroom', style: 'Modern', width: 0.4, depth: 0.7, height: 0.5 },
  { id: 'shower_stall', name: 'Shower Stall', icon: '🚿', category: 'Bathroom', style: 'Industrial', width: 0.9, depth: 0.9, height: 2.0 },
];

let furnitureCounter = 0;
function nextFurnitureId(): string {
  return `furn_${++furnitureCounter}`;
}

interface FurnitureState {
  placedItems: FurnitureItem[];
  selectedItemId: string | null;
  isTweakMode: boolean;
  isCatalogOpen: boolean;
  showGrid: boolean;
  history: FurnitureItem[][];
  historyIndex: number;

  // Actions
  addItem: (template: FurnitureTemplate, x: number, y: number) => void;
  removeItem: (id: string) => void;
  moveItem: (id: string, x: number, y: number) => void;
  rotateItem: (id: string, rotation: number) => void;
  updateItem: (id: string, updates: Partial<FurnitureItem>) => void;
  selectItem: (id: string | null) => void;
  setTweakMode: (on: boolean) => void;
  setCatalogOpen: (on: boolean) => void;
  setShowGrid: (on: boolean) => void;
  toggleGrid: () => void;
  toggleTweakMode: () => void;
  toggleCatalog: () => void;
  duplicateItem: (id: string) => void;
  resetAll: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useFurnitureStore = create<FurnitureState>()(
  immer((set, get) => ({
    placedItems: [],
    selectedItemId: null,
    isTweakMode: false,
    isCatalogOpen: false,
    showGrid: true,
    history: [[]],
    historyIndex: 0,

    addItem: (template, x, y) =>
      set((state) => {
        const item: FurnitureItem = {
          id: nextFurnitureId(),
          templateId: template.id,
          name: template.name,
          icon: template.icon,
          category: template.category,
          style: template.style,
          width: template.width,
          depth: template.depth,
          height: template.height,
          x,
          y,
          rotation: 0,
        };
        state.placedItems.push(item);
        const snapshot = state.placedItems.map((i) => ({ ...i }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }),

    removeItem: (id) =>
      set((state) => {
        state.placedItems = state.placedItems.filter((i) => i.id !== id);
        if (state.selectedItemId === id) state.selectedItemId = null;
        const snapshot = state.placedItems.map((i) => ({ ...i }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }),

    moveItem: (id, x, y) =>
      set((state) => {
        const item = state.placedItems.find((i) => i.id === id);
        if (item) {
          item.x = x;
          item.y = y;
        }
      }),

    rotateItem: (id, rotation) =>
      set((state) => {
        const item = state.placedItems.find((i) => i.id === id);
        if (item) {
          item.rotation = rotation;
        }
      }),

    updateItem: (id, updates) =>
      set((state) => {
        const item = state.placedItems.find((i) => i.id === id);
        if (item) Object.assign(item, updates);
      }),

    selectItem: (id) =>
      set((state) => {
        state.selectedItemId = id;
      }),

    setTweakMode: (on) =>
      set((state) => {
        state.isTweakMode = on;
      }),

    setCatalogOpen: (on) =>
      set((state) => {
        state.isCatalogOpen = on;
      }),

    setShowGrid: (on) =>
      set((state) => {
        state.showGrid = on;
      }),

    toggleGrid: () =>
      set((state) => {
        state.showGrid = !state.showGrid;
      }),

    toggleTweakMode: () =>
      set((state) => {
        state.isTweakMode = !state.isTweakMode;
      }),

    toggleCatalog: () =>
      set((state) => {
        state.isCatalogOpen = !state.isCatalogOpen;
      }),

    duplicateItem: (id) =>
      set((state) => {
        const source = state.placedItems.find((i) => i.id === id);
        if (source) {
          const dup: FurnitureItem = {
            ...source,
            id: nextFurnitureId(),
            x: source.x + 0.5,
            y: source.y + 0.5,
          };
          state.placedItems.push(dup);
          const snapshot = state.placedItems.map((i) => ({ ...i }));
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(snapshot);
          if (state.history.length > 50) state.history.shift();
          state.historyIndex = state.history.length - 1;
        }
      }),

    resetAll: () =>
      set((state) => {
        state.placedItems = [];
        state.selectedItemId = null;
        const snapshot: FurnitureItem[][] = [[]];
        state.history = snapshot;
        state.historyIndex = 0;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.placedItems = state.history[state.historyIndex].map((i) => ({ ...i }));
          state.selectedItemId = null;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.placedItems = state.history[state.historyIndex].map((i) => ({ ...i }));
          state.selectedItemId = null;
        }
      }),

    pushHistory: () =>
      set((state) => {
        const snapshot = state.placedItems.map((i) => ({ ...i }));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
      }),
  }))
);
