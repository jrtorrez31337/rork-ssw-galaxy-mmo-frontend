import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { GalaxyMap } from '@/components/galaxy/GalaxyMap';

/**
 * GalaxyMapViewport - Galaxy-wide faction territory view
 *
 * Shows the full galaxy with:
 * - Color-coded sectors by controlling faction
 * - Current location indicator
 * - Interactive zoom and pan
 */
export function GalaxyMapViewport() {
  const { profileId } = useAuth();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentSector = currentShip?.location_sector || '0.0.0';

  const handleSectorPress = (sector: any) => {
    console.debug('[GalaxyMapViewport] Sector pressed:', sector);
    // TODO: Could open jump panel or show sector details
  };

  return (
    <View style={styles.container}>
      <GalaxyMap
        currentSectorId={currentSector}
        onSectorPress={handleSectorPress}
        showLegend={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.space,
  },
});
