import { apiClient } from './client';
import {
  JumpRequest,
  JumpResponse,
  DockRequest,
  DockResponse,
  UndockRequest,
  UndockResponse,
  StationsInSectorResponse,
  MovementErrorCode,
} from '@/types/movement';

/**
 * Execute a hyperspace jump to a target sector
 */
export async function jumpToSector(shipId: string, targetSector: string) {
  const response = await apiClient.post<JumpResponse>('/actions/jump', {
    ship_id: shipId,
    target_sector: targetSector,
  });
  return response;
}

/**
 * Dock at a space station
 */
export async function dockAtStation(shipId: string, stationId: string) {
  const response = await apiClient.post<DockResponse>('/actions/dock', {
    ship_id: shipId,
    station_id: stationId,
  });
  return response;
}

/**
 * Undock from current station
 */
export async function undockFromStation(shipId: string) {
  const response = await apiClient.post<UndockResponse>('/actions/undock', {
    ship_id: shipId,
  });
  return response;
}

/**
 * Get list of stations in a sector
 */
export async function getStationsInSector(sector: string) {
  const response = await apiClient.get<StationsInSectorResponse>(
    `/stations?sector=${sector}`
  );
  return response;
}

/**
 * Convert movement error codes to user-friendly messages
 */
export function handleMovementError(errorCode: MovementErrorCode): string {
  switch (errorCode) {
    case 'INSUFFICIENT_FUEL':
      return 'Not enough fuel for this jump. Find a station to refuel.';
    case 'SHIP_DOCKED':
      return 'You must undock from the station before jumping.';
    case 'SHIP_IN_COMBAT':
      return 'Cannot jump or dock while in combat!';
    case 'JUMP_ON_COOLDOWN':
      return 'Jump drive is recharging. Wait 10 seconds.';
    case 'INVALID_SECTOR':
      return 'Invalid sector coordinates. Use format: x.y.z';
    case 'STATION_NOT_FOUND':
      return 'Station not found in this sector.';
    case 'NOT_IN_RANGE':
      return 'Too far from station. Must be within 5000 units.';
    case 'STATION_FULL':
      return 'Station is at maximum capacity. Try another station.';
    case 'SHIP_NOT_DOCKED':
      return 'Ship is not currently docked at a station.';
    case 'SHIP_NOT_FOUND':
      return 'Ship not found.';
    case 'VALIDATION_ERROR':
      return 'Invalid request parameters.';
    default:
      return 'An error occurred';
  }
}

export const movementApi = {
  jump: jumpToSector,
  dock: dockAtStation,
  undock: undockFromStation,
  getStations: getStationsInSector,
  handleError: handleMovementError,
};
