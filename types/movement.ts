import { Vector3 } from './api';
import { StationServicePricing } from './station-services';

// ==================== STATION TYPES ====================

export type StationType = 'trade' | 'military' | 'research' | 'mining';
export type StationService = 'market' | 'refuel' | 'repair' | 'missions';

export interface Station {
  id: string;
  name: string;
  location_sector: string;
  station_type: StationType;
  position: Vector3;
  faction_id?: string;
  services: StationService[];
  docking_capacity: number;
  docked_ships_count: number;
  created_at: string;
  service_pricing?: StationServicePricing[]; // Phase 1: Service pricing info
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface JumpRequest {
  ship_id: string;
  target_sector: string;
}

export interface JumpResponse {
  success: boolean;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  fuel_consumed: number;
  fuel_remaining: number;
  position: [number, number, number];
  message?: string;
}

export interface DockRequest {
  ship_id: string;
  station_id: string;
}

export interface DockResponse {
  success: boolean;
  ship_id: string;
  station: Station;
  message?: string;
}

export interface UndockRequest {
  ship_id: string;
}

export interface UndockResponse {
  success: boolean;
  ship_id: string;
  message?: string;
}

export interface StationsInSectorResponse {
  stations: Station[];
}

// ==================== ERROR CODES ====================

export type MovementErrorCode =
  | 'INSUFFICIENT_FUEL'
  | 'SHIP_DOCKED'
  | 'SHIP_IN_COMBAT'
  | 'JUMP_ON_COOLDOWN'
  | 'INVALID_SECTOR'
  | 'STATION_NOT_FOUND'
  | 'NOT_IN_RANGE'
  | 'STATION_FULL'
  | 'SHIP_NOT_DOCKED'
  | 'SHIP_NOT_FOUND'
  | 'VALIDATION_ERROR';

export interface MovementError {
  error: {
    code: MovementErrorCode;
    message: string;
  };
}

// ==================== SSE EVENT TYPES ====================

export interface ShipJumpedEvent {
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  fuel_consumed: number;
  fuel_remaining: number;
  position: [number, number, number];
}

export interface ShipDockedEvent {
  ship_id: string;
  player_id: string;
  station_id: string;
  station_name: string;
  sector: string;
}

export interface ShipUndockedEvent {
  ship_id: string;
  player_id: string;
  station_id: string;
  station_name: string;
  sector: string;
}

export type MovementEvent =
  | { type: 'SHIP_JUMPED'; data: ShipJumpedEvent }
  | { type: 'SHIP_DOCKED'; data: ShipDockedEvent }
  | { type: 'SHIP_UNDOCKED'; data: ShipUndockedEvent };
