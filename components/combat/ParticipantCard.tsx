import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Shield, Heart, Skull } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import type { CombatParticipant } from '@/types/combat';
import { getHealthPercentage } from '@/types/combat';

interface ParticipantCardProps {
  participant: CombatParticipant;
  isPlayer?: boolean;
}

/**
 * Combat participant card showing health bars and status
 * Displays animated hull and shield bars with current/max values
 *
 * Per Gap Analysis Sprint 1: Combat Visualization
 */
export default function ParticipantCard({
  participant,
  isPlayer = false,
}: ParticipantCardProps) {
  const hullPercent = getHealthPercentage(
    participant.hull,
    participant.hull_max
  );
  const shieldPercent = getHealthPercentage(
    participant.shield,
    participant.shield_max
  );

  // Animate health bar changes
  const hullAnim = useRef(new Animated.Value(hullPercent)).current;
  const shieldAnim = useRef(new Animated.Value(shieldPercent)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(hullAnim, {
        toValue: hullPercent,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(shieldAnim, {
        toValue: shieldPercent,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [hullPercent, shieldPercent, hullAnim, shieldAnim]);

  const isAlive = participant.is_alive;
  const totalHealth = participant.hull + participant.shield;
  const totalMaxHealth = participant.hull_max + participant.shield_max;

  // Dynamic hull color based on health
  const hullColor = hullPercent > 50
    ? tokens.colors.success
    : hullPercent > 25
      ? tokens.colors.warning
      : tokens.colors.danger;

  return (
    <View
      style={[
        styles.container,
        isPlayer && styles.playerContainer,
        !isAlive && styles.deadContainer,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.name, !isAlive && styles.deadText]}>
          {participant.name}
          {isPlayer && ' (You)'}
        </Text>
        {!isAlive && (
          <View style={styles.deadBadge}>
            <Skull size={14} color={tokens.colors.danger} />
            <Text style={styles.deadBadgeText}>DEFEATED</Text>
          </View>
        )}
      </View>

      {/* Health bars */}
      {isAlive ? (
        <View style={styles.barsContainer}>
          {/* Shield bar */}
          <View style={styles.barRow}>
            <Shield size={14} color={tokens.colors.lcars.sky} />
            <View style={styles.barWrapper}>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[
                    styles.barFill,
                    styles.shieldBar,
                    {
                      width: shieldAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barText}>
                {Math.floor(participant.shield)} / {participant.shield_max}
              </Text>
            </View>
          </View>

          {/* Hull bar */}
          <View style={styles.barRow}>
            <Heart size={14} color={hullColor} />
            <View style={styles.barWrapper}>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[
                    styles.barFill,
                    { backgroundColor: hullColor },
                    {
                      width: hullAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.barText}>
                {Math.floor(participant.hull)} / {participant.hull_max}
              </Text>
            </View>
          </View>

          {/* Total health */}
          <View style={styles.totalHealth}>
            <Text style={styles.totalHealthText}>
              Total: {Math.floor(totalHealth)} / {totalMaxHealth}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.deadMessage}>
          <Text style={styles.deadMessageText}>Ship destroyed</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    borderWidth: 2,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[2],
  },
  playerContainer: {
    borderColor: tokens.colors.primary.main,
    backgroundColor: tokens.colors.surface.base + 'ee',
  },
  deadContainer: {
    borderColor: tokens.colors.danger,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  name: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    flex: 1,
  },
  deadText: {
    color: tokens.colors.text.tertiary,
  },
  deadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    backgroundColor: tokens.colors.danger + '20',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },
  deadBadgeText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.danger,
    letterSpacing: 0.5,
  },
  barsContainer: {
    gap: tokens.spacing[2],
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  barWrapper: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  barBackground: {
    height: 16,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.radius.sm - 1,
  },
  shieldBar: {
    backgroundColor: tokens.colors.lcars.sky,
  },
  hullBar: {
    backgroundColor: tokens.colors.success,
  },
  barText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  totalHealth: {
    alignItems: 'flex-end',
    marginTop: tokens.spacing[1],
  },
  totalHealthText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  deadMessage: {
    paddingVertical: tokens.spacing[2],
    alignItems: 'center',
  },
  deadMessageText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
});
