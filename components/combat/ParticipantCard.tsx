import { View, Text, StyleSheet } from 'react-native';
import { Shield, Heart, Skull } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { CombatParticipant } from '@/types/combat';
import { getHealthPercentage } from '@/types/combat';

interface ParticipantCardProps {
  participant: CombatParticipant;
  isPlayer?: boolean;
}

/**
 * Combat participant card showing health bars and status
 * Displays hull and shield bars with current/max values
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

  const isAlive = participant.is_alive;
  const totalHealth = participant.hull + participant.shield;
  const totalMaxHealth = participant.hull_max + participant.shield_max;

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
            <Skull size={14} color={Colors.danger} />
            <Text style={styles.deadBadgeText}>DEFEATED</Text>
          </View>
        )}
      </View>

      {/* Health bars */}
      {isAlive ? (
        <View style={styles.barsContainer}>
          {/* Shield bar */}
          <View style={styles.barRow}>
            <Shield size={14} color={Colors.primary} />
            <View style={styles.barWrapper}>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    styles.shieldBar,
                    { width: `${shieldPercent}%` },
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
            <Heart size={14} color={Colors.danger} />
            <View style={styles.barWrapper}>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    styles.hullBar,
                    { width: `${hullPercent}%` },
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
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 8,
  },
  playerContainer: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface + 'ee',
  },
  deadContainer: {
    borderColor: Colors.danger,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  deadText: {
    color: Colors.textSecondary,
  },
  deadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.danger,
    letterSpacing: 0.5,
  },
  barsContainer: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    gap: 4,
  },
  barBackground: {
    height: 20,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  shieldBar: {
    backgroundColor: Colors.primary,
  },
  hullBar: {
    backgroundColor: Colors.danger,
  },
  barText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  totalHealth: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  totalHealthText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  deadMessage: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  deadMessageText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
