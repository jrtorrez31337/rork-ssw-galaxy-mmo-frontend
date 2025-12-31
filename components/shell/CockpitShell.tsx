import React, { useEffect, useRef, ReactNode, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { HeaderBar } from './HeaderBar';
import { LeftRail } from './LeftRail';
import { CommandBar } from './CommandBar';
import { StatusBar } from './StatusBar';
import { AlertOverlay } from './AlertOverlay';
import { ContextualPanel, PanelRouter } from '@/components/panels';
import { FlightViewport } from '@/components/viewport/FlightViewport';
import { useFlightTick, useFlightIntegration } from '@/hooks/useFlightIntegration';
import { useCommandHandler } from '@/hooks/useCommandHandler';
import { RespawnOverlay } from '@/components/respawn/RespawnOverlay';
import { CombatHUD, CombatResults } from '@/components/combat';
import { useAuth } from '@/contexts/AuthContext';

/**
 * CockpitShell - Command Console Frame
 *
 * Command Terminal aesthetic with persistent zones:
 * ┌────────────────────────────────────────────────────────┐
 * │                    HEADER BAR (56px)                   │
 * │    Logo + Player Info + Connection Status              │
 * ├──────┬─────────────────────────────────────────────────┤
 * │      │           VIEWPORT                              │
 * │  N   │         {children} - sector view, maps          │
 * │  A   │                                                 │
 * │  V   ├─────────────────────────────────────────────────┤
 * │      │       CONTEXTUAL PANEL (slide-up)               │
 * │  R   │    States: hidden | peek | expanded             │
 * │  A   │                                                 │
 * │  I   │                                                 │
 * │  L   │                                                 │
 * │      │                                                 │
 * │ 80px │                                                 │
 * ├──────┴─────────────────────────────────────────────────┤
 * │                   STATUS BAR (48px)                    │
 * │    Hull/Shield/Fuel + Location + Cargo                 │
 * ├────────────────────────────────────────────────────────┤
 * │                  COMMAND BAR (56px)                    │
 * │    Ticker + Action Buttons                             │
 * └────────────────────────────────────────────────────────┘
 */

interface CockpitShellProps {
  children: ReactNode;
}

// Mount counter to verify shell never remounts
let shellMountCount = 0;

// Flag to track if initial navigation is complete
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
  useFlightTick(shellMounted);
  useFlightIntegration({ autoLockControls: true });

  // Command action handler
  useCommandHandler();

  // Handler to exit flight mode
  const handleExitFlight = useCallback(() => {
    setActiveViewport('sector');
  }, [setActiveViewport]);

  useEffect(() => {
    shellMountCount += 1;
    mountId.current = shellMountCount;

    if (__DEV__) {
      console.log(`[CockpitShell] Mounted (instance #${mountId.current})`);

      if (initialNavigationComplete && shellMountCount > 2) {
        console.warn(
          `[CockpitShell] WARNING: Shell remounted after navigation! ` +
            `Mount count: ${shellMountCount}`
        );
      }

      if (shellMountCount === 2) {
        setTimeout(() => {
          initialNavigationComplete = true;
        }, 1000);
      }
    }

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
      {/* Header Bar - Logo, player info, connection */}
      <HeaderBar />

      {/* Main content area */}
      <View style={styles.mainArea}>
        {/* Left Navigation Rail */}
        <LeftRail />

        {/* Primary Viewport */}
        <View style={styles.viewport}>
          {/* Main content area */}
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

          {/* Alert overlay */}
          <AlertOverlay />
        </View>
      </View>

      {/* Status Bar - Ship vitals, location, cargo (hidden in flight mode) */}
      {activeViewport !== 'flight' && <StatusBar />}

      {/* Command Bar - Actions (hidden in flight mode) */}
      {activeViewport !== 'flight' && <CommandBar />}

      {/* Combat HUD */}
      {profileId && <CombatHUD playerId={profileId} />}

      {/* Combat Results Modal */}
      <CombatResults />

      {/* Respawn Overlay */}
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
    backgroundColor: tokens.colors.console.void,
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  viewport: {
    flex: 1,
    backgroundColor: tokens.colors.console.nebula,
    position: 'relative',
  },
  contentArea: {
    flex: 1,
  },
});
