import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import type {
  TradeExecutedEvent,
  CreditsChangedEvent,
  InventoryUpdateEvent,
} from '@/types/economy';

/**
 * Hook to subscribe to real-time trading events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Listens for:
 * - trade_executed: When a trade completes (buyer's or seller's perspective)
 * - credits_changed: When player's credit balance changes from trades
 * - inventory_update: When player's ship cargo changes from trades
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Trading Events] Setting up listeners via SSE Manager');

    // Handle trade_executed event
    const cleanupTradeExecuted = sseManager.addEventListener('trade_executed', (data: any) => {
      console.log('[Trading Events] Trade executed:', data);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orderbook'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // For credits

      if (callbacks?.onTradeExecuted) {
        callbacks.onTradeExecuted(data.payload);
      }
    });

    // Handle credits_changed event (from trades)
    const cleanupCreditsChanged = sseManager.addEventListener('credits_changed', (data: any) => {
      // Only handle trade-related credit changes
      if (
        data.payload?.reason === 'trade_purchase' ||
        data.payload?.reason === 'trade_sale'
      ) {
        console.log('[Trading Events] Credits changed from trade:', data);
        queryClient.invalidateQueries({ queryKey: ['user'] });

        if (callbacks?.onCreditsChanged) {
          callbacks.onCreditsChanged(data.payload);
        }
      }
    });

    // Handle inventory_update event (from trades)
    const cleanupInventoryUpdate = sseManager.addEventListener('inventory_update', (data: any) => {
      if (data.payload?.reason === 'trade') {
        console.log('[Trading Events] Inventory updated from trade:', data);
        queryClient.invalidateQueries({ queryKey: ['inventory'] });

        if (callbacks?.onInventoryUpdate) {
          callbacks.onInventoryUpdate(data.payload);
        }
      }
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Trading Events] Cleaning up listeners');
      cleanupTradeExecuted();
      cleanupCreditsChanged();
      cleanupInventoryUpdate();
    };
  }, [playerId, queryClient, callbacks]);
}
