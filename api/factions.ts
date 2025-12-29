import { apiClient } from './client';
import type {
  Faction,
  FactionDetails,
  FactionMembersResponse,
  FactionRelations,
  FactionTerritory,
  SectorInfluence,
  GalaxyInfluenceMap,
} from '@/types/factions';

export interface GetFactionMembersParams {
  limit?: number;
  offset?: number;
}

export const factionsApi = {
  /**
   * List all factions in the galaxy
   * GET /v1/factions
   */
  listFactions: async (): Promise<Faction[]> => {
    const response = await apiClient.get<{ data: Faction[] }>('/v1/factions');
    return response.data;
  },

  /**
   * Get detailed information about a specific faction
   * GET /v1/factions/{faction_id}
   */
  getFaction: async (factionId: string): Promise<FactionDetails> => {
    const response = await apiClient.get<{ data: FactionDetails }>(
      `/v1/factions/${factionId}`
    );
    return response.data;
  },

  /**
   * Get list of players in a faction
   * GET /v1/factions/{faction_id}/members
   */
  getFactionMembers: async (
    factionId: string,
    params?: GetFactionMembersParams
  ): Promise<FactionMembersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/v1/factions/${factionId}/members${query ? `?${query}` : ''}`;
    const response = await apiClient.get<{ data: FactionMembersResponse }>(endpoint);
    return response.data;
  },

  /**
   * Get diplomatic relations between this faction and others
   * GET /v1/factions/{faction_id}/relations
   */
  getFactionRelations: async (factionId: string): Promise<FactionRelations> => {
    const response = await apiClient.get<{ data: FactionRelations }>(
      `/v1/factions/${factionId}/relations`
    );
    return response.data;
  },

  /**
   * Get territory controlled by a faction
   * GET /v1/factions/{faction_id}/territory
   */
  getFactionTerritory: async (factionId: string): Promise<FactionTerritory> => {
    const response = await apiClient.get<{ data: FactionTerritory }>(
      `/v1/factions/${factionId}/territory`
    );
    return response.data;
  },

  /**
   * Get faction influence in a specific sector
   * GET /v1/sectors/{sector_id}/influence
   */
  getSectorInfluence: async (sectorId: string): Promise<SectorInfluence> => {
    const response = await apiClient.get<{ data: SectorInfluence }>(
      `/v1/sectors/${sectorId}/influence`
    );
    return response.data;
  },

  /**
   * Get galaxy-wide influence map
   * GET /v1/galaxy/influence-map
   */
  getGalaxyInfluenceMap: async (): Promise<GalaxyInfluenceMap> => {
    const response = await apiClient.get<{ data: GalaxyInfluenceMap }>(
      '/v1/galaxy/influence-map'
    );
    return response.data;
  },
};
