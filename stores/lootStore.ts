import { create } from 'zustand';
import type { LootDrop } from '@/types/combat';

/**
 * Loot state management store
 * Manages loot notifications and history
 */

interface LootState {
  // Current loot notification
  recentLoot: LootDrop | null;
  showNotification: boolean;

  // Loot history
  lootHistory: LootDrop[];

  // Actions
  addLoot: (loot: LootDrop) => void;
  dismissNotification: () => void;
  clearHistory: () => void;
  reset: () => void;
}

const initialState = {
  recentLoot: null,
  showNotification: false,
  lootHistory: [],
};

export const useLootStore = create<LootState>((set) => ({
  ...initialState,

  addLoot: (loot) =>
    set((state) => ({
      recentLoot: loot,
      showNotification: true,
      lootHistory: [loot, ...state.lootHistory].slice(0, 50), // Keep last 50
    })),

  dismissNotification: () =>
    set({
      showNotification: false,
    }),

  clearHistory: () =>
    set({
      lootHistory: [],
    }),

  reset: () => set(initialState),
}));
