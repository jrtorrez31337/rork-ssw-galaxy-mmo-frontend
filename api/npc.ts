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

export const npcApi = {
  /**
   * Get NPCs in a sector
   * Uses GET /v1/sectors/{sector_id}/state per 03B-WORLDSIM.apib (line 90)
   *
   * @param sector - Sector coordinates in "x,y,z" format
   * @returns List of NPC entities in the sector
   */
  getNPCsInSector: async (sector: string): Promise<NPCListResponse> => {
    try {
      const response = await apiClient.get<{ data: SectorStateResponse }>(
        `/sectors/${sector}/state`
      );

      // Transform backend NPC format to frontend NPCEntity format
      const npcs: NPCEntity[] = (response.data?.npcs || []).map((npc) => ({
        entity_id: npc.npc_id,
        entity_type: 'npc' as const,
        name: `${npc.npc_type}-${npc.npc_id.substring(0, 8)}`,
        npc_type: npc.npc_type as NPCEntity['npc_type'],
        faction: npc.faction,
        position: [npc.position.x, npc.position.y, npc.position.z] as [number, number, number],
        velocity: [0, 0, 0] as [number, number, number], // NPCs are stationary in state endpoint
        hull: 100, // Not provided by state endpoint, use defaults
        hull_max: 100,
        shield: 50,
        shield_max: 50,
      }));

      return { sector, npcs };
    } catch (error: any) {
      // If sector state endpoint fails, return empty list
      // (sector might not have any NPCs or might not exist)
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('sector')) {
        console.log(`[NPC API] No NPCs in sector ${sector} (sector may not exist yet)`);
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
