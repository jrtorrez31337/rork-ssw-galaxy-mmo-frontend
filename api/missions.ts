import { apiClient } from './client';
import { storage } from '@/utils/storage';
import type {
  MissionTemplate,
  Mission,
  GetAvailableMissionsResponse,
  GetActiveMissionsResponse,
  GetMissionDetailsResponse,
  AcceptMissionResponse,
  GetCompletedMissionsResponse,
} from '@/types/missions';

/**
 * Missions API client for mission operations
 * Provides methods to interact with the Mission Service
 *
 * Per 03E-MISSIONS.apib:
 * - All mission endpoints require player_id query parameter
 */

export const missionsApi = {
  /**
   * Get available missions for the current player
   * Filtered by player level and faction reputation
   * Per 03E-MISSIONS.apib (line 56): GET /v1/missions/available?player_id=xxx
   *
   * @returns List of mission templates available to accept
   * @throws Error if request fails
   */
  getAvailable: async (): Promise<MissionTemplate[]> => {
    const playerId = await storage.getProfileId();
    if (!playerId) {
      console.log('[Missions API] No player ID available, returning empty list');
      return [];
    }
    try {
      const response = await apiClient.get<GetAvailableMissionsResponse>(
        `/missions/available?player_id=${playerId}`
      );
      return response.missions || [];
    } catch (error: any) {
      // Return empty list for 404 (no missions available)
      if (error.message?.includes('404')) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get active missions for the current player
   * Returns all missions currently in progress
   * Per 03E-MISSIONS.apib (line 164): GET /v1/missions/active?player_id=xxx
   *
   * @returns List of active mission instances with progress
   * @throws Error if request fails
   */
  getActive: async (): Promise<Mission[]> => {
    const playerId = await storage.getProfileId();
    if (!playerId) {
      console.log('[Missions API] No player ID available, returning empty list');
      return [];
    }
    try {
      const response = await apiClient.get<GetActiveMissionsResponse>(
        `/missions/active?player_id=${playerId}`
      );
      return response.missions || [];
    } catch (error: any) {
      // Return empty list for 404 (no active missions)
      if (error.message?.includes('404')) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get detailed information about a specific mission
   * Includes full objective details and current progress
   *
   * @param missionId - UUID of the mission instance
   * @returns Mission details with objectives
   * @throws Error if mission not found or request fails
   */
  getDetails: async (missionId: string): Promise<Mission> => {
    const response = await apiClient.get<GetMissionDetailsResponse>(
      `/missions/${missionId}`
    );
    return response.mission;
  },

  /**
   * Accept a mission from available templates
   * Creates a new mission instance and starts tracking
   *
   * @param templateId - UUID of the mission template to accept
   * @returns Newly created mission instance
   * @throws Error if mission on cooldown, requirements not met, or request fails
   */
  accept: async (templateId: string): Promise<Mission> => {
    const response = await apiClient.post<AcceptMissionResponse>(
      `/missions/${templateId}/accept`
    );
    return response.mission;
  },

  /**
   * Abandon an active mission
   * Removes mission from active list without rewards
   *
   * @param missionId - UUID of the mission instance to abandon
   * @throws Error if mission not found or request fails
   */
  abandon: async (missionId: string): Promise<void> => {
    await apiClient.post<void>(`/missions/${missionId}/abandon`);
  },

  /**
   * Get completed missions history
   * Returns paginated list of finished missions
   * Per 03E-MISSIONS.apib: GET /v1/missions/completed?player_id=xxx
   *
   * @param limit - Number of missions to return (default: 20)
   * @param offset - Number of missions to skip (default: 0)
   * @returns Paginated list of completed missions
   * @throws Error if request fails
   */
  getCompleted: async (
    limit: number = 20,
    offset: number = 0
  ): Promise<{ missions: Mission[]; total: number }> => {
    const playerId = await storage.getProfileId();
    if (!playerId) {
      console.log('[Missions API] No player ID available, returning empty list');
      return { missions: [], total: 0 };
    }
    try {
      const response = await apiClient.get<GetCompletedMissionsResponse>(
        `/missions/completed?player_id=${playerId}&limit=${limit}&offset=${offset}`
      );
      return {
        missions: response.missions || [],
        total: response.total || 0,
      };
    } catch (error: any) {
      // Return empty list for 404 (no completed missions)
      if (error.message?.includes('404')) {
        return { missions: [], total: 0 };
      }
      throw error;
    }
  },
};
