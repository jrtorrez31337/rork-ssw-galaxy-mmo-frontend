import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, AccessibilityProps } from 'react-native';
import { tokens } from '@/ui/theme';

/**
 * StatusChip - LCARS-style status indicator
 *
 * Per UI/UX Doctrine:
 * - Color indicates state (green=good, yellow=caution, red=danger)
 * - Compact for dense information display
 * - Readable at a glance
 *
 * Accessibility:
 * - Announces status via accessibilityLabel
 * - Uses semantic colors with text backup
 */

export type ChipStatus = 'online' | 'offline' | 'warning' | 'danger' | 'info' | 'neutral';
export type ChipSize = 'small' | 'medium' | 'large';

interface StatusChipProps extends AccessibilityProps {
  label: string;
  status?: ChipStatus;
  size?: ChipSize;
  icon?: ReactNode;
  value?: string | number;
  style?: ViewStyle;
  pulsing?: boolean;
}

function getStatusColor(status: ChipStatus): string {
  switch (status) {
    case 'online': return tokens.colors.semantic.success;
    case 'offline': return tokens.colors.text.disabled;
    case 'warning': return tokens.colors.semantic.warning;
    case 'danger': return tokens.colors.semantic.danger;
    case 'info': return tokens.colors.semantic.information;
    case 'neutral':
    default: return tokens.colors.lcars.peach;
  }
}

function getStatusLabel(status: ChipStatus): string {
  switch (status) {
    case 'online': return 'Online';
    case 'offline': return 'Offline';
    case 'warning': return 'Warning';
    case 'danger': return 'Critical';
    case 'info': return 'Information';
    default: return 'Status';
  }
}

export function StatusChip({
  label,
  status = 'neutral',
  size = 'medium',
  icon,
  value,
  style,
  pulsing = false,
  ...accessibilityProps
}: StatusChipProps) {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const textSizeStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  };

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size],
        { borderColor: statusColor },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value || statusLabel}`}
      {...accessibilityProps}
    >
      {/* Status indicator dot */}
      <View
        style={[
          styles.indicator,
          { backgroundColor: statusColor },
          pulsing && styles.indicatorPulsing,
        ]}
      />

      {/* Icon if provided */}
      {icon && <View style={styles.icon}>{icon}</View>}

      {/* Label */}
      <Text
        style={[styles.label, textSizeStyles[size]]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Value if provided */}
      {value !== undefined && (
        <Text
          style={[
            styles.value,
            textSizeStyles[size],
            { color: statusColor },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

/**
 * StatusDot - Minimal status indicator
 */
interface StatusDotProps extends AccessibilityProps {
  status: ChipStatus;
  size?: ChipSize;
  pulsing?: boolean;
}

export function StatusDot({
  status,
  size = 'medium',
  pulsing = false,
  ...accessibilityProps
}: StatusDotProps) {
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const dotSize = size === 'small' ? 6 : size === 'large' ? 12 : 8;

  return (
    <View
      style={[
        styles.dot,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: statusColor,
        },
        pulsing && styles.indicatorPulsing,
      ]}
      accessibilityRole="image"
      accessibilityLabel={statusLabel}
      {...accessibilityProps}
    />
  );
}

/**
 * StatusBadge - Larger status badge with text
 */
interface StatusBadgeProps extends AccessibilityProps {
  text: string;
  status?: ChipStatus;
  style?: ViewStyle;
}

export function StatusBadge({
  text,
  status = 'neutral',
  style,
  ...accessibilityProps
}: StatusBadgeProps) {
  const statusColor = getStatusColor(status);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: statusColor },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={text}
      {...accessibilityProps}
    >
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.tertiary,
    borderWidth: 1,
    borderRadius: tokens.radius.sm,
  },
  small: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: 2,
    gap: tokens.spacing[1],
  },
  medium: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    gap: tokens.spacing[2],
  },
  large: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    gap: tokens.spacing[2],
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorPulsing: {
    // Note: Actual pulsing animation would need Animated API
    // This is a placeholder style
    opacity: 0.8,
  },
  icon: {
    marginRight: tokens.spacing[1],
  },
  label: {
    color: tokens.colors.text.secondary,
    fontWeight: tokens.typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
  textMedium: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: tokens.typography.fontSize.xs,
    letterSpacing: 0.5,
  },
  value: {
    fontWeight: tokens.typography.fontWeight.bold,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  dot: {
    // Size set dynamically
  },
  badge: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },
  badgeText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
