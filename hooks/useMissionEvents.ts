import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import { useMissionStore } from '@/stores/missionStore';
import type {
  MissionAssignedEvent,
  ObjectiveUpdatedEvent,
  ObjectiveCompletedEvent,
  MissionCompletedEvent,
  MissionExpiredEvent,
} from '@/types/missions';

/**
 * Hook to subscribe to real-time mission events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Per 04-REALTIME-SSE.apib:
 * - game.missions.assigned: Mission accepted (line 599-626)
 * - game.missions.objective: Objective progress updated (line 629-646)
 * - game.missions.completed: Mission finished (line 650-669)
 */

export interface MissionEventCallbacks {
  onMissionAssigned?: (event: MissionAssignedEvent) => void;
  onObjectiveUpdated?: (event: ObjectiveUpdatedEvent) => void;
  onObjectiveCompleted?: (event: ObjectiveCompletedEvent) => void;
  onMissionCompleted?: (event: MissionCompletedEvent) => void;
  onMissionExpired?: (event: MissionExpiredEvent) => void;
  onError?: (error: any) => void;
}

export function useMissionEvents(
  playerId: string,
  callbacks?: MissionEventCallbacks
) {
  const queryClient = useQueryClient();
  const {
    updateMissionProgress,
    updateObjectiveProgress,
    markMissionCompleted,
    markMissionExpired,
    fetchActive,
    fetchAvailable,
  } = useMissionStore();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Mission Events] Setting up listeners via SSE Manager');

    // Handle game.missions.assigned event per 04-REALTIME-SSE.apib (line 599-626)
    const cleanupAssigned = sseManager.addEventListener('game.missions.assigned', (data: any) => {
      if (data.player_id !== playerId) return;
      console.log('[Mission Events] Mission assigned:', data.template_name);

      // Refresh active missions to include the new one
      fetchActive();
      fetchAvailable();

      if (callbacks?.onMissionAssigned) {
        callbacks.onMissionAssigned(data);
      }
    });

    // Handle game.missions.objective event per 04-REALTIME-SSE.apib (line 629-646)
    const cleanupObjUpdated = sseManager.addEventListener('game.missions.objective', (data: any) => {
      if (data.player_id !== playerId) return;
      console.log('[Mission Events] Objective updated:', data.objective_id);

      // Update objective progress in store
      updateObjectiveProgress(data.mission_id, data.objective_id, {
        current_progress: data.current_count,
        status: data.completed ? 'completed' : 'in_progress',
      });

      // Invalidate queries to refresh mission data
      queryClient.invalidateQueries({ queryKey: ['missions', 'active'] });

      if (callbacks?.onObjectiveUpdated) {
        callbacks.onObjectiveUpdated(data);
      }

      // Also trigger objective completed callback if completed
      if (data.completed && callbacks?.onObjectiveCompleted) {
        callbacks.onObjectiveCompleted(data);
      }
    });

    // Handle game.missions.completed event per 04-REALTIME-SSE.apib (line 650-669)
    const cleanupMissionCompleted = sseManager.addEventListener('game.missions.completed', (data: any) => {
      if (data.player_id !== playerId) return;
      console.log('[Mission Events] Mission completed:', data.mission_id);
      console.log('[Mission Events] Rewards:', {
        credits: data.credits_awarded,
        reputation: data.reputation_awarded,
        items: data.items_awarded,
      });

      // Mark mission as completed in store
      markMissionCompleted(data.mission_id);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['reputations'] });

      if (callbacks?.onMissionCompleted) {
        callbacks.onMissionCompleted(data);
      }
    });

    // Note: No mission_expired event in API spec - expiration handled via polling
    // or game.missions.failed event (if implemented)

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Mission Events] Cleaning up listeners');
      cleanupAssigned();
      cleanupObjUpdated();
      cleanupMissionCompleted();
    };
  }, [playerId, queryClient, callbacks]);
}
