import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { tokens } from '../theme';

export const ShipCardSkeleton = React.memo(function ShipCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={150} height={20} />
        <Skeleton width={60} height={24} />
      </View>

      {/* Location */}
      <Skeleton width={120} height={14} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Skeleton width={40} height={12} />
          <Skeleton width="100%" height={6} style={{ marginVertical: tokens.spacing[1] }} />
          <Skeleton width={50} height={12} />
        </View>
        <View style={styles.stat}>
          <Skeleton width={40} height={12} />
          <Skeleton width="100%" height={6} style={{ marginVertical: tokens.spacing[1] }} />
          <Skeleton width={50} height={12} />
        </View>
        <View style={styles.stat}>
          <Skeleton width={40} height={12} />
          <Skeleton width={40} height={16} style={{ marginTop: tokens.spacing[1] }} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Skeleton width="48%" height={32} borderRadius={tokens.radius.base} />
        <Skeleton width="48%" height={32} borderRadius={tokens.radius.base} />
      </View>
      <View style={styles.actions}>
        <Skeleton width="48%" height={32} borderRadius={tokens.radius.base} />
        <Skeleton width="48%" height={32} borderRadius={tokens.radius.base} />
      </View>
      <View style={styles.actions}>
        <Skeleton width="100%" height={32} borderRadius={tokens.radius.base} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  stat: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
});
