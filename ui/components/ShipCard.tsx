import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ship as ShipIcon, Package, Navigation, TrendingUp, Pickaxe, Radar } from 'lucide-react-native';
import { Text } from './Text';
import { tokens } from '../theme';
import type { Ship } from '@/types/api';

interface ShipCardProps {
  ship: Ship;
  onControlsPress?: () => void;
  onInventoryPress?: () => void;
  onTradingPress?: () => void;
  onMiningPress?: () => void;
  onSectorPress?: () => void;
}

const getHealthColor = (percent: number) => {
  if (percent > 70) return tokens.colors.success;
  if (percent > 30) return tokens.colors.warning;
  return tokens.colors.danger;
};

export const ShipCard = React.memo(function ShipCard({
  ship,
  onControlsPress,
  onInventoryPress,
  onTradingPress,
  onMiningPress,
  onSectorPress,
}: ShipCardProps) {
  const hullPercent = useMemo(
    () => (ship.hull_points / ship.hull_max) * 100,
    [ship.hull_points, ship.hull_max]
  );

  const shieldPercent = useMemo(
    () => (ship.shield_points / ship.shield_max) * 100,
    [ship.shield_points, ship.shield_max]
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ShipIcon size={20} color={tokens.colors.primary.main} />
          <Text variant="heading" weight="bold">
            {ship.name || 'Unnamed Ship'}
          </Text>
        </View>
        <View style={styles.typeBadge}>
          <Text variant="caption" weight="semibold" color={tokens.colors.text.primary}>
            {ship.ship_type}
          </Text>
        </View>
      </View>

      {/* Location */}
      <Text variant="body" color={tokens.colors.text.secondary} style={styles.location}>
        {ship.location_sector}
        {ship.docked_at && ` • Docked at ${ship.docked_at}`}
      </Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text variant="caption" color={tokens.colors.text.secondary}>
            Hull
          </Text>
          <View style={styles.statBar}>
            <View
              style={[
                styles.statBarFill,
                {
                  width: `${hullPercent}%`,
                  backgroundColor: getHealthColor(hullPercent),
                },
              ]}
            />
          </View>
          <Text variant="caption" weight="semibold">
            {ship.hull_points}/{ship.hull_max}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text variant="caption" color={tokens.colors.text.secondary}>
            Shield
          </Text>
          <View style={styles.statBar}>
            <View
              style={[
                styles.statBarFill,
                {
                  width: `${shieldPercent}%`,
                  backgroundColor: getHealthColor(shieldPercent),
                },
              ]}
            />
          </View>
          <Text variant="caption" weight="semibold">
            {ship.shield_points}/{ship.shield_max}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text variant="caption" color={tokens.colors.text.secondary}>
            Cargo
          </Text>
          <View style={styles.statValue}>
            <Text variant="body" weight="semibold">
              {ship.cargo_capacity}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onControlsPress}
          accessibilityRole="button"
          accessibilityLabel="Ship Controls"
        >
          <Navigation size={16} color={tokens.colors.primary.main} />
          <Text variant="caption" weight="semibold" color={tokens.colors.primary.main}>
            Controls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onInventoryPress}
          accessibilityRole="button"
          accessibilityLabel="Ship Inventory"
        >
          <Package size={16} color={tokens.colors.primary.main} />
          <Text variant="caption" weight="semibold" color={tokens.colors.primary.main}>
            Inventory
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, !ship.docked_at && styles.actionButtonDisabled]}
          onPress={onTradingPress}
          disabled={!ship.docked_at}
          accessibilityRole="button"
          accessibilityLabel={ship.docked_at ? 'Trading' : 'Trading (Dock Required)'}
        >
          <TrendingUp
            size={16}
            color={ship.docked_at ? tokens.colors.primary.main : tokens.colors.text.tertiary}
          />
          <Text
            variant="caption"
            weight="semibold"
            color={ship.docked_at ? tokens.colors.primary.main : tokens.colors.text.tertiary}
          >
            Trading {!ship.docked_at && '(Dock)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, ship.docked_at && styles.actionButtonDisabled]}
          onPress={onMiningPress}
          disabled={!!ship.docked_at}
          accessibilityRole="button"
          accessibilityLabel={!ship.docked_at ? 'Mining' : 'Mining (Undock Required)'}
        >
          <Pickaxe
            size={16}
            color={!ship.docked_at ? tokens.colors.primary.main : tokens.colors.text.tertiary}
          />
          <Text
            variant="caption"
            weight="semibold"
            color={!ship.docked_at ? tokens.colors.primary.main : tokens.colors.text.tertiary}
          >
            Mining {ship.docked_at && '(Undock)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonFull, ship.docked_at && styles.actionButtonDisabled]}
          onPress={onSectorPress}
          disabled={!!ship.docked_at}
          accessibilityRole="button"
          accessibilityLabel={!ship.docked_at ? 'Sector View' : 'Sector View (Undock Required)'}
        >
          <Radar
            size={16}
            color={!ship.docked_at ? tokens.colors.primary.main : tokens.colors.text.tertiary}
          />
          <Text
            variant="caption"
            weight="semibold"
            color={!ship.docked_at ? tokens.colors.primary.main : tokens.colors.text.tertiary}
          >
            Sector View {ship.docked_at && '(Undock)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    flex: 1,
  },
  location: {
    marginTop: -tokens.spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  stat: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  statBar: {
    height: 6,
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.sm,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: tokens.radius.sm,
  },
  statValue: {
    height: 6,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[1],
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.primary.main,
  },
  actionButtonFull: {
    flex: undefined,
    width: '100%',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    borderColor: tokens.colors.border.default,
  },
  typeBadge: {
    backgroundColor: tokens.colors.surface.raised,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.base,
  },
});
