import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { storage } from '@/utils/storage';
import {
  FuelPurchasedEvent,
  RepairCompletedEvent,
  CreditsChangedEvent,
} from '@/types/station-services';
import { config } from '@/constants/config';

/**
 * Hook to subscribe to real-time station service events via Server-Sent Events (SSE)
 *
 * Events handled:
 * - fuel_purchased: Ship refueled
 * - repair_completed: Ship repaired
 * - credits_changed: Credits balance updated
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

export interface StationServiceEventCallbacks {
  onFuelPurchased?: (event: FuelPurchasedEvent['payload']) => void;
  onRepairCompleted?: (event: RepairCompletedEvent['payload']) => void;
  onCreditsChanged?: (event: CreditsChangedEvent['payload']) => void;
  onError?: (error: any) => void;
}

export function useStationServices(
  playerId: string,
  callbacks?: StationServiceEventCallbacks
) {
  const eventSourceRef = useRef<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.log('[SSE] No access token available');
        return;
      }

      console.log(`[SSE] Connecting to Fanout service for player: ${playerId}`);
      console.log(`[SSE] URL: ${config.FANOUT_URL}/v1/stream/gameplay`);

      // Connect to Fanout service through Gateway (SSE stream)
      const eventSource = new EventSource(`${config.FANOUT_URL}/v1/stream/gameplay`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      eventSource.addEventListener('open' as any, async () => {
        console.log('[SSE] Connected to Fanout service');

        // Subscribe to channels after connection
        // Note: Using direct Fanout access for subscribe due to Gateway routing complexity
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
                'game.services',
                'game.economy',
              ],
            }),
          });

          if (subscribeResponse.ok) {
            console.log('[SSE] Subscribed to channels:', [
              `player.${playerId}`,
              'game.services',
              'game.economy',
            ]);
          } else {
            console.error('[SSE] Subscription failed:', await subscribeResponse.text());
          }
        } catch (error) {
          console.error('[SSE] Subscribe error:', error);
        }
      });

      // Use standard 'message' event for all SSE events
      eventSource.addEventListener('message' as any, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Received event:', data.type, data);

          // Handle different event types
          switch (data.type) {
            case 'fuel_purchased':
              if (data.payload.player_id === playerId) {
                queryClient.invalidateQueries({ queryKey: ['ships', playerId] });
                if (callbacks?.onFuelPurchased) {
                  callbacks.onFuelPurchased(data.payload);
                }
              }
              break;

            case 'repair_completed':
              if (data.payload.player_id === playerId) {
                queryClient.invalidateQueries({ queryKey: ['ships', playerId] });
                if (callbacks?.onRepairCompleted) {
                  callbacks.onRepairCompleted(data.payload);
                }
              }
              break;

            case 'credits_changed':
              if (data.payload.player_id === playerId) {
                queryClient.invalidateQueries({ queryKey: ['user'] });
                if (callbacks?.onCreditsChanged) {
                  callbacks.onCreditsChanged(data.payload);
                }
              }
              break;
          }
        } catch (error) {
          console.error('[SSE] Parse error:', error);
        }
      });

      eventSource.addEventListener('error' as any, (error: any) => {
        console.error('[SSE] Connection error:', error);
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      });

      eventSourceRef.current = eventSource;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing station services connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, queryClient, callbacks]);
}

/**
 * Alternative implementation using polling (if SSE is not available)
 *
 * This periodically refetches ship and user data to detect changes.
 * Less efficient than SSE but works without additional dependencies.
 */
export function useStationServicesPolling(
  playerId: string,
  intervalMs: number = 10000 // Poll every 10 seconds
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    const pollData = () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['ships', playerId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    };

    const interval = setInterval(pollData, intervalMs);

    // Initial poll
    pollData();

    return () => {
      clearInterval(interval);
    };
  }, [playerId, queryClient, intervalMs]);
}
