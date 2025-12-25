import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InventoryItem } from '@/api/inventory';
import { RESOURCE_METADATA, RARITY_COLORS } from '@/constants/resources';
import Colors from '@/constants/colors';

interface ResourceItemProps {
  item: InventoryItem;
  onPress?: () => void;
  selected?: boolean;
}

export default function ResourceItem({ item, onPress, selected }: ResourceItemProps) {
  const metadata = RESOURCE_METADATA[item.resource_type];
  const qualityPercent = ((item.quality - 0.5) / 1.5) * 100; // 0.5-2.0 mapped to 0-100%

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        { borderColor: selected ? Colors.primary : metadata.color },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: metadata.color }]}>
          {metadata.icon}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{metadata.name}</Text>
        <Text style={styles.description}>{metadata.description}</Text>

        <View style={styles.statsRow}>
          <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          <Text style={[styles.rarity, { color: RARITY_COLORS[metadata.rarity] }]}>
            {metadata.rarity}
          </Text>
        </View>

        {item.quality !== 1.0 && (
          <View style={styles.qualityContainer}>
            <Text style={styles.qualityLabel}>
              Quality: {item.quality.toFixed(2)}x
            </Text>
            <View style={styles.qualityTrack}>
              <View
                style={[
                  styles.qualityFill,
                  {
                    width: `${qualityPercent}%`,
                    backgroundColor: metadata.color,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <Text style={styles.volume}>
          Volume: {item.total_volume} units
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  containerSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
    textShadowColor: 'currentColor',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  quantity: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  rarity: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qualityContainer: {
    marginTop: 4,
  },
  qualityLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  qualityTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
  },
  volume: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
