import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Rocket, Wifi, WifiOff, MapPin } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { useProcgenStore, selectCurrentSectorMetadata } from '@/stores/procgenStore';
import { ConnectionDot } from '@/components/hud/ConnectionStatus';
import { useSSEConnectionStatus } from '@/contexts/SSEEventContext';

/**
 * HeaderBar - Command Console Top Bar
 * Command Terminal aesthetic with animated glow logo
 * Shows: Logo, player info (callsign, credits), connection status
 */

export function HeaderBar() {
  const { user, profileId } = useAuth();
  const alertLevel = useCockpitStore((s) => s.alertLevel);

  // Get current ship for sector coordinates
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });
  const currentShip = ships?.[0] || null;
  const sectorCoords = currentShip?.current_sector || '0.0.0';

  // Get sector metadata (name, faction) from procgen store
  const sectorMetadata = useProcgenStore(selectCurrentSectorMetadata);
  const sectorName = sectorMetadata?.name || 'Unknown Sector';
  const factionTag = sectorMetadata?.factionTag || null;

  // SSE connection status
  const { isConnected } = useSSEConnectionStatus();

  // Animated glow effect
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [glowAnim]);

  // Alert pulse animation
  const alertPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alertLevel === 'red') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alertPulse, {
            toValue: 1,
            duration: 1000,
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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const alertOverlayOpacity = alertPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  // Parse credits from string (API returns decimal string for precision)
  const credits = user?.credits ? parseInt(user.credits, 10) : 0;

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

      {/* Left: Logo Section */}
      <View style={styles.logoSection}>
        <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]}>
          <Rocket size={24} color={tokens.colors.command.blue} />
        </Animated.View>
        <View style={styles.logoText}>
          <Text style={styles.logoTitle}>SSW</Text>
          <View style={styles.logoSubtitleContainer}>
            <Text style={styles.logoSubtitle}>STARSCAPE</Text>
          </View>
        </View>
      </View>

      {/* Center: Player Info */}
      <View style={styles.statusSection}>
        <View style={styles.playerInfo}>
          <Text style={styles.callsign}>
            {user?.display_name?.toUpperCase() || 'PILOT'}
          </Text>
          <Text style={styles.rank}>COMMANDER</Text>
        </View>
        <View style={styles.creditsBox}>
          <Text style={styles.creditsLabel}>CR</Text>
          <Text style={styles.creditsValue}>
            {credits.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Center-Right: Sector Info */}
      <View style={styles.sectorSection}>
        <View style={styles.sectorInfo}>
          <MapPin size={14} color={tokens.colors.command.gold} />
          <Text style={styles.sectorName}>{sectorName}</Text>
        </View>
        <View style={styles.sectorMeta}>
          <Text style={styles.sectorCoords}>{sectorCoords}</Text>
          {factionTag && (
            <Text style={styles.factionTag}>[{factionTag}]</Text>
          )}
        </View>
      </View>

      {/* Right: Connection Status */}
      <View style={styles.connectionSection}>
        <View style={styles.connectionIndicator}>
          {isConnected ? (
            <Wifi size={16} color={tokens.colors.status.online} />
          ) : (
            <WifiOff size={16} color={tokens.colors.status.danger} />
          )}
          <Text
            style={[
              styles.connectionText,
              { color: isConnected ? tokens.colors.status.online : tokens.colors.status.danger },
            ]}
          >
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </Text>
        </View>
        <ConnectionDot size="small" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.console.deepSpace,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    paddingHorizontal: tokens.spacing.md,
    overflow: 'hidden',
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  logoGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.console.hull,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.command.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  logoText: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.command.blue,
    letterSpacing: 3,
  },
  logoSubtitleContainer: {
    borderLeftWidth: 0,
  },
  logoSubtitle: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: 8,
    color: tokens.colors.text.muted,
    letterSpacing: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.lg,
  },
  playerInfo: {
    alignItems: 'flex-end',
  },
  callsign: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.command.gold,
    letterSpacing: 1,
  },
  rank: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },
  creditsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.console.hull,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
    gap: tokens.spacing.xs,
  },
  creditsLabel: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.muted,
  },
  creditsValue: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.operations.engineering,
  },
  sectorSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  sectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  sectorName: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.command.gold,
  },
  sectorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  sectorCoords: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },
  factionTag: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.muted,
  },
  connectionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  connectionText: {
    fontFamily: tokens.typography.fontFamily.mono,
    fontSize: tokens.typography.fontSize.xs,
    letterSpacing: 1,
  },
});
