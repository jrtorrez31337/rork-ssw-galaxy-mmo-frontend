import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { tokens } from '../theme';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  count?: number;
  dot?: boolean;
  style?: ViewStyle;
}

export function Badge({ variant = 'primary', count, dot = false, style }: BadgeProps) {
  if (dot) {
    return <View style={[styles.dot, styles[`dot_${variant}`], style]} />;
  }

  if (count === undefined || count === 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text variant="caption" weight="semibold" color={tokens.colors.text.inverse}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: tokens.radius.full,
    paddingHorizontal: tokens.spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge_primary: {
    backgroundColor: tokens.colors.primary.main,
  },
  badge_success: {
    backgroundColor: tokens.colors.success,
  },
  badge_warning: {
    backgroundColor: tokens.colors.warning,
  },
  badge_danger: {
    backgroundColor: tokens.colors.danger,
  },
  badge_info: {
    backgroundColor: tokens.colors.info,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: tokens.radius.full,
  },

  dot_primary: {
    backgroundColor: tokens.colors.primary.main,
  },
  dot_success: {
    backgroundColor: tokens.colors.success,
  },
  dot_warning: {
    backgroundColor: tokens.colors.warning,
  },
  dot_danger: {
    backgroundColor: tokens.colors.danger,
  },
  dot_info: {
    backgroundColor: tokens.colors.info,
  },
});
