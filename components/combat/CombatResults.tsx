import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Trophy, Skull, ArrowRight, Timer } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCombatStore } from '@/stores/combatStore';
import type { CombatEndReason } from '@/types/combat';

/**
 * Combat results modal shown when combat ends
 * Displays victory/defeat status and combat duration
 *
 * Per Gap Analysis Sprint 1: Combat Visualization
 */
export default function CombatResults() {
  const { lastCombatResult, showResults, setShowResults, endCombat } = useCombatStore();

  // Scale animation for dramatic entrance
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showResults) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [showResults, scaleAnim, opacityAnim]);

  if (!showResults || !lastCombatResult) {
    return null;
  }

  const isVictory = lastCombatResult.reason === 'victory';
  const isDefeat = lastCombatResult.reason === 'defeat';
  const isFlee = lastCombatResult.reason === 'flee';

  const getIcon = () => {
    if (isVictory) return <Trophy size={48} color={tokens.colors.success} />;
    if (isDefeat) return <Skull size={48} color={tokens.colors.danger} />;
    if (isFlee) return <ArrowRight size={48} color={tokens.colors.warning} />;
    return <Timer size={48} color={tokens.colors.text.tertiary} />;
  };

  const getTitle = () => {
    if (isVictory) return 'VICTORY!';
    if (isDefeat) return 'DEFEAT';
    if (isFlee) return 'ESCAPED';
    return 'DISENGAGED';
  };

  const getMessage = () => {
    if (isVictory) return 'Enemy ship destroyed';
    if (isDefeat) return 'Your ship was destroyed';
    if (isFlee) return 'You successfully fled the battle';
    return 'Combat has ended';
  };

  const getTitleColor = () => {
    if (isVictory) return tokens.colors.success;
    if (isDefeat) return tokens.colors.danger;
    if (isFlee) return tokens.colors.warning;
    return tokens.colors.text.primary;
  };

  const handleClose = () => {
    setShowResults(false);
    endCombat();
  };

  return (
    <Modal
      visible={showResults}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              borderColor: getTitleColor(),
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { borderColor: getTitleColor() }]}>
            {getIcon()}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: getTitleColor() }]}>
            {getTitle()}
          </Text>

          {/* Message */}
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Combat Duration:</Text>
              <Text style={styles.statValue}>
                {lastCombatResult.totalTicks} ticks
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Outcome:</Text>
              <Text style={[styles.statValue, { color: getTitleColor() }]}>
                {lastCombatResult.reason.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Loot notice */}
          {isVictory && (
            <View style={styles.lootNotice}>
              <Text style={styles.lootNoticeText}>
                Loot rewards will appear shortly
              </Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: getTitleColor() },
            ]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[5],
  },
  container: {
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[6],
    width: '100%',
    maxWidth: 400,
    borderWidth: 3,
    borderColor: tokens.colors.border.default,
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing[2],
  },
  title: {
    fontSize: tokens.typography.fontSize['3xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  message: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  stats: {
    width: '100%',
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    gap: tokens.spacing[2],
    marginTop: tokens.spacing[2],
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  statValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  lootNotice: {
    backgroundColor: tokens.colors.success + '20',
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    width: '100%',
    borderWidth: 1,
    borderColor: tokens.colors.success + '40',
  },
  lootNoticeText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.success,
    textAlign: 'center',
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  button: {
    backgroundColor: tokens.colors.primary.main,
    paddingVertical: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[8],
    borderRadius: tokens.radius.base,
    marginTop: tokens.spacing[2],
    minWidth: 200,
  },
  buttonText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
