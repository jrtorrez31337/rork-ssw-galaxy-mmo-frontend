import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/ui';
import { tokens } from '@/ui/theme';
import { GalaxyMap } from '@/components/galaxy';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * Galaxy Map Screen
 *
 * Per Gap Analysis Sprint 3:
 * - Full-screen galaxy influence visualization
 * - Shows faction territories across all sectors
 * - Displays current player location
 */

export default function GalaxyMapScreen() {
  const router = useRouter();
  const { profileId } = useAuth();

  // Get current ship to show player location
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentSectorId = currentShip?.location_sector;

  const handleSectorPress = (sector: { x: number; y: number; z: number }) => {
    console.log('[GalaxyMap] Sector selected:', sector);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Globe size={24} color={tokens.colors.primary.main} />
          <Text variant="title" weight="bold">
            Galaxy Map
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Current Location Indicator */}
      {currentSectorId && (
        <View style={styles.locationBar}>
          <Text variant="caption" color={tokens.colors.text.secondary}>
            Your location:
          </Text>
          <Text variant="body" weight="semibold" color={tokens.colors.primary.main}>
            {currentSectorId}
          </Text>
        </View>
      )}

      {/* Galaxy Map */}
      <GalaxyMap
        currentSectorId={currentSectorId}
        onSectorPress={handleSectorPress}
        showLegend
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    backgroundColor: tokens.colors.surface.base,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
});
