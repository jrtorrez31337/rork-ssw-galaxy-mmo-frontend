import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ReputationTierChangeEvent } from '@/types/api';
import { config } from '@/constants/config';

/**
 * Hook to subscribe to real-time reputation tier change events via Server-Sent Events (SSE)
 *
 * Note: React Native doesn't have native EventSource support.
 * This implementation will need one of the following:
 * 1. A polyfill like 'react-native-sse' or 'react-native-event-source'
 * 2. WebSocket implementation instead
 * 3. Polling fallback
 *
 * For now, this is structured for SSE with EventSource API.
 * Install: npm install react-native-sse
 */

export interface ReputationEventCallbacks {
  onTierChange?: (event: ReputationTierChangeEvent) => void;
  onError?: (error: any) => void;
}

export function useReputationEvents(
  playerId: string,
  callbacks?: ReputationEventCallbacks
) {
  const eventSourceRef = useRef<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    // TODO: Replace with actual SSE library implementation
    // Example with react-native-sse or EventSource polyfill:
    /*
    import EventSource from 'react-native-sse';
    import { storage } from '@/utils/storage';

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();

      const eventSource = new EventSource(
        `${config.API_BASE_URL}/events?channels=social.reputation.tier_change`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      eventSource.addEventListener('social.reputation.tier_change', (event: any) => {
        const data: ReputationTierChangeEvent = JSON.parse(event.data);

        // Only process events for this player
        if (data.player_id === playerId) {
          // Invalidate reputation queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['reputations', playerId] });
          queryClient.invalidateQueries({
            queryKey: ['reputationHistory', playerId]
          });

          // Call custom callback if provided
          if (callbacks?.onTierChange) {
            callbacks.onTierChange(data);
          }
        }
      });

      eventSource.addEventListener('error', (error: any) => {
        console.error('SSE connection error:', error);
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      });

      eventSourceRef.current = eventSource;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    */

    // Placeholder logging for now
    console.log(
      `[useReputationEvents] Would subscribe to reputation events for player: ${playerId}`
    );
    console.log(
      `[useReputationEvents] SSE URL: ${config.API_BASE_URL}/events?channels=social.reputation.tier_change`
    );

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, queryClient, callbacks]);
}

/**
 * Alternative implementation using polling (if SSE is not available)
 *
 * This periodically refetches reputation data to detect changes.
 * Less efficient than SSE but works without additional dependencies.
 */
export function useReputationPolling(
  playerId: string,
  intervalMs: number = 30000 // Poll every 30 seconds
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    const pollReputation = () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['reputations', playerId] });
    };

    const interval = setInterval(pollReputation, intervalMs);

    // Initial poll
    pollReputation();

    return () => {
      clearInterval(interval);
    };
  }, [playerId, queryClient, intervalMs]);
}
