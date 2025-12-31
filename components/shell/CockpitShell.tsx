import React, { useEffect, useRef, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { HeaderBar } from './HeaderBar';
import { LeftRail } from './LeftRail';
import { AlertOverlay } from './AlertOverlay';
import { UnifiedLCARSBar, LCARS_BAR_HEIGHT } from '@/components/lcars-bar';
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
 * │      │                                                 │
 * │  L   │           VIEWPORT                              │
 * │  E   │         {children} - sector view, maps          │
 * │  F   │                                                 │
 * │  T   │                                                 │
 * │      │                                                 │
 * │  R   ├─────────────────────────────────────────────────┤
 * │  A   │       UNIFIED LCARS BAR (240px)                 │
 * │  I   │    Content changes based on rail selection      │
 * │  L   │    Top border color matches active rail         │
 * │      │                                                 │
 * │ 80px │                                                 │
 * └──────┴─────────────────────────────────────────────────┘
 *
 * The UnifiedLCARSBar replaces the old popup ContextualPanel.
 * Rail selection (NAV/FLT/OPS/TAC/ENG/COM) switches bar content.
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
  const mountId = useRef<number | null>(null);

  // Get player ID for combat HUD
  const { profileId } = useAuth();

  // Flight system integration (per Cinematic Flight Doctrine)
  useFlightTick(shellMounted);
  useFlightIntegration({ autoLockControls: true });

  // Command action handler
  useCommandHandler();

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
          {/* Main content area - padded to avoid LCARS bar */}
          <View style={styles.contentArea}>
            {activeViewport === 'flight' ? (
              <FlightViewport />
            ) : (
              children
            )}
          </View>

          {/* Unified LCARS Bar - always visible, content changes by rail */}
          <UnifiedLCARSBar />

          {/* Alert overlay */}
          <AlertOverlay />
        </View>
      </View>

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
    paddingBottom: LCARS_BAR_HEIGHT,
  },
});
