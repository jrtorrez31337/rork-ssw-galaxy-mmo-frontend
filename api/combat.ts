import { apiClient } from './client';
import type {
  InitiateCombatRequest,
  InitiateCombatResponse,
  CombatInstance,
} from '@/types/combat';

/**
 * Combat API client for combat operations
 * Phase 5: Combat System Integration
 */

export const combatApi = {
  /**
   * Initiate combat with an NPC or player
   * Creates a new combat instance and starts the combat loop
   *
   * @param request - Combat initiation details (player_id, ship_id, target_entity_id)
   * @returns Combat instance with initial state
   * @throws Error if ship is not found, in combat, docked, etc.
   */
  initiateCombat: async (
    request: InitiateCombatRequest
  ): Promise<InitiateCombatResponse> => {
    return apiClient.post<InitiateCombatResponse>('/combat/initiate', request);
  },

  /**
   * Get current combat instance details
   * Useful for reconnecting or checking combat state
   *
   * @param combatId - UUID of the combat instance
   * @returns Current combat state with participants and tick count
   */
  getCombat: async (combatId: string): Promise<CombatInstance> => {
    return apiClient.get<CombatInstance>(`/combat/${combatId}`);
  },

  /**
   * Flee from combat (if endpoint exists)
   * Note: This endpoint may not be implemented yet in backend
   *
   * @param combatId - UUID of the combat instance
   * @param playerId - Player's profile ID
   */
  fleeCombat: async (combatId: string, playerId: string): Promise<any> => {
    return apiClient.post(`/combat/${combatId}/flee`, { player_id: playerId });
  },
};
