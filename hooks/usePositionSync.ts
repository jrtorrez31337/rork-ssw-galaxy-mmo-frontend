import { useEffect, useCallback, useRef } from 'react';
import { usePositionStore } from '@/stores/positionStore';
import { useTravelStateStore } from '@/stores/travelStateStore';
import { useLocationStore } from '@/stores/locationStore';
import { sublightApi } from '@/api/sublight';

/**
 * usePositionSync - Synchronizes ship position with server
 *
 * Handles:
 * - Periodic position sync (every 200ms while moving)
 * - Server reconciliation when response differs from prediction
 * - Pauses sync when docked or in hyperspace
 */

interface UsePositionSyncOptions {
  /** Ship ID for position updates */
  shipId: string | null;
  /** Whether sync is enabled */
  enabled?: boolean;
  /** Sync interval in ms (default 200) */
  syncInterval?: number;
}

export function usePositionSync(options: UsePositionSyncOptions) {
  const { shipId, enabled = true, syncInterval = 200 } = options;

  const {
    localPosition,
    localVelocity,
    localRotation,
    pendingUpdate,
    isMoving,
    clearPendingSync,
    reconcileWithServer,
    setCurrentSector,
  } = usePositionStore();

  const travelMode = useTravelStateStore((s) => s.mode);
  const isDocked = useLocationStore((s) => s.docked.isDocked);
  const currentSectorInfo = useLocationStore((s) => s.currentSector);
  const currentSectorId = currentSectorInfo?.id ?? null;

  // Track if sync is in progress to avoid overlapping requests
  const syncInProgress = useRef(false);
  const lastSyncTime = useRef(0);

  // Sync is disabled when docked or in hyperspace
  const canSync = enabled && shipId && !isDocked && travelMode !== 'hyperspace';

  // Update current sector in position store
  useEffect(() => {
    setCurrentSector(currentSectorId);
  }, [currentSectorId, setCurrentSector]);

  // Submit position update to server
  const submitPositionUpdate = useCallback(async () => {
    if (!canSync || !shipId || syncInProgress.current) return;

    // Only sync if we're moving or have pending updates
    if (!isMoving && !pendingUpdate) return;

    // Throttle syncs
    const now = Date.now();
    if (now - lastSyncTime.current < syncInterval) return;

    syncInProgress.current = true;
    lastSyncTime.current = now;

    try {
      const response = await sublightApi.updatePosition({
        ship_id: shipId,
        position: localPosition,
        velocity: localVelocity,
        rotation: localRotation,
        timestamp: now,
      });

      if (response.success) {
        // Reconcile with server position
        if (response.correction_applied) {
          reconcileWithServer(
            response.server_position,
            response.server_velocity,
            response.server_rotation
          );
        }
        clearPendingSync();
      }
    } catch (error) {
      // Silently handle errors - position sync is best-effort
      console.debug('[PositionSync] Sync failed:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, [
    canSync,
    shipId,
    isMoving,
    pendingUpdate,
    syncInterval,
    localPosition,
    localVelocity,
    localRotation,
    reconcileWithServer,
    clearPendingSync,
  ]);

  // Periodic sync interval
  useEffect(() => {
    if (!canSync) return;

    const interval = setInterval(() => {
      submitPositionUpdate();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [canSync, syncInterval, submitPositionUpdate]);

  // Return useful state and controls
  return {
    isConnected: canSync,
    isSyncing: syncInProgress.current,
    forceSyncNow: submitPositionUpdate,
  };
}

/**
 * usePositionTick - Updates local position every frame
 *
 * Should be used alongside useFlightTick for smooth position updates.
 * The flightStore tick already calls positionStore.applyFlightInput,
 * so this is mainly for additional interpolation if needed.
 */
export function usePositionTick(enabled: boolean = true) {
  const updateLocalPosition = usePositionStore((s) => s.updateLocalPosition);
  const isMoving = usePositionStore((s) => s.isMoving);

  useEffect(() => {
    if (!enabled || !isMoving) return;

    let lastTime = Date.now();
    let animationFrame: number;

    const tick = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Cap delta to prevent jumps
      const cappedDelta = Math.min(deltaTime, 0.1);
      updateLocalPosition(cappedDelta);

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [enabled, isMoving, updateLocalPosition]);
}

/**
 * usePositionEvents - Subscribes to position updates from other players
 *
 * Listens for SSE events and updates local state for multiplayer.
 * This is a placeholder - actual implementation depends on SSE infrastructure.
 */
export function usePositionEvents(sectorId: string | null) {
  const reconcileWithServer = usePositionStore((s) => s.reconcileWithServer);

  useEffect(() => {
    if (!sectorId) return;

    // TODO: Subscribe to SSE position events
    // The SSE channel would be something like `sector.${sectorId}.positions`
    // For now, this is a placeholder for multiplayer position sync

    // When event received:
    // if (event.ship_id !== myShipId) {
    //   // Update other player's position in a separate store
    // }

    return () => {
      // Cleanup SSE subscription
    };
  }, [sectorId, reconcileWithServer]);
}
