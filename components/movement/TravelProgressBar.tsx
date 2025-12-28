import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { X, Navigation } from 'lucide-react-native';
import { tokens } from '@/ui/theme/tokens';
import { useTravelStore } from '@/stores/travelStore';

interface TravelProgressBarProps {
  onCancel?: () => void;
  onPress?: () => void;
}

/**
 * Persistent travel status bar shown when ship is in transit
 * Displays route, progress bar, ETA countdown, and cancel button
 */
export default function TravelProgressBar({ onCancel, onPress }: TravelProgressBarProps) {
  const { activeTravel, remainingSeconds, progressPercent, isInTransit, decrementRemainingSeconds } =
    useTravelStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Client-side countdown for smooth UX
  useEffect(() => {
    if (!isInTransit || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      decrementRemainingSeconds();
    }, 1000);

    return () => clearInterval(interval);
  }, [isInTransit, decrementRemainingSeconds]);

  // Pulse animation for the navigation icon
  useEffect(() => {
    if (!isInTransit) {
      pulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [isInTransit, pulseAnim]);

  if (!activeTravel || !isInTransit) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 3) return 'Arriving...';
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={styles.container}>
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Animated.View style={{ opacity: pulseAnim }}>
              <Navigation size={16} color={tokens.colors.primary.main} />
            </Animated.View>
            <Text style={styles.title}>IN TRANSIT</Text>
          </View>
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Route and ETA */}
        <View style={styles.infoRow}>
          <Text style={styles.destination}>
            {activeTravel.from_sector} → {activeTravel.to_sector}
          </Text>
          <Text style={styles.eta}>{formatTime(remainingSeconds)}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.barContainer}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(Math.max(progressPercent, 0), 100)}%` },
            ]}
          />
          {/* Ship indicator on the progress bar */}
          <View
            style={[
              styles.shipIndicator,
              { left: `${Math.min(Math.max(progressPercent, 0), 100)}%` },
            ]}
          >
            <Text style={styles.shipIcon}>▶</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.primary.alpha[10],
    borderWidth: 1,
    borderColor: tokens.colors.primary.alpha[30],
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  title: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary.main,
    letterSpacing: 1,
  },
  cancelButton: {
    padding: tokens.spacing[1],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
  },
  destination: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  eta: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.warning,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  barContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary.main,
    borderRadius: 4,
  },
  shipIndicator: {
    position: 'absolute',
    top: -4,
    marginLeft: -8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipIcon: {
    fontSize: 10,
    color: tokens.colors.primary.main,
  },
});
