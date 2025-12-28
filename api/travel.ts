import { apiClient } from './client';
import type {
  TravelResponse,
  TravelStatusResponse,
  TravelCancelResponse,
  TravelErrorCode,
} from '@/types/travel';

/**
 * Initiate async travel to a target sector
 * Travel takes real time and completion is signaled via SSE events
 */
export async function startTravel(shipId: string, targetSector: string) {
  const response = await apiClient.post<TravelResponse>('/v1/actions/travel', {
    ship_id: shipId,
    target_sector: targetSector,
  });
  return response;
}

/**
 * Get the status of a travel operation by travel_id
 */
export async function getTravelStatus(travelId: string) {
  const response = await apiClient.get<TravelStatusResponse>(
    `/v1/travel/${travelId}`
  );
  return response;
}

/**
 * Get the active travel for a specific ship
 * Returns null-like response if ship is not traveling
 */
export async function getShipTravel(shipId: string) {
  try {
    const response = await apiClient.get<TravelStatusResponse>(
      `/v1/ships/${shipId}/travel`
    );
    return response;
  } catch (error: any) {
    // NOT_IN_TRANSIT is expected when ship isn't traveling
    if (error.code === 'NOT_IN_TRANSIT') {
      return null;
    }
    throw error;
  }
}

/**
 * Cancel an in-progress travel operation
 * Returns partial fuel refund (80% of remaining fuel portion)
 */
export async function cancelTravel(travelId: string) {
  const response = await apiClient.post<TravelCancelResponse>(
    `/v1/travel/${travelId}/cancel`
  );
  return response;
}

/**
 * Convert travel error codes to user-friendly messages
 */
export function handleTravelError(errorCode: TravelErrorCode): string {
  switch (errorCode) {
    case 'SHIP_DOCKED':
      return 'You must undock from the station before traveling.';
    case 'SHIP_IN_COMBAT':
      return 'Cannot travel while in combat!';
    case 'ALREADY_IN_TRANSIT':
      return 'Ship is already traveling. Cancel current travel first.';
    case 'JUMP_ON_COOLDOWN':
      return 'Jump drive is recharging. Please wait.';
    case 'INSUFFICIENT_FUEL':
      return 'Not enough fuel for this journey. Find a station to refuel.';
    case 'INVALID_SECTOR':
      return 'Invalid sector coordinates. Use format: x.y.z';
    case 'SHIP_NOT_FOUND':
      return 'Ship not found.';
    case 'TRAVEL_NOT_FOUND':
      return 'Travel operation not found or already completed.';
    case 'NOT_IN_TRANSIT':
      return 'Ship is not currently traveling.';
    default:
      return 'An error occurred during travel.';
  }
}

export const travelApi = {
  start: startTravel,
  getStatus: getTravelStatus,
  getShipTravel: getShipTravel,
  cancel: cancelTravel,
  handleError: handleTravelError,
};
