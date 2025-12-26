import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Trophy, Skull, ArrowRight, Timer } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCombatStore } from '@/stores/combatStore';
import type { CombatEndReason } from '@/types/combat';

/**
 * Combat results modal shown when combat ends
 * Displays victory/defeat status and combat duration
 */
export default function CombatResults() {
  const { lastCombatResult, showResults, setShowResults } = useCombatStore();

  if (!showResults || !lastCombatResult) {
    return null;
  }

  const isVictory = lastCombatResult.reason === 'victory';
  const isDefeat = lastCombatResult.reason === 'defeat';
  const isFlee = lastCombatResult.reason === 'flee';

  const getIcon = () => {
    if (isVictory) return <Trophy size={48} color={Colors.success} />;
    if (isDefeat) return <Skull size={48} color={Colors.danger} />;
    if (isFlee) return <ArrowRight size={48} color={Colors.warning} />;
    return <Timer size={48} color={Colors.textSecondary} />;
  };

  const getTitle = () => {
    if (isVictory) return 'VICTORY!';
    if (isDefeat) return 'DEFEAT';
    if (isFlee) return 'FLED COMBAT';
    return 'COMBAT ENDED';
  };

  const getMessage = () => {
    if (isVictory) return 'Enemy ship destroyed';
    if (isDefeat) return 'Your ship was destroyed';
    if (isFlee) return 'You successfully fled the battle';
    return 'Combat has ended';
  };

  const getTitleColor = () => {
    if (isVictory) return Colors.success;
    if (isDefeat) return Colors.danger;
    if (isFlee) return Colors.warning;
    return Colors.text;
  };

  const handleClose = () => {
    setShowResults(false);
  };

  return (
    <Modal
      visible={showResults}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>{getIcon()}</View>

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
              <Text style={styles.statValue}>{lastCombatResult.reason}</Text>
            </View>
          </View>

          {/* Loot notice */}
          {isVictory && (
            <View style={styles.lootNotice}>
              <Text style={styles.lootNoticeText}>
                Check your notifications for loot rewards
              </Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.button,
              isVictory && styles.buttonSuccess,
              isDefeat && styles.buttonDanger,
            ]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stats: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  lootNotice: {
    backgroundColor: Colors.success + '20',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  lootNoticeText: {
    fontSize: 12,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 8,
    minWidth: 200,
  },
  buttonSuccess: {
    backgroundColor: Colors.success,
  },
  buttonDanger: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
