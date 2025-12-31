import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Shield, Zap, Fuel, Package, Anchor, Navigation } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { useShipStatus } from '@/hooks/useShipStatus';

/**
 * StatusBar - Ship Status Display
 * Command Console aesthetic - shows vitals, location, cargo
 * Located at the bottom of the viewport
 */

interface StatusGaugeProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  critical?: boolean;
}

function StatusGauge({ label, current, max, color, icon, critical }: StatusGaugeProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (critical) {
      Animated.loop(
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
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [critical, pulseAnim]);

  return (
    <Animated.View style={[styles.statusItem, { opacity: pulseAnim }]}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={styles.statusBarContainer}>
        <View
          style={[
            styles.statusBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.statusValue}>{Math.floor(percentage)}%</Text>
    </Animated.View>
  );
}

export function StatusBar() {
  const { profileId } = useAuth();

  // Fetch current ship
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const shipStatus = useShipStatus({
    ship: currentShip,
    characterId: profileId || undefined,
  });

  // Color helpers
  const getHullColor = () => {
    if (!shipStatus) return tokens.colors.status.online;
    const pct = shipStatus.hull.percentage;
    if (pct < 25) return tokens.colors.alert.critical;
    if (pct < 75) return tokens.colors.alert.warning;
    return tokens.colors.status.online;
  };

  const getShieldColor = () => {
    return tokens.colors.command.blue;
  };

  const getFuelColor = () => {
    if (!shipStatus) return tokens.colors.operations.orange;
    if (shipStatus.fuel.percentage < 10) return tokens.colors.alert.critical;
    if (shipStatus.fuel.percentage < 20) return tokens.colors.alert.warning;
    return tokens.colors.operations.orange;
  };

  const isDocked = currentShip?.docked || false;

  return (
    <View style={styles.container}>
      {/* Left: Ship Status Gauges */}
      <View style={styles.shipStatusSection}>
        <StatusGauge
          label="HULL"
          current={shipStatus?.hull.current || 0}
          max={shipStatus?.hull.max || 100}
          color={getHullColor()}
          icon={<Shield size={12} color={getHullColor()} />}
          critical={shipStatus ? shipStatus.hull.percentage < 25 : false}
        />
        <StatusGauge
          label="SHLD"
          current={shipStatus?.shield.current || 0}
          max={shipStatus?.shield.max || 100}
          color={getShieldColor()}
          icon={<Zap size={12} color={getShieldColor()} />}
        />
        <StatusGauge
          label="FUEL"
          current={shipStatus?.fuel.current || 0}
          max={shipStatus?.fuel.max || 100}
          color={getFuelColor()}
          icon={<Fuel size={12} color={getFuelColor()} />}
          critical={shipStatus ? shipStatus.fuel.percentage < 10 : false}
        />
      </View>

      {/* Center: Location Info */}
      <View style={styles.locationSection}>
        <Text style={styles.locationLabel}>LOCATION</Text>
        <View style={styles.locationValueRow}>
          {isDocked ? (
            <Anchor size={12} color={tokens.colors.command.gold} />
          ) : (
            <Navigation size={12} color={tokens.colors.command.blue} />
          )}
          <Text style={styles.locationValue}>
            {isDocked ? 'DOCKED' : 'IN FLIGHT'} • {shipStatus?.location?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
      </View>

      {/* Right: Cargo Info */}
      <View style={styles.cargoSection}>
        <Text style={styles.cargoLabel}>CARGO</Text>
        <View style={styles.cargoValueRow}>
          <Package size={12} color={tokens.colors.operations.engineering} />
          <Text style={styles.cargoValue}>
            {currentShip?.cargo_used || 0}/{currentShip?.cargo_capacity || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.console.deepSpace,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    paddingHorizontal: tokens.spacing.md,
  },
  shipStatusSection: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  statusLabel: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.muted,
    width: 32,
  },
  statusBarContainer: {
    width: 60,
    height: 6,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusValue: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    width: 32,
  },
  locationSection: {
    alignItems: 'center',
  },
  locationLabel: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: 9,
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  locationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  locationValue: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
  },
  cargoSection: {
    alignItems: 'flex-end',
  },
  cargoLabel: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: 9,
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  cargoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  cargoValue: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
});
