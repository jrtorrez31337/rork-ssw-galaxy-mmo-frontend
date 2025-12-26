import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import EventSource from 'react-native-sse';
import { storage } from '@/utils/storage';
import { config } from '@/constants/config';
import { useCombatStore } from '@/stores/combatStore';
import { useLootStore } from '@/stores/lootStore';
import type {
  CombatOutcomeEvent,
  LootReceivedEvent,
  CombatEndedEvent,
} from '@/types/combat';

/**
 * Hook to subscribe to real-time combat events via Server-Sent Events (SSE)
 *
 * Listens for:
 * - combat_outcome: Damage updates each combat tick
 * - loot_received: Loot drops from defeated NPCs
 * - combat_ended: Combat instance completion
 *
 * Uses react-native-sse library for SSE support in React Native
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
  const eventSourceRef = useRef<any>(null);
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

    const setupSSE = async () => {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.log('[SSE] No access token available for combat events');
        return;
      }

      console.log('[SSE] Connecting to Fanout service for combat events');
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
        console.log('[SSE] Connected to Fanout service (combat)');

        // Subscribe to combat channels
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
                  `player.${playerId}`, // Personal combat notifications
                  'game.combat', // Global combat activity (optional)
                ],
              }),
            }
          );

          if (subscribeResponse.ok) {
            console.log('[SSE] Subscribed to combat channels');
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
          console.log('[SSE] Received combat event:', data.type, data);

          // Handle combat_outcome event
          if (data.type === 'combat_outcome') {
            const payload: CombatOutcomeEvent['payload'] = data.payload;

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
                    position: { x: 0, y: 0 }, // Will be calculated in UI
                    timestamp: Date.now(),
                    targetId: tickEvent.target,
                  });
                }
              }

              if (tickEvent.type === 'death' && tickEvent.target) {
                // Mark participant as dead
                updateParticipantHealth(tickEvent.target, 0, 0);
              }
            });

            // Call custom callback if provided
            if (callbacks?.onCombatOutcome) {
              callbacks.onCombatOutcome(payload);
            }
          }

          // Handle loot_received event
          if (data.type === 'loot_received') {
            const payload: LootReceivedEvent['payload'] = data.payload;

            // Add loot to store (will show notification)
            addLoot({
              credits: payload.credits,
              resources: payload.resources,
              timestamp: Date.now(),
            });

            // Invalidate inventory query to refresh
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['user'] }); // For credits

            // Call custom callback if provided
            if (callbacks?.onLootReceived) {
              callbacks.onLootReceived(payload);
            }
          }

          // Handle combat_ended event
          if (data.type === 'combat_ended') {
            const payload: CombatEndedEvent['payload'] = data.payload;

            // Set combat result (will show results modal)
            setCombatResult(payload.end_reason, payload.tick);

            // End combat after a short delay
            setTimeout(() => {
              endCombat();
            }, 500);

            // Call custom callback if provided
            if (callbacks?.onCombatEnded) {
              callbacks.onCombatEnded(payload);
            }
          }
        } catch (error) {
          console.error('[SSE] Parse error:', error);
        }
      });

      eventSource.addEventListener('error' as any, (error: any) => {
        console.error('[SSE] Combat connection error:', error);
        if (callbacks?.onError) {
          callbacks.onError(error);
        }
      });

      eventSourceRef.current = eventSource;
    };

    setupSSE();

    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Closing combat connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [playerId, queryClient, callbacks]);
}
