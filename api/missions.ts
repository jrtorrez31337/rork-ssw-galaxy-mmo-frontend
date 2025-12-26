import { apiClient } from './client';
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
 */

export const missionsApi = {
  /**
   * Get available missions for the current player
   * Filtered by player level and faction reputation
   *
   * @returns List of mission templates available to accept
   * @throws Error if request fails
   */
  getAvailable: async (): Promise<MissionTemplate[]> => {
    const response = await apiClient.get<GetAvailableMissionsResponse>(
      '/missions/available'
    );
    return response.missions;
  },

  /**
   * Get active missions for the current player
   * Returns all missions currently in progress
   *
   * @returns List of active mission instances with progress
   * @throws Error if request fails
   */
  getActive: async (): Promise<Mission[]> => {
    const response = await apiClient.get<GetActiveMissionsResponse>(
      '/missions/active'
    );
    return response.missions;
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
    const response = await apiClient.get<GetCompletedMissionsResponse>(
      `/missions/completed?limit=${limit}&offset=${offset}`
    );
    return {
      missions: response.missions,
      total: response.total,
    };
  },
};
