import { useEffect } from 'react';
import { useFlightStore, getProfile } from '@/stores/flightStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useLocationStore } from '@/stores/locationStore';
import { useTravelStateStore } from '@/stores/travelStateStore';

/**
 * useFlightIntegration - Integrates flight state with game state
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - Controls locked when docked or in hyperspace
 * - Profile loaded based on ship type
 * - Priority elevated during combat states
 *
 * Per UI/UX Doctrine:
 * - Alert cascade affects flight UI
 * - Combat auto-switches to TAC but flight remains accessible
 */

interface UseFlightIntegrationOptions {
  /** Ship type ID for profile selection */
  shipType?: string;
  /** Whether to auto-lock controls based on game state */
  autoLockControls?: boolean;
}

export function useFlightIntegration(options: UseFlightIntegrationOptions = {}) {
  const { shipType, autoLockControls = true } = options;

  const lockControls = useFlightStore((s) => s.lockControls);
  const unlockControls = useFlightStore((s) => s.unlockControls);
  const setProfileById = useFlightStore((s) => s.setProfileById);

  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const isDocked = useLocationStore((s) => s.docked.isDocked);
  const travelMode = useTravelStateStore((s) => s.mode);
  const isInHyperspace = travelMode === 'hyperspace';

  // Set profile based on ship type
  useEffect(() => {
    if (shipType) {
      const profile = getProfile(shipType);
      if (profile) {
        setProfileById(shipType);
      } else {
        // Fallback to default profile
        setProfileById('default');
      }
    }
  }, [shipType, setProfileById]);

  // Auto-lock controls based on game state
  useEffect(() => {
    if (!autoLockControls) return;

    if (isDocked) {
      lockControls('Ship is docked');
    } else if (isInHyperspace) {
      lockControls('In hyperspace transit');
    } else {
      unlockControls();
    }
  }, [isDocked, isInHyperspace, autoLockControls, lockControls, unlockControls]);

  // Return useful state for components
  return {
    isControlsLocked: isDocked || isInHyperspace,
    controlsLockReason: isDocked
      ? 'Ship is docked'
      : isInHyperspace
      ? 'In hyperspace transit'
      : null,
    isInCombat: alertLevel === 'red',
    alertLevel,
  };
}

/**
 * useFlightTick - Runs the flight simulation tick
 *
 * Should be called from a component that's always mounted
 * (e.g., CockpitShell) to keep flight state updated.
 */
export function useFlightTick(enabled: boolean = true) {
  const tick = useFlightStore((s) => s.tick);

  useEffect(() => {
    if (!enabled) return;

    let lastTime = Date.now();
    let animationFrame: number;

    const runTick = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;

      // Cap delta time to prevent huge jumps after tab switch
      const cappedDelta = Math.min(deltaTime, 0.1);
      tick(cappedDelta);

      animationFrame = requestAnimationFrame(runTick);
    };

    animationFrame = requestAnimationFrame(runTick);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [enabled, tick]);
}

/**
 * useFlightCombatEscalation - Elevates flight priority during combat
 *
 * Per Cinematic Flight Doctrine:
 * - During combat, flight controls remain accessible
 * - Throttle/attitude may auto-adjust for combat maneuvering
 */
export function useFlightCombatEscalation() {
  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const profile = useFlightStore((s) => s.profile);
  const setAxisCoupling = useFlightStore((s) => s.setAxisCoupling);

  // During combat, auto-enable axis coupling if profile supports it
  // This helps with maneuvering during intense situations
  useEffect(() => {
    if (alertLevel === 'red' && profile.axisCouplingMode === 'roll_to_yaw') {
      // Optionally auto-enable coupling during combat
      // Uncomment if desired: setAxisCoupling(true);
    }
  }, [alertLevel, profile.axisCouplingMode, setAxisCoupling]);

  return {
    isInCombat: alertLevel === 'red',
    combatEscalated: alertLevel === 'red',
  };
}
