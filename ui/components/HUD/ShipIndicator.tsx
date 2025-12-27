import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ship } from 'lucide-react-native';
import { Text } from '../Text';
import { Badge } from '../Badge';
import { tokens } from '../../theme';
import type { Ship as ShipType } from '@/types/api';

interface ShipIndicatorProps {
  ship: ShipType | null;
  onPress?: () => void;
}

export function ShipIndicator({ ship, onPress }: ShipIndicatorProps) {
  if (!ship) {
    return (
      <View style={styles.container}>
        <Ship size={tokens.interaction.iconSize.base} color={tokens.colors.text.tertiary} />
        <Text variant="caption" color={tokens.colors.text.tertiary}>
          No Ship
        </Text>
      </View>
    );
  }

  const hullPercent = ship.hull_points / ship.hull_max;
  const statusColor =
    hullPercent > 0.6
      ? tokens.colors.success
      : hullPercent > 0.3
      ? tokens.colors.warning
      : tokens.colors.danger;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress} accessible={!!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Ship size={tokens.interaction.iconSize.base} color={tokens.colors.primary.main} />
      <View style={styles.info}>
        <Text variant="caption" weight="semibold" numberOfLines={1} style={styles.name}>
          {ship.name || 'Unnamed Ship'}
        </Text>
        {ship.docked_at && (
          <Text variant="caption" color={tokens.colors.text.tertiary} style={styles.status}>
            Docked
          </Text>
        )}
      </View>
      <Badge dot variant={hullPercent > 0.6 ? 'success' : hullPercent > 0.3 ? 'warning' : 'danger'} />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  info: {
    gap: tokens.spacing[1],
  },
  name: {
    maxWidth: 100,
  },
  status: {
    fontSize: tokens.typography.fontSize.xs,
  },
});
