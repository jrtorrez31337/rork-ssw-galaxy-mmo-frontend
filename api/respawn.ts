import { apiClient } from './client';

export interface RespawnLocation {
  sector: string;
  station_id: string | null;
  station_name: string | null;
  respawn_type: 'faction_station' | 'home_sector';
  distance_from_death: number;
}

export interface RespawnResult {
  ship_id: string;
  respawn_sector: string;
  station_id: string | null;
  hull_percent: number;
  shield_percent: number;
  fuel_percent: number;
}

export interface NearestStation {
  station_id: string;
  station_name: string;
  sector: string;
  distance: number;
  faction_id: string;
  faction_name: string;
}

export const respawnApi = {
  /**
   * Get the respawn location for a player based on their faction and death location
   */
  getRespawnLocation: (playerId: string) =>
    apiClient.get<RespawnLocation>(`/respawn/location?player_id=${playerId}`),

  /**
   * Execute respawn - move ship to respawn location and reset stats
   */
  executeRespawn: (playerId: string) =>
    apiClient.post<RespawnResult>('/respawn/execute', { player_id: playerId }),

  /**
   * Get nearest stations to a sector, optionally filtered by faction
   */
  getNearestStations: (sector: string, factionId?: string, limit: number = 5) => {
    let endpoint = `/stations/nearest?sector=${encodeURIComponent(sector)}&limit=${limit}`;
    if (factionId) {
      endpoint += `&faction_id=${factionId}`;
    }
    return apiClient.get<NearestStation[]>(endpoint);
  },
};
