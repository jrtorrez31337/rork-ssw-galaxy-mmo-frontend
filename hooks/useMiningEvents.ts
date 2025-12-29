import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import type {
  ResourceExtractedEvent,
  MiningInventoryUpdateEvent,
} from '@/types/mining';

/**
 * Hook to subscribe to real-time mining events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Listens for:
 * - resource_extracted: When a player successfully extracts resources from a node
 * - inventory_update: When mining adds resources to ship cargo
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Mining Events] Setting up listeners via SSE Manager');

    // Handle resource_extracted event
    const cleanupResourceExtracted = sseManager.addEventListener('resource_extracted', (data: any) => {
      console.log('[Mining Events] Resource extracted:', data);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['mining-nodes'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      if (callbacks?.onResourceExtracted) {
        callbacks.onResourceExtracted(data.payload);
      }
    });

    // Handle inventory_update event (from mining)
    const cleanupInventoryUpdate = sseManager.addEventListener('inventory_update', (data: any) => {
      if (data.payload?.reason === 'mining') {
        console.log('[Mining Events] Inventory updated from mining:', data);
        queryClient.invalidateQueries({ queryKey: ['inventory'] });

        if (callbacks?.onInventoryUpdate) {
          callbacks.onInventoryUpdate(data.payload);
        }
      }
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Mining Events] Cleaning up listeners');
      cleanupResourceExtracted();
      cleanupInventoryUpdate();
    };
  }, [playerId, queryClient, callbacks]);
}
