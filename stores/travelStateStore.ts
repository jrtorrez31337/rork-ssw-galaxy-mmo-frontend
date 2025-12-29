import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Travel State
 *
 * Surfaces travel/navigation state to UI per Space Mechanics Doctrine.
 * Does not implement travel mechanics - only exposes travel data.
 *
 * Per Doctrine Section 2 (Travel Model):
 * - Sublight (in-system) vs Hyperspace (inter-system)
 * - Transition states: pre-jump, in-hyperspace, post-jump
 * - Fuel costs and time estimates
 */

export type TravelMode = 'idle' | 'sublight' | 'hyperspace';
export type HyperspacePhase = 'idle' | 'calculating' | 'spooling' | 'transit' | 'cooldown';
export type SubflightSpeed = 'stop' | 'cruise' | 'flank' | 'combat';

export interface Destination {
  id: string;
  name: string;
  type: 'sector' | 'system' | 'station' | 'body' | 'coordinates';
  distance: number;          // Light-seconds (sublight) or light-years (hyperspace)
  estimatedTime: number;     // Seconds
  fuelCost: number;          // Percentage of tank
}

export interface SubflightState {
  speed: SubflightSpeed;
  velocity: number;          // Current speed (0-1 normalized, 0.1c = flank)
  heading: number;           // Degrees
  isMoving: boolean;
  destination: Destination | null;
  timeToArrival: number;     // Seconds
  distanceRemaining: number; // Light-seconds
}

export interface HyperspaceState {
  phase: HyperspacePhase;
  destination: Destination | null;

  // Calculation phase
  calculationProgress: number;    // 0-100
  calculationTimeRemaining: number;

  // Spool phase
  spoolProgress: number;          // 0-100
  spoolTimeRemaining: number;
  canAbort: boolean;

  // Transit phase
  transitProgress: number;        // 0-100
  transitTimeRemaining: number;
  estimatedArrival: Date | null;

  // Cooldown phase
  cooldownRemaining: number;      // Seconds until can jump again

  // Route
  isLaneJump: boolean;           // Using hyperspace lane (faster, predictable)
  routeWaypoints: string[];      // Multi-jump route
  currentWaypoint: number;
}

interface TravelState {
  // Overall mode
  mode: TravelMode;
  isInTransit: boolean;

  // Sublight travel
  sublight: SubflightState;

  // Hyperspace travel
  hyperspace: HyperspaceState;

  // Navigation readiness
  canInitiateJump: boolean;
  jumpBlockReason: string | null; // "In gravity well", "In combat", etc.
  gravityWellClearance: number;   // Distance to clear (0 = clear)

  // Fuel context
  fuelSufficient: boolean;
  fuelAfterTrip: number;          // Projected fuel after reaching destination

  // Actions - Update from SSE/API data
  setTravelMode: (mode: TravelMode) => void;

  // Sublight actions
  setSubflightState: (state: Partial<SubflightState>) => void;
  setSubflightDestination: (destination: Destination | null) => void;
  updateSubflightProgress: (timeToArrival: number, distanceRemaining: number) => void;

  // Hyperspace actions
  setHyperspacePhase: (phase: HyperspacePhase) => void;
  setHyperspaceDestination: (destination: Destination | null) => void;
  updateCalculationProgress: (progress: number, timeRemaining: number) => void;
  updateSpoolProgress: (progress: number, timeRemaining: number, canAbort: boolean) => void;
  updateTransitProgress: (progress: number, timeRemaining: number) => void;
  setCooldown: (remaining: number) => void;
  setRoute: (isLane: boolean, waypoints: string[], current: number) => void;

  // Navigation context
  setJumpReadiness: (canJump: boolean, blockReason: string | null, clearance: number) => void;
  setFuelProjection: (sufficient: boolean, remaining: number) => void;

  // Lifecycle
  arriveAtDestination: () => void;
  cancelTravel: () => void;
  reset: () => void;
}

const initialSublight: SubflightState = {
  speed: 'stop',
  velocity: 0,
  heading: 0,
  isMoving: false,
  destination: null,
  timeToArrival: 0,
  distanceRemaining: 0,
};

const initialHyperspace: HyperspaceState = {
  phase: 'idle',
  destination: null,
  calculationProgress: 0,
  calculationTimeRemaining: 0,
  spoolProgress: 0,
  spoolTimeRemaining: 0,
  canAbort: true,
  transitProgress: 0,
  transitTimeRemaining: 0,
  estimatedArrival: null,
  cooldownRemaining: 0,
  isLaneJump: false,
  routeWaypoints: [],
  currentWaypoint: 0,
};

