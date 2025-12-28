/**
 * Async Travel System Types
 *
 * Types for the time-based travel system where ships take real time
 * to travel between sectors.
 */

// Travel status states
export type TravelStatus = 'idle' | 'in_transit' | 'arriving';

// API Request/Response types
export interface TravelRequest {
  ship_id: string;
  target_sector: string;
}

export interface TravelResponse {
  travel_id: string;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  fuel_consumed: number;
  fuel_remaining: number;
  started_at: string;
  arrives_at: string;
  travel_time_seconds: number;
  status: TravelStatus;
  message?: string;
}

export interface TravelStatusResponse {
  travel_id: string;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  status: TravelStatus;
  started_at: string;
  arrives_at: string;
  completed_at: string | null;
  remaining_seconds: number;
  progress_percent: number;
  fuel_consumed: number;
}

export interface TravelCancelResponse {
  travel_id: string;
  ship_id: string;
  from_sector: string;
  fuel_refund: number;
  message: string;
}

export interface ActiveTravelResponse {
  travel: TravelStatusResponse | null;
}

// SSE Event payload types
export interface TravelStartedEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  started_at: number;
  arrives_at: number;
  travel_time_seconds: number;
  fuel_consumed: number;
}

export interface TravelCompletedEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  arrived_at: number;
  fuel_consumed: number;
}

export interface TravelCancelledEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  cancelled_at: number;
  fuel_refund: number;
}

export interface TravelInterruptedEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  interrupted_at: number;
  interrupted_by: string;
  reason: 'interdiction' | 'combat';
  drop_sector: string;
}

// Union type for all travel events
export type TravelEvent =
  | { type: 'travel_started'; payload: TravelStartedEvent }
  | { type: 'travel_completed'; payload: TravelCompletedEvent }
  | { type: 'travel_cancelled'; payload: TravelCancelledEvent }
  | { type: 'travel_interrupted'; payload: TravelInterruptedEvent };

// Error codes from the travel API
export type TravelErrorCode =
  | 'SHIP_DOCKED'
  | 'SHIP_IN_COMBAT'
  | 'ALREADY_IN_TRANSIT'
  | 'JUMP_ON_COOLDOWN'
  | 'INSUFFICIENT_FUEL'
  | 'INVALID_SECTOR'
  | 'SHIP_NOT_FOUND'
  | 'TRAVEL_NOT_FOUND'
  | 'NOT_IN_TRANSIT';

// Travel state for the store
export interface TravelState {
  activeTravel: TravelStatusResponse | null;
  isInTransit: boolean;
  remainingSeconds: number;
  progressPercent: number;
}
