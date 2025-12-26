import { View, Text, StyleSheet } from 'react-native';
import { getQualityInfo } from '@/types/mining';

interface QualityIndicatorProps {
  quality: number | string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Visual indicator for resource quality
 * Displays color-coded quality tier based on value (0.50 - 2.00)
 *
 * Quality Tiers:
 * - 0.50-0.79: Poor (red)
 * - 0.80-1.19: Average (yellow)
 * - 1.20-1.59: Good (green)
 * - 1.60-2.00: Excellent (purple)
 */
export default function QualityIndicator({
  quality,
  showLabel = true,
  size = 'medium',
}: QualityIndicatorProps) {
  const qualityInfo = getQualityInfo(quality);
  const qualityValue =
    typeof quality === 'string' ? parseFloat(quality) : quality;

  const sizeStyles = {
    small: { fontSize: 12, padding: 4 },
    medium: { fontSize: 14, padding: 6 },
    large: { fontSize: 16, padding: 8 },
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: qualityInfo.color,
            padding: sizeStyles[size].padding,
          },
        ]}
      >
        <Text
          style={[
            styles.value,
            { fontSize: sizeStyles[size].fontSize },
          ]}
        >
          {qualityValue.toFixed(2)}×
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: qualityInfo.color }]}>
          {qualityInfo.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  value: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
