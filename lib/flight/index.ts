/**
 * Flight System - Public API
 *
 * Per Cinematic Arcade Flight Model Doctrine
 */

export * from './metrics';

// Re-export types for convenience
export type {
  FlightState,
  FlightHandlingProfile,
  FlightInputCommand,
  FlightMetrics,
  ThrottleState,
  AttitudeState,
  AxisInput,
  AxisCouplingMode,
} from '@/types/flight';
