import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { storage } from '@/utils/storage';
import { config } from '@/constants/config';
import type {
  TradeExecutedEvent,
  CreditsChangedEvent,
  InventoryUpdateEvent,
} from '@/types/economy';

/**
 * Hook to subscribe to real-time trading events via Server-Sent Events (SSE)
 *
 * Listens for:
 * - trade_executed: When a trade completes (buyer's or seller's perspective)
 * - credits_changed: When player's credit balance changes from trades
 * - inventory_update: When player's ship cargo changes from trades
 *
 * Uses react-native-sse library for SSE support in React Native
 */

export interface TradingEventCallbacks {
  onTradeExecuted?: (event: TradeExecutedEvent['payload']) => void;
  onCreditsChanged?: (event: CreditsChangedEvent['payload']) => void;
  onInventoryUpdate?: (event: InventoryUpdateEvent['payload']) => void;
  onError?: (error: any) => void;
}

export function useTradingEvents(
  playerId: string,
  callbacks?: TradingEventCallbacks
) {
  const eventSourceRef = useRef<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.log('[SSE] No access token available for trading events');
        return;
      }

      console.log('[SSE] Connecting to Fanout service for trading events');
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
        console.log('[SSE] Connected to Fanout service (trading)');

        // Subscribe to trading channels
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
                  `player.${playerId}`, // Personal trading notifications
                  'game.economy', // Global market activity (optional)
                ],
              }),
            }
          );

          if (subscribeResponse.ok) {
            console.log('[SSE] Subscribed to trading channels');
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
          console.log('[SSE] Received trading event:', data.type, data);

          // Handle trade_executed event
          if (data.type === 'trade_executed') {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['orderbook'] });
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['user'] }); // For credits

            // Call custom callback if provided
            if (callbacks?.onTradeExecuted) {
              callbacks.onTradeExecuted(data.payload);
            }
          }

          // Handle credits_changed event (from trades)
          if (data.type === 'credits_changed') {
            // Only handle trade-related credit changes
            if (
              data.payload.reason === 'trade_purchase' ||
              data.payload.reason === 'trade_sale'
            ) {
              queryClient.invalidateQueries({ queryKey: ['user'] });

              if (callbacks?.onCreditsChanged) {
                callbacks.onCreditsChanged(data.payload);
              }
            }
          }

          // Handle inventory_update event (from trades)
          if (data.type === 'inventory_update') {
            if (data.payload.reason === 'trade') {
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
        console.error('[SSE] Trading connection error:', error);
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      });

      eventSourceRef.current = eventSource;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing trading connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, queryClient, callbacks]);
}
