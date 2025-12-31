import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useFlightStore } from '@/stores/flightStore';
import { ShipVisualization3D } from '@/components/flight/ShipVisualization3D';

/**
 * FlightViewport - Dedicated flight mode viewport
 *
 * Shows the 3D ship visualization. Flight controls are now
 * handled by FlightLCARSContent in the UnifiedLCARSBar.
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FlightViewportProps {
  onExitFlight?: () => void;
}

export function FlightViewport({ onExitFlight }: FlightViewportProps) {
  const profile = useFlightStore((s) => s.profile);

  // Map profile ID to ship type for visualization
  const shipType: 'scout' | 'fighter' | 'trader' | 'explorer' =
    ['scout', 'fighter', 'trader', 'explorer'].includes(profile.id)
      ? (profile.id as 'scout' | 'fighter' | 'trader' | 'explorer')
      : 'scout';

  return (
    <View style={styles.container}>
      {/* Ship Visualization - Takes all available space */}
      <View style={styles.shipArea}>
        <ShipVisualization3D
          shipType={shipType}
          size={{ width: SCREEN_WIDTH - 80, height: SCREEN_HEIGHT * 0.5 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050810',
  },
  shipArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
});
