import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/ui';
import Colors from '@/constants/colors';

export const ReputationCardSkeleton = React.memo(function ReputationCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={150} height={20} />
        <Skeleton width={70} height={24} borderRadius={6} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Skeleton width="100%" height={8} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width={80} height={13} style={{ alignSelf: 'center' }} />
      </View>

      {/* Effects */}
      <View style={styles.effectsContainer}>
        <Skeleton width={90} height={24} borderRadius={4} />
        <Skeleton width={110} height={24} borderRadius={4} />
      </View>

      {/* Updated At */}
      <Skeleton width={100} height={11} style={{ alignSelf: 'flex-end' }} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
});
