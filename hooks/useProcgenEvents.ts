import { useEffect, useRef } from 'react';
import { sseManager } from '@/lib/sseManager';
import { useProcgenStore } from '@/stores/procgenStore';
import type { SectorDelta, DeltaType } from '@/lib/procgen/types';

/**
 * SSE event payload for sector deltas
 */
export interface SectorDeltaEvent {
  sector_id: string;
  delta_id: string;
  delta_type: DeltaType;
  target_id?: string;
  target_type?: string;
  changes: Record<string, any>;
  version: number;
  caused_by_player_id?: string;
  caused_by_event?: string;
  timestamp: number;
}

/**
 * Callback interface for procgen events
 */
export interface ProcgenEventCallbacks {
  onDeltaReceived?: (delta: SectorDelta) => void;
  onSectorUpdated?: (sectorId: string, newVersion: number) => void;
}

/**
 * Hook to subscribe to real-time sector delta events via SSE Manager
 *
 * Events:
 * - game.sector.delta: State change to procedurally generated sector content
 */
export function useProcgenEvents(
  playerId: string,
  callbacks?: ProcgenEventCallbacks
) {
  const { applyDelta, getSectorVersion } = useProcgenStore();

  // Use ref for callbacks to avoid re-running effect when callbacks change
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!playerId) return;

    console.log('[Procgen Events] Setting up sector delta listener');

    // Handle game.sector.delta event
    const cleanupDelta = sseManager.addEventListener('game.sector.delta', (data: SectorDeltaEvent) => {
      console.log('[Procgen Events] Delta received:', data.sector_id, data.delta_type);

      // Convert SSE event to SectorDelta
      const delta: SectorDelta = {
        id: data.delta_id,
        sectorId: data.sector_id,
        deltaType: data.delta_type,
        targetId: data.target_id,
        targetType: data.target_type,
        changes: data.changes,
        appliedAt: new Date(data.timestamp * 1000).toISOString(),
        version: data.version,
        causedByPlayerId: data.caused_by_player_id,
        causedByEvent: data.caused_by_event,
      };

      // Check if we have this sector loaded and if the delta is newer
      const currentVersion = getSectorVersion(data.sector_id);
      if (currentVersion !== undefined && data.version > currentVersion) {
        // Apply delta to store
        applyDelta(delta);

        // Notify callbacks
        callbacksRef.current?.onDeltaReceived?.(delta);
        callbacksRef.current?.onSectorUpdated?.(data.sector_id, data.version);
      } else if (currentVersion === undefined) {
        // We don't have this sector loaded - delta will be fetched when sector is entered
        console.log('[Procgen Events] Delta for unloaded sector, ignoring:', data.sector_id);
      } else {
        // Delta is older or same version, skip
        console.log('[Procgen Events] Skipping stale delta:', data.version, '<=', currentVersion);
      }
    });

    // Cleanup listener on unmount
    return () => {
      console.log('[Procgen Events] Cleaning up sector delta listener');
      cleanupDelta();
    };
  }, [playerId, applyDelta, getSectorVersion]);
}

/**
 * Hook to subscribe to deltas for a specific sector
 * Useful when you only care about changes in the current sector
 */
export function useSectorDeltas(
  sectorId: string | null,
  onDelta?: (delta: SectorDelta) => void
) {
  const { applyDelta, getSectorVersion } = useProcgenStore();
  const onDeltaRef = useRef(onDelta);
  onDeltaRef.current = onDelta;

  useEffect(() => {
    if (!sectorId) return;

    console.log('[Sector Deltas] Subscribing to deltas for:', sectorId);

    // Subscribe to sector-specific channel
    sseManager.subscribeToSector(sectorId);

    const cleanupDelta = sseManager.addEventListener('game.sector.delta', (data: SectorDeltaEvent) => {
      // Only process deltas for this sector
      if (data.sector_id !== sectorId) return;

      const delta: SectorDelta = {
        id: data.delta_id,
        sectorId: data.sector_id,
        deltaType: data.delta_type,
        targetId: data.target_id,
        targetType: data.target_type,
        changes: data.changes,
        appliedAt: new Date(data.timestamp * 1000).toISOString(),
        version: data.version,
        causedByPlayerId: data.caused_by_player_id,
        causedByEvent: data.caused_by_event,
      };

      // Check version
      const currentVersion = getSectorVersion(sectorId);
      if (currentVersion === undefined || data.version > currentVersion) {
        applyDelta(delta);
        onDeltaRef.current?.(delta);
      }
    });

    return () => {
      console.log('[Sector Deltas] Unsubscribing from:', sectorId);
      sseManager.unsubscribeFromChannel(`sector.${sectorId}`);
      cleanupDelta();
    };
  }, [sectorId, applyDelta, getSectorVersion]);
}
