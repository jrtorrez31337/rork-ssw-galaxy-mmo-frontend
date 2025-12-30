import { apiClient } from './client';
import type { Station } from '@/types/movement';

/**
 * Ship in sector (from /sectors/{id}/ships endpoint)
 */
export interface SectorShip {
  id: string;
  name: string;
  owner_id: string;
  ship_type: string;
  location_sector: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  is_npc: boolean;
  faction_id?: string;
}

/**
 * Response from GET /sectors/{sector_id}/ships
 * Note: apiClient unwraps the outer { success, data } wrapper
 */
export interface ShipsInSectorResponse {
  sector: string;
  ships: SectorShip[];
  count: number;
}

/**
 * Response from GET /stations?sector=X.Y.Z
 * Note: apiClient unwraps the outer { success, data } wrapper
 */
export interface StationsInSectorResponse {
  sector: string;
  stations: Station[];
  count: number;
}

/**
 * Response from GET /sectors/{sector_id}/all-entities
 * Note: apiClient unwraps the outer { success, data } wrapper
 */
export interface AllEntitiesResponse {
  sector: string;
  stations: Station[];
  station_count: number;
  ships: SectorShip[];
  ship_count: number;
}

/**
 * Get all ships in a sector
 * @param sector - Sector coordinates (e.g. "0.0.0")
 * @param viewerProfileId - Optional profile ID to update activity timestamp
 */
export async function getShipsInSector(sector: string, viewerProfileId?: string): Promise<ShipsInSectorResponse> {
  const params = viewerProfileId ? `?viewer=${viewerProfileId}` : '';
  const response = await apiClient.get<ShipsInSectorResponse>(
    `/sectors/${sector}/ships${params}`
  );
  return response;
}

/**
 * Get all stations in a sector
 */
export async function getStationsInSector(sector: string): Promise<StationsInSectorResponse> {
  const response = await apiClient.get<StationsInSectorResponse>(
    `/stations?sector=${sector}`
  );
  return response;
}

/**
 * Get all entities (stations + ships) in a sector
 */
export async function getAllEntitiesInSector(sector: string): Promise<AllEntitiesResponse> {
  const response = await apiClient.get<AllEntitiesResponse>(
    `/sectors/${sector}/all-entities`
  );
  return response;
}

export const sectorEntitiesApi = {
  getShips: getShipsInSector,
  getStations: getStationsInSector,
  getAllEntities: getAllEntitiesInSector,
};
