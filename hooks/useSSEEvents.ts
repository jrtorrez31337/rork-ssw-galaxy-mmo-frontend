import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseManager } from '@/lib/sseManager';

// Import stores
import { useCombatStore } from '@/stores/combatStore';
import { useLootStore } from '@/stores/lootStore';
import { useMissionStore } from '@/stores/missionStore';
import { useLocationStore } from '@/stores/locationStore';
import { usePositionStore } from '@/stores/positionStore';
import { useShipSystemsStore } from '@/stores/shipSystemsStore';
import { useProcgenStore } from '@/stores/procgenStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useRespawnStore } from '@/stores/respawnStore';

// Import types
import type { SectorDelta, DeltaType } from '@/lib/procgen/types';

/**
 * Unified SSE Event Consumer Hook
 *
 * This hook sets up all SSE event listeners in one place, dispatching
 * events to the appropriate Zustand stores. It should be used once at
 * the app level via SSEEventProvider.
 *
 * Event categories handled:
 * - Combat: tick, loot, end, start
 * - Movement: jump, dock, undock
 * - Missions: assigned, objective, completed
 * - Economy: trade, price_update
 * - Mining: extract
 * - Procgen: sector.delta
 * - Social: reputation
 * - Travel: started, completed, cancelled, interrupted
 *
 * Per 04-REALTIME-SSE.apib event specifications
 */

export interface SSEEventCallbacks {
  // Combat
  onCombatStart?: (data: any) => void;
  onCombatTick?: (data: any) => void;
  onCombatLoot?: (data: any) => void;
  onCombatEnd?: (data: any) => void;

  // Movement
  onShipJumped?: (data: any) => void;
  onShipDocked?: (data: any) => void;
  onShipUndocked?: (data: any) => void;

  // Missions
  onMissionAssigned?: (data: any) => void;
  onMissionObjective?: (data: any) => void;
  onMissionCompleted?: (data: any) => void;

  // Economy
  onTradeExecuted?: (data: any) => void;
  onPriceUpdate?: (data: any) => void;

  // Mining
  onMiningExtract?: (data: any) => void;

  // Procgen
  onSectorDelta?: (delta: SectorDelta) => void;

  // Social
  onReputationChange?: (data: any) => void;

  // Travel
  onTravelStarted?: (data: any) => void;
  onTravelCompleted?: (data: any) => void;
  onTravelCancelled?: (data: any) => void;

  // Generic
  onAnyEvent?: (eventType: string, data: any) => void;
  onError?: (error: any) => void;
}

