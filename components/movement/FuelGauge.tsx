import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface FuelGaugeProps {
  current: number;
  capacity: number;
  showLabel?: boolean;
}

export default function FuelGauge({
  current,
  capacity,
  showLabel = true,
}: FuelGaugeProps) {
  const percentage = (current / capacity) * 100;

  const getBarColor = () => {
    if (percentage > 50) return Colors.success;
    if (percentage > 20) return Colors.accent;
    return Colors.danger;
  };

  const getTextColor = () => {
    if (percentage > 50) return Colors.success;
    if (percentage > 20) return Colors.accent;
    return Colors.danger;
  };

  const isLowFuel = percentage < 20;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.header}>
          <Text style={styles.label}>Fuel</Text>
          <Text style={[styles.stats, { color: getTextColor() }]}>
            {current.toFixed(1)} / {capacity.toFixed(1)} units
          </Text>
        </View>
      )}

      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getBarColor(),
            },
          ]}
        />
      </View>

      {isLowFuel && (
        <Text style={styles.warning}>⚠️ Low fuel warning</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stats: {
    fontSize: 14,
    fontWeight: '500',
  },
  barContainer: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  barFill: {
    height: '100%',
  },
  warning: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
});
