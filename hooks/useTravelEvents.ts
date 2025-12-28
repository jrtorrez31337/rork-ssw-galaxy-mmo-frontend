import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import { useTravelStore } from '@/stores/travelStore';
import type {
  TravelStartedEvent,
  TravelCompletedEvent,
  TravelCancelledEvent,
  TravelInterruptedEvent,
} from '@/types/travel';

/**
 * Hook to subscribe to real-time travel events via SSE Manager
 *
 * Events:
 * - game.travel.started: Travel initiated, ship is now in transit
 * - game.travel.completed: Ship has arrived at destination
 * - game.travel.cancelled: Travel was cancelled, partial fuel refund
 * - game.travel.interrupted: Travel interrupted by interdiction
 */

export interface TravelEventCallbacks {
  onTravelStarted?: (event: TravelStartedEvent) => void;
  onTravelCompleted?: (event: TravelCompletedEvent) => void;
  onTravelCancelled?: (event: TravelCancelledEvent) => void;
  onTravelInterrupted?: (event: TravelInterruptedEvent) => void;
}

export function useTravelEvents(
  playerId: string,
  callbacks?: TravelEventCallbacks
) {
  const queryClient = useQueryClient();
  const { setActiveTravel, clearTravel } = useTravelStore();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Travel Events] Setting up listeners via SSE Manager');

    // Handle game.travel.started event
    const cleanupStarted = sseManager.addEventListener('game.travel.started', (data: any) => {
      console.log('[Travel Events] Travel started:', data);

      // Update travel store with active travel
      setActiveTravel({
        travel_id: data.travel_id,
        ship_id: data.ship_id,
        from_sector: data.from_sector,
        to_sector: data.to_sector,
        distance: data.distance,
        status: 'in_transit',
        started_at: new Date(data.started_at * 1000).toISOString(),
        arrives_at: new Date(data.arrives_at * 1000).toISOString(),
        completed_at: null,
        remaining_seconds: data.travel_time_seconds,
        progress_percent: 0,
        fuel_consumed: data.fuel_consumed,
      });

      // Invalidate ship queries to reflect in_transit status
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });

      if (callbacks?.onTravelStarted) {
        callbacks.onTravelStarted(data);
      }
    });

    // Handle game.travel.completed event
    const cleanupCompleted = sseManager.addEventListener('game.travel.completed', (data: any) => {
      console.log('[Travel Events] Travel completed:', data);

      // Clear travel state - ship has arrived
      clearTravel();

      // Invalidate queries to refresh ship location and sector data
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['npcs'] });

      if (callbacks?.onTravelCompleted) {
        callbacks.onTravelCompleted(data);
      }
    });

    // Handle game.travel.cancelled event
    const cleanupCancelled = sseManager.addEventListener('game.travel.cancelled', (data: any) => {
      console.log('[Travel Events] Travel cancelled:', data);

      // Clear travel state - ship returned to origin
      clearTravel();

      // Invalidate ship queries
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });

      if (callbacks?.onTravelCancelled) {
        callbacks.onTravelCancelled(data);
      }
    });

    // Handle game.travel.interrupted event (interdiction)
    const cleanupInterrupted = sseManager.addEventListener('game.travel.interrupted', (data: any) => {
      console.log('[Travel Events] Travel interrupted:', data);

      // Clear travel state - ship dropped out at intermediate sector
      clearTravel();

      // Invalidate ship queries to reflect new location
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });

      if (callbacks?.onTravelInterrupted) {
        callbacks.onTravelInterrupted(data);
      }
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Travel Events] Cleaning up listeners');
      cleanupStarted();
      cleanupCompleted();
      cleanupCancelled();
      cleanupInterrupted();
    };
  }, [playerId, queryClient, callbacks, setActiveTravel, clearTravel]);
}
