import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import { ReputationTierChangeEvent } from '@/types/api';

/**
 * Hook to subscribe to real-time reputation events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Per 04-REALTIME-SSE.apib (line 726-744):
 * - game.social.reputation: Faction reputation changes
 */

export interface ReputationEventCallbacks {
  onTierChange?: (event: ReputationTierChangeEvent) => void;
  onError?: (error: any) => void;
}

export function useReputationEvents(
  playerId: string,
  callbacks?: ReputationEventCallbacks
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Reputation Events] Setting up listeners via SSE Manager');

    // Handle game.social.reputation event per 04-REALTIME-SSE.apib (line 726-744)
    const cleanupReputation = sseManager.addEventListener('game.social.reputation', (data: any) => {
      if (data.player_id !== playerId) return;
      console.log('[Reputation Events] Reputation change:', data);

      // Invalidate reputation queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['reputations', playerId] });
      queryClient.invalidateQueries({ queryKey: ['reputationHistory', playerId] });

      if (callbacks?.onTierChange) {
        // Pass data as-is - callback can handle the API format
        // API format: player_id, faction_id, old_reputation, new_reputation, change, reason
        callbacks.onTierChange(data as ReputationTierChangeEvent);
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log('[Reputation Events] Cleaning up listeners');
      cleanupReputation();
    };
  }, [playerId, queryClient, callbacks]);
}

/**
 * Alternative implementation using polling (if SSE is not available)
 *
 * This periodically refetches reputation data to detect changes.
 * Less efficient than SSE but works without additional dependencies.
 */
export function useReputationPolling(
  playerId: string,
  intervalMs: number = 30000 // Poll every 30 seconds
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;

    const pollReputation = () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['reputations', playerId] });
    };

    const interval = setInterval(pollReputation, intervalMs);

    // Initial poll
    pollReputation();

    return () => {
      clearInterval(interval);
    };
  }, [playerId, queryClient, intervalMs]);
}
