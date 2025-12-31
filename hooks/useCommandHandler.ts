import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useCommandStore, CommandAction } from '@/stores/commandStore';
import { useLocationStore } from '@/stores/locationStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useFlightStore } from '@/stores/flightStore';
import { movementApi } from '@/api/movement';
import { useAuth } from '@/contexts/AuthContext';
import { shipApi } from '@/api/ships';
import { useQuery } from '@tanstack/react-query';

/**
 * useCommandHandler - Handles command actions dispatched from CommandBar
 *
 * This hook consumes pending actions from the commandStore and executes
 * the appropriate API calls. It runs in the CockpitShell to ensure
 * commands are always processed.
 *
 * Supported actions:
 * - nav:undock - Undock from current station
 * - nav:engage - Handled by JumpPanel/NavigationPanel
 * - nav:dock - Handled by DockingPanel
 * - nav:abort - Cancel travel (handled by TravelProgressBar)
 * - tac:fire - Combat actions (handled by CombatHUD)
 * - ops:execute - Operations (handled by specific panels)
 * - com:hail - Communications (handled by ChatPanel)
 * - flt:launch - Flight mode (handled by FlightViewport)
 */
export function useCommandHandler() {
  const { profileId } = useAuth();
  const queryClient = useQueryClient();

  const pendingAction = useCommandStore((s) => s.pendingAction);
  const consumeAction = useCommandStore((s) => s.consumeAction);
  const setActionFeedback = useCommandStore((s) => s.setActionFeedback);

  // Location store for syncing docked state
  const locationDock = useLocationStore((s) => s.dock);
  const locationUndock = useLocationStore((s) => s.undock);
  const setDisplayLocation = useLocationStore((s) => s.setDisplayLocation);

  // Cockpit and flight stores for flight mode
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);
  const setFlightProfile = useFlightStore((s) => s.setProfileById);
  const setActiveShipId = useFlightStore((s) => s.setActiveShipId);

  // Fetch current ship
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;

  // Sync locationStore with ship data
  useEffect(() => {
    if (!currentShip) return;

    // Update display location
    setDisplayLocation(currentShip.location_sector || 'Unknown');

    // Sync docked state
    if (currentShip.docked_at) {
      locationDock(
        currentShip.docked_at,
        currentShip.docked_at, // Use station ID as name if no name available
        'station',
        ['fuel', 'repair', 'trade'] // Default services
      );
    } else {
      locationUndock();
    }
  }, [currentShip?.id, currentShip?.docked_at, currentShip?.location_sector, locationDock, locationUndock, setDisplayLocation]);

  // Handle undock action
  const handleUndock = useCallback(async () => {
    if (!currentShip) {
      setActionFeedback(false, 'No ship available');
      return;
    }

    if (!currentShip.docked_at) {
      setActionFeedback(false, 'Ship is not docked');
      return;
    }

    try {
      await movementApi.undock(currentShip.id);

      // Invalidate ship queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      queryClient.invalidateQueries({ queryKey: ['ship'] });

      setActionFeedback(true, 'Undocked successfully');
    } catch (error: any) {
      const errorMessage = movementApi.handleError(
        error?.response?.data?.error?.code || 'VALIDATION_ERROR'
      );
      setActionFeedback(false, `Undock failed: ${errorMessage}`);
    }
  }, [currentShip, queryClient, setActionFeedback]);

  // Process pending actions
  useEffect(() => {
    if (!pendingAction) return;

    const action = pendingAction.action;
    const context = pendingAction.context;

    console.log('[CommandHandler] Processing action:', action);

    // Consume the action immediately to prevent double-processing
    consumeAction();

    switch (action) {
      case 'nav:undock':
        handleUndock();
        break;

      case 'nav:engage':
        // This action is typically handled by NavigationPanel or JumpPanel
        // which listen for this action and open the jump dialog
        console.log('[CommandHandler] nav:engage - should be handled by NavigationPanel');
        break;

      case 'nav:dock':
        // Handled by DockingPanel
        console.log('[CommandHandler] nav:dock - should be handled by DockingPanel');
        break;

      case 'nav:abort':
        // Handled by TravelProgressBar or travel store
        console.log('[CommandHandler] nav:abort - should be handled by travel system');
        break;

      case 'tac:fire':
        // Handled by CombatHUD
        console.log('[CommandHandler] tac:fire - should be handled by CombatHUD');
        break;

      case 'ops:execute':
        // Handled by specific operation panels
        console.log('[CommandHandler] ops:execute - should be handled by operation panels');
        break;

      case 'com:hail':
        // Handled by ChatPanel
        console.log('[CommandHandler] com:hail - should be handled by ChatPanel');
        break;

      case 'flt:launch':
        // Activate flight mode with current ship's profile
        if (currentShip) {
          // Set flight profile based on ship type
          setFlightProfile(currentShip.ship_type || 'scout');
          setActiveShipId(currentShip.id);
          // Switch to flight viewport
          setActiveViewport('flight');
          setActionFeedback(true, 'Flight mode engaged');
          console.log('[CommandHandler] flt:launch - activating flight mode for', currentShip.ship_type);
        } else {
          setActionFeedback(false, 'No ship available for flight');
          console.warn('[CommandHandler] flt:launch - no ship available');
        }
        break;

      default:
        console.warn('[CommandHandler] Unknown action:', action);
    }
  }, [pendingAction, consumeAction, handleUndock]);
}
