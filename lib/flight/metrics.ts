/**
 * Flight Metrics - Pure Functions
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - Derived metrics as pure functions
 * - Values map cleanly to LCARS UI surfaces
 * - No engine-specific assumptions
 */

import type {
  FlightState,
  FlightMetrics,
  FlightHandlingProfile,
  AxisInput,
} from '@/types/flight';

/**
 * Compute all derived flight metrics from current state
 * Pure function - no side effects
 */
export function computeFlightMetrics(state: FlightState): FlightMetrics {
  const { throttle, attitude, profile } = state;

  // Speed as percentage of max
  const speedPercent = profile.maxSpeed > 0
    ? Math.min(1, throttle.speed / profile.maxSpeed)
    : 0;

  // Activity levels (absolute value of smoothed input, 0-1)
  const pitchActivity = Math.abs(attitude.pitch.smoothed);
  const rollActivity = Math.abs(attitude.roll.smoothed);
  const yawActivity = Math.abs(attitude.yaw.smoothed);

  // Overall attitude activity (average)
  const attitudeActivity = (pitchActivity + rollActivity + yawActivity) / 3;

  // Inertia level is inverse of input response
  // Lower inputResponse = more inertia = higher inertiaLevel display
  const inertiaLevel = 1 - profile.inputResponse;

  return {
    speedPercent,
    throttlePercent: throttle.current,
    pitchActivity,
    rollActivity,
    yawActivity,
    attitudeActivity,
    inertiaLevel,
    speedDisplay: formatSpeed(throttle.speed),
    throttleDisplay: formatThrottle(throttle.current),
  };
}

/**
 * Format speed for display
 * Uses game units - adjust format as needed
 */
export function formatSpeed(speed: number): string {
  if (speed < 0.01) return '0.00';
  if (speed < 10) return speed.toFixed(2);
  if (speed < 100) return speed.toFixed(1);
  return Math.round(speed).toString();
}

/**
 * Format throttle for display as percentage
 */
export function formatThrottle(throttle: number): string {
  const percent = Math.round(throttle * 100);
  return `${percent}%`;
}

/**
 * Lerp (linear interpolation) helper
 * Used for smooth input/throttle transitions
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * Math.min(1, Math.max(0, factor));
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Apply input response smoothing to an axis input
 * Pure function - returns new AxisInput
 */
export function smoothAxisInput(
  current: AxisInput,
  rawInput: number,
  inputResponse: number,
  deltaTime: number
): AxisInput {
  const clampedRaw = clamp(rawInput, -1, 1);
  // Smoothing factor scales with inputResponse and deltaTime
  // Higher inputResponse = faster response
  const smoothingFactor = inputResponse * Math.min(1, deltaTime * 10);
  const smoothed = lerp(current.smoothed, clampedRaw, smoothingFactor);

  return {
    raw: clampedRaw,
    smoothed: clamp(smoothed, -1, 1),
  };
}

/**
 * Apply throttle smoothing
 * Per doctrine P3: Smooth throttle (no binary acceleration)
 */
export function smoothThrottle(
  currentThrottle: number,
  targetThrottle: number,
  acceleration: number,
  deltaTime: number
): number {
  const target = clamp(targetThrottle, 0, 1);
  // Throttle changes at acceleration rate
  const maxChange = acceleration * deltaTime;
  const diff = target - currentThrottle;

  if (Math.abs(diff) <= maxChange) {
    return target;
  }

  return currentThrottle + Math.sign(diff) * maxChange;
}

/**
 * Calculate current speed from throttle and profile
 * Per doctrine P1: Velocity = heading × throttle
 */
export function calculateSpeed(
  currentSpeed: number,
  currentThrottle: number,
  profile: FlightHandlingProfile,
  deltaTime: number
): number {
  const targetSpeed = currentThrottle * profile.maxSpeed;
  // Speed approaches target based on acceleration
  const maxChange = profile.acceleration * profile.maxSpeed * deltaTime;
  const diff = targetSpeed - currentSpeed;

  if (Math.abs(diff) <= maxChange) {
    return targetSpeed;
  }

  return currentSpeed + Math.sign(diff) * maxChange;
}

/**
 * Apply axis coupling (roll → yaw)
 * Per doctrine P5: Optional axis coupling mode
 * Returns modified yaw input based on roll
 */
export function applyAxisCoupling(
  rollInput: number,
  yawInput: number,
  couplingEnabled: boolean,
  profile: FlightHandlingProfile
): number {
  if (!couplingEnabled || profile.axisCouplingMode !== 'roll_to_yaw') {
    return yawInput;
  }

  // Roll contributes to yaw with reduced authority (50%)
  const coupledYaw = rollInput * 0.5;

  // Add coupled yaw to direct yaw input, clamped
  return clamp(yawInput + coupledYaw, -1, 1);
}

/**
 * Get attitude activity color based on level
 * Per LCARS UI doctrine color semantics
 */
export function getActivityColor(activity: number): string {
  if (activity < 0.2) return '#666680'; // Muted - idle
  if (activity < 0.5) return '#99CCFF'; // Sky - low activity
  if (activity < 0.8) return '#9999FF'; // Navigation blue - active
  return '#FF9900'; // Orange - high activity
}

/**
 * Get throttle color based on level
 */
export function getThrottleColor(throttle: number): string {
  if (throttle < 0.1) return '#666680'; // Muted - idle
  if (throttle < 0.5) return '#99CC99'; // Green - cruise
  if (throttle < 0.8) return '#FFCC00'; // Gold - high
  return '#FF9900'; // Orange - max
}

/**
 * Get speed status description
 */
export function getSpeedStatus(speedPercent: number): string {
  if (speedPercent < 0.01) return 'STATION KEEPING';
  if (speedPercent < 0.25) return 'MANEUVERING';
  if (speedPercent < 0.5) return 'CRUISE';
  if (speedPercent < 0.75) return 'FLANK';
  return 'MAXIMUM';
}
