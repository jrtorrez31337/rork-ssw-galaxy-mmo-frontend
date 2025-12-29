import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Combat Readiness State
 *
 * Surfaces combat readiness to UI per Space Mechanics Doctrine.
 * Does not implement combat mechanics - only exposes readiness data.
 *
 * Per Doctrine Section 3 (Combat Model):
 * - Alert levels (GREEN/YELLOW/RED)
 * - Weapons status
 * - Engagement context
 */

export type AlertLevel = 'green' | 'yellow' | 'red';
export type WeaponState = 'ready' | 'cooling' | 'charging' | 'damaged' | 'offline';
export type EngagementState = 'none' | 'pre-combat' | 'engaged' | 'disengaging' | 'post-combat';

export interface WeaponStatus {
  id: string;
  name: string;
  type: 'energy' | 'kinetic' | 'missile' | 'torpedo';
  state: WeaponState;
  cooldownRemaining: number;    // Seconds
  chargeLevel: number;          // 0-100 for charging weapons
  ammoCount: number | null;     // null for energy weapons
  ammoMax: number | null;
  isInArc: boolean;            // Can hit current target
  optimalRange: number;        // Best accuracy range (ls)
  maxRange: number;            // Maximum range (ls)
}

export interface EngagementContext {
  state: EngagementState;
  combatId: string | null;
  startTime: Date | null;
  duration: number;            // Seconds in combat
  currentTick: number;

  // Participants
  hostileCount: number;
  friendlyCount: number;
  isOutnumbered: boolean;

  // Escape viability
  escapeVector: number | null; // Bearing to safe hyperspace distance
  escapeDistance: number;       // Distance to safety (ls)
  canEscape: boolean;

  // Aggression
  isAggressor: boolean;        // Did we fire first?
  inSafeZone: boolean;         // Near station (triggers defense)
}

interface CombatReadinessState {
  // Alert level (per doctrine: always visible)
  alertLevel: AlertLevel;
  alertReason: string | null;
  alertTimestamp: Date | null;

  // Weapons array
  weapons: WeaponStatus[];
  weaponsOnline: number;
  weaponsReady: number;
  hasWeaponsDamaged: boolean;

  // Active weapon group
  activeWeaponGroup: number;
  weaponGroups: Array<{
    id: number;
    weaponIds: string[];
  }>;

  // Engagement
  engagement: EngagementContext;
  isInCombat: boolean;

  // Defensive status
  evasionMode: boolean;        // Prioritizing engines
  defensivePosture: 'aggressive' | 'balanced' | 'defensive' | 'evasive';

  // Cooldowns
  emergencyJumpCooldown: number;   // Emergency hyperspace
  lastFiredTime: Date | null;

  // Actions - Update from SSE/API data
  setAlertLevel: (level: AlertLevel, reason: string | null) => void;
  escalateAlert: (level: AlertLevel, reason: string) => void;
  clearAlert: () => void;

  // Weapon actions
  setWeapons: (weapons: WeaponStatus[]) => void;
  updateWeaponState: (weaponId: string, state: WeaponState, cooldown?: number) => void;
  updateWeaponAmmo: (weaponId: string, count: number) => void;
  setWeaponInArc: (weaponId: string, inArc: boolean) => void;
  setActiveWeaponGroup: (group: number) => void;
  setWeaponGroups: (groups: Array<{ id: number; weaponIds: string[] }>) => void;

  // Engagement actions
  enterCombat: (combatId: string, isAggressor: boolean) => void;
  updateEngagement: (updates: Partial<EngagementContext>) => void;
  exitCombat: () => void;

  // Defensive actions
  setDefensivePosture: (posture: 'aggressive' | 'balanced' | 'defensive' | 'evasive') => void;
  setEvasionMode: (enabled: boolean) => void;
  setEmergencyJumpCooldown: (seconds: number) => void;

  reset: () => void;
}

const initialEngagement: EngagementContext = {
  state: 'none',
  combatId: null,
  startTime: null,
  duration: 0,
  currentTick: 0,
  hostileCount: 0,
  friendlyCount: 0,
  isOutnumbered: false,
  escapeVector: null,
  escapeDistance: 0,
  canEscape: true,
  isAggressor: false,
  inSafeZone: false,
};

