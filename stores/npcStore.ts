import { create } from 'zustand';
import type { NPCEntity } from '@/types/combat';

/**
 * NPC state management store
 * Manages NPCs in the current sector
 */

interface NPCState {
  // NPCs in current sector
  npcs: NPCEntity[];
  currentSector: string | null;

  // Selected NPC
  selectedNPC: NPCEntity | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setNPCs: (npcs: NPCEntity[], sector: string) => void;
  addNPC: (npc: NPCEntity) => void;
  removeNPC: (npcId: string) => void;
  updateNPC: (npcId: string, updates: Partial<NPCEntity>) => void;
  setSelectedNPC: (npc: NPCEntity | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  npcs: [],
  currentSector: null,
  selectedNPC: null,
  isLoading: false,
  error: null,
};

export const useNPCStore = create<NPCState>((set) => ({
  ...initialState,

  setNPCs: (npcs, sector) =>
    set({
      npcs,
      currentSector: sector,
      error: null,
    }),

  addNPC: (npc) =>
    set((state) => ({
      npcs: [...state.npcs, npc],
    })),

  removeNPC: (npcId) =>
    set((state) => ({
      npcs: state.npcs.filter((npc) => npc.entity_id !== npcId),
      selectedNPC:
        state.selectedNPC?.entity_id === npcId ? null : state.selectedNPC,
    })),

  updateNPC: (npcId, updates) =>
    set((state) => ({
      npcs: state.npcs.map((npc) =>
        npc.entity_id === npcId ? { ...npc, ...updates } : npc
      ),
      selectedNPC:
        state.selectedNPC?.entity_id === npcId
          ? { ...state.selectedNPC, ...updates }
          : state.selectedNPC,
    })),

  setSelectedNPC: (npc) => set({ selectedNPC: npc }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
