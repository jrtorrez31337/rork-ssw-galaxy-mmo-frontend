import { apiClient } from './client';
import {
  RefuelRequest,
  RefuelResponse,
  RepairRequest,
  RepairResponse,
  StationServiceErrorCode,
} from '@/types/station-services';

/**
 * Refuel ship at current docked station
 *
 * @param shipId - The ship to refuel
 * @param amount - Fuel units to purchase (0 = fill tank)
 * @returns RefuelResponse with updated fuel and credits
 */
export async function refuelShip(shipId: string, amount: number = 0) {
  const response = await apiClient.post<RefuelResponse>('/stations/refuel', {
    ship_id: shipId,
    amount,
  });
  return response;
}

/**
 * Repair ship hull and/or shield at current docked station
 *
 * @param shipId - The ship to repair
 * @param repairHull - Whether to repair hull damage
 * @param repairShield - Whether to repair shield damage
 * @returns RepairResponse with repair details and costs
 */
export async function repairShip(
  shipId: string,
  repairHull: boolean,
  repairShield: boolean
) {
  const response = await apiClient.post<RepairResponse>('/stations/repair', {
    ship_id: shipId,
    repair_hull: repairHull,
    repair_shield: repairShield,
  });
  return response;
}

/**
 * Convert station service error codes to user-friendly messages
 */
export function handleStationServiceError(
  errorCode: StationServiceErrorCode,
  customMessage?: string
): string {
  if (customMessage) return customMessage;

  switch (errorCode) {
    case 'AUTH_REQUIRED':
      return 'You must be logged in to use station services.';
    case 'SHIP_NOT_DOCKED':
      return 'You must dock at a station first.';
    case 'SERVICE_NOT_AVAILABLE':
      return "This station doesn't offer this service.";
    case 'INSUFFICIENT_CREDITS':
      return 'Not enough credits to complete this transaction.';
    case 'FUEL_FULL':
      return 'Your fuel tank is already full.';
    case 'SHIP_FULLY_REPAIRED':
      return 'Your ship is already at full health.';
    case 'SHIP_NOT_FOUND':
      return 'Ship not found.';
    case 'STATION_NOT_FOUND':
      return 'Station not found.';
    case 'PRICING_ERROR':
      return 'Service pricing unavailable. Please try again.';
    case 'VALIDATION_ERROR':
      return 'Invalid request. Please check your selections.';
    default:
      return 'An error occurred. Please try again.';
  }
}

export const stationServicesApi = {
  refuel: refuelShip,
  repair: repairShip,
  handleError: handleStationServiceError,
};
