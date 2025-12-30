import { apiClient } from './client';
import type { NPCEntity } from '@/types/combat';

/**
 * NPC API client for NPC operations
 * Per 03B-WORLDSIM.apib: NPCs are fetched via sector state or entities endpoints
 */

// Response from /v1/sectors/{sector_id}/state (line 90-143 of 03B-WORLDSIM.apib)
interface SectorStateResponse {
  sector_id: string;
  timestamp: string;
  player_ships: Array<{
    ship_id: string;
    owner_id: string;
    ship_name: string;
    ship_type: string;
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    is_docked: boolean;
  }>;
  npcs: Array<{
    npc_id: string;
    npc_type: string;
    faction: string;
    position: { x: number; y: number; z: number };
    threat_rating: number;
  }>;
  resource_nodes: number;
  active_combats: number;
}

export interface NPCListResponse {
  sector: string;
  npcs: NPCEntity[];
}

// Response from /v1/sectors/{sector_id}/npcs
interface NPCsResponse {
  sector_id: string;
  count: number;
  npcs: Array<{
    npc_id: string;
    ship_id: string;
    npc_type: string;
    behavior: string;
    faction: string;
    faction_id?: string;
    position: number[];
    threat_rating: number;
  }>;
}

export const npcApi = {
  /**
   * Get NPCs in a sector
   * Uses GET /v1/sectors/{sector_id}/npcs
   *
   * @param sector - Sector coordinates in "x.y.z" format
   * @returns List of NPC entities in the sector
   */
  getNPCsInSector: async (sector: string): Promise<NPCListResponse> => {
    try {
      const response = await apiClient.get<{ data: NPCsResponse }>(
        `/sectors/${sector}/npcs`
      );

      // Transform backend NPC format to frontend NPCEntity format
      const npcs: NPCEntity[] = (response.data?.npcs || []).map((npc) => ({
        entity_id: npc.npc_id,
        entity_type: 'npc' as const,
        name: `${npc.npc_type}-${npc.npc_id.substring(0, 8)}`,
        npc_type: npc.npc_type as NPCEntity['npc_type'],
        faction: npc.faction,
        position: npc.position as [number, number, number],
        velocity: [0, 0, 0] as [number, number, number],
        hull: 100,
        hull_max: 100,
        shield: 50,
        shield_max: 50,
      }));

      return { sector, npcs };
    } catch (error: any) {
      // If NPC endpoint fails, return empty list
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log(`[NPC API] No NPCs in sector ${sector}`);
        return { sector, npcs: [] };
      }
      throw error;
    }
  },

  /**
   * Get specific NPC details
   * Note: No dedicated NPC endpoint exists in backend API
   * This would need to use sector entities endpoint with filter
   */
  getNPC: async (npcId: string): Promise<NPCEntity | null> => {
    // Backend doesn't have a dedicated NPC detail endpoint
    // Return null for now - combat system uses NPC data from initiate response
    console.warn('[NPC API] getNPC not implemented - backend has no /npcs/{id} endpoint');
    return null;
  },
};
