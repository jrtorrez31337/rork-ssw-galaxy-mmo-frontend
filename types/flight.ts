/**
 * Flight System Types
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - Forward-vector locomotion (velocity = heading × throttle)
 * - Three-axis attitude control (pitch, roll, yaw)
 * - Smooth throttle interpolation
 * - Input response smoothing ("inertia")
 * - Optional axis coupling (roll → yaw)
 * - Ship identity via handling profiles
 *
 * These types are engine-agnostic and map cleanly to LCARS UI surfaces.
 */

/**
 * Axis coupling modes per doctrine §3
 * - none: Independent axis control
 * - roll_to_yaw: Roll input generates proportional yaw (reduced authority)
 */
export type AxisCouplingMode = 'none' | 'roll_to_yaw';

/**
 * FlightHandlingProfile - Defines ship flight feel
 *
 * Per doctrine §3: "These values define ship identity, progression, and balance."
 * Handling profiles are data-driven and tunable without UI changes.
 */
export interface FlightHandlingProfile {
  /** Profile identifier for display */
  id: string;

  /** Human-readable name (e.g., "Scout", "Fighter", "Trader") */
  name: string;

  /** Maximum forward speed in game units per second */
  maxSpeed: number;

  /** Acceleration rate - how quickly throttle changes affect speed */
  acceleration: number;

  /** Pitch rotation speed (degrees per second at full input) */
  pitchSpeed: number;

  /** Roll rotation speed (degrees per second at full input) */
  rollSpeed: number;

  /** Yaw rotation speed (degrees per second at full input) */
  yawSpeed: number;

  /**
   * Input response constant (0.0-1.0)
   * Lower values = more inertia/smoothing
   * Higher values = more responsive/twitchy
   * Per doctrine §4: "Input Response ('Inertia') gauge"
   */
  inputResponse: number;

  /** Axis coupling mode */
  axisCouplingMode: AxisCouplingMode;
}

/**
 * AxisInput - Current input state for a single axis
 * Normalized to -1.0 to 1.0 range
 */
export interface AxisInput {
  /** Raw input value from controls (-1.0 to 1.0) */
  raw: number;

  /** Smoothed value after input response applied (-1.0 to 1.0) */
  smoothed: number;
}

/**
 * AttitudeState - Current rotational state
 * Per doctrine P2: Three-axis attitude control
 */
export interface AttitudeState {
  /** Pitch axis (nose up/down) */
  pitch: AxisInput;

  /** Roll axis (banking left/right) */
  roll: AxisInput;

  /** Yaw axis (turning left/right) */
  yaw: AxisInput;
}

/**
 * ThrottleState - Current throttle/speed state
 * Per doctrine P3: Smooth throttle (no binary acceleration)
 */
export interface ThrottleState {
  /** Target throttle (0.0-1.0) - what the player is requesting */
  target: number;

  /** Current throttle (0.0-1.0) - smoothed value */
  current: number;

  /** Current actual speed in game units */
  speed: number;
}

/**
 * FlightState - Complete flight system state
 * This is the canonical state that UI components subscribe to.
 */
export interface FlightState {
  /** Active handling profile */
  profile: FlightHandlingProfile;

  /** Throttle and speed state */
  throttle: ThrottleState;

  /** Attitude control state */
  attitude: AttitudeState;

  /** Whether axis coupling is currently active */
  axisCouplingEnabled: boolean;

  /** Whether flight controls are currently locked (e.g., docked, in hyperspace) */
  controlsLocked: boolean;

  /** Reason for control lock, if any */
  controlsLockReason: string | null;
}

/**
 * FlightInputCommand - Input command from controls
 * Used to update flight state from UI input
 */
export interface FlightInputCommand {
  /** Throttle change (-1.0 to 1.0 for relative, or absolute 0.0-1.0) */
  throttle?: number;

  /** Pitch input (-1.0 to 1.0) */
  pitch?: number;

  /** Roll input (-1.0 to 1.0) */
  roll?: number;

  /** Yaw input (-1.0 to 1.0) */
  yaw?: number;

  /** Toggle axis coupling */
  toggleAxisCoupling?: boolean;
}

/**
 * FlightMetrics - Derived values for UI display
 * Pure functions compute these from FlightState
 */
export interface FlightMetrics {
  /** Speed as percentage of max (0.0-1.0) */
  speedPercent: number;

  /** Throttle as percentage (0.0-1.0) */
  throttlePercent: number;

  /** Pitch activity level (0.0-1.0, absolute value of smoothed) */
  pitchActivity: number;

  /** Roll activity level (0.0-1.0) */
  rollActivity: number;

  /** Yaw activity level (0.0-1.0) */
  yawActivity: number;

  /** Overall attitude activity (average of all axes) */
  attitudeActivity: number;

  /** Input response as display value (0.0-1.0) */
  inertiaLevel: number;

  /** Human-readable speed string */
  speedDisplay: string;

  /** Human-readable throttle string */
  throttleDisplay: string;
}
