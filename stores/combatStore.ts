import { create } from 'zustand';
import type {
  CombatInstance,
  CombatParticipant,
  DamageNumber,
  CombatEndReason,
} from '@/types/combat';

/**
 * Combat state management store
 * Manages active combat, participants, damage numbers, and combat results
 */

interface CombatState {
  // Active combat
  combatInstance: CombatInstance | null;
  currentTick: number;
  isInCombat: boolean;

  // Damage animations
  damageNumbers: DamageNumber[];

  // Combat results
  lastCombatResult: {
    reason: CombatEndReason;
    totalTicks: number;
  } | null;
  showResults: boolean;

  // Actions
  setCombatInstance: (instance: CombatInstance | null) => void;
  updateParticipantHealth: (
    targetId: string,
    hull: number,
    shield: number
  ) => void;
  updateParticipantStatus: (targetId: string, isAlive: boolean) => void;
  setCombatTick: (tick: number) => void;
  addDamageNumber: (damageNumber: DamageNumber) => void;
  removeDamageNumber: (id: string) => void;
  setCombatResult: (
    reason: CombatEndReason,
    totalTicks: number
  ) => void;
  setShowResults: (show: boolean) => void;
  endCombat: () => void;
  reset: () => void;
}

const initialState = {
  combatInstance: null,
  currentTick: 0,
  isInCombat: false,
  damageNumbers: [],
  lastCombatResult: null,
  showResults: false,
};

export const useCombatStore = create<CombatState>((set) => ({
  ...initialState,

  setCombatInstance: (instance) =>
    set({
      combatInstance: instance,
      isInCombat: !!instance,
      currentTick: instance?.tick || 0,
    }),

  updateParticipantHealth: (targetId, hull, shield) =>
    set((state) => {
      if (!state.combatInstance) return state;

      return {
        combatInstance: {
          ...state.combatInstance,
          participants: state.combatInstance.participants.map((p) =>
            p.player_id === targetId || p.ship_id === targetId
              ? { ...p, hull, shield, is_alive: hull > 0 }
              : p
          ),
        },
      };
    }),

  updateParticipantStatus: (targetId, isAlive) =>
    set((state) => {
      if (!state.combatInstance) return state;

      return {
        combatInstance: {
          ...state.combatInstance,
          participants: state.combatInstance.participants.map((p) =>
            p.player_id === targetId || p.ship_id === targetId
              ? { ...p, is_alive: isAlive }
              : p
          ),
        },
      };
    }),

  setCombatTick: (tick) => set({ currentTick: tick }),

  addDamageNumber: (damageNumber) =>
    set((state) => ({
      damageNumbers: [...state.damageNumbers, damageNumber],
    })),

  removeDamageNumber: (id) =>
    set((state) => ({
      damageNumbers: state.damageNumbers.filter((dn) => dn.id !== id),
    })),

  setCombatResult: (reason, totalTicks) =>
    set({
      lastCombatResult: { reason, totalTicks },
      showResults: true,
    }),

  setShowResults: (show) => set({ showResults: show }),

  endCombat: () =>
    set({
      combatInstance: null,
      isInCombat: false,
      currentTick: 0,
      damageNumbers: [],
    }),

  reset: () => set(initialState),
}));
