import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/ui';
import { tokens } from '@/ui/theme';
import { Zap } from 'lucide-react-native';
import { useTravelStore } from '@/stores/travelStore';

/**
 * HyperspaceViewport - FTL transit visualization
 *
 * Shows hyperspace jump animation and progress:
 * - Destination sector
 * - ETA / progress
 * - Jump tunnel effect
 *
 * TODO: Add animated hyperspace tunnel effect
 */
export function HyperspaceViewport() {
  const { isInTransit, currentJourney, progress } = useTravelStore();

  const destination = currentJourney?.to_sector || 'Unknown';
  const progressPct = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Zap size={64} color={tokens.colors.lcars.sky} />
        <Text variant="heading" weight="bold" style={styles.title}>
          {isInTransit ? 'IN TRANSIT' : 'HYPERSPACE'}
        </Text>
        {isInTransit && (
          <>
            <Text variant="body" color={tokens.colors.text.primary}>
              Destination: {destination}
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text variant="caption" color={tokens.colors.lcars.sky}>
                {progressPct}%
              </Text>
            </View>
          </>
        )}
        {!isInTransit && (
          <Text variant="body" color={tokens.colors.text.secondary}>
            Not currently in hyperspace
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050510',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  title: {
    color: tokens.colors.lcars.sky,
    marginTop: tokens.spacing[4],
  },
  progressContainer: {
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginTop: tokens.spacing[4],
  },
  progressBar: {
    width: 200,
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.lcars.sky,
    borderRadius: 4,
  },
});
