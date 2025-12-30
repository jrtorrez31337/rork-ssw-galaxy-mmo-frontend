import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AlertTriangle, Shield, Swords } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import type { SectorControlData } from '@/hooks/useSectorControl';

/**
 * ThreatIndicator - Warning overlay for hostile/contested territory
 *
 * Displays strategic awareness information:
 * - Contested zone warning (pulsing)
 * - Enemy territory warning (red alert)
 * - War zone indicator (active combat)
 *
 * Per UI/UX Doctrine: Real-time strategic awareness
 */

interface ThreatIndicatorProps {
  /** Sector control data */
  controlData: SectorControlData | null;
  /** Position in the view */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export function ThreatIndicator({
  controlData,
  position = 'top-right',
  compact = false,
}: ThreatIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for threat warnings
  useEffect(() => {
    if (controlData?.isWarZone || (controlData?.threatLevel ?? 0) > 50) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (controlData?.isContested) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [controlData?.isWarZone, controlData?.isContested, controlData?.threatLevel, pulseAnim]);

  // Don't show for safe/neutral sectors
  if (!controlData || (controlData.status === 'neutral' && !controlData.isWarZone)) {
    return null;
  }

  // Don't show if threat level is low and not contested
  if (controlData.threatLevel < 25 && !controlData.isContested && !controlData.isWarZone) {
    return null;
  }

  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: 8, left: 8 };
      case 'top-right':
        return { top: 8, right: 8 };
      case 'bottom-left':
        return { bottom: 8, left: 8 };
      case 'bottom-right':
        return { bottom: 8, right: 8 };
    }
  };

  const getThreatLevel = () => {
    if (controlData.isWarZone) return 'war';
    if (controlData.threatLevel > 75) return 'high';
    if (controlData.threatLevel > 50) return 'medium';
    if (controlData.isContested) return 'contested';
    return 'low';
  };

  const threatLevel = getThreatLevel();

  const getIndicatorStyle = () => {
    switch (threatLevel) {
      case 'war':
        return {
          backgroundColor: tokens.colors.alert.red,
          borderColor: tokens.colors.alert.red,
        };
      case 'high':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          borderColor: tokens.colors.alert.red,
        };
      case 'medium':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.9)',
          borderColor: tokens.colors.alert.yellow,
        };
      case 'contested':
        return {
          backgroundColor: 'rgba(139, 92, 246, 0.9)',
          borderColor: '#8B5CF6',
        };
      default:
        return {
          backgroundColor: tokens.colors.background.tertiary,
          borderColor: tokens.colors.border.default,
        };
    }
  };

  const getIcon = () => {
    const iconSize = compact ? 12 : 16;
    const iconColor = tokens.colors.text.inverse;

    switch (threatLevel) {
      case 'war':
        return <Swords size={iconSize} color={iconColor} />;
      case 'high':
      case 'medium':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'contested':
        return <Shield size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (threatLevel) {
      case 'war':
        return 'WAR ZONE';
      case 'high':
        return 'HOSTILE';
      case 'medium':
        return 'CAUTION';
      case 'contested':
        return 'CONTESTED';
      default:
        return '';
    }
  };

  const indicatorStyle = getIndicatorStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        compact ? styles.containerCompact : null,
        getPositionStyle(),
        indicatorStyle,
        { opacity: pulseAnim },
      ]}
    >
      {getIcon()}
      {!compact && (
        <Text style={styles.label}>{getLabel()}</Text>
      )}
      {!compact && controlData.threatLevel > 0 && (
        <Text style={styles.threatValue}>{controlData.threatLevel}%</Text>
      )}
    </Animated.View>
  );
}

/**
 * ThreatBanner - Full-width warning banner for critical alerts
 */
interface ThreatBannerProps {
  controlData: SectorControlData | null;
  onDismiss?: () => void;
}

export function ThreatBanner({ controlData, onDismiss }: ThreatBannerProps) {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const shouldShow = controlData?.isWarZone || (controlData?.threatLevel ?? 0) > 50;

    if (shouldShow) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();

      // Start pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
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
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [controlData?.isWarZone, controlData?.threatLevel, slideAnim, pulseAnim]);

  if (!controlData?.isWarZone && (controlData?.threatLevel ?? 0) <= 50) {
    return null;
  }

  const getMessage = () => {
    if (controlData?.isWarZone) {
      return `ENTERING WAR ZONE - ${controlData.controllingFaction?.name || 'Unknown'} controlled`;
    }
    if (controlData?.isContested) {
      return `CONTESTED TERRITORY - ${controlData.controllingFaction?.name || 'Unknown'} vs ${controlData.contestingFaction?.name || 'Unknown'}`;
    }
    return `HOSTILE TERRITORY - ${controlData?.controllingFaction?.name || 'Unknown'} controlled`;
  };

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          opacity: pulseAnim,
        },
      ]}
    >
      <AlertTriangle size={16} color={tokens.colors.text.inverse} />
      <Text style={styles.bannerText}>{getMessage()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
  containerCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: tokens.radius.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  threatValue: {
    fontSize: 9,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
    opacity: 0.8,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: tokens.colors.alert.red,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ThreatIndicator;
