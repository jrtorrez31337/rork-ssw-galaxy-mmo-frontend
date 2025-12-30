import { apiClient } from './client';

/**
 * Sublight Movement API
 *
 * Handles in-sector ship movement (sublight/impulse speed).
 * Position updates are sent periodically and server validates/authorizes.
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PositionUpdateRequest {
  ship_id: string;
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  timestamp: number; // Client timestamp for reconciliation
}

export interface PositionUpdateResponse {
  success: boolean;
  server_position: Vector3;
  server_velocity: Vector3;
  server_rotation: Quaternion;
  server_timestamp: number;
  correction_applied: boolean;
}

export interface MoveErrorCode {
  code: 'SHIP_DOCKED' | 'SHIP_IN_HYPERSPACE' | 'SHIP_IN_COMBAT' | 'OUT_OF_BOUNDS' | 'SPEED_EXCEEDED' | 'SHIP_NOT_FOUND' | 'VALIDATION_ERROR';
  message: string;
}

/**
 * Submit position update to server
 * Server validates and returns authoritative position
 */
export async function updatePosition(request: PositionUpdateRequest): Promise<PositionUpdateResponse> {
  const response = await apiClient.post<PositionUpdateResponse>('/actions/move', request);
  return response;
}

/**
 * Get current server-authoritative position for a ship
 */
export async function getPosition(shipId: string): Promise<{
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  timestamp: number;
}> {
  const response = await apiClient.get<{
    position: Vector3;
    velocity: Vector3;
    rotation: Quaternion;
    timestamp: number;
  }>(`/ships/${shipId}/position`);
  return response;
}

/**
 * Convert sublight error codes to user-friendly messages
 */
export function handleSublightError(error: MoveErrorCode): string {
  switch (error.code) {
    case 'SHIP_DOCKED':
      return 'Undock from station before moving.';
    case 'SHIP_IN_HYPERSPACE':
      return 'Cannot move while in hyperspace transit.';
    case 'SHIP_IN_COMBAT':
      return 'Movement limited during combat.';
    case 'OUT_OF_BOUNDS':
      return 'Position outside sector bounds.';
    case 'SPEED_EXCEEDED':
      return 'Speed exceeds ship capability. Position corrected.';
    case 'SHIP_NOT_FOUND':
      return 'Ship not found.';
    case 'VALIDATION_ERROR':
      return 'Invalid position data.';
    default:
      return error.message || 'Movement error occurred.';
  }
}

export const sublightApi = {
  updatePosition,
  getPosition,
  handleError: handleSublightError,
};
