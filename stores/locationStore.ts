import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Location State
 *
 * Surfaces spatial position to UI per Space Mechanics Doctrine.
 * Does not implement navigation - only exposes location data.
 *
 * Per Doctrine Section 1 (Three Scales):
 * - Galaxy: Sectors and Systems
 * - System: Bodies, stations, points of interest
 * - Local: Immediate vicinity, engagement range
 */

export type LocationScale = 'galaxy' | 'system' | 'local';

export interface Coordinates {
  x: number;
  y: number;
  z?: number; // Optional for 2D representation
}

export interface SectorInfo {
  id: string;
  name: string;
  coordinates: Coordinates;
  isExplored: boolean;
  dangerLevel: 'safe' | 'contested' | 'hostile' | 'unknown';
  controllingFaction: string | null;
}

export interface SystemInfo {
  id: string;
  name: string;
  starClass: string;          // e.g., "G2V", "M4"
  bodies: number;             // Count of orbital bodies
  hasStation: boolean;
  isCharted: boolean;
}

export interface LocalPosition {
  coordinates: Coordinates;
  nearestBody: string | null;
  nearestBodyDistance: number;  // Light-seconds
  nearestStation: string | null;
  nearestStationDistance: number;
  gravityWellDistance: number;  // Distance to nearest large mass (for hyperspace)
  isInDockingRange: boolean;    // < 0.1 ls per doctrine
}

export interface DockedState {
  isDocked: boolean;
  stationId: string | null;
  stationName: string | null;
  stationType: 'station' | 'planet' | 'outpost' | null;
  servicesAvailable: string[];
}

interface LocationState {
  // Current position display (per doctrine: always visible)
  displayLocation: string;     // Formatted for header bar: "Sector Name : System"

  // Scale context
  currentScale: LocationScale;

  // Sector (galaxy scale)
  currentSector: SectorInfo | null;

  // System (system scale)
  currentSystem: SystemInfo | null;
  isInSystem: boolean;

  // Local position (local scale)
  localPosition: LocalPosition;

  // Docked state
  docked: DockedState;

  // Navigation context
  canJump: boolean;            // Clear of gravity well
  jumpClearanceDistance: number; // Distance needed to jump

  // Actions - Update from SSE/API data
  setDisplayLocation: (location: string) => void;
  setCurrentScale: (scale: LocationScale) => void;
  setSector: (sector: SectorInfo) => void;
  setSystem: (system: SystemInfo | null) => void;
  updateLocalPosition: (position: Partial<LocalPosition>) => void;
  setDocked: (docked: DockedState) => void;
  dock: (stationId: string, stationName: string, stationType: DockedState['stationType'], services: string[]) => void;
  undock: () => void;
  updateJumpClearance: (canJump: boolean, distance: number) => void;
  reset: () => void;
}

const initialLocalPosition: LocalPosition = {
  coordinates: { x: 0, y: 0, z: 0 },
  nearestBody: null,
  nearestBodyDistance: 0,
  nearestStation: null,
  nearestStationDistance: 0,
  gravityWellDistance: 100,
  isInDockingRange: false,
};

const initialDockedState: DockedState = {
  isDocked: false,
  stationId: null,
  stationName: null,
  stationType: null,
  servicesAvailable: [],
};

export const useLocationStore = create<LocationState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    displayLocation: 'Unknown Sector',
    currentScale: 'local',
    currentSector: null,
    currentSystem: null,
    isInSystem: false,
    localPosition: initialLocalPosition,
    docked: initialDockedState,
    canJump: true,
    jumpClearanceDistance: 0,

    setDisplayLocation: (location) => set({ displayLocation: location }),

    setCurrentScale: (scale) => set({ currentScale: scale }),

    setSector: (sector) => set({
      currentSector: sector,
      displayLocation: sector.name,
    }),

    setSystem: (system) => set({
      currentSystem: system,
      isInSystem: !!system,
      displayLocation: system ? `${system.name}` : 'Deep Space',
    }),

    updateLocalPosition: (position) => set((state) => ({
      localPosition: {
        ...state.localPosition,
        ...position,
      },
    })),

    setDocked: (docked) => set({ docked }),

    dock: (stationId, stationName, stationType, services) => set({
      docked: {
        isDocked: true,
        stationId,
        stationName,
        stationType,
        servicesAvailable: services,
      },
    }),

    undock: () => set({
      docked: initialDockedState,
    }),

    updateJumpClearance: (canJump, distance) => set({
      canJump,
      jumpClearanceDistance: distance,
    }),

    reset: () => set({
      displayLocation: 'Unknown Sector',
      currentScale: 'local',
      currentSector: null,
      currentSystem: null,
      isInSystem: false,
      localPosition: initialLocalPosition,
      docked: initialDockedState,
      canJump: true,
      jumpClearanceDistance: 0,
    }),
  }))
);

// Selectors
export const selectDisplayLocation = (state: LocationState) => state.displayLocation;
export const selectIsDocked = (state: LocationState) => state.docked.isDocked;
export const selectCurrentSector = (state: LocationState) => state.currentSector;
export const selectCanJump = (state: LocationState) => state.canJump;
export const selectDockedStation = (state: LocationState) => state.docked;
