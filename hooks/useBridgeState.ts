import { useMemo } from 'react';
import { useShipSystemsStore, selectVitals, selectHasDamage } from '@/stores/shipSystemsStore';
import { useLocationStore, selectDisplayLocation, selectIsDocked, selectCanJump } from '@/stores/locationStore';
import { useTargetStore, selectTarget, selectHasTarget, selectHostileCount, selectIsBeingTargeted } from '@/stores/targetStore';
import { useTravelStateStore, selectTravelMode, selectIsInTransit, selectHyperspacePhase } from '@/stores/travelStateStore';
import { useCombatReadinessStore, selectAlertLevel, selectIsInCombat, selectWeaponsReady } from '@/stores/combatReadinessStore';
import { useCockpitStore } from '@/stores/cockpitStore';

/**
 * useBridgeState - Unified Bridge State Hook
 *
 * Aggregates all mechanics state stores into a single interface
 * for the cockpit shell and its components.
 *
 * Per UI/UX Doctrine: "A player waking from sleep should understand
 * ship status within 2 seconds of looking at the screen."
 *
 * This hook provides exactly that - immediate access to all
 * glanceable state without navigating stores individually.
 */

export interface BridgeState {
  // === GLANCE LAYER (0 taps - Header Bar) ===
  glance: {
    // Ship vitals (always visible)
    hull: number;          // Percentage
    hullCritical: boolean;
    shields: number;       // Percentage
    shieldsDown: boolean;
    fuel: number;          // Percentage
    fuelCritical: boolean;

    // Location (always visible)
    location: string;      // Formatted display string
    isDocked: boolean;

    // Alert status (always visible)
    alertLevel: 'green' | 'yellow' | 'red';
    alertReason: string | null;
  };

  // === SITUATION LAYER (what's happening) ===
  situation: {
    // Combat
    isInCombat: boolean;
    hostileCount: number;
    isBeingTargeted: boolean;
    weaponsReady: number;

    // Travel
    isInTransit: boolean;
    travelMode: 'idle' | 'sublight' | 'hyperspace';
    hyperspacePhase: 'idle' | 'calculating' | 'spooling' | 'transit' | 'cooldown';

    // Ship condition
    hasDamage: boolean;
    isOperational: boolean;
  };

  // === TARGET LAYER (if target selected) ===
  target: {
    hasTarget: boolean;
    name: string | null;
    range: number | null;
    bearing: string | null;   // "3 o'clock"
    hull: number | null;
    shields: number | null;
    threatLevel: string | null;
    isHostile: boolean;
  };

  // === NAVIGATION LAYER (travel readiness) ===
  navigation: {
    canJump: boolean;
    jumpBlockReason: string | null;
    isDocked: boolean;
    canUndock: boolean;
  };

  // === DERIVED STATES (UI helpers) ===
  derived: {
    // Primary action suggestion
    suggestedAction: 'dock' | 'undock' | 'jump' | 'fire' | 'flee' | 'idle';
    actionColor: 'navigation' | 'combat' | 'economy';

    // Mode indicators
    showCombatUI: boolean;
    showTravelUI: boolean;
    showDockUI: boolean;

    // Urgency
    requiresAttention: boolean;
    urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  };
}

