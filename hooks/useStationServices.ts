import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import {
  FuelPurchasedEvent,
  RepairCompletedEvent,
  CreditsChangedEvent,
} from '@/types/station-services';

/**
 * Hook to subscribe to real-time station service events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Events handled:
 * - fuel_purchased: Ship refueled
 * - repair_completed: Ship repaired
 * - credits_changed: Credits balance updated
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Station Services] Setting up listeners via SSE Manager');

    // Handle game.services.fuel_purchase event per API spec (04-REALTIME-SSE.apib:674-695)
    const cleanupFuel = sseManager.addEventListener('game.services.fuel_purchase', (data: any) => {
      if (data.player_id !== playerId) return;

      console.log('[Station Services] Fuel purchased:', data);
      queryClient.invalidateQueries({ queryKey: ['ships', playerId] });

      if (callbacks?.onFuelPurchased) {
        callbacks.onFuelPurchased(data);
      }
    });

    // Handle game.services.repair event per API spec (04-REALTIME-SSE.apib:700-721)
    const cleanupRepair = sseManager.addEventListener('game.services.repair', (data: any) => {
      if (data.player_id !== playerId) return;

      console.log('[Station Services] Repair completed:', data);
      queryClient.invalidateQueries({ queryKey: ['ships', playerId] });

      if (callbacks?.onRepairCompleted) {
        callbacks.onRepairCompleted(data);
      }
    });

    // Handle credits changes via economy events per API spec
    // Note: There's no dedicated credits_changed event in the API spec
    // Credits changes come through trade events (game.economy.trade)
    const cleanupCredits = sseManager.addEventListener('game.economy.trade', (data: any) => {
      if (data.buyer_id !== playerId && data.seller_id !== playerId) return;

      console.log('[Station Services] Trade executed, credits changed:', data);
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Note: onCreditsChanged callback not called - API doesn't provide
      // the balance fields the type requires. Use query invalidation instead.
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Station Services] Cleaning up listeners');
      cleanupFuel();
      cleanupRepair();
      cleanupCredits();
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
