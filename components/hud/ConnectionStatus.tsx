import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSSEConnectionStatus, SSEConnectionStatus } from '@/contexts/SSEEventContext';

/**
 * Connection Status Indicator
 *
 * Shows the current SSE connection status in the UI.
 * Displays a colored dot with optional label.
 *
 * Colors:
 * - Green: Connected
 * - Yellow: Connecting/Reconnecting
 * - Red: Disconnected/Error
 */

interface ConnectionStatusProps {
  /** Show text label next to the indicator */
  showLabel?: boolean;
  /** Size of the indicator dot */
  size?: 'small' | 'medium' | 'large';
  /** Style override */
  style?: object;
}

const STATUS_COLORS: Record<SSEConnectionStatus, string> = {
  connected: '#10B981', // Green
  connecting: '#F59E0B', // Yellow/Amber
  reconnecting: '#F59E0B', // Yellow/Amber
  disconnected: '#6B7280', // Gray
  error: '#EF4444', // Red
};

const STATUS_LABELS: Record<SSEConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  disconnected: 'Offline',
  error: 'Error',
};

const DOT_SIZES = {
  small: 6,
  medium: 8,
  large: 10,
};

export function ConnectionStatus({
  showLabel = false,
  size = 'small',
  style,
}: ConnectionStatusProps) {
  const status = useSSEConnectionStatus();
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const dotSize = DOT_SIZES[size];

  // Pulse animation for connecting states
  const [pulseAnim] = React.useState(() => new Animated.Value(1));

  React.useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            opacity: pulseAnim,
          },
        ]}
      />
      {showLabel && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

/**
 * Minimal connection indicator for header bars
 * Just shows a colored dot without any label
 */
export function ConnectionDot({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) {
  return <ConnectionStatus size={size} showLabel={false} />;
}

/**
 * Full connection status with label
 * For settings pages or debug overlays
 */
export function ConnectionStatusFull() {
  return <ConnectionStatus size="medium" showLabel={true} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    // Size set dynamically
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
