import { useEffect, useRef } from 'react';
import EventSource from 'react-native-sse';
import { storage } from '@/utils/storage';
import {
  MovementEvent,
  ShipJumpedEvent,
  ShipDockedEvent,
  ShipUndockedEvent,
} from '@/types/movement';
import { config } from '@/constants/config';

/**
 * Hook to subscribe to real-time movement events via Server-Sent Events (SSE)
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

type EventCallback = (event: MovementEvent) => void;

export function useMovementEvents(playerId: string, onEvent: EventCallback) {
  const eventSourceRef = useRef<any>(null);

  useEffect(() => {
    if (!playerId) return;

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.log('[SSE] No access token available');
        return;
      }

      console.log(`[SSE] Connecting to Fanout service for movement events`);
      console.log(`[SSE] URL: ${config.FANOUT_URL}/v1/stream/gameplay`);

      // Connect to Fanout service through Gateway (SSE stream)
      const eventSource = new EventSource(`${config.FANOUT_URL}/v1/stream/gameplay`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      eventSource.addEventListener('open' as any, async () => {
        console.log('[SSE] Connected to Fanout service (movement)');

        // Subscribe to movement channels
        // Note: Using direct Fanout access for subscribe due to Gateway routing complexity
        try{
          const subscribeResponse = await fetch(`http://192.168.122.76:8086/v1/stream/gameplay/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              channels: [
                `player.${playerId}`,
                'game.movement',
              ],
            }),
          });

          if (subscribeResponse.ok) {
            console.log('[SSE] Subscribed to movement channels');
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
          console.log('[SSE] Received movement event:', data.type, data);

          // Handle different movement event types
          switch (data.type) {
            case 'ship_jumped':
              onEvent({ type: 'SHIP_JUMPED', data: data.payload || data });
              break;
            case 'ship_docked':
              onEvent({ type: 'SHIP_DOCKED', data: data.payload || data });
              break;
            case 'ship_undocked':
              onEvent({ type: 'SHIP_UNDOCKED', data: data.payload || data });
              break;
          }
        } catch (error) {
          console.error('[SSE] Parse error:', error);
        }
      });

      eventSource.addEventListener('error' as any, (error: any) => {
        console.error('[SSE] Movement connection error:', error);
      });

      eventSourceRef.current = eventSource;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing movement connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, onEvent]);
}

/**
 * Alternative implementation using polling (if SSE is not available)
 */
export function useMovementEventsPolling(
  playerId: string,
  onEvent: EventCallback,
  intervalMs: number = 5000
) {
  useEffect(() => {
    if (!playerId) return;

    // Polling implementation
    const pollEvents = async () => {
      try {
        // TODO: Implement polling endpoint if backend supports it
        // const response = await fetch(`${config.API_BASE_URL}/events/poll?player_id=${playerId}`);
        // const events = await response.json();
        // events.forEach(onEvent);
      } catch (error) {
        console.error('Error polling events:', error);
      }
    };

    const interval = setInterval(pollEvents, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [playerId, onEvent, intervalMs]);
}