export const useTravelStateStore = create<TravelState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    mode: 'idle',
    isInTransit: false,
    sublight: initialSublight,
    hyperspace: initialHyperspace,
    canInitiateJump: true,
    jumpBlockReason: null,
    gravityWellClearance: 0,
    fuelSufficient: true,
    fuelAfterTrip: 100,

    setTravelMode: (mode) => set({
      mode,
      isInTransit: mode !== 'idle',
    }),

    // Sublight
    setSubflightState: (state) => set((prev) => ({
      sublight: { ...prev.sublight, ...state },
      mode: state.isMoving ? 'sublight' : prev.mode,
      isInTransit: state.isMoving || prev.hyperspace.phase === 'transit',
    })),

    setSubflightDestination: (destination) => set((prev) => ({
      sublight: { ...prev.sublight, destination },
    })),

    updateSubflightProgress: (timeToArrival, distanceRemaining) => set((prev) => ({
      sublight: {
        ...prev.sublight,
        timeToArrival,
        distanceRemaining,
        isMoving: timeToArrival > 0,
      },
    })),

    // Hyperspace
    setHyperspacePhase: (phase) => set((prev) => ({
      hyperspace: { ...prev.hyperspace, phase },
      mode: phase === 'transit' ? 'hyperspace' : prev.mode,
      isInTransit: phase === 'transit' || prev.sublight.isMoving,
    })),

    setHyperspaceDestination: (destination) => set((prev) => ({
      hyperspace: { ...prev.hyperspace, destination },
    })),

    updateCalculationProgress: (progress, timeRemaining) => set((prev) => ({
      hyperspace: {
        ...prev.hyperspace,
        phase: 'calculating',
        calculationProgress: progress,
        calculationTimeRemaining: timeRemaining,
      },
    })),

    updateSpoolProgress: (progress, timeRemaining, canAbort) => set((prev) => ({
      hyperspace: {
        ...prev.hyperspace,
        phase: 'spooling',
        spoolProgress: progress,
        spoolTimeRemaining: timeRemaining,
        canAbort,
      },
    })),

    updateTransitProgress: (progress, timeRemaining) => set((prev) => ({
      hyperspace: {
        ...prev.hyperspace,
        phase: 'transit',
        transitProgress: progress,
        transitTimeRemaining: timeRemaining,
      },
      mode: 'hyperspace',
      isInTransit: true,
    })),

    setCooldown: (remaining) => set((prev) => ({
      hyperspace: {
        ...prev.hyperspace,
        phase: remaining > 0 ? 'cooldown' : 'idle',
        cooldownRemaining: remaining,
      },
    })),

    setRoute: (isLane, waypoints, current) => set((prev) => ({
      hyperspace: {
        ...prev.hyperspace,
        isLaneJump: isLane,
        routeWaypoints: waypoints,
        currentWaypoint: current,
      },
    })),

    // Navigation context
    setJumpReadiness: (canJump, blockReason, clearance) => set({
      canInitiateJump: canJump,
      jumpBlockReason: blockReason,
      gravityWellClearance: clearance,
    }),

    setFuelProjection: (sufficient, remaining) => set({
      fuelSufficient: sufficient,
      fuelAfterTrip: remaining,
    }),

    // Lifecycle
    arriveAtDestination: () => set({
      mode: 'idle',
      isInTransit: false,
      sublight: { ...initialSublight },
      hyperspace: {
        ...initialHyperspace,
        phase: 'cooldown',
        cooldownRemaining: 30, // Default cooldown
      },
    }),

    cancelTravel: () => set({
      mode: 'idle',
      isInTransit: false,
      sublight: { ...initialSublight },
      hyperspace: { ...initialHyperspace },
    }),

    reset: () => set({
      mode: 'idle',
      isInTransit: false,
      sublight: initialSublight,
      hyperspace: initialHyperspace,
      canInitiateJump: true,
      jumpBlockReason: null,
      gravityWellClearance: 0,
      fuelSufficient: true,
      fuelAfterTrip: 100,
    }),
  }))
);

// Selectors
export const selectTravelMode = (state: TravelState) => state.mode;
export const selectIsInTransit = (state: TravelState) => state.isInTransit;
export const selectHyperspacePhase = (state: TravelState) => state.hyperspace.phase;
export const selectCanJump = (state: TravelState) => state.canInitiateJump;
export const selectIsInHyperspace = (state: TravelState) => state.hyperspace.phase === 'transit';