export function useSSEEvents(
  playerId: string | null,
  callbacks?: SSEEventCallbacks
) {
  const queryClient = useQueryClient();

  // Store references
  const combatStore = useCombatStore();
  const lootStore = useLootStore();
  const missionStore = useMissionStore();
  const locationStore = useLocationStore();
  const positionStore = usePositionStore();
  const shipSystemsStore = useShipSystemsStore();
  const procgenStore = useProcgenStore();
  const notificationStore = useNotificationStore();
  const respawnStore = useRespawnStore();

  // Stable callback ref to avoid re-registering listeners
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Notify callback helper
  const notify = useCallback((eventType: string, data: any) => {
    callbacksRef.current?.onAnyEvent?.(eventType, data);
  }, []);

  useEffect(() => {
    if (!playerId) {
      console.log('[SSE Events] No player ID, skipping event setup');
      return;
    }

    console.log('[SSE Events] Setting up unified event listeners for:', playerId);
    const cleanupFunctions: (() => void)[] = [];

    // ==================== COMBAT EVENTS ====================

    // game.combat.start - Combat initiated
    cleanupFunctions.push(
      sseManager.addEventListener('game.combat.start', (data: any) => {
        console.log('[SSE Events] Combat started:', data.combat_id);
        notify('game.combat.start', data);

        // Initialize combat instance in store
        combatStore.setCombatInstance({
          combat_id: data.combat_id,
          status: 'active',
          sector: data.sector_id || data.sector,
          started_at: new Date(data.started_at * 1000).toISOString(),
          tick: 0,
          participants: data.participants || [],
        });

        callbacksRef.current?.onCombatStart?.(data);
      })
    );

    // game.combat.tick - Combat tick with damage updates
    cleanupFunctions.push(
      sseManager.addEventListener('game.combat.tick', (data: any) => {
        console.log('[SSE Events] Combat tick:', data.tick);
        notify('game.combat.tick', data);

        // Update tick counter
        combatStore.setCombatTick(data.tick);

        // Process actions (damage dealt)
        (data.actions || []).forEach((action: any) => {
          // Find target's current health from participants
          const targetParticipant = data.participants?.find(
            (p: any) => p.player_id === action.target_id
          );

          if (targetParticipant) {
            combatStore.updateParticipantHealth(
              action.target_id,
              targetParticipant.hull,
              targetParticipant.shield
            );

            // Check if player ship was destroyed (hull = 0)
            if (action.target_id === playerId && targetParticipant.hull <= 0) {
              console.log('[SSE Events] Player ship destroyed in combat!');
              const currentSector = usePositionStore.getState().currentSectorId || data.sector_id || 'Unknown';
              const attacker = data.participants?.find(
                (p: any) => p.player_id !== playerId
              );
              respawnStore.setDestroyed(
                currentSector,
                attacker?.display_name || attacker?.ship_name || 'Enemy'
              );
            }
          }

          // Add damage number animation
          if (action.damage) {
            combatStore.addDamageNumber({
              id: `${Date.now()}-${Math.random()}`,
              damage: action.damage,
              position: { x: 0, y: 0 },
              timestamp: Date.now(),
              targetId: action.target_id,
            });
          }
        });

        callbacksRef.current?.onCombatTick?.(data);
      })
    );

    // game.combat.loot - Loot dropped from defeated NPC
    cleanupFunctions.push(
      sseManager.addEventListener('game.combat.loot', (data: any) => {
        console.log('[SSE Events] Loot received:', data.loot);
        notify('game.combat.loot', data);

        // Add to loot store
        lootStore.addLoot({
          credits: data.loot?.credits ?? 0,
          resources: data.loot?.resources ?? [],
          timestamp: Date.now(),
        });

        // Refresh inventory queries
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });

        callbacksRef.current?.onCombatLoot?.(data);
      })
    );

    // game.combat.end - Combat finished
    cleanupFunctions.push(
      sseManager.addEventListener('game.combat.end', (data: any) => {
        console.log('[SSE Events] Combat ended:', data.outcome);
        notify('game.combat.end', data);

        combatStore.setCombatResult(data.outcome, data.total_ticks);

        // Check if player was defeated (backup for destruction detection)
        const defeatOutcomes = ['player_defeat', 'player_destroyed', 'defeat', 'destroyed'];
        if (defeatOutcomes.includes(data.outcome?.toLowerCase())) {
          const currentSector = usePositionStore.getState().currentSectorId || data.sector_id || 'Unknown';
          // Find the entity that killed the player
          const killer = data.participants?.find(
            (p: any) => p.player_id !== playerId && p.hull > 0
          );
          respawnStore.setDestroyed(
            currentSector,
            killer?.display_name || killer?.ship_name || 'Combat'
          );
        }

        // Delay ending combat to show result
        setTimeout(() => {
          combatStore.endCombat();
        }, 500);

        callbacksRef.current?.onCombatEnd?.(data);
      })
    );

    // ==================== MOVEMENT EVENTS ====================

    // game.movement.jump - Ship jumped to new sector
    cleanupFunctions.push(
      sseManager.addEventListener('game.movement.jump', (data: any) => {
        console.log('[SSE Events] Ship jumped to:', data.to_sector);
        notify('game.movement.jump', data);

        // Update stores with new sector
        if (data.to_sector) {
          positionStore.setCurrentSector(data.to_sector);
          locationStore.setDisplayLocation(data.to_sector);
          locationStore.undock(); // Ensure undocked after jump
        }

        // Refresh sector data
        queryClient.invalidateQueries({ queryKey: ['sector'] });

        callbacksRef.current?.onShipJumped?.(data);
      })
    );

    // game.movement.dock - Ship docked at station
    cleanupFunctions.push(
      sseManager.addEventListener('game.movement.dock', (data: any) => {
        console.log('[SSE Events] Ship docked at:', data.station_id);
        notify('game.movement.dock', data);

        locationStore.dock(
          data.station_id,
          data.station_name || 'Station',
          data.station_type || 'station',
          data.services || []
        );

        callbacksRef.current?.onShipDocked?.(data);
      })
    );

    // game.movement.undock - Ship undocked from station
    cleanupFunctions.push(
      sseManager.addEventListener('game.movement.undock', (data: any) => {
        console.log('[SSE Events] Ship undocked');
        notify('game.movement.undock', data);

        locationStore.undock();

        callbacksRef.current?.onShipUndocked?.(data);
      })
    );

    // ==================== MISSION EVENTS ====================

    // game.missions.assigned - Mission accepted
    cleanupFunctions.push(
      sseManager.addEventListener('game.missions.assigned', (data: any) => {
        if (data.player_id !== playerId) return;
        console.log('[SSE Events] Mission assigned:', data.template_name);
        notify('game.missions.assigned', data);

        missionStore.fetchActive();
        missionStore.fetchAvailable();

        callbacksRef.current?.onMissionAssigned?.(data);
      })
    );

    // game.missions.objective - Objective progress updated
    cleanupFunctions.push(
      sseManager.addEventListener('game.missions.objective', (data: any) => {
        if (data.player_id !== playerId) return;
        console.log('[SSE Events] Objective updated:', data.objective_id);
        notify('game.missions.objective', data);

        missionStore.updateObjectiveProgress(data.mission_id, data.objective_id, {
          current_progress: data.current_count,
          status: data.completed ? 'completed' : 'in_progress',
        });

        queryClient.invalidateQueries({ queryKey: ['missions', 'active'] });

        callbacksRef.current?.onMissionObjective?.(data);
      })
    );

    // game.missions.completed - Mission finished
    cleanupFunctions.push(
      sseManager.addEventListener('game.missions.completed', (data: any) => {
        if (data.player_id !== playerId) return;
        console.log('[SSE Events] Mission completed:', data.mission_id);
        notify('game.missions.completed', data);

        missionStore.markMissionCompleted(data.mission_id);

        queryClient.invalidateQueries({ queryKey: ['missions'] });
        queryClient.invalidateQueries({ queryKey: ['characters'] });
        queryClient.invalidateQueries({ queryKey: ['reputations'] });

        // Show notification
        notificationStore.addNotification({
          type: 'mission_completed',
          urgency: 'important',
          title: 'Mission Complete!',
          message: `Earned ${data.credits_awarded} credits`,
          data: { mission_id: data.mission_id, credits: data.credits_awarded },
        });

        callbacksRef.current?.onMissionCompleted?.(data);
      })
    );

    // ==================== ECONOMY EVENTS ====================

    // game.economy.trade - Trade executed
    cleanupFunctions.push(
      sseManager.addEventListener('game.economy.trade', (data: any) => {
        console.log('[SSE Events] Trade executed:', data.commodity);
        notify('game.economy.trade', data);

        queryClient.invalidateQueries({ queryKey: ['orderbook'] });
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });

        callbacksRef.current?.onTradeExecuted?.(data);
      })
    );

    // game.economy.price_update - Significant price change
    cleanupFunctions.push(
      sseManager.addEventListener('game.economy.price_update', (data: any) => {
        console.log('[SSE Events] Price update:', data.commodity, data.change_percent);
        notify('game.economy.price_update', data);

        queryClient.invalidateQueries({ queryKey: ['prices'] });

        callbacksRef.current?.onPriceUpdate?.(data);
      })
    );

    // ==================== MINING EVENTS ====================

    // game.mining.extract - Resource extracted
    cleanupFunctions.push(
      sseManager.addEventListener('game.mining.extract', (data: any) => {
        console.log('[SSE Events] Mining extract:', data.resource_type);
        notify('game.mining.extract', data);

        // Update ship cargo
        queryClient.invalidateQueries({ queryKey: ['inventory'] });

        callbacksRef.current?.onMiningExtract?.(data);
      })
    );

    // ==================== PROCGEN EVENTS ====================

    // game.sector.delta - Sector state change
    cleanupFunctions.push(
      sseManager.addEventListener('game.sector.delta', (data: any) => {
        console.log('[SSE Events] Sector delta:', data.sector_id, data.delta_type);
        notify('game.sector.delta', data);

        const delta: SectorDelta = {
          id: data.delta_id,
          sectorId: data.sector_id,
          deltaType: data.delta_type as DeltaType,
          targetId: data.target_id,
          targetType: data.target_type,
          changes: data.changes,
          appliedAt: new Date(data.timestamp * 1000).toISOString(),
          version: data.version,
          causedByPlayerId: data.caused_by_player_id,
          causedByEvent: data.caused_by_event,
        };

        // Apply if we have this sector loaded
        const currentVersion = procgenStore.getSectorVersion(data.sector_id);
        if (currentVersion !== undefined && data.version > currentVersion) {
          procgenStore.applyDelta(delta);
          callbacksRef.current?.onSectorDelta?.(delta);
        }
      })
    );

    // ==================== SOCIAL EVENTS ====================

    // game.social.reputation - Reputation changed
    cleanupFunctions.push(
      sseManager.addEventListener('game.social.reputation', (data: any) => {
        if (data.player_id !== playerId) return;
        console.log('[SSE Events] Reputation changed:', data.faction_id, data.change);
        notify('game.social.reputation', data);

        queryClient.invalidateQueries({ queryKey: ['reputations'] });

        // Show notification for tier changes
        if (data.tier_changed) {
          notificationStore.addNotification({
            type: 'reputation_change',
            urgency: 'important',
            title: 'Reputation Changed',
            message: `${data.faction_name}: ${data.old_tier} → ${data.new_tier}`,
            data: { faction_id: data.faction_id, change: data.change },
          });
        }

        callbacksRef.current?.onReputationChange?.(data);
      })
    );

    // ==================== TRAVEL EVENTS ====================

    // game.travel.started - Async travel started
    cleanupFunctions.push(
      sseManager.addEventListener('game.travel.started', (data: any) => {
        console.log('[SSE Events] Travel started:', data.travel_id);
        notify('game.travel.started', data);
        callbacksRef.current?.onTravelStarted?.(data);
      })
    );

    // game.travel.completed - Async travel completed
    cleanupFunctions.push(
      sseManager.addEventListener('game.travel.completed', (data: any) => {
        console.log('[SSE Events] Travel completed:', data.travel_id);
        notify('game.travel.completed', data);

        if (data.destination_sector) {
          positionStore.setCurrentSector(data.destination_sector);
          locationStore.setDisplayLocation(data.destination_sector);
        }
        queryClient.invalidateQueries({ queryKey: ['sector'] });

        callbacksRef.current?.onTravelCompleted?.(data);
      })
    );

    // game.travel.cancelled - Travel cancelled
    cleanupFunctions.push(
      sseManager.addEventListener('game.travel.cancelled', (data: any) => {
        console.log('[SSE Events] Travel cancelled:', data.travel_id);
        notify('game.travel.cancelled', data);
        callbacksRef.current?.onTravelCancelled?.(data);
      })
    );

    // game.travel.interrupted - Travel interrupted (combat, etc.)
    cleanupFunctions.push(
      sseManager.addEventListener('game.travel.interrupted', (data: any) => {
        console.log('[SSE Events] Travel interrupted:', data.reason);
        notify('game.travel.interrupted', data);

        notificationStore.addNotification({
          type: 'system_alert',
          urgency: 'important',
          title: 'Travel Interrupted',
          message: data.reason || 'Your journey was interrupted',
          data: { travel_id: data.travel_id },
        });
      })
    );

    // ==================== STATION SERVICE EVENTS ====================

    // game.services.fuel_purchase - Fuel purchased
    cleanupFunctions.push(
      sseManager.addEventListener('game.services.fuel_purchase', (data: any) => {
        console.log('[SSE Events] Fuel purchased:', data.amount);
        notify('game.services.fuel_purchase', data);

        if (data.new_fuel !== undefined && data.fuel_max !== undefined) {
          shipSystemsStore.updateFuel(data.new_fuel, data.fuel_max);
        }
        queryClient.invalidateQueries({ queryKey: ['user'] });
      })
    );

    // game.services.repair - Ship repaired
    cleanupFunctions.push(
      sseManager.addEventListener('game.services.repair', (data: any) => {
        console.log('[SSE Events] Ship repaired');
        notify('game.services.repair', data);

        if (data.new_hull !== undefined && data.hull_max !== undefined) {
          shipSystemsStore.updateHull(data.new_hull, data.hull_max);
        }
        if (data.new_shield !== undefined && data.shield_max !== undefined) {
          shipSystemsStore.updateShields(data.new_shield, data.shield_max);
        }
        queryClient.invalidateQueries({ queryKey: ['user'] });
      })
    );

    // ==================== CHAT EVENTS ====================

    // game.chat.message - Chat message received
    cleanupFunctions.push(
      sseManager.addEventListener('game.chat.message', (data: any) => {
        console.log('[SSE Events] Chat message:', data.room_id);
        notify('game.chat.message', data);
        // Chat handling would be done by chat-specific component
      })
    );

    console.log('[SSE Events] Registered', cleanupFunctions.length, 'event listeners');

    // Cleanup all listeners on unmount
    return () => {
      console.log('[SSE Events] Cleaning up all event listeners');
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [
    playerId,
    queryClient,
    notify,
    combatStore,
    lootStore,
    missionStore,
    locationStore,
    positionStore,
    shipSystemsStore,
    procgenStore,
    notificationStore,
    respawnStore,
  ]);

  // Return connection status
  return {
    isConnected: sseManager.isStreamConnected(),
  };
}
