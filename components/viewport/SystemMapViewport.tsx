import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/ui';
import { tokens } from '@/ui/theme';
import { Map } from 'lucide-react-native';

/**
 * SystemMapViewport - System-level navigation map
 *
 * Shows the star system with:
 * - Central star
 * - Planets/stations
 * - Jump points to adjacent sectors
 *
 * TODO: Implement full system map visualization
 */
export function SystemMapViewport() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Map size={48} color={tokens.colors.semantic.navigation} />
        <Text variant="heading" weight="bold" style={styles.title}>
          SYSTEM MAP
        </Text>
        <Text variant="body" color={tokens.colors.text.secondary}>
          System navigation view coming soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.space,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  title: {
    color: tokens.colors.semantic.navigation,
  },
});
