import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { FlightViewport } from './FlightViewport';
import { SectorViewport } from './SectorViewport';
import { SystemMapViewport } from './SystemMapViewport';
import { GalaxyMapViewport } from './GalaxyMapViewport';
import { StationViewport } from './StationViewport';
import { HyperspaceViewport } from './HyperspaceViewport';

/**
 * Viewscreen - Main viewport router
 *
 * Routes content based on activeViewport state from cockpitStore.
 * This is the primary display area in the CockpitShell.
 *
 * Viewport Types:
 * - 'sector' - SectorGrid (default space view)
 * - 'flight' - FlightViewport (3D ship visualization)
 * - 'system-map' - System-level navigation
 * - 'galaxy-map' - Galaxy-wide faction territory
 * - 'station' - Station interior (when docked)
 * - 'hyperspace' - FTL transit visualization
 */
export function Viewscreen() {
  const activeViewport = useCockpitStore((s) => s.activeViewport);

  const renderViewport = () => {
    switch (activeViewport) {
      case 'flight':
        return <FlightViewport />;
      case 'sector':
        return <SectorViewport />;
      case 'system-map':
        return <SystemMapViewport />;
      case 'galaxy-map':
        return <GalaxyMapViewport />;
      case 'station':
        return <StationViewport />;
      case 'hyperspace':
        return <HyperspaceViewport />;
      default:
        return <SectorViewport />;
    }
  };

  return (
    <View style={styles.container}>
      {renderViewport()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.space,
  },
});
