import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { Swords, Clock, Package } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCombatStore } from '@/stores/combatStore';
import { useLootStore } from '@/stores/lootStore';
import ParticipantCard from './ParticipantCard';
import type { DamageNumber, LootedResource } from '@/types/combat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CombatHUDProps {
  playerId: string;
}

// ============ Damage Number Animation ============

interface DamageNumberAnimProps {
  damage: DamageNumber;
  onComplete: () => void;
}

function DamageNumberAnim({ damage, onComplete }: DamageNumberAnimProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -60,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [opacity, translateY, scale, onComplete]);

  // Position randomly in the combat area
  const left = 30 + Math.random() * (SCREEN_WIDTH - 120);
  const top = 180 + Math.random() * 80;

  return (
    <Animated.View
      style={[
        styles.damageNumber,
        {
          left,
          top,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Text style={styles.damageText}>-{damage.damage}</Text>
    </Animated.View>
  );
}

// ============ Loot Notification ============

interface LootNotificationProps {
  credits: number;
  resources: LootedResource[];
  onDismiss: () => void;
}

function LootNotification({ credits, resources, onDismiss }: LootNotificationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 4000);

    return () => clearTimeout(timer);
  }, [opacity, translateY, onDismiss]);

  const hasLoot = credits > 0 || resources.length > 0;
  if (!hasLoot) return null;

  return (
    <Animated.View
      style={[
        styles.lootNotification,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.lootHeader}>
        <Package size={20} color={tokens.colors.lcars.gold} />
        <Text style={styles.lootTitle}>LOOT ACQUIRED</Text>
      </View>
      <View style={styles.lootContent}>
        {credits > 0 && (
          <Text style={styles.lootCredits}>+{credits.toLocaleString()} Credits</Text>
        )}
        {resources.map((resource, index) => (
          <Text key={index} style={styles.lootResource}>
            +{resource.quantity} {resource.resource_type}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

// ============ Main Combat HUD ============

/**
 * Combat HUD overlay showing active combat state
 * Displays all participants with health bars, combat tick counter,
 * damage number animations, and loot notifications.
 *
 * Per Gap Analysis Sprint 1: Combat Visualization
 */
export default function CombatHUD({ playerId }: CombatHUDProps) {
  const {
    combatInstance,
    currentTick,
    isInCombat,
    damageNumbers,
    removeDamageNumber,
  } = useCombatStore();

  const {
    recentLoot,
    showNotification: showLootNotification,
    dismissNotification: dismissLootNotification,
  } = useLootStore();

  // Animation for HUD appearance
  const hudOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isInCombat) {
      Animated.timing(hudOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      hudOpacity.setValue(0);
    }
  }, [isInCombat, hudOpacity]);

  const handleDamageComplete = useCallback((id: string) => {
    removeDamageNumber(id);
  }, [removeDamageNumber]);

  // Don't render if not in combat and no loot to show
  if (!isInCombat && !showLootNotification) {
    return null;
  }

  // Separate player and enemies
  const playerParticipant = combatInstance?.participants.find(
    (p) => p.player_id === playerId
  );
  const enemyParticipants = combatInstance?.participants.filter(
    (p) => p.player_id !== playerId
  ) || [];

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Combat HUD Panel */}
      {isInCombat && combatInstance && (
        <Animated.View style={[styles.container, { opacity: hudOpacity }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Swords size={20} color={tokens.colors.lcars.orange} />
              <Text style={styles.title}>COMBAT ENGAGED</Text>
            </View>
            <View style={styles.tickCounter}>
              <Clock size={16} color={tokens.colors.text.tertiary} />
              <Text style={styles.tickText}>Tick: {currentTick}</Text>
            </View>
          </View>

          {/* Participants */}
          <ScrollView
            style={styles.participantsScroll}
            contentContainerStyle={styles.participantsContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Player */}
            {playerParticipant && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Ship</Text>
                <ParticipantCard participant={playerParticipant} isPlayer={true} />
              </View>
            )}

            {/* Enemies */}
            {enemyParticipants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {enemyParticipants.length === 1 ? 'Enemy' : 'Enemies'} (
                  {enemyParticipants.length})
                </Text>
                {enemyParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.player_id || participant.ship_id}
                    participant={participant}
                    isPlayer={false}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* Damage Numbers */}
      {damageNumbers.map((damage) => (
        <DamageNumberAnim
          key={damage.id}
          damage={damage}
          onComplete={() => handleDamageComplete(damage.id)}
        />
      ))}

      {/* Loot Notification */}
      {showLootNotification && recentLoot && (
        <LootNotification
          credits={recentLoot.credits}
          resources={recentLoot.resources}
          onDismiss={dismissLootNotification}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.lcars.orange,
    paddingTop: 8,
    maxHeight: '60%',
  },
  header: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    gap: tokens.spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.orange,
    letterSpacing: 1,
  },
  tickCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  tickText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  participantsScroll: {
    maxHeight: 400,
  },
  participantsContainer: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  section: {
    gap: tokens.spacing[2],
  },
  sectionLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Damage Numbers
  damageNumber: {
    position: 'absolute',
    zIndex: 200,
  },
  damageText: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.danger,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Loot Notification
  lootNotification: {
    position: 'absolute',
    bottom: 100,
    left: tokens.spacing[4],
    right: tokens.spacing[4],
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.lcars.gold,
    padding: tokens.spacing[4],
    zIndex: 160,
  },
  lootHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[3],
    paddingBottom: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  lootTitle: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.gold,
    letterSpacing: 1,
  },
  lootContent: {
    gap: tokens.spacing[1],
  },
  lootCredits: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.lcars.gold,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  lootResource: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
