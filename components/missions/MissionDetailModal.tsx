import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useEffect, useRef } from 'react';
import {
  X,
  Target,
  Coins,
  Star,
  Package,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { Mission, Objective } from '@/types/missions';

interface MissionDetailModalProps {
  mission: Mission | null;
  visible: boolean;
  onClose: () => void;
  onAbandon?: (missionId: string) => Promise<void>;
}

/**
 * Mission detail modal component
 * Full-screen detailed view of an active mission
 */
export default function MissionDetailModal({
  mission,
  visible,
  onClose,
  onAbandon,
}: MissionDetailModalProps) {
  if (!mission) return null;

  const handleAbandon = () => {
    Alert.alert(
      'Abandon Mission',
      `Are you sure you want to abandon "${mission.template_name}"?\n\nYou will not receive any rewards and the mission will be removed from your active missions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            if (onAbandon) {
              await onAbandon(mission.id);
              onClose();
            }
          },
        },
      ]
    );
  };

  const getTimeRemaining = () => {
    if (!mission.expires_at) return null;

    const now = new Date();
    const expiry = new Date(mission.expires_at);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'EXPIRED';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const timeRemaining = getTimeRemaining();
  const isExpiringSoon =
    mission.expires_at &&
    timeRemaining &&
    timeRemaining !== 'EXPIRED' &&
    new Date(mission.expires_at).getTime() - new Date().getTime() < 30 * 60 * 1000;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={2}>
              {mission.template_name}
            </Text>
            {mission.faction_name && (
              <Text style={styles.faction}>{mission.faction_name}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress section */}
          <View style={styles.section}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Mission Progress</Text>
              <Text style={styles.progressPercentage}>
                {mission.progress_percentage}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${mission.progress_percentage}%` },
                ]}
              />
            </View>
            {timeRemaining && (
              <View
                style={[
                  styles.timeRemainingContainer,
                  isExpiringSoon && styles.timeRemainingExpiring,
                ]}
              >
                <Clock
                  size={16}
                  color={isExpiringSoon ? Colors.danger : Colors.warning}
                />
                <Text
                  style={[
                    styles.timeRemainingText,
                    isExpiringSoon && styles.timeRemainingTextExpiring,
                  ]}
                >
                  {timeRemaining}
                </Text>
                {isExpiringSoon && (
                  <AlertTriangle size={16} color={Colors.danger} />
                )}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mission Briefing</Text>
            <Text style={styles.description}>{mission.description}</Text>
          </View>

          {/* Objectives */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectives</Text>
            <View style={styles.objectivesList}>
              {mission.objectives.map((objective) => (
                <ObjectiveItem key={objective.id} objective={objective} />
              ))}
            </View>
          </View>

          {/* Rewards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <View style={styles.rewardsList}>
              {mission.reward_credits > 0 && (
                <View style={styles.rewardItem}>
                  <Coins size={20} color={Colors.warning} />
                  <Text style={styles.rewardText}>
                    {mission.reward_credits.toLocaleString()} Credits
                  </Text>
                </View>
              )}
              {mission.reward_reputation > 0 && (
                <View style={styles.rewardItem}>
                  <Star size={20} color={Colors.info} />
                  <Text style={styles.rewardText}>
                    {mission.reward_reputation} Reputation
                  </Text>
                </View>
              )}
              {mission.reward_items && mission.reward_items.length > 0 && (
                <>
                  {mission.reward_items.map((item, idx) => (
                    <View key={idx} style={styles.rewardItem}>
                      <Package size={20} color={Colors.success} />
                      <Text style={styles.rewardText}>
                        {item.quantity}x {item.resource_type} (Q{item.quality})
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer actions */}
        {onAbandon && mission.status === 'active' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.abandonButton}
              onPress={handleAbandon}
            >
              <Text style={styles.abandonButtonText}>Abandon Mission</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

interface ObjectiveItemProps {
  objective: Objective;
}

function ObjectiveItem({ objective }: ObjectiveItemProps) {
  const progressAnim = useRef(
    new Animated.Value(
      (objective.current_progress / objective.target_quantity) * 100
    )
  ).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (objective.current_progress / objective.target_quantity) * 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [objective.current_progress, objective.target_quantity]);

  const isCompleted = objective.status === 'completed';
  const isFailed = objective.status === 'failed';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.objectiveItem, isCompleted && styles.objectiveItemCompleted]}>
      <View style={styles.objectiveHeader}>
        <View style={styles.objectiveHeaderLeft}>
          <View
            style={[
              styles.objectiveCheckbox,
              isCompleted && styles.objectiveCheckboxCompleted,
              isFailed && styles.objectiveCheckboxFailed,
            ]}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            {isFailed && <Text style={styles.checkmark}>✕</Text>}
          </View>
          <View style={styles.objectiveInfo}>
            <View style={styles.objectiveTitleRow}>
              <Text
                style={[
                  styles.objectiveDescription,
                  isCompleted && styles.objectiveDescriptionCompleted,
                ]}
              >
                {objective.description}
              </Text>
              {objective.is_required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.objectiveType}>{objective.objective_type}</Text>
          </View>
        </View>
        <Text style={styles.objectiveProgress}>
          {objective.current_progress}/{objective.target_quantity}
        </Text>
      </View>

      {/* Progress bar */}
      {!isCompleted && !isFailed && (
        <View style={styles.objectiveProgressBar}>
          <Animated.View
            style={[
              styles.objectiveProgressFill,
              { width: progressWidth },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 30,
  },
  faction: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: 6,
  },
  timeRemainingExpiring: {
    backgroundColor: `${Colors.danger}15`,
  },
  timeRemainingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
    flex: 1,
  },
  timeRemainingTextExpiring: {
    color: Colors.danger,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  objectivesList: {
    gap: 12,
  },
  objectiveItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  objectiveItemCompleted: {
    backgroundColor: `${Colors.success}10`,
    borderColor: Colors.success,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  objectiveHeaderLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  objectiveCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  objectiveCheckboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  objectiveCheckboxFailed: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  objectiveInfo: {
    flex: 1,
    gap: 4,
  },
  objectiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  objectiveDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  objectiveDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textDim,
  },
  requiredBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  objectiveType: {
    fontSize: 11,
    color: Colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  objectiveProgress: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  objectiveProgressBar: {
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  objectiveProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  rewardsList: {
    gap: 10,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  abandonButton: {
    backgroundColor: Colors.danger,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  abandonButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
