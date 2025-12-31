import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore, RailSystem } from '@/stores/cockpitStore';
import { LCARSBarRouter } from './LCARSBarRouter';

/**
 * UnifiedLCARSBar - Persistent bottom control bar
 *
 * Replaces the popup ContextualPanel with a fixed 240px bar.
 * Content changes based on activeRail selection.
 * Top border color matches the selected rail's semantic color.
 */

export const LCARS_BAR_HEIGHT = 240;

// Rail-specific border colors
const RAIL_COLORS: Record<RailSystem, string> = {
  NAV: tokens.colors.semantic.navigation,      // Blue
  FLT: tokens.colors.lcars.sky,               // Sky blue
  OPS: tokens.colors.semantic.economy,        // Orange/gold
  TAC: tokens.colors.semantic.combat,         // Red
  ENG: tokens.colors.lcars.peach,             // Peach
  COM: tokens.colors.semantic.communications, // Violet/cyan
};

export function UnifiedLCARSBar() {
  const activeRail = useCockpitStore((s) => s.activeRail);
  const borderColor = RAIL_COLORS[activeRail];

  return (
    <View style={[styles.container, { borderTopColor: borderColor }]}>
      <LCARSBarRouter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LCARS_BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: tokens.colors.console.deepSpace,
    borderTopWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});
