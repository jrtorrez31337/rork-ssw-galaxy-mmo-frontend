import React, { useEffect, useRef, ReactNode, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { HeaderBar } from './HeaderBar';
import { LeftRail } from './LeftRail';
import { CommandBar } from './CommandBar';
import { AlertOverlay } from './AlertOverlay';
import { ContextualPanel, PanelRouter } from '@/components/panels';
import { FlightViewport } from '@/components/viewport/FlightViewport';
import { useFlightTick, useFlightIntegration } from '@/hooks/useFlightIntegration';
import { useCommandHandler } from '@/hooks/useCommandHandler';
import { RespawnOverlay } from '@/components/respawn/RespawnOverlay';
import { CombatHUD, CombatResults } from '@/components/combat';
import { useAuth } from '@/contexts/AuthContext';

/**
 * CockpitShell - Persistent Bridge Frame
 *
 * Per UI/UX Doctrine and Implementation Architecture:
 * - MUST NEVER REMOUNT during session
 * - Contains all persistent zones: HeaderBar, LeftRail, Viewport, CommandBar
 * - ContextualPanel slides up from bottom based on rail selection
 * - AlertOverlay renders above viewport but below true modals
 * - Children render inside the content area (sector view, maps, etc.)
 *
 * Layout (Mobile Portrait):
 * ┌────────────────────────────────────────────────────────┐
 * │                    HEADER BAR (56px)                   │
 * ├──────┬─────────────────────────────────────────────────┤
 * │      │           CONTENT AREA                          │
 * │  L   │         {children} - sector view, maps          │
 * │  E   │                                                 │
 * │  F   ├─────────────────────────────────────────────────┤
 * │  T   │       CONTEXTUAL PANEL (slide-up)               │
 * │      │    States: hidden | peek (56px) | expanded      │
 * │  R   │         <PanelRouter /> content                 │
 * │  A   │    NAV: Navigation controls                     │
 * │  I   │    OPS: Missions, trading, mining               │
 * │  L   │    TAC: Target, weapons, combat                 │
 * │      │    ENG: Systems, power, repairs                 │
 * │ 72px │    COM: Chat, factions, hailing                 │
 * ├──────┴─────────────────────────────────────────────────┤
 * │                   COMMAND BAR (64px)                   │
 * └────────────────────────────────────────────────────────┘
 */

interface CockpitShellProps {
  children: ReactNode;
}

// Mount counter to verify shell never remounts
let shellMountCount = 0;

// Flag to track if initial navigation is complete
// Expo Router may cause one remount during initial route resolution
let initialNavigationComplete = false;

export function CockpitShell({ children }: CockpitShellProps) {
  const markShellMounted = useCockpitStore((s) => s.markShellMounted);
  const shellMounted = useCockpitStore((s) => s.shellMounted);
  const activeViewport = useCockpitStore((s) => s.activeViewport);
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);
  const mountId = useRef<number | null>(null);

  // Get player ID for combat HUD
  const { profileId } = useAuth();

  // Flight system integration (per Cinematic Flight Doctrine)
  // Runs flight simulation tick and integrates with game state
  useFlightTick(shellMounted);
  useFlightIntegration({ autoLockControls: true });

  // Command action handler - processes actions from CommandBar
  useCommandHandler();

  // Handler to exit flight mode and return to sector view
  const handleExitFlight = useCallback(() => {
    setActiveViewport('sector');
  }, [setActiveViewport]);

  useEffect(() => {
    // Track mount count for debugging
    shellMountCount += 1;
    mountId.current = shellMountCount;

    if (__DEV__) {
      console.log(`[CockpitShell] Mounted (instance #${mountId.current})`);

      // Allow one remount during initial navigation (Expo Router behavior)
      // Only warn if shell remounts AFTER initial navigation is complete
      if (initialNavigationComplete && shellMountCount > 2) {
        console.warn(
          `[CockpitShell] WARNING: Shell remounted after navigation! This violates doctrine. ` +
          `Mount count: ${shellMountCount}`
        );
      }

      // Mark initial navigation as complete after first stable mount
      if (shellMountCount === 2) {
        setTimeout(() => {
          initialNavigationComplete = true;
        }, 1000);
      }
    }

    // Mark shell as mounted in store
    if (!shellMounted) {
      markShellMounted();
    }

    return () => {
      if (__DEV__) {
        console.log(`[CockpitShell] Unmounted (instance #${mountId.current})`);
      }
    };
  }, [markShellMounted, shellMounted]);

  return (
    <View style={styles.shell}>
      {/* Header Bar - Always visible */}
      <HeaderBar />

      {/* Main content area */}
      <View style={styles.mainArea}>
        {/* Left Rail - Always visible */}
        <LeftRail />

        {/* Primary Viewport - Children render here */}
        <View style={styles.viewport}>
          {/* Main content area - sector view, maps, flight mode, etc. */}
          <View style={styles.contentArea}>
            {activeViewport === 'flight' ? (
              <FlightViewport onExitFlight={handleExitFlight} />
            ) : (
              children
            )}
          </View>

          {/* Contextual Panel - slides up from bottom (hidden in flight mode) */}
          {activeViewport !== 'flight' && (
            <ContextualPanel>
              <PanelRouter />
            </ContextualPanel>
          )}

          {/* Alert overlay sits above viewport content */}
          <AlertOverlay />
        </View>
      </View>

      {/* Command Bar - Always visible */}
      <CommandBar />

      {/* Combat HUD - Shows during active combat */}
      {profileId && <CombatHUD playerId={profileId} />}

      {/* Combat Results Modal - Shows after combat ends */}
      <CombatResults />

      {/* Respawn Overlay - Shows when player ship is destroyed */}
      <RespawnOverlay />
    </View>
  );
}

// Export mount count for testing
export function getShellMountCount(): number {
  return shellMountCount;
}

// Reset mount count (for testing only)
export function resetShellMountCount(): void {
  if (__DEV__) {
    shellMountCount = 0;
    initialNavigationComplete = false;
  }
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  viewport: {
    flex: 1,
    backgroundColor: tokens.colors.background.space,
    position: 'relative',
  },
  contentArea: {
    flex: 1,
  },
});
