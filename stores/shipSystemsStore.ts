import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Ship Systems State
 *
 * Surfaces ship mechanical state to UI per Space Mechanics Doctrine.
 * Does not implement mechanics - only exposes data for display.
 *
 * Per Doctrine Section 5 (Mechanics-to-UI Contract):
 * - Hull/Shield/Fuel always visible
 * - System damage indicators
 * - Power distribution display
 * - Reactor output
 */

export type SystemId = 'weapons' | 'shields' | 'engines' | 'sensors' | 'reactor';

export interface SystemStatus {
  id: SystemId;
  name: string;
  health: number;        // 0-100 percentage
  isOperational: boolean;
  isDamaged: boolean;
  isCritical: boolean;   // < 25%
  effectivenessModifier: number; // 0-1, how much damage reduces effectiveness
}

export interface PowerDistribution {
  weapons: number;   // 0-100
  shields: number;   // 0-100
  engines: number;   // 0-100
  systems: number;   // 0-100
}

export interface Vitals {
  hull: {
    current: number;
    max: number;
    percentage: number;
    isCritical: boolean;  // < 25%
    isDamaged: boolean;   // < 75%
  };
  shields: {
    current: number;
    max: number;
    percentage: number;
    isDown: boolean;      // 0%
    isRecharging: boolean;
  };
  fuel: {
    current: number;
    max: number;
    percentage: number;
    isCritical: boolean;  // < 10%
    isLow: boolean;       // < 20%
  };
}

interface ShipSystemsState {
  // Ship identification
  shipId: string | null;
  shipName: string;
  shipClass: string;

  // Vitals (always visible per doctrine)
  vitals: Vitals;

  // Power distribution
  powerDistribution: PowerDistribution;
  reactorOutput: number;         // Current capacity (may be reduced by damage)
  reactorCapacity: number;       // Max capacity

  // Individual systems
  systems: Record<SystemId, SystemStatus>;

  // Repair state
  repairQueue: Array<{
    systemId: SystemId;
    progress: number;      // 0-100
    timeRemaining: number; // seconds
  }>;
  isRepairing: boolean;

  // Derived states
  isOperational: boolean;  // All critical systems functional
  hasDamage: boolean;      // Any system damaged
  hasCriticalDamage: boolean; // Any system critical

  // Actions - Update from SSE/API data
  setShipIdentity: (id: string, name: string, shipClass: string) => void;
  updateVitals: (vitals: Partial<Vitals>) => void;
  updateHull: (current: number, max: number) => void;
  updateShields: (current: number, max: number, isRecharging?: boolean) => void;
  updateFuel: (current: number, max: number) => void;
  updatePowerDistribution: (distribution: Partial<PowerDistribution>) => void;
  updateSystemHealth: (systemId: SystemId, health: number) => void;
  updateReactorOutput: (output: number, capacity: number) => void;
  addRepairJob: (systemId: SystemId, timeRemaining: number) => void;
  updateRepairProgress: (systemId: SystemId, progress: number, timeRemaining: number) => void;
  completeRepair: (systemId: SystemId) => void;
  reset: () => void;
}

function calculateVitalState(current: number, max: number) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  return {
    current,
    max,
    percentage,
  };
}

function createSystemStatus(id: SystemId, name: string, health: number = 100): SystemStatus {
  return {
    id,
    name,
    health,
    isOperational: health > 0,
    isDamaged: health < 100,
    isCritical: health < 25,
    effectivenessModifier: health / 100,
  };
}

const initialVitals: Vitals = {
  hull: { current: 100, max: 100, percentage: 100, isCritical: false, isDamaged: false },
  shields: { current: 100, max: 100, percentage: 100, isDown: false, isRecharging: false },
  fuel: { current: 100, max: 100, percentage: 100, isCritical: false, isLow: false },
};

const initialPowerDistribution: PowerDistribution = {
  weapons: 25,
  shields: 25,
  engines: 25,
  systems: 25,
};

const initialSystems: Record<SystemId, SystemStatus> = {
  weapons: createSystemStatus('weapons', 'Weapons'),
  shields: createSystemStatus('shields', 'Shields'),
  engines: createSystemStatus('engines', 'Engines'),
  sensors: createSystemStatus('sensors', 'Sensors'),
  reactor: createSystemStatus('reactor', 'Reactor'),
};

