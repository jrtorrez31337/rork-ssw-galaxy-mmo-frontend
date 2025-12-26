import { create } from 'zustand';
import { missionsApi } from '@/api/missions';
import type { Mission, MissionTemplate, Objective } from '@/types/missions';

/**
 * Mission state management store
 * Manages available missions, active missions, and mission progress
 */

interface MissionState {
  // Available missions
  availableMissions: MissionTemplate[];

  // Active missions
  activeMissions: Mission[];

  // Completed missions history
  completedMissions: Mission[];
  completedTotal: number;

  // Selected mission for detail view
  selectedMission: Mission | null;

  // Loading states
  loading: boolean;
  loadingAvailable: boolean;
  loadingActive: boolean;
  loadingCompleted: boolean;

  // Error state
  error: string | null;

  // Actions - Fetching
  fetchAvailable: () => Promise<void>;
  fetchActive: () => Promise<void>;
  fetchCompleted: (limit?: number, offset?: number) => Promise<void>;
  fetchMissionDetails: (missionId: string) => Promise<void>;

  // Actions - Mission management
  acceptMission: (templateId: string) => Promise<Mission | null>;
  abandonMission: (missionId: string) => Promise<void>;

  // Actions - Real-time updates (called from SSE hook)
  updateMissionProgress: (missionId: string, updates: Partial<Mission>) => void;
  updateObjectiveProgress: (
    missionId: string,
    objectiveId: string,
    updates: Partial<Objective>
  ) => void;
  markMissionCompleted: (missionId: string) => void;
  markMissionExpired: (missionId: string) => void;

  // Actions - UI
  setSelectedMission: (mission: Mission | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  availableMissions: [],
  activeMissions: [],
  completedMissions: [],
  completedTotal: 0,
  selectedMission: null,
  loading: false,
  loadingAvailable: false,
  loadingActive: false,
  loadingCompleted: false,
  error: null,
};

export const useMissionStore = create<MissionState>((set, get) => ({
  ...initialState,

  // Fetch available missions
  fetchAvailable: async () => {
    set({ loadingAvailable: true, error: null });
    try {
      const missions = await missionsApi.getAvailable();
      set({ availableMissions: missions, loadingAvailable: false });
    } catch (error: any) {
      console.error('[MissionStore] Failed to fetch available missions:', error);
      set({
        error: error.message || 'Failed to load available missions',
        loadingAvailable: false
      });
    }
  },

  // Fetch active missions
  fetchActive: async () => {
    set({ loadingActive: true, error: null });
    try {
      const missions = await missionsApi.getActive();
      set({ activeMissions: missions, loadingActive: false });
    } catch (error: any) {
      console.error('[MissionStore] Failed to fetch active missions:', error);
      set({
        error: error.message || 'Failed to load active missions',
        loadingActive: false
      });
    }
  },

  // Fetch completed missions
  fetchCompleted: async (limit = 20, offset = 0) => {
    set({ loadingCompleted: true, error: null });
    try {
      const { missions, total } = await missionsApi.getCompleted(limit, offset);
      set({
        completedMissions: missions,
        completedTotal: total,
        loadingCompleted: false
      });
    } catch (error: any) {
      console.error('[MissionStore] Failed to fetch completed missions:', error);
      set({
        error: error.message || 'Failed to load mission history',
        loadingCompleted: false
      });
    }
  },

  // Fetch mission details
  fetchMissionDetails: async (missionId: string) => {
    set({ loading: true, error: null });
    try {
      const mission = await missionsApi.getDetails(missionId);
      set({ selectedMission: mission, loading: false });
    } catch (error: any) {
      console.error('[MissionStore] Failed to fetch mission details:', error);
      set({
        error: error.message || 'Failed to load mission details',
        loading: false
      });
    }
  },

  // Accept mission
  acceptMission: async (templateId: string) => {
    set({ loading: true, error: null });
    try {
      const mission = await missionsApi.accept(templateId);

      // Add to active missions
      set((state) => ({
        activeMissions: [...state.activeMissions, mission],
        // Remove from available if non-repeatable
        availableMissions: state.availableMissions.filter(
          (m) => m.template_id !== templateId || m.is_repeatable
        ),
        loading: false,
      }));

      return mission;
    } catch (error: any) {
      console.error('[MissionStore] Failed to accept mission:', error);
      set({
        error: error.message || 'Failed to accept mission',
        loading: false
      });
      return null;
    }
  },

  // Abandon mission
  abandonMission: async (missionId: string) => {
    set({ loading: true, error: null });
    try {
      await missionsApi.abandon(missionId);

      // Remove from active missions
      set((state) => ({
        activeMissions: state.activeMissions.filter((m) => m.id !== missionId),
        selectedMission:
          state.selectedMission?.id === missionId ? null : state.selectedMission,
        loading: false,
      }));

      // Refresh available missions (cooldown may have reset)
      get().fetchAvailable();
    } catch (error: any) {
      console.error('[MissionStore] Failed to abandon mission:', error);
      set({
        error: error.message || 'Failed to abandon mission',
        loading: false
      });
    }
  },

  // Update mission progress (from SSE events)
  updateMissionProgress: (missionId: string, updates: Partial<Mission>) => {
    set((state) => ({
      activeMissions: state.activeMissions.map((mission) =>
        mission.id === missionId ? { ...mission, ...updates } : mission
      ),
      selectedMission:
        state.selectedMission?.id === missionId
          ? { ...state.selectedMission, ...updates }
          : state.selectedMission,
    }));
  },

  // Update objective progress (from SSE events)
  updateObjectiveProgress: (
    missionId: string,
    objectiveId: string,
    updates: Partial<Objective>
  ) => {
    set((state) => ({
      activeMissions: state.activeMissions.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              objectives: mission.objectives.map((obj) =>
                obj.id === objectiveId ? { ...obj, ...updates } : obj
              ),
            }
          : mission
      ),
      selectedMission:
        state.selectedMission?.id === missionId
          ? {
              ...state.selectedMission,
              objectives: state.selectedMission.objectives.map((obj) =>
                obj.id === objectiveId ? { ...obj, ...updates } : obj
              ),
            }
          : state.selectedMission,
    }));
  },

  // Mark mission as completed (from SSE event)
  markMissionCompleted: (missionId: string) => {
    set((state) => {
      const completedMission = state.activeMissions.find((m) => m.id === missionId);

      return {
        activeMissions: state.activeMissions.filter((m) => m.id !== missionId),
        selectedMission:
          state.selectedMission?.id === missionId ? null : state.selectedMission,
        // Add to completed if found
        completedMissions: completedMission
          ? [{ ...completedMission, status: 'completed' }, ...state.completedMissions]
          : state.completedMissions,
      };
    });

    // Refresh available missions
    get().fetchAvailable();
  },

  // Mark mission as expired (from SSE event)
  markMissionExpired: (missionId: string) => {
    set((state) => ({
      activeMissions: state.activeMissions.filter((m) => m.id !== missionId),
      selectedMission:
        state.selectedMission?.id === missionId ? null : state.selectedMission,
    }));

    // Refresh available missions
    get().fetchAvailable();
  },

  // Set selected mission
  setSelectedMission: (mission: Mission | null) => {
    set({ selectedMission: mission });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set(initialState);
  },
}));
