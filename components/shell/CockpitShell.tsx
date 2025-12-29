import React, { useEffect, useRef, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { HeaderBar } from './HeaderBar';
import { LeftRail } from './LeftRail';
import { CommandBar } from './CommandBar';
import { AlertOverlay } from './AlertOverlay';
import { ContextualPanel, PanelRouter } from '@/components/panels';

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

export function CockpitShell({ children }: CockpitShellProps) {
  const markShellMounted = useCockpitStore((s) => s.markShellMounted);
  const shellMounted = useCockpitStore((s) => s.shellMounted);
  const mountId = useRef<number | null>(null);

  useEffect(() => {
    // Track mount count for debugging
    shellMountCount += 1;
    mountId.current = shellMountCount;

    if (__DEV__) {
      console.log(`[CockpitShell] Mounted (instance #${mountId.current})`);
      if (shellMountCount > 1) {
        console.warn(
          `[CockpitShell] WARNING: Shell remounted! This violates doctrine. ` +
          `Mount count: ${shellMountCount}`
        );
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
          {/* Main content area - sector view, maps, etc. */}
          <View style={styles.contentArea}>
            {children}
          </View>

          {/* Contextual Panel - slides up from bottom */}
          <ContextualPanel>
            <PanelRouter />
          </ContextualPanel>

          {/* Alert overlay sits above viewport content */}
          <AlertOverlay />
        </View>
      </View>

      {/* Command Bar - Always visible */}
      <CommandBar />
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
