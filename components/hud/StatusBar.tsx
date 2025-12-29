import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { ShipStatus } from '@/hooks/useShipStatus';
import { Ship, Zap, Shield, DollarSign, Target, Bell } from 'lucide-react-native';

interface StatusBarProps {
  status: ShipStatus | null;
  onTapFuel?: () => void;
  onTapHull?: () => void;
  onTapShield?: () => void;
  onTapCredits?: () => void;
  onTapMissions?: () => void;
  onTapAlerts?: () => void;
}

/**
 * Persistent Status Bar (HUD Shell)
 * Always visible at top of screen showing critical ship stats
 * According to B1-ux-system-definition.md (lines 72-142)
 */
export function StatusBar({
  status,
  onTapFuel,
  onTapHull,
  onTapShield,
  onTapCredits,
  onTapMissions,
  onTapAlerts,
}: StatusBarProps) {
  if (!status) {
    return null; // Don't show status bar if no ship data
  }

  // Semantic colors based on percentage thresholds
  const getFuelColor = () => {
    return status.fuel.percentage < 20 ? '#FFAA00' : '#FFFF00';
  };

  const getHullColor = () => {
    if (status.hull.percentage < 25) return '#FF4444'; // Critical
    if (status.hull.percentage < 75) return '#FFAA00'; // Damaged
    return '#44FF44'; // Healthy
  };

  const getShieldColor = () => {
    return status.shield.percentage > 0 ? '#00AAFF' : '#666666'; // Active/Down
  };

  return (
    <View style={styles.container}>
      {/* Left side: Ship info */}
      <View style={styles.leftSection}>
        <View style={styles.infoGroup}>
          <Ship size={14} color={tokens.colors.text.secondary} />
          <Text style={styles.shipName} numberOfLines={1}>
            {status.shipName}
          </Text>
        </View>
        <Text style={styles.locationText} numberOfLines={1}>
          Sector {status.location}
        </Text>
      </View>

      {/* Center: Ship vitals */}
      <View style={styles.centerSection}>
        {/* Fuel */}
        <TouchableOpacity
          style={styles.stat}
          onPress={onTapFuel}
          activeOpacity={0.7}
        >
          <Zap size={12} color={getFuelColor()} />
          <Text style={[styles.statValue, { color: getFuelColor() }]}>
            {Math.floor(status.fuel.current)}/{status.fuel.max}
          </Text>
        </TouchableOpacity>

        {/* Hull */}
        <TouchableOpacity
          style={styles.stat}
          onPress={onTapHull}
          activeOpacity={0.7}
        >
          <View style={styles.statIcon}>
            <Text style={[styles.statLabel, { color: getHullColor() }]}>HP</Text>
          </View>
          <Text style={[styles.statValue, { color: getHullColor() }]}>
            {Math.floor(status.hull.current)}/{status.hull.max}
          </Text>
        </TouchableOpacity>

        {/* Shield */}
        <TouchableOpacity
          style={styles.stat}
          onPress={onTapShield}
          activeOpacity={0.7}
        >
          <Shield size={12} color={getShieldColor()} />
          <Text style={[styles.statValue, { color: getShieldColor() }]}>
            {Math.floor(status.shield.current)}/{status.shield.max}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right side: Economy & Notifications */}
      <View style={styles.rightSection}>
        {/* Credits */}
        <TouchableOpacity
          style={styles.stat}
          onPress={onTapCredits}
          activeOpacity={0.7}
        >
          <DollarSign size={12} color={tokens.colors.warning} />
          <Text style={styles.statValue}>
            {status.credits.toLocaleString()} CR
          </Text>
        </TouchableOpacity>

        {/* Missions */}
        <TouchableOpacity
          style={styles.stat}
          onPress={onTapMissions}
          activeOpacity={0.7}
        >
          <Target size={12} color={tokens.colors.primary.main} />
          <Text style={styles.statValue}>{status.activeMissions}</Text>
        </TouchableOpacity>

        {/* Alerts */}
        <TouchableOpacity
          style={styles.stat}
          onPress={onTapAlerts}
          activeOpacity={0.7}
        >
          <Bell size={12} color={tokens.colors.danger} />
          {status.unreadAlerts > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {status.unreadAlerts > 99 ? '99+' : status.unreadAlerts}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48, // Compact mode (B1 spec: 48-60px)
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent (B1 spec: 80% opacity)
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  shipName: {
    fontFamily: tokens.typography.fontFamily.mono, // Monospace (B1 spec)
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },

  locationText: {
    fontFamily: tokens.typography.fontFamily.mono, // Monospace (B1 spec)
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },

  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },

  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacing[4],
  },

  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    minWidth: tokens.interaction.minTouchTarget, // 44px min touch target (B1 spec)
    minHeight: tokens.interaction.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[1],
  },

  statIcon: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statLabel: {
    fontFamily: tokens.typography.fontFamily.mono, // Monospace (B1 spec)
    fontSize: 8,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  statValue: {
    fontFamily: tokens.typography.fontFamily.mono, // Monospace (B1 spec)
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: tokens.colors.danger,
    borderRadius: tokens.radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[1],
  },

  badgeText: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: 8,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.bold,
  },
});
