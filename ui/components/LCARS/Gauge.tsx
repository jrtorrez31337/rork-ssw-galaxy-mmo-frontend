import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  AccessibilityProps,
} from 'react-native';
import { tokens } from '@/ui/theme';

/**
 * Gauge - LCARS-style progress/level indicator
 *
 * Per UI/UX Doctrine:
 * - Hull/Shield/Fuel always visible in Header Bar
 * - Color indicates state (green=healthy, yellow=caution, red=critical)
 * - Percentage + bar for quick glance
 * - Pulsing for critical states
 *
 * Accessibility:
 * - Announces value and state
 * - Uses progressbar role
 */

export type GaugeVariant = 'horizontal' | 'vertical' | 'arc';
export type GaugeSize = 'small' | 'medium' | 'large';

interface GaugeProps extends AccessibilityProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: GaugeVariant;
  size?: GaugeSize;
  color?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
  animated?: boolean;
  style?: ViewStyle;
}

const defaultThresholds = {
  warning: 50,
  critical: 25,
};

function getThresholdColor(value: number, thresholds: { warning: number; critical: number }): string {
  if (value <= thresholds.critical) return tokens.colors.semantic.danger;
  if (value <= thresholds.warning) return tokens.colors.semantic.warning;
  return tokens.colors.semantic.success;
}

export function Gauge({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'horizontal',
  size = 'medium',
  color,
  thresholds = defaultThresholds,
  animated = true,
  style,
  ...accessibilityProps
}: GaugeProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const displayColor = color || getThresholdColor(percentage, thresholds);
  const isCritical = percentage <= thresholds.critical;

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate value changes
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(percentage);
    }
  }, [percentage, animated, animatedWidth]);

  // Pulse animation for critical state
  useEffect(() => {
    if (isCritical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => pulseAnim.stopAnimation();
  }, [isCritical, pulseAnim]);

  const sizeConfig = {
    small: { height: 4, fontSize: 9, padding: tokens.spacing[1] },
    medium: { height: 8, fontSize: 11, padding: tokens.spacing[2] },
    large: { height: 12, fontSize: 13, padding: tokens.spacing[3] },
  };

  const config = sizeConfig[size];

  if (variant === 'vertical') {
    return (
      <View
        style={[styles.verticalContainer, style]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
        accessibilityLabel={label ? `${label}: ${Math.round(percentage)}%` : undefined}
        {...accessibilityProps}
      >
        {label && (
          <Text style={[styles.label, { fontSize: config.fontSize }]}>{label}</Text>
        )}
        <Animated.View
          style={[
            styles.verticalTrack,
            { width: config.height, opacity: isCritical ? pulseAnim : 1 },
          ]}
        >
          <Animated.View
            style={[
              styles.verticalFill,
              {
                backgroundColor: displayColor,
                height: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </Animated.View>
        {showValue && (
          <Text style={[styles.value, { fontSize: config.fontSize, color: displayColor }]}>
            {Math.round(percentage)}%
          </Text>
        )}
      </View>
    );
  }

  // Horizontal (default)
  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: isCritical ? pulseAnim : 1 },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
      accessibilityLabel={label ? `${label}: ${Math.round(percentage)}%` : undefined}
      {...accessibilityProps}
    >
      {label && (
        <Text style={[styles.label, { fontSize: config.fontSize }]}>{label}</Text>
      )}
      <View style={[styles.track, { height: config.height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: displayColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {showValue && (
        <Text style={[styles.value, { fontSize: config.fontSize, color: displayColor }]}>
          {Math.round(percentage)}%
        </Text>
      )}
    </Animated.View>
  );
}

/**
 * GaugeCluster - Group of related gauges
 */
interface GaugeClusterProps {
  gauges: Array<{
    label: string;
    value: number;
    max?: number;
    color?: string;
  }>;
  orientation?: 'horizontal' | 'vertical';
  size?: GaugeSize;
}

export function GaugeCluster({
  gauges,
  orientation = 'horizontal',
  size = 'medium',
}: GaugeClusterProps) {
  return (
    <View
      style={[
        styles.cluster,
        orientation === 'vertical' && styles.clusterVertical,
      ]}
    >
      {gauges.map((gauge, index) => (
        <Gauge
          key={index}
          label={gauge.label}
          value={gauge.value}
          max={gauge.max}
          color={gauge.color}
          size={size}
          style={orientation === 'horizontal' ? styles.clusterItem : undefined}
        />
      ))}
    </View>
  );
}

/**
 * SegmentedGauge - LCARS-style segmented bar
 */
interface SegmentedGaugeProps extends AccessibilityProps {
  value: number;
  segments?: number;
  label?: string;
  color?: string;
  thresholds?: { warning: number; critical: number };
  style?: ViewStyle;
}

export function SegmentedGauge({
  value,
  segments = 10,
  label,
  color,
  thresholds = defaultThresholds,
  style,
  ...accessibilityProps
}: SegmentedGaugeProps) {
  const percentage = Math.min(100, Math.max(0, value));
  const filledSegments = Math.ceil((percentage / 100) * segments);
  const displayColor = color || getThresholdColor(percentage, thresholds);

  return (
    <View
      style={[styles.segmentedContainer, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
      {...accessibilityProps}
    >
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.segments}>
        {Array.from({ length: segments }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              index < filledSegments && { backgroundColor: displayColor },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  verticalContainer: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  label: {
    color: tokens.colors.text.tertiary,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 32,
  },
  track: {
    flex: 1,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  verticalTrack: {
    flex: 1,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalFill: {
    width: '100%',
    borderRadius: tokens.radius.full,
  },
  value: {
    fontWeight: tokens.typography.fontWeight.bold,
    fontFamily: tokens.typography.fontFamily.mono,
    minWidth: 36,
    textAlign: 'right',
  },
  cluster: {
    flexDirection: 'row',
    gap: tokens.spacing[4],
  },
  clusterVertical: {
    flexDirection: 'column',
    gap: tokens.spacing[2],
  },
  clusterItem: {
    flex: 1,
  },
  segmentedContainer: {
    gap: tokens.spacing[2],
  },
  segments: {
    flexDirection: 'row',
    gap: 2,
  },
  segment: {
    flex: 1,
    height: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 2,
  },
});
