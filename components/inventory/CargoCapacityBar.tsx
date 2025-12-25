import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface CargoCapacityBarProps {
  used: number;
  capacity: number;
}

export default function CargoCapacityBar({ used, capacity }: CargoCapacityBarProps) {
  const percentage = (used / capacity) * 100;
  const isNearFull = percentage >= 80;
  const isFull = percentage >= 100;

  const getBarColor = () => {
    if (isFull) return '#FF4444';
    if (isNearFull) return '#FFA500';
    return Colors.primary;
  };

  const getTextColor = () => {
    if (isFull) return '#FF4444';
    if (isNearFull) return '#FFA500';
    return 'rgba(255, 255, 255, 0.8)';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Cargo Hold</Text>
        <Text style={[styles.stats, { color: getTextColor() }]}>
          {used} / {capacity} units ({percentage.toFixed(1)}%)
        </Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stats: {
    fontSize: 14,
    fontWeight: '500' as const,
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
});
