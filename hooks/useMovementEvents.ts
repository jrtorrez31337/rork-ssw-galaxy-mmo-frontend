import { useEffect, useRef } from 'react';
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

    // TODO: Replace with actual SSE library implementation
    // Example with react-native-sse or EventSource polyfill:
    /*
    import EventSource from 'react-native-sse';

    const eventSource = new EventSource(
      `${API_BASE_URL}/events?channels=player.${playerId},game.movement.jump,game.movement.dock,game.movement.undock`,
      {
        headers: {
          // Add auth token if required
        },
      }
    );

    eventSource.addEventListener('SHIP_JUMPED', (event: any) => {
      const data: ShipJumpedEvent = JSON.parse(event.data);
      onEvent({ type: 'SHIP_JUMPED', data });
    });

    eventSource.addEventListener('SHIP_DOCKED', (event: any) => {
      const data: ShipDockedEvent = JSON.parse(event.data);
      onEvent({ type: 'SHIP_DOCKED', data });
    });

    eventSource.addEventListener('SHIP_UNDOCKED', (event: any) => {
      const data: ShipUndockedEvent = JSON.parse(event.data);
      onEvent({ type: 'SHIP_UNDOCKED', data });
    });

    eventSource.addEventListener('error', (error: any) => {
      console.error('SSE connection error:', error);
    });

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
    */

    // Placeholder logging for now
    console.log(
      `[useMovementEvents] Would subscribe to events for player: ${playerId}`
    );
    console.log(
      `[useMovementEvents] SSE URL: ${config.API_BASE_URL}/events?channels=player.${playerId},game.movement.jump,game.movement.dock,game.movement.undock`
    );

    return () => {
      if (eventSourceRef.current) {
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
