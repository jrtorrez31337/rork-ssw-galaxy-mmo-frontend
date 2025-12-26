import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Swords, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCombatStore } from '@/stores/combatStore';
import ParticipantCard from './ParticipantCard';

interface CombatHUDProps {
  playerId: string;
}

/**
 * Combat HUD overlay showing active combat state
 * Displays all participants with health bars and combat tick counter
 */
export default function CombatHUD({ playerId }: CombatHUDProps) {
  const { combatInstance, currentTick, isInCombat } = useCombatStore();

  if (!isInCombat || !combatInstance) {
    return null;
  }

  // Separate player and enemies
  const playerParticipant = combatInstance.participants.find(
    (p) => p.player_id === playerId
  );
  const enemyParticipants = combatInstance.participants.filter(
    (p) => p.player_id !== playerId
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Swords size={20} color={Colors.danger} />
          <Text style={styles.title}>COMBAT ACTIVE</Text>
        </View>
        <View style={styles.tickCounter}>
          <Clock size={16} color={Colors.textSecondary} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background + 'f5',
    borderBottomWidth: 2,
    borderBottomColor: Colors.danger,
    paddingTop: 50, // Account for status bar
    maxHeight: '60%',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.danger,
    letterSpacing: 1,
  },
  tickCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  participantsScroll: {
    maxHeight: 400,
  },
  participantsContainer: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
