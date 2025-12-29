import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  FlightState,
  FlightHandlingProfile,
  FlightInputCommand,
  ThrottleState,
  AttitudeState,
  AxisInput,
  AxisCouplingMode,
} from '@/types/flight';
import {
  smoothAxisInput,
  smoothThrottle,
  calculateSpeed,
  applyAxisCoupling,
  clamp,
} from '@/lib/flight/metrics';

/**
 * Flight Store - Cinematic Arcade Flight State Management
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - Forward-vector locomotion
 * - Three-axis attitude control
 * - Smooth throttle interpolation
 * - Input response smoothing ("inertia")
 * - Optional axis coupling
 * - Ship identity via handling profiles
 *
 * This store is the single source of truth for flight state.
 * UI components subscribe to slices they need.
 */

// Default handling profile for initial state
const DEFAULT_PROFILE: FlightHandlingProfile = {
  id: 'default',
  name: 'Standard',
  maxSpeed: 100,
  acceleration: 0.5, // Takes ~2 seconds to reach max throttle
  pitchSpeed: 45, // Degrees per second
  rollSpeed: 60,
  yawSpeed: 30,
  inputResponse: 0.15, // Moderate inertia
  axisCouplingMode: 'none',
};

// Default axis input state
const DEFAULT_AXIS: AxisInput = {
  raw: 0,
  smoothed: 0,
};

// Default throttle state
const DEFAULT_THROTTLE: ThrottleState = {
  target: 0,
  current: 0,
  speed: 0,
};

// Default attitude state
const DEFAULT_ATTITUDE: AttitudeState = {
  pitch: { ...DEFAULT_AXIS },
  roll: { ...DEFAULT_AXIS },
  yaw: { ...DEFAULT_AXIS },
};

// Initial flight state
const INITIAL_STATE: FlightState = {
  profile: DEFAULT_PROFILE,
  throttle: DEFAULT_THROTTLE,
  attitude: DEFAULT_ATTITUDE,
  axisCouplingEnabled: false,
  controlsLocked: false,
  controlsLockReason: null,
};

interface FlightStoreActions {
  // Profile management
  setProfile: (profile: FlightHandlingProfile) => void;
  setProfileById: (profileId: string) => void;

  // Input handling
  processInput: (command: FlightInputCommand, deltaTime: number) => void;
  setThrottle: (value: number) => void;
  setPitch: (value: number) => void;
  setRoll: (value: number) => void;
  setYaw: (value: number) => void;

  // Axis coupling
  toggleAxisCoupling: () => void;
  setAxisCoupling: (enabled: boolean) => void;

  // Control locking
  lockControls: (reason: string) => void;
  unlockControls: () => void;

  // State updates (for simulation tick)
  tick: (deltaTime: number) => void;

  // Reset
  reset: () => void;
}

type FlightStore = FlightState & FlightStoreActions;

// Profile registry - ships can register their profiles here
const profileRegistry = new Map<string, FlightHandlingProfile>();
profileRegistry.set('default', DEFAULT_PROFILE);

// Register default ship profiles per ship types
const SHIP_PROFILES: FlightHandlingProfile[] = [
  {
    id: 'scout',
    name: 'Scout',
    maxSpeed: 150,
    acceleration: 0.8,
    pitchSpeed: 60,
    rollSpeed: 90,
    yawSpeed: 45,
    inputResponse: 0.25, // More responsive
    axisCouplingMode: 'none',
  },
  {
    id: 'fighter',
    name: 'Fighter',
    maxSpeed: 120,
    acceleration: 0.7,
    pitchSpeed: 75,
    rollSpeed: 100,
    yawSpeed: 50,
    inputResponse: 0.3, // Very responsive
    axisCouplingMode: 'roll_to_yaw',
  },
  {
    id: 'trader',
    name: 'Trader',
    maxSpeed: 80,
    acceleration: 0.3,
    pitchSpeed: 30,
    rollSpeed: 40,
    yawSpeed: 25,
    inputResponse: 0.1, // Sluggish, heavy
    axisCouplingMode: 'none',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    maxSpeed: 100,
    acceleration: 0.5,
    pitchSpeed: 45,
    rollSpeed: 60,
    yawSpeed: 35,
    inputResponse: 0.2, // Balanced
    axisCouplingMode: 'none',
  },
];

// Register all ship profiles
SHIP_PROFILES.forEach((p) => profileRegistry.set(p.id, p));

/**
 * Register a custom handling profile
 */
export function registerProfile(profile: FlightHandlingProfile): void {
  profileRegistry.set(profile.id, profile);
}

/**
 * Get a profile by ID
 */
export function getProfile(id: string): FlightHandlingProfile | undefined {
  return profileRegistry.get(id);
}

/**
 * Get all registered profiles
 */
export function getAllProfiles(): FlightHandlingProfile[] {
  return Array.from(profileRegistry.values());
}