export function useBridgeState(): BridgeState {
  // Ship systems
  const vitals = useShipSystemsStore(selectVitals);
  const hasDamage = useShipSystemsStore(selectHasDamage);
  const isOperational = useShipSystemsStore((s) => s.isOperational);

  // Location
  const displayLocation = useLocationStore(selectDisplayLocation);
  const isDocked = useLocationStore(selectIsDocked);
  const canJumpFromLocation = useLocationStore(selectCanJump);

  // Target
  const target = useTargetStore(selectTarget);
  const hasTarget = useTargetStore(selectHasTarget);
  const hostileCount = useTargetStore(selectHostileCount);
  const isBeingTargeted = useTargetStore(selectIsBeingTargeted);

  // Travel
  const travelMode = useTravelStateStore(selectTravelMode);
  const isInTransit = useTravelStateStore(selectIsInTransit);
  const hyperspacePhase = useTravelStateStore(selectHyperspacePhase);
  const canJumpFromTravel = useTravelStateStore((s) => s.canInitiateJump);
  const jumpBlockReason = useTravelStateStore((s) => s.jumpBlockReason);

  // Combat
  const alertLevel = useCombatReadinessStore(selectAlertLevel);
  const isInCombat = useCombatReadinessStore(selectIsInCombat);
  const weaponsReady = useCombatReadinessStore(selectWeaponsReady);
  const alertReason = useCombatReadinessStore((s) => s.alertReason);

  // Cockpit UI state
  const cockpitAlertLevel = useCockpitStore((s) => s.alertLevel);
  const cockpitAlertReason = useCockpitStore((s) => s.alertReason);

  // Use cockpit store alert if set, otherwise combat store
  const effectiveAlertLevel = cockpitAlertLevel !== 'green' ? cockpitAlertLevel : alertLevel;
  const effectiveAlertReason = cockpitAlertReason || alertReason;

  // Compute derived states
  const derived = useMemo(() => {
    // Determine suggested action
    let suggestedAction: BridgeState['derived']['suggestedAction'] = 'idle';
    let actionColor: BridgeState['derived']['actionColor'] = 'navigation';

    if (isInCombat) {
      suggestedAction = hostileCount > 2 ? 'flee' : 'fire';
      actionColor = 'combat';
    } else if (isDocked) {
      suggestedAction = 'undock';
      actionColor = 'navigation';
    } else if (hasTarget && target?.type === 'station') {
      suggestedAction = 'dock';
      actionColor = 'navigation';
    } else if (canJumpFromLocation && canJumpFromTravel && !isInTransit) {
      suggestedAction = 'jump';
      actionColor = 'navigation';
    }

    // Determine urgency
    let urgencyLevel: BridgeState['derived']['urgencyLevel'] = 'none';
    if (vitals.hull.isCritical || vitals.fuel.isCritical) {
      urgencyLevel = 'critical';
    } else if (isInCombat || isBeingTargeted) {
      urgencyLevel = 'high';
    } else if (vitals.hull.isDamaged || vitals.fuel.isLow) {
      urgencyLevel = 'medium';
    } else if (hasDamage) {
      urgencyLevel = 'low';
    }

    return {
      suggestedAction,
      actionColor,
      showCombatUI: isInCombat || effectiveAlertLevel === 'red',
      showTravelUI: isInTransit || hyperspacePhase !== 'idle',
      showDockUI: isDocked,
      requiresAttention: urgencyLevel !== 'none' && urgencyLevel !== 'low',
      urgencyLevel,
    };
  }, [
    isInCombat,
    isDocked,
    hasTarget,
    target?.type,
    canJumpFromLocation,
    canJumpFromTravel,
    isInTransit,
    vitals,
    isBeingTargeted,
    hasDamage,
    effectiveAlertLevel,
    hyperspacePhase,
    hostileCount,
  ]);

  return {
    glance: {
      hull: vitals.hull.percentage,
      hullCritical: vitals.hull.isCritical,
      shields: vitals.shields.percentage,
      shieldsDown: vitals.shields.isDown,
      fuel: vitals.fuel.percentage,
      fuelCritical: vitals.fuel.isCritical,
      location: displayLocation,
      isDocked,
      alertLevel: effectiveAlertLevel,
      alertReason: effectiveAlertReason,
    },
    situation: {
      isInCombat,
      hostileCount,
      isBeingTargeted,
      weaponsReady,
      isInTransit,
      travelMode,
      hyperspacePhase,
      hasDamage,
      isOperational,
    },
    target: {
      hasTarget,
      name: target?.name || null,
      range: target?.range || null,
      bearing: target?.bearingClock || null,
      hull: target?.hull || null,
      shields: target?.shields || null,
      threatLevel: target?.threatLevel || null,
      isHostile: target?.isHostile || false,
    },
    navigation: {
      canJump: canJumpFromLocation && canJumpFromTravel && !isInCombat,
      jumpBlockReason: isInCombat ? 'In combat' : jumpBlockReason,
      isDocked,
      canUndock: isDocked && !isInCombat,
    },
    derived,
  };
}

/**
 * Lightweight selectors for specific use cases
 */

export function useGlanceState() {
  return useBridgeState().glance;
}

export function useSituationState() {
  return useBridgeState().situation;
}

export function useTargetState() {
  return useBridgeState().target;
}

export function useNavigationState() {
  return useBridgeState().navigation;
}
