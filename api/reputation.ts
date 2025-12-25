import { apiClient } from './client';
import {
  FactionReputation,
  PlayerReputations,
  ReputationHistory,
  ReputationTiers,
} from '@/types/api';

export interface GetReputationHistoryParams {
  faction_id?: string;
  limit?: number;
}

export const reputationApi = {
  // Get all faction reputations for a player
  getAllReputations: (playerId: string): Promise<PlayerReputations> =>
    apiClient.get<PlayerReputations>(`/v1/players/${playerId}/reputation`),

  // Get reputation with a specific faction
  getFactionReputation: (
    playerId: string,
    factionId: string
  ): Promise<FactionReputation> =>
    apiClient.get<FactionReputation>(
      `/v1/players/${playerId}/reputation/${factionId}`
    ),

  // Get reputation history
  getReputationHistory: (
    playerId: string,
    params?: GetReputationHistoryParams
  ): Promise<ReputationHistory> => {
    const queryParams = new URLSearchParams();
    if (params?.faction_id) {
      queryParams.append('faction_id', params.faction_id);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/v1/players/${playerId}/reputation/history${query ? `?${query}` : ''}`;
    return apiClient.get<ReputationHistory>(endpoint);
  },

  // Get reputation tier definitions
  getTiers: (): Promise<ReputationTiers> =>
    apiClient.get<ReputationTiers>('/v1/reputation/tiers'),
};