export const useFlightStore = create<FlightStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    ...INITIAL_STATE,

    // Set complete profile
    setProfile: (profile) => {
      set({ profile });
    },

    // Set profile by ID from registry
    setProfileById: (profileId) => {
      const profile = profileRegistry.get(profileId);
      if (profile) {
        set({ profile });
      } else {
        console.warn(`[FlightStore] Profile not found: ${profileId}`);
      }
    },

    // Process input command with smoothing
    processInput: (command, deltaTime) => {
      const state = get();

      if (state.controlsLocked) {
        return; // Ignore input when controls are locked
      }

      const { profile, attitude, throttle, axisCouplingEnabled } = state;

      // Process throttle
      let newThrottle = throttle;
      if (command.throttle !== undefined) {
        newThrottle = {
          ...throttle,
          target: clamp(command.throttle, 0, 1),
        };
      }

      // Process attitude inputs
      let newAttitude = { ...attitude };

      if (command.pitch !== undefined) {
        newAttitude.pitch = smoothAxisInput(
          attitude.pitch,
          command.pitch,
          profile.inputResponse,
          deltaTime
        );
      }

      if (command.roll !== undefined) {
        newAttitude.roll = smoothAxisInput(
          attitude.roll,
          command.roll,
          profile.inputResponse,
          deltaTime
        );
      }

      // Apply yaw with optional axis coupling
      if (command.yaw !== undefined || command.roll !== undefined) {
        const effectiveYaw = applyAxisCoupling(
          command.roll ?? attitude.roll.raw,
          command.yaw ?? attitude.yaw.raw,
          axisCouplingEnabled,
          profile
        );
        newAttitude.yaw = smoothAxisInput(
          attitude.yaw,
          effectiveYaw,
          profile.inputResponse,
          deltaTime
        );
      }

      // Handle axis coupling toggle
      let newCoupling = axisCouplingEnabled;
      if (command.toggleAxisCoupling) {
        newCoupling = !axisCouplingEnabled;
      }

      set({
        throttle: newThrottle,
        attitude: newAttitude,
        axisCouplingEnabled: newCoupling,
      });
    },

    // Direct throttle set
    setThrottle: (value) => {
      const state = get();
      if (state.controlsLocked) return;
      set({
        throttle: {
          ...state.throttle,
          target: clamp(value, 0, 1),
        },
      });
    },

    // Direct axis setters
    setPitch: (value) => {
      const state = get();
      if (state.controlsLocked) return;
      set({
        attitude: {
          ...state.attitude,
          pitch: { ...state.attitude.pitch, raw: clamp(value, -1, 1) },
        },
      });
    },

    setRoll: (value) => {
      const state = get();
      if (state.controlsLocked) return;
      set({
        attitude: {
          ...state.attitude,
          roll: { ...state.attitude.roll, raw: clamp(value, -1, 1) },
        },
      });
    },

    setYaw: (value) => {
      const state = get();
      if (state.controlsLocked) return;
      set({
        attitude: {
          ...state.attitude,
          yaw: { ...state.attitude.yaw, raw: clamp(value, -1, 1) },
        },
      });
    },

    // Axis coupling
    toggleAxisCoupling: () => {
      const state = get();
      // Only allow toggle if profile supports it
      if (state.profile.axisCouplingMode === 'none') {
        return; // Profile doesn't support coupling
      }
      set({ axisCouplingEnabled: !state.axisCouplingEnabled });
    },

    setAxisCoupling: (enabled) => {
      const state = get();
      if (state.profile.axisCouplingMode === 'none') {
        set({ axisCouplingEnabled: false });
        return;
      }
      set({ axisCouplingEnabled: enabled });
    },

    // Control locking
    lockControls: (reason) => {
      set({
        controlsLocked: true,
        controlsLockReason: reason,
      });
    },

    unlockControls: () => {
      set({
        controlsLocked: false,
        controlsLockReason: null,
      });
    },

    // Simulation tick - update smoothed values and speed
    tick: (deltaTime) => {
      const state = get();
      const { profile, throttle, attitude } = state;

      // Smooth throttle
      const smoothedThrottle = smoothThrottle(
        throttle.current,
        throttle.target,
        profile.acceleration,
        deltaTime
      );

      // Calculate speed based on throttle
      const newSpeed = calculateSpeed(
        throttle.speed,
        smoothedThrottle,
        profile,
        deltaTime
      );

      // Decay attitude inputs toward zero when no input
      const decayedAttitude: AttitudeState = {
        pitch: smoothAxisInput(
          attitude.pitch,
          attitude.pitch.raw,
          profile.inputResponse,
          deltaTime
        ),
        roll: smoothAxisInput(
          attitude.roll,
          attitude.roll.raw,
          profile.inputResponse,
          deltaTime
        ),
        yaw: smoothAxisInput(
          attitude.yaw,
          attitude.yaw.raw,
          profile.inputResponse,
          deltaTime
        ),
      };

      set({
        throttle: {
          ...throttle,
          current: smoothedThrottle,
          speed: newSpeed,
        },
        attitude: decayedAttitude,
      });
    },

    // Reset to initial state
    reset: () => {
      set(INITIAL_STATE);
    },
  }))
);

// Selectors for optimized subscriptions
export const selectThrottle = (state: FlightStore) => state.throttle;
export const selectAttitude = (state: FlightStore) => state.attitude;
export const selectProfile = (state: FlightStore) => state.profile;
export const selectSpeed = (state: FlightStore) => state.throttle.speed;
export const selectControlsLocked = (state: FlightStore) => state.controlsLocked;
export const selectAxisCoupling = (state: FlightStore) => state.axisCouplingEnabled;
