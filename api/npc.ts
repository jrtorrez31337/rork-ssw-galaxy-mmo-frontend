import { apiClient } from './client';
import type { NPCEntity } from '@/types/combat';

/**
 * NPC API client for NPC operations
 * Phase 5: NPC Ships Integration
 */

export interface NPCListResponse {
  sector: string;
  npcs: NPCEntity[];
}

export const npcApi = {
  /**
   * Get NPCs in a sector
   * Returns AI-controlled ships (pirates, traders, patrols)
   *
   * @param sector - Sector coordinates in "x,y,z" format
   * @param npcType - Optional filter by NPC type
   * @returns List of NPC entities in the sector
   */
  getNPCsInSector: async (
    sector: string,
    npcType?: string
  ): Promise<NPCListResponse> => {
    const params = new URLSearchParams({ sector });
    if (npcType) {
      params.set('npc_type', npcType);
    }

    return apiClient.get<NPCListResponse>(`/npcs?${params.toString()}`);
  },

  /**
   * Get specific NPC details
   *
   * @param npcId - NPC entity ID
   * @returns NPC entity details
   */
  getNPC: async (npcId: string): Promise<NPCEntity> => {
    return apiClient.get<NPCEntity>(`/npcs/${npcId}`);
  },
};
