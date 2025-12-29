import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useShipStatus } from '@/hooks/useShipStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * HeaderBar (Status Rail)
 * Per UI/UX Doctrine Section 2: Always visible, 48-56pt height
 * Shows: Ship name, Hull, Shield, Fuel, Location, Alert status
 */

interface VitalBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  critical?: boolean;
}

function VitalBar({ label, current, max, color, critical }: VitalBarProps) {
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
    <Animated.View style={[styles.vitalContainer, { opacity: pulseAnim }]}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <View style={styles.vitalBarOuter}>
        <View
          style={[
            styles.vitalBarInner,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.vitalValue, { color }]}>
        {Math.floor(percentage)}%
      </Text>
    </Animated.View>
  );
}

export function HeaderBar() {
  const { profileId } = useAuth();
  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const alertReason = useCockpitStore((s) => s.alertReason);

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

  // Alert indicator animation
  const alertPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alertLevel === 'red') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alertPulse, {
            toValue: 1,
            duration: 1000, // 0.5Hz per doctrine
            useNativeDriver: true,
          }),
          Animated.timing(alertPulse, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      alertPulse.setValue(0);
    }
  }, [alertLevel, alertPulse]);

  const getAlertColor = () => {
    switch (alertLevel) {
      case 'red': return tokens.colors.alert.red;
      case 'yellow': return tokens.colors.alert.yellow;
      default: return tokens.colors.alert.green;
    }
  };

  const getHullColor = () => {
    if (!shipStatus) return tokens.colors.lcars.green;
    const pct = shipStatus.hull.percentage;
    if (pct < 25) return tokens.colors.lcars.red;
    if (pct < 75) return tokens.colors.lcars.gold;
    return tokens.colors.lcars.green;
  };

  const getShieldColor = () => {
    if (!shipStatus || shipStatus.shield.percentage === 0) {
      return tokens.colors.text.tertiary;
    }
    return tokens.colors.lcars.sky;
  };

  const getFuelColor = () => {
    if (!shipStatus) return tokens.colors.lcars.gold;
    if (shipStatus.fuel.percentage < 10) return tokens.colors.lcars.red;
    if (shipStatus.fuel.percentage < 20) return tokens.colors.lcars.gold;
    return tokens.colors.lcars.gold;
  };

  // Red alert overlay
  const alertOverlayOpacity = alertPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <View style={styles.container}>
      {/* Red alert pulse overlay */}
      {alertLevel === 'red' && (
        <Animated.View
          style={[
            styles.alertOverlay,
            { opacity: alertOverlayOpacity, backgroundColor: tokens.colors.alert.red },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Left: Ship identifier */}
      <View style={styles.leftSection}>
        <Text style={styles.shipName} numberOfLines={1}>
          {shipStatus?.shipName || 'NO SHIP'}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {shipStatus?.location || 'UNKNOWN'}
        </Text>
      </View>

      {/* Center: Vitals */}
      <View style={styles.centerSection}>
        <VitalBar
          label="HULL"
          current={shipStatus?.hull.current || 0}
          max={shipStatus?.hull.max || 100}
          color={getHullColor()}
          critical={shipStatus ? shipStatus.hull.percentage < 25 : false}
        />
        <VitalBar
          label="SHLD"
          current={shipStatus?.shield.current || 0}
          max={shipStatus?.shield.max || 100}
          color={getShieldColor()}
        />
        <VitalBar
          label="FUEL"
          current={shipStatus?.fuel.current || 0}
          max={shipStatus?.fuel.max || 100}
          color={getFuelColor()}
          critical={shipStatus ? shipStatus.fuel.percentage < 10 : false}
        />
      </View>

      {/* Right: Alert status */}
      <View style={styles.rightSection}>
        <View style={[styles.alertIndicator, { backgroundColor: getAlertColor() }]}>
          <Text style={styles.alertText}>
            {alertLevel.toUpperCase()}
          </Text>
        </View>
        {alertReason && alertLevel !== 'green' && (
          <Text style={styles.alertReason} numberOfLines={1}>
            {alertReason}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.panel,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    paddingHorizontal: tokens.spacing[3],
    overflow: 'hidden',
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  leftSection: {
    flex: 1,
    minWidth: 80,
  },
  shipName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.orange,
    textTransform: 'uppercase',
  },
  location: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  centerSection: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: tokens.spacing[4],
  },
  vitalContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    marginBottom: 2,
  },
  vitalBarOuter: {
    width: 40,
    height: 6,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  vitalBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  vitalValue: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 2,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 60,
  },
  alertIndicator: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  alertText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textTransform: 'uppercase',
  },
  alertReason: {
    fontSize: 9,
    color: tokens.colors.text.tertiary,
    marginTop: 2,
  },
});
