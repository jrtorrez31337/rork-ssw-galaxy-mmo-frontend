import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { storage } from '@/utils/storage';
import { config } from '@/constants/config';
import type {
  ResourceExtractedEvent,
  MiningInventoryUpdateEvent,
} from '@/types/mining';

/**
 * Hook to subscribe to real-time mining events via Server-Sent Events (SSE)
 *
 * Listens for:
 * - resource_extracted: When a player successfully extracts resources from a node
 * - inventory_update: When mining adds resources to ship cargo
 *
 * Uses react-native-sse library for SSE support in React Native
 */

export interface MiningEventCallbacks {
  onResourceExtracted?: (event: ResourceExtractedEvent['payload']) => void;
  onInventoryUpdate?: (event: MiningInventoryUpdateEvent['payload']) => void;
  onError?: (error: any) => void;
}

export function useMiningEvents(
  playerId: string,
  callbacks?: MiningEventCallbacks
) {
  const eventSourceRef = useRef<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.log('[SSE] No access token available for mining events');
        return;
      }

      console.log('[SSE] Connecting to Fanout service for mining events');
      console.log(`[SSE] URL: ${config.FANOUT_URL}/v1/stream/gameplay`);

      // Connect to Fanout service through Gateway (SSE stream)
      const eventSource = new EventSource(
        `${config.FANOUT_URL}/v1/stream/gameplay`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      eventSource.addEventListener('open' as any, async () => {
        console.log('[SSE] Connected to Fanout service (mining)');

        // Subscribe to mining channels
        // Note: Using direct Fanout access for subscribe due to Gateway routing complexity
        try {
          const subscribeResponse = await fetch(
            'http://192.168.122.76:8086/v1/stream/gameplay/subscribe',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                channels: [
                  `player.${playerId}`, // Personal mining notifications
                  'game.mining', // Global mining activity (optional)
                ],
              }),
            }
          );

          if (subscribeResponse.ok) {
            console.log('[SSE] Subscribed to mining channels');
          } else {
            console.error(
              '[SSE] Subscription failed:',
              await subscribeResponse.text()
            );
          }
        } catch (error) {
          console.error('[SSE] Subscribe error:', error);
        }
      });

      // Listen for SSE events
      eventSource.addEventListener('message' as any, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Received mining event:', data.type, data);

          // Handle resource_extracted event
          if (data.type === 'resource_extracted') {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['mining-nodes'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });

            // Call custom callback if provided
            if (callbacks?.onResourceExtracted) {
              callbacks.onResourceExtracted(data.payload);
            }
          }

          // Handle inventory_update event (from mining)
          if (data.type === 'inventory_update') {
            if (data.payload.reason === 'mining') {
              queryClient.invalidateQueries({ queryKey: ['inventory'] });

              if (callbacks?.onInventoryUpdate) {
                callbacks.onInventoryUpdate(data.payload);
              }
            }
          }
        } catch (error) {
          console.error('[SSE] Parse error:', error);
        }
      });

      eventSource.addEventListener('error' as any, (error: any) => {
        console.error('[SSE] Mining connection error:', error);
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      });

      eventSourceRef.current = eventSource;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing mining connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, queryClient, callbacks]);
}
