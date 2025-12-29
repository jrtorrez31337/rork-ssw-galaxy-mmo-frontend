import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';
import { useCombatStore } from '@/stores/combatStore';
import { useLootStore } from '@/stores/lootStore';
import type {
  CombatOutcomeEvent,
  LootReceivedEvent,
  CombatEndedEvent,
} from '@/types/combat';

/**
 * Hook to subscribe to real-time combat events via SSE Manager
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 *
 * Per 03C-COMBAT.apib and 04-REALTIME-SSE.apib:
 * - game.combat.tick: Damage updates each combat tick (line 481-522)
 * - game.combat.loot: Loot drops from defeated NPCs (line 524-556)
 * - game.combat.end: Combat instance completion (line 559-586)
 */

export interface CombatEventCallbacks {
  onCombatOutcome?: (event: CombatOutcomeEvent['payload']) => void;
  onLootReceived?: (event: LootReceivedEvent['payload']) => void;
  onCombatEnded?: (event: CombatEndedEvent['payload']) => void;
  onError?: (error: any) => void;
}

export function useCombatEvents(
  playerId: string,
  callbacks?: CombatEventCallbacks
) {
  const queryClient = useQueryClient();
  const {
    updateParticipantHealth,
    setCombatTick,
    addDamageNumber,
    endCombat,
    setCombatResult,
  } = useCombatStore();
  const { addLoot } = useLootStore();

  useEffect(() => {
    if (!playerId) return;

    console.log('[Combat Events] Setting up listeners via SSE Manager');

    // Handle game.combat.tick event per 03C-COMBAT.apib (line 481-522)
    const cleanupOutcome = sseManager.addEventListener('game.combat.tick', (data: any) => {
      console.log('[Combat Events] Received game.combat.tick:', data);
      // Transform backend format to frontend expected format
      const payload: CombatOutcomeEvent['payload'] = {
        combat_id: data.combat_id,
        tick: data.tick,
        events: (data.actions || []).map((action: any) => ({
          type: 'damage',
          attacker: action.attacker_id,
          target: action.target_id,
          damage: action.damage,
          target_hull: data.participants?.find((p: any) => p.player_id === action.target_id)?.hull,
          target_shield: data.participants?.find((p: any) => p.player_id === action.target_id)?.shield,
        })),
      };

      // Update combat tick
      setCombatTick(payload.tick);

      // Process each tick event
      payload.events.forEach((tickEvent) => {
        if (tickEvent.type === 'damage' && tickEvent.target) {
          // Update participant health
          if (
            tickEvent.target_hull !== undefined &&
            tickEvent.target_shield !== undefined
          ) {
            updateParticipantHealth(
              tickEvent.target,
              tickEvent.target_hull,
              tickEvent.target_shield
            );
          }

          // Add damage number animation
          if (tickEvent.damage) {
            addDamageNumber({
              id: `${Date.now()}-${Math.random()}`,
              damage: tickEvent.damage,
              position: { x: 0, y: 0 },
              timestamp: Date.now(),
              targetId: tickEvent.target,
            });
          }
        }

        if (tickEvent.type === 'death' && tickEvent.target) {
          updateParticipantHealth(tickEvent.target, 0, 0);
        }
      });

      if (callbacks?.onCombatOutcome) {
        callbacks.onCombatOutcome(payload);
      }
    });

    // Handle game.combat.loot event per 03C-COMBAT.apib (line 524-556)
    const cleanupLoot = sseManager.addEventListener('game.combat.loot', (data: any) => {
      console.log('[Combat Events] Received game.combat.loot:', data);

      // Add loot to store (will show notification)
      // Backend format: { loot: { credits, resources } }
      addLoot({
        credits: data.loot?.credits ?? 0,
        resources: data.loot?.resources ?? [],
        timestamp: Date.now(),
      });

      // Invalidate inventory query to refresh
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });

      if (callbacks?.onLootReceived) {
        callbacks.onLootReceived(data);
      }
    });

    // Handle game.combat.end event per 03C-COMBAT.apib (line 559-586)
    const cleanupEnded = sseManager.addEventListener('game.combat.end', (data: any) => {
      console.log('[Combat Events] Received game.combat.end:', data);

      // Backend format: { outcome, winning_team, duration_seconds, total_ticks, survivors }
      setCombatResult(data.outcome, data.total_ticks);

      setTimeout(() => {
        endCombat();
      }, 500);

      if (callbacks?.onCombatEnded) {
        callbacks.onCombatEnded({
          combat_id: data.combat_id,
          end_reason: data.outcome,
          tick: data.total_ticks,
        });
      }
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[Combat Events] Cleaning up listeners');
      cleanupOutcome();
      cleanupLoot();
      cleanupEnded();
    };
  }, [playerId, queryClient, callbacks]);
}
