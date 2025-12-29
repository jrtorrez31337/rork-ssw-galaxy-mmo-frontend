import { useState, useEffect } from 'react';
import { sseManager } from '@/lib/sseManager';
import { Ship } from '@/types/api';

export interface ShipStatus {
  shipName: string;
  location: string; // Sector coordinates "x,y,z"
  fuel: {
    current: number;
    max: number;
    percentage: number;
  };
  hull: {
    current: number;
    max: number;
    percentage: number;
  };
  shield: {
    current: number;
    max: number;
    percentage: number;
  };
  credits: number;
  activeMissions: number;
  unreadAlerts: number;
  isDocked: boolean;
}

interface UseShipStatusOptions {
  ship: Ship | null;
  characterId?: string;
}

/**
 * Hook to provide real-time ship status for the Status Bar
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Uses centralized SSE Manager instead of creating own connection
 * - All events come through single multiplexed connection
 */
export function useShipStatus({ ship, characterId }: UseShipStatusOptions): ShipStatus | null {
  const [status, setStatus] = useState<ShipStatus | null>(null);

  // Initialize status from ship data
  useEffect(() => {
    if (!ship) {
      setStatus(null);
      return;
    }

    const initialStatus: ShipStatus = {
      shipName: ship.name || `Ship ${ship.id.substring(0, 8)}`,
      location: ship.location_sector,
      fuel: {
        current: ship.fuel_current,
        max: ship.fuel_capacity,
        percentage: (ship.fuel_current / ship.fuel_capacity) * 100,
      },
      hull: {
        current: ship.hull_points,
        max: ship.hull_max,
        percentage: (ship.hull_points / ship.hull_max) * 100,
      },
      shield: {
        current: ship.shield_points,
        max: ship.shield_max,
        percentage: (ship.shield_points / ship.shield_max) * 100,
      },
      credits: 0, // Will be updated from character data
      activeMissions: 0, // Will be updated from mission data
      unreadAlerts: 0, // Will be updated from SSE events
      isDocked: !!ship.docked_at,
    };

    setStatus(initialStatus);
  }, [ship?.id]);

  // Set up SSE event listeners for real-time updates
  useEffect(() => {
    if (!ship || !characterId) return;

    console.log('[StatusBar] Setting up listeners via SSE Manager');

    // Handle game.movement.jump event per API spec (04-REALTIME-SSE.apib:321-341)
    const cleanupJumped = sseManager.addEventListener('game.movement.jump', (data: any) => {
      console.log('[StatusBar] Ship jumped:', data);
      setStatus((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          location: data.to_sector,
          fuel: {
            ...prev.fuel,
            current: data.fuel_remaining,
            percentage: (data.fuel_remaining / prev.fuel.max) * 100,
          },
        };
      });
    });

    // Handle game.movement.dock event per API spec (04-REALTIME-SSE.apib:345-362)
    const cleanupDocked = sseManager.addEventListener('game.movement.dock', (data: any) => {
      console.log('[StatusBar] Ship docked:', data);
      setStatus((prev) => prev ? { ...prev, isDocked: true } : prev);
    });

    // Handle game.movement.undock event per API spec (04-REALTIME-SSE.apib:366-381)
    const cleanupUndocked = sseManager.addEventListener('game.movement.undock', (data: any) => {
      console.log('[StatusBar] Ship undocked:', data);
      setStatus((prev) => prev ? { ...prev, isDocked: false } : prev);
    });

    // Handle game.combat.outcome event per API spec (04-REALTIME-SSE.apib:448-469)
    const cleanupCombat = sseManager.addEventListener('game.combat.outcome', (data: any) => {
      // Combat outcome doesn't include ship stats in the spec
      // Status bar will be updated via query invalidation
      setStatus((prev) => prev ? {
        ...prev,
        unreadAlerts: prev.unreadAlerts + 1,
      } : prev);
    });

    // Handle game.missions.assigned event per API spec (04-REALTIME-SSE.apib:599-626)
    const cleanupMissionAccepted = sseManager.addEventListener('game.missions.assigned', (data: any) => {
      setStatus((prev) => prev ? {
        ...prev,
        activeMissions: prev.activeMissions + 1,
        unreadAlerts: prev.unreadAlerts + 1,
      } : prev);
    });

    // Handle game.missions.completed event per API spec (04-REALTIME-SSE.apib:650-669)
    const cleanupMissionCompleted = sseManager.addEventListener('game.missions.completed', (data: any) => {
      setStatus((prev) => prev ? {
        ...prev,
        activeMissions: Math.max(0, prev.activeMissions - 1),
        unreadAlerts: prev.unreadAlerts + 1,
      } : prev);
    });

    // Handle game.economy.trade event per API spec (04-REALTIME-SSE.apib:504-525)
    const cleanupTrade = sseManager.addEventListener('game.economy.trade', (data: any) => {
      setStatus((prev) => prev ? {
        ...prev,
        unreadAlerts: prev.unreadAlerts + 1,
      } : prev);
    });

    // Handle game.services.fuel_purchase event per API spec (04-REALTIME-SSE.apib:674-695)
    const cleanupFuel = sseManager.addEventListener('game.services.fuel_purchase', (data: any) => {
      setStatus((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fuel: {
            ...prev.fuel,
            current: data.fuel_remaining,
            percentage: (data.fuel_remaining / prev.fuel.max) * 100,
          },
        };
      });
    });

    // Handle game.services.repair event per API spec (04-REALTIME-SSE.apib:700-721)
    const cleanupRepair = sseManager.addEventListener('game.services.repair', (data: any) => {
      setStatus((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hull: {
            ...prev.hull,
            current: data.hull_current,
            percentage: (data.hull_current / prev.hull.max) * 100,
          },
          shield: {
            ...prev.shield,
            current: data.shield_current,
            percentage: (data.shield_current / prev.shield.max) * 100,
          },
        };
      });
    });

    // Cleanup all listeners on unmount
    return () => {
      console.log('[StatusBar] Cleaning up listeners');
      cleanupJumped();
      cleanupDocked();
      cleanupUndocked();
      cleanupCombat();
      cleanupMissionAccepted();
      cleanupMissionCompleted();
      cleanupTrade();
      cleanupFuel();
      cleanupRepair();
    };
  }, [ship?.id, characterId]);

  return status;
}