export const useShipSystemsStore = create<ShipSystemsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    shipId: null,
    shipName: 'Unknown Vessel',
    shipClass: 'Unknown',
    vitals: initialVitals,
    powerDistribution: initialPowerDistribution,
    reactorOutput: 100,
    reactorCapacity: 100,
    systems: initialSystems,
    repairQueue: [],
    isRepairing: false,
    isOperational: true,
    hasDamage: false,
    hasCriticalDamage: false,

    setShipIdentity: (id, name, shipClass) => set({
      shipId: id,
      shipName: name,
      shipClass,
    }),

    updateVitals: (vitals) => set((state) => ({
      vitals: {
        ...state.vitals,
        ...vitals,
      },
    })),

    updateHull: (current, max) => set((state) => {
      const percentage = max > 0 ? (current / max) * 100 : 0;
      return {
        vitals: {
          ...state.vitals,
          hull: {
            current,
            max,
            percentage,
            isCritical: percentage < 25,
            isDamaged: percentage < 75,
          },
        },
      };
    }),

    updateShields: (current, max, isRecharging = false) => set((state) => {
      const percentage = max > 0 ? (current / max) * 100 : 0;
      return {
        vitals: {
          ...state.vitals,
          shields: {
            current,
            max,
            percentage,
            isDown: percentage === 0,
            isRecharging,
          },
        },
      };
    }),

    updateFuel: (current, max) => set((state) => {
      const percentage = max > 0 ? (current / max) * 100 : 0;
      return {
        vitals: {
          ...state.vitals,
          fuel: {
            current,
            max,
            percentage,
            isCritical: percentage < 10,
            isLow: percentage < 20,
          },
        },
      };
    }),

    updatePowerDistribution: (distribution) => set((state) => ({
      powerDistribution: {
        ...state.powerDistribution,
        ...distribution,
      },
    })),

    updateSystemHealth: (systemId, health) => set((state) => {
      const updatedSystems = {
        ...state.systems,
        [systemId]: {
          ...state.systems[systemId],
          health,
          isOperational: health > 0,
          isDamaged: health < 100,
          isCritical: health < 25,
          effectivenessModifier: health / 100,
        },
      };

      const systemValues = Object.values(updatedSystems);
      return {
        systems: updatedSystems,
        hasDamage: systemValues.some((s) => s.isDamaged),
        hasCriticalDamage: systemValues.some((s) => s.isCritical),
        isOperational: systemValues.every((s) => s.isOperational),
      };
    }),

    updateReactorOutput: (output, capacity) => set({
      reactorOutput: output,
      reactorCapacity: capacity,
    }),

    addRepairJob: (systemId, timeRemaining) => set((state) => ({
      repairQueue: [
        ...state.repairQueue,
        { systemId, progress: 0, timeRemaining },
      ],
      isRepairing: true,
    })),

    updateRepairProgress: (systemId, progress, timeRemaining) => set((state) => ({
      repairQueue: state.repairQueue.map((job) =>
        job.systemId === systemId
          ? { ...job, progress, timeRemaining }
          : job
      ),
    })),

    completeRepair: (systemId) => set((state) => {
      const newQueue = state.repairQueue.filter((job) => job.systemId !== systemId);
      return {
        repairQueue: newQueue,
        isRepairing: newQueue.length > 0,
        systems: {
          ...state.systems,
          [systemId]: createSystemStatus(systemId, state.systems[systemId].name, 100),
        },
      };
    }),

    reset: () => set({
      shipId: null,
      shipName: 'Unknown Vessel',
      shipClass: 'Unknown',
      vitals: initialVitals,
      powerDistribution: initialPowerDistribution,
      reactorOutput: 100,
      reactorCapacity: 100,
      systems: initialSystems,
      repairQueue: [],
      isRepairing: false,
      isOperational: true,
      hasDamage: false,
      hasCriticalDamage: false,
    }),
  }))
);

// Selectors
export const selectVitals = (state: ShipSystemsState) => state.vitals;
export const selectHull = (state: ShipSystemsState) => state.vitals.hull;
export const selectShields = (state: ShipSystemsState) => state.vitals.shields;
export const selectFuel = (state: ShipSystemsState) => state.vitals.fuel;
export const selectPowerDistribution = (state: ShipSystemsState) => state.powerDistribution;
export const selectSystems = (state: ShipSystemsState) => state.systems;
export const selectHasDamage = (state: ShipSystemsState) => state.hasDamage;
