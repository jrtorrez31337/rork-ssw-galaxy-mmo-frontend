import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Target State
 *
 * Surfaces targeting context to UI per Space Mechanics Doctrine.
 * Does not implement targeting mechanics - only exposes target data.
 *
 * Per Doctrine Section 5 (Combat Information Requirements):
 * - Target range and closing rate
 * - Target bearing (relative position)
 * - Target hull/shields
 * - Target velocity vector
 * - Threat level assessment
 */

export type TargetType = 'ship' | 'station' | 'asteroid' | 'anomaly' | 'unknown';
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type ClosingRate = 'closing' | 'extending' | 'holding';

export interface TargetInfo {
  id: string;
  name: string;
  type: TargetType;

  // Classification
  shipClass: string | null;     // If ship
  factionId: string | null;
  factionName: string | null;
  isHostile: boolean;
  isPlayer: boolean;

  // Position (per doctrine: relative bearing)
  range: number;                 // Light-seconds
  bearing: number;               // Degrees (0-360) or clock position
  bearingClock: string;          // "12 o'clock" format
  closingRate: ClosingRate;
  rangeChanging: number;         // + extending, - closing (ls/s)

  // Velocity
  speed: number;                 // Current speed
  heading: number;               // Direction of travel

  // Status (if scanned or in combat)
  hull: number | null;           // Percentage, null if unknown
  shields: number | null;        // Percentage, null if unknown
  isAlive: boolean;

  // Threat assessment
  threatLevel: ThreatLevel;
  isTargetingYou: boolean;       // WARNING: someone aiming at you

  // Scan state
  scanLevel: 'none' | 'passive' | 'active' | 'full';
  lastScanTime: number | null;
}

export interface ContactInfo {
  id: string;
  type: TargetType;
  range: number;
  bearing: number;
  isHostile: boolean;
  threatLevel: ThreatLevel;
}

interface TargetState {
  // Primary target
  target: TargetInfo | null;
  hasTarget: boolean;

  // Contact list (all detected objects)
  contacts: ContactInfo[];
  hostileCount: number;
  friendlyCount: number;

  // Weapons lock
  isLocked: boolean;
  lockProgress: number;          // 0-100
  lockTimeRemaining: number;     // Seconds until locked

  // Incoming threat warnings
  incomingMissiles: number;
  isBeingTargeted: boolean;      // Any hostile has you locked

  // Engagement range context
  inWeaponsRange: boolean;
  optimalRange: number;          // Ideal engagement distance
  maxRange: number;              // Maximum weapons range

  // Actions - Update from SSE/API data
  setTarget: (target: TargetInfo | null) => void;
  updateTargetPosition: (range: number, bearing: number, closingRate: ClosingRate) => void;
  updateTargetStatus: (hull: number, shields: number, isAlive: boolean) => void;
  updateTargetThreat: (threatLevel: ThreatLevel, isTargetingYou: boolean) => void;
  setContacts: (contacts: ContactInfo[]) => void;
  addContact: (contact: ContactInfo) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, updates: Partial<ContactInfo>) => void;
  setLockState: (isLocked: boolean, progress: number, timeRemaining: number) => void;
  setIncomingThreats: (missiles: number, isBeingTargeted: boolean) => void;
  setWeaponsRange: (inRange: boolean, optimal: number, max: number) => void;
  clearTarget: () => void;
  reset: () => void;
}

function clockFromBearing(bearing: number): string {
  // Convert degrees to clock position (12 o'clock = 0°, 3 o'clock = 90°, etc.)
  const hour = Math.round(((bearing + 15) % 360) / 30);
  return `${hour === 0 ? 12 : hour} o'clock`;
}

export const useTargetStore = create<TargetState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    target: null,
    hasTarget: false,
    contacts: [],
    hostileCount: 0,
    friendlyCount: 0,
    isLocked: false,
    lockProgress: 0,
    lockTimeRemaining: 0,
    incomingMissiles: 0,
    isBeingTargeted: false,
    inWeaponsRange: false,
    optimalRange: 5,
    maxRange: 10,

    setTarget: (target) => set({
      target,
      hasTarget: !!target,
      isLocked: false,
      lockProgress: 0,
      lockTimeRemaining: 0,
    }),

    updateTargetPosition: (range, bearing, closingRate) => set((state) => {
      if (!state.target) return state;
      return {
        target: {
          ...state.target,
          range,
          bearing,
          bearingClock: clockFromBearing(bearing),
          closingRate,
        },
        inWeaponsRange: range <= state.maxRange,
      };
    }),

    updateTargetStatus: (hull, shields, isAlive) => set((state) => {
      if (!state.target) return state;
      return {
        target: {
          ...state.target,
          hull,
          shields,
          isAlive,
        },
      };
    }),

    updateTargetThreat: (threatLevel, isTargetingYou) => set((state) => {
      if (!state.target) return state;
      return {
        target: {
          ...state.target,
          threatLevel,
          isTargetingYou,
        },
      };
    }),

    setContacts: (contacts) => set({
      contacts,
      hostileCount: contacts.filter((c) => c.isHostile).length,
      friendlyCount: contacts.filter((c) => !c.isHostile).length,
    }),

    addContact: (contact) => set((state) => {
      const exists = state.contacts.some((c) => c.id === contact.id);
      if (exists) return state;
      const newContacts = [...state.contacts, contact];
      return {
        contacts: newContacts,
        hostileCount: newContacts.filter((c) => c.isHostile).length,
        friendlyCount: newContacts.filter((c) => !c.isHostile).length,
      };
    }),

    removeContact: (id) => set((state) => {
      const newContacts = state.contacts.filter((c) => c.id !== id);
      return {
        contacts: newContacts,
        hostileCount: newContacts.filter((c) => c.isHostile).length,
        friendlyCount: newContacts.filter((c) => !c.isHostile).length,
        // Clear target if removed
        target: state.target?.id === id ? null : state.target,
        hasTarget: state.target?.id === id ? false : state.hasTarget,
      };
    }),

    updateContact: (id, updates) => set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

    setLockState: (isLocked, progress, timeRemaining) => set({
      isLocked,
      lockProgress: progress,
      lockTimeRemaining: timeRemaining,
    }),

    setIncomingThreats: (missiles, isBeingTargeted) => set({
      incomingMissiles: missiles,
      isBeingTargeted,
    }),

    setWeaponsRange: (inRange, optimal, max) => set({
      inWeaponsRange: inRange,
      optimalRange: optimal,
      maxRange: max,
    }),

    clearTarget: () => set({
      target: null,
      hasTarget: false,
      isLocked: false,
      lockProgress: 0,
      lockTimeRemaining: 0,
    }),

    reset: () => set({
      target: null,
      hasTarget: false,
      contacts: [],
      hostileCount: 0,
      friendlyCount: 0,
      isLocked: false,
      lockProgress: 0,
      lockTimeRemaining: 0,
      incomingMissiles: 0,
      isBeingTargeted: false,
      inWeaponsRange: false,
      optimalRange: 5,
      maxRange: 10,
    }),
  }))
);

// Selectors
export const selectTarget = (state: TargetState) => state.target;
export const selectHasTarget = (state: TargetState) => state.hasTarget;
export const selectContacts = (state: TargetState) => state.contacts;
export const selectHostileCount = (state: TargetState) => state.hostileCount;
export const selectIsBeingTargeted = (state: TargetState) => state.isBeingTargeted;
export const selectIncomingMissiles = (state: TargetState) => state.incomingMissiles;
