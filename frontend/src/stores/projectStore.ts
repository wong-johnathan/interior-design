import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DesignBrief, RoomBrief, ChatMessage } from '@/lib/api';

interface ProjectState {
  projectId: string | null;
  projectName: string;
  flatModelId: string | null;
  designBrief: DesignBrief | null;
  chatHistory: ChatMessage[];
  activeRoom: string;
  selectedStyle: string;
  isFurnished: boolean;
  isChatOpen: boolean;
  isMobileChatOpen: boolean;

  setProject: (id: string, name: string, flatModelId: string) => void;
  setDesignBrief: (brief: DesignBrief) => void;
  updateRoomBrief: (roomType: string, update: Partial<RoomBrief>) => void;
  setActiveRoom: (room: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatHistory: (history: ChatMessage[]) => void;
  setFurnished: (v: boolean) => void;
  toggleChat: () => void;
  setMobileChatOpen: (v: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  immer((set) => ({
    projectId: null,
    projectName: 'My Project',
    flatModelId: null,
    designBrief: null,
    chatHistory: [],
    activeRoom: 'living',
    selectedStyle: '',
    isFurnished: false,
    isChatOpen: true,
    isMobileChatOpen: false,

    setProject: (id, name, flatModelId) =>
      set((state) => {
        state.projectId = id;
        state.projectName = name;
        state.flatModelId = flatModelId;
      }),

    setDesignBrief: (brief) =>
      set((state) => {
        state.designBrief = brief;
      }),

    updateRoomBrief: (roomType, update) =>
      set((state) => {
        if (state.designBrief?.rooms[roomType]) {
          Object.assign(state.designBrief.rooms[roomType], update);
        }
      }),

    setActiveRoom: (room) =>
      set((state) => {
        state.activeRoom = room;
      }),

    addChatMessage: (msg) =>
      set((state) => {
        state.chatHistory.push(msg);
      }),

    setChatHistory: (history) =>
      set((state) => {
        state.chatHistory = history;
      }),

    setFurnished: (v) =>
      set((state) => {
        state.isFurnished = v;
      }),

    toggleChat: () =>
      set((state) => {
        state.isChatOpen = !state.isChatOpen;
      }),

    setMobileChatOpen: (v) =>
      set((state) => {
        state.isMobileChatOpen = v;
      }),
  }))
);
