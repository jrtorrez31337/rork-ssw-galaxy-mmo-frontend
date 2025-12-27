import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { tokens } from '../theme';

export const CharacterCardSkeleton = React.memo(function CharacterCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={150} height={20} />
      </View>

      {/* Home Sector */}
      <Skeleton width={140} height={14} style={{ marginBottom: tokens.spacing[3] }} />

      {/* Attributes */}
      <View style={styles.attributes}>
        <View style={styles.attributeRow}>
          <View style={styles.attribute}>
            <Skeleton width={50} height={12} />
            <Skeleton width={30} height={16} style={{ marginTop: tokens.spacing[1] }} />
          </View>
          <View style={styles.attribute}>
            <Skeleton width={70} height={12} />
            <Skeleton width={30} height={16} style={{ marginTop: tokens.spacing[1] }} />
          </View>
          <View style={styles.attribute}>
            <Skeleton width={50} height={12} />
            <Skeleton width={30} height={16} style={{ marginTop: tokens.spacing[1] }} />
          </View>
        </View>
        <View style={styles.attributeRow}>
          <View style={styles.attribute}>
            <Skeleton width={50} height={12} />
            <Skeleton width={30} height={16} style={{ marginTop: tokens.spacing[1] }} />
          </View>
          <View style={styles.attribute}>
            <Skeleton width={70} height={12} />
            <Skeleton width={30} height={16} style={{ marginTop: tokens.spacing[1] }} />
          </View>
        </View>
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
    gap: tokens.spacing[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
  },
  attributes: {
    gap: tokens.spacing[2],
  },
  attributeRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  attribute: {
    flex: 1,
    backgroundColor: tokens.colors.surface.raised,
    padding: tokens.spacing[2],
    borderRadius: tokens.radius.base,
    alignItems: 'center',
  },
});
