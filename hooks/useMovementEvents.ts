import { useEffect } from 'react';
import { sseManager } from '@/lib/sseManager';
import {
  MovementEvent,
  ShipJumpedEvent,
  ShipDockedEvent,
  ShipUndockedEvent,
} from '@/types/movement';

/**
 * Hook to subscribe to real-time movement events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Listens for:
 * - ship_jumped: Ship completed hyperjump to new sector
 * - ship_docked: Ship docked at a station
 * - ship_undocked: Ship undocked from a station
 */

type EventCallback = (event: MovementEvent) => void;

export function useMovementEvents(playerId: string, onEvent: EventCallback) {
  useEffect(() => {
    if (!playerId) return;

    console.log('[Movement Events] Setting up listeners via SSE Manager');

    // Handle ship_jumped event
    const cleanupJumped = sseManager.addEventListener('ship_jumped', (data: any) => {
      console.log('[Movement Events] Ship jumped:', data);
      onEvent({ type: 'SHIP_JUMPED', data: data.payload || data });
    });

    // Handle ship_docked event
    const cleanupDocked = sseManager.addEventListener('ship_docked', (data: any) => {
      console.log('[Movement Events] Ship docked:', data);
      onEvent({ type: 'SHIP_DOCKED', data: data.payload || data });
    });

    // Handle ship_undocked event
    const cleanupUndocked = sseManager.addEventListener('ship_undocked', (data: any) => {
      console.log('[Movement Events] Ship undocked:', data);
      onEvent({ type: 'SHIP_UNDOCKED', data: data.payload || data });
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Movement Events] Cleaning up listeners');
      cleanupJumped();
      cleanupDocked();
      cleanupUndocked();
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