export const useCombatReadinessStore = create<CombatReadinessState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    alertLevel: 'green',
    alertReason: null,
    alertTimestamp: null,
    weapons: [],
    weaponsOnline: 0,
    weaponsReady: 0,
    hasWeaponsDamaged: false,
    activeWeaponGroup: 1,
    weaponGroups: [],
    engagement: initialEngagement,
    isInCombat: false,
    evasionMode: false,
    defensivePosture: 'balanced',
    emergencyJumpCooldown: 0,
    lastFiredTime: null,

    setAlertLevel: (level, reason) => set({
      alertLevel: level,
      alertReason: reason,
      alertTimestamp: new Date(),
    }),

    escalateAlert: (level, reason) => {
      const current = get().alertLevel;
      const priority = { green: 0, yellow: 1, red: 2 };
      if (priority[level] > priority[current]) {
        set({
          alertLevel: level,
          alertReason: reason,
          alertTimestamp: new Date(),
        });
      }
    },

    clearAlert: () => set({
      alertLevel: 'green',
      alertReason: null,
      alertTimestamp: null,
    }),

    setWeapons: (weapons) => {
      const online = weapons.filter((w) => w.state !== 'offline' && w.state !== 'damaged').length;
      const ready = weapons.filter((w) => w.state === 'ready').length;
      const damaged = weapons.some((w) => w.state === 'damaged');
      set({
        weapons,
        weaponsOnline: online,
        weaponsReady: ready,
        hasWeaponsDamaged: damaged,
      });
    },

    updateWeaponState: (weaponId, state, cooldown = 0) => set((prev) => {
      const weapons = prev.weapons.map((w) =>
        w.id === weaponId
          ? { ...w, state, cooldownRemaining: cooldown }
          : w
      );
      return {
        weapons,
        weaponsReady: weapons.filter((w) => w.state === 'ready').length,
        hasWeaponsDamaged: weapons.some((w) => w.state === 'damaged'),
      };
    }),

    updateWeaponAmmo: (weaponId, count) => set((prev) => ({
      weapons: prev.weapons.map((w) =>
        w.id === weaponId ? { ...w, ammoCount: count } : w
      ),
    })),

    setWeaponInArc: (weaponId, inArc) => set((prev) => ({
      weapons: prev.weapons.map((w) =>
        w.id === weaponId ? { ...w, isInArc: inArc } : w
      ),
    })),

    setActiveWeaponGroup: (group) => set({ activeWeaponGroup: group }),

    setWeaponGroups: (groups) => set({ weaponGroups: groups }),

    enterCombat: (combatId, isAggressor) => set({
      alertLevel: 'red',
      alertReason: 'Combat initiated',
      alertTimestamp: new Date(),
      engagement: {
        ...initialEngagement,
        state: 'engaged',
        combatId,
        startTime: new Date(),
        isAggressor,
      },
      isInCombat: true,
    }),

    updateEngagement: (updates) => set((prev) => ({
      engagement: { ...prev.engagement, ...updates },
    })),

    exitCombat: () => set((prev) => ({
      engagement: {
        ...initialEngagement,
        state: 'post-combat',
        duration: prev.engagement.duration,
      },
      isInCombat: false,
      // Don't auto-clear alert; let it downgrade naturally
    })),

    setDefensivePosture: (posture) => set({ defensivePosture: posture }),

    setEvasionMode: (enabled) => set({ evasionMode: enabled }),

    setEmergencyJumpCooldown: (seconds) => set({ emergencyJumpCooldown: seconds }),

    reset: () => set({
      alertLevel: 'green',
      alertReason: null,
      alertTimestamp: null,
      weapons: [],
      weaponsOnline: 0,
      weaponsReady: 0,
      hasWeaponsDamaged: false,
      activeWeaponGroup: 1,
      weaponGroups: [],
      engagement: initialEngagement,
      isInCombat: false,
      evasionMode: false,
      defensivePosture: 'balanced',
      emergencyJumpCooldown: 0,
      lastFiredTime: null,
    }),
  }))
);

// Selectors
export const selectAlertLevel = (state: CombatReadinessState) => state.alertLevel;
export const selectIsInCombat = (state: CombatReadinessState) => state.isInCombat;
export const selectWeapons = (state: CombatReadinessState) => state.weapons;
export const selectWeaponsReady = (state: CombatReadinessState) => state.weaponsReady;
export const selectEngagement = (state: CombatReadinessState) => state.engagement;
export const selectCanEscape = (state: CombatReadinessState) => state.engagement.canEscape;
