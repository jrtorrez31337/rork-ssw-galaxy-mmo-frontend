import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { storage } from '@/utils/storage';
import { useMissionStore } from '@/stores/missionStore';
import { config } from '@/constants/config';
import type {
  MissionAssignedEvent,
  ObjectiveUpdatedEvent,
  ObjectiveCompletedEvent,
  MissionCompletedEvent,
  MissionExpiredEvent,
} from '@/types/missions';

/**
 * Hook to subscribe to real-time mission events via Server-Sent Events (SSE)
 * Listens for mission progress, objective updates, and mission completions
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
  const eventSourceRef = useRef<any>(null);
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

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.log('[SSE:Missions] No access token available');
        return;
      }

      console.log(`[SSE:Missions] Connecting to Fanout service for mission events`);
      console.log(`[SSE:Missions] URL: ${config.FANOUT_URL}/v1/stream/gameplay`);

      // Connect to Fanout service through Gateway (SSE stream)
      const eventSource = new EventSource(`${config.FANOUT_URL}/v1/stream/gameplay`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      eventSource.addEventListener('open' as any, async () => {
        console.log('[SSE:Missions] Connected to Fanout service');

        // Subscribe to mission channels
        try {
          const subscribeResponse = await fetch(`http://192.168.122.76:8086/v1/stream/gameplay/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              channels: [
                `player.${playerId}`,
                'missions.global',
              ],
            }),
          });

          if (subscribeResponse.ok) {
            console.log('[SSE:Missions] Subscribed to mission channels');
          } else {
            console.error('[SSE:Missions] Subscription failed:', await subscribeResponse.text());
          }
        } catch (error) {
          console.error('[SSE:Missions] Subscribe error:', error);
        }
      });

      // Listen for mission events
      eventSource.addEventListener('message' as any, (event: any) => {
        try {
          const data = JSON.parse(event.data);

          // Only process events for this player
          if (data.player_id !== playerId) return;

          console.log('[SSE:Missions] Received event:', data.type, data);

          switch (data.type) {
            case 'mission_assigned':
              handleMissionAssigned(data as MissionAssignedEvent);
              break;

            case 'objective_updated':
              handleObjectiveUpdated(data as ObjectiveUpdatedEvent);
              break;

            case 'objective_completed':
              handleObjectiveCompleted(data as ObjectiveCompletedEvent);
              break;

            case 'mission_completed':
              handleMissionCompleted(data as MissionCompletedEvent);
              break;

            case 'mission_expired':
              handleMissionExpired(data as MissionExpiredEvent);
              break;

            default:
              // Ignore other event types
              break;
          }
        } catch (error) {
          console.error('[SSE:Missions] Parse error:', error);
        }
      });

      eventSource.addEventListener('error' as any, (error: any) => {
        console.error('[SSE:Missions] Connection error:', error);
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      });

      eventSourceRef.current = eventSource;
    };

    // Event handlers
    const handleMissionAssigned = (event: MissionAssignedEvent) => {
      console.log('[SSE:Missions] Mission assigned:', event.template_name);

      // Refresh active missions to include the new one
      fetchActive();
      fetchAvailable();

      // Call custom callback
      if (callbacks?.onMissionAssigned) {
        callbacks.onMissionAssigned(event);
      }
    };

    const handleObjectiveUpdated = (event: ObjectiveUpdatedEvent) => {
      console.log('[SSE:Missions] Objective updated:', event.objective_id);

      // Update objective progress in store
      updateObjectiveProgress(event.mission_id, event.objective_id, {
        current_progress: event.current_progress,
        status: event.status,
      });

      // Invalidate queries to refresh mission data
      queryClient.invalidateQueries({ queryKey: ['missions', 'active'] });

      // Call custom callback
      if (callbacks?.onObjectiveUpdated) {
        callbacks.onObjectiveUpdated(event);
      }
    };

    const handleObjectiveCompleted = (event: ObjectiveCompletedEvent) => {
      console.log('[SSE:Missions] Objective completed:', event.description);

      // Update objective status
      updateObjectiveProgress(event.mission_id, event.objective_id, {
        status: 'completed',
      });

      // Refresh mission data
      fetchActive();

      // Call custom callback
      if (callbacks?.onObjectiveCompleted) {
        callbacks.onObjectiveCompleted(event);
      }
    };

    const handleMissionCompleted = (event: MissionCompletedEvent) => {
      console.log('[SSE:Missions] Mission completed:', event.template_name);
      console.log('[SSE:Missions] Rewards:', {
        credits: event.credits_awarded,
        reputation: event.reputation_awarded,
        items: event.items_awarded,
      });

      // Mark mission as completed in store
      markMissionCompleted(event.mission_id);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['reputations'] });

      // Call custom callback
      if (callbacks?.onMissionCompleted) {
        callbacks.onMissionCompleted(event);
      }
    };

    const handleMissionExpired = (event: MissionExpiredEvent) => {
      console.log('[SSE:Missions] Mission expired:', event.template_name);

      // Mark mission as expired in store
      markMissionExpired(event.mission_id);

      // Refresh missions
      fetchActive();
      fetchAvailable();

      // Call custom callback
      if (callbacks?.onMissionExpired) {
        callbacks.onMissionExpired(event);
      }
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE:Missions] Closing mission connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, queryClient, callbacks]);
}
