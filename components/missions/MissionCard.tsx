import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  Swords,
  Pickaxe,
  TrendingUp,
  Radar,
  Package,
  Shield,
  Clock,
  Repeat,
  Target,
  Coins,
  Star,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { MissionTemplate } from '@/types/missions';

interface MissionCardProps {
  mission: MissionTemplate;
  onAccept: (templateId: string) => Promise<void>;
}

/**
 * Mission card component for displaying available missions
 * Styled with 2D space adventure aesthetic
 */
export default function MissionCard({ mission, onAccept }: MissionCardProps) {
  const [accepting, setAccepting] = useState(false);

  const getMissionTypeIcon = () => {
    switch (mission.mission_type) {
      case 'combat':
        return <Swords size={20} color={Colors.danger} />;
      case 'mining':
        return <Pickaxe size={20} color={Colors.info} />;
      case 'trade':
        return <TrendingUp size={20} color={Colors.success} />;
      case 'exploration':
        return <Radar size={20} color={Colors.warning} />;
      case 'delivery':
        return <Package size={20} color={Colors.primary} />;
      case 'escort':
        return <Shield size={20} color={Colors.secondary} />;
      case 'patrol':
        return <Target size={20} color={Colors.primary} />;
      default:
        return <Target size={20} color={Colors.primary} />;
    }
  };

  const getMissionTypeColor = () => {
    switch (mission.mission_type) {
      case 'combat':
        return Colors.danger;
      case 'mining':
        return Colors.info;
      case 'trade':
        return Colors.success;
      case 'exploration':
        return Colors.warning;
      case 'delivery':
        return Colors.primary;
      case 'escort':
        return Colors.secondary;
      case 'patrol':
        return Colors.primary;
      default:
        return Colors.primary;
    }
  };

  const handleAccept = async () => {
    Alert.alert(
      'Accept Mission',
      `Accept "${mission.name}"?\n\nThis will add the mission to your active missions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(true);
            try {
              await onAccept(mission.template_id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept mission');
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return '';
    // Simple duration formatting (e.g., "2h", "30m")
    return duration.replace('hours', 'h').replace('minutes', 'm');
  };

  return (
    <View style={[styles.card, { borderColor: getMissionTypeColor() }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {getMissionTypeIcon()}
          <Text style={styles.title} numberOfLines={1}>
            {mission.name}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: getMissionTypeColor() }]}>
          <Text style={styles.typeText}>{mission.mission_type.toUpperCase()}</Text>
        </View>
      </View>

      {/* Faction */}
      {mission.faction_name && (
        <View style={styles.factionRow}>
          <Shield size={14} color={Colors.textSecondary} />
          <Text style={styles.factionText}>{mission.faction_name}</Text>
        </View>
      )}

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {mission.description}
      </Text>

      {/* Requirements */}
      <View style={styles.requirementsRow}>
        <View style={styles.requirement}>
          <Text style={styles.requirementLabel}>Level</Text>
          <Text style={styles.requirementValue}>{mission.required_level}</Text>
        </View>
        {mission.required_reputation > 0 && (
          <View style={styles.requirement}>
            <Text style={styles.requirementLabel}>Reputation</Text>
            <Text style={styles.requirementValue}>{mission.required_reputation}</Text>
          </View>
        )}
      </View>

      {/* Objectives */}
      <View style={styles.objectivesSection}>
        <Text style={styles.sectionTitle}>Objectives:</Text>
        {mission.objectives.slice(0, 3).map((obj, idx) => (
          <View key={idx} style={styles.objectiveRow}>
            <Target size={12} color={Colors.primary} />
            <Text style={styles.objectiveText} numberOfLines={1}>
              {obj.is_required && <Text style={styles.required}>* </Text>}
              {obj.description}
            </Text>
          </View>
        ))}
        {mission.objectives.length > 3 && (
          <Text style={styles.moreObjectives}>
            +{mission.objectives.length - 3} more objectives
          </Text>
        )}
      </View>

      {/* Rewards */}
      <View style={styles.rewardsSection}>
        <Text style={styles.sectionTitle}>Rewards:</Text>
        <View style={styles.rewardsGrid}>
          {mission.reward_credits > 0 && (
            <View style={styles.rewardItem}>
              <Coins size={14} color={Colors.warning} />
              <Text style={styles.rewardText}>{mission.reward_credits} CR</Text>
            </View>
          )}
          {mission.reward_reputation > 0 && (
            <View style={styles.rewardItem}>
              <Star size={14} color={Colors.info} />
              <Text style={styles.rewardText}>{mission.reward_reputation} REP</Text>
            </View>
          )}
          {mission.reward_items.length > 0 && (
            <View style={styles.rewardItem}>
              <Package size={14} color={Colors.success} />
              <Text style={styles.rewardText}>
                {mission.reward_items.length} Items
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Meta info */}
      <View style={styles.metaRow}>
        {mission.time_limit && (
          <View style={styles.metaItem}>
            <Clock size={12} color={Colors.textDim} />
            <Text style={styles.metaText}>
              Limit: {formatDuration(mission.time_limit)}
            </Text>
          </View>
        )}
        {mission.is_repeatable && (
          <View style={styles.metaItem}>
            <Repeat size={12} color={Colors.textDim} />
            <Text style={styles.metaText}>Repeatable</Text>
          </View>
        )}
      </View>

      {/* Accept button */}
      <TouchableOpacity
        style={[
          styles.acceptButton,
          { backgroundColor: getMissionTypeColor() },
          accepting && styles.acceptButtonDisabled,
        ]}
        onPress={handleAccept}
        disabled={accepting}
      >
        <Text style={styles.acceptButtonText}>
          {accepting ? 'Accepting...' : 'Accept Mission'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  factionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  requirementsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  requirementLabel: {
    fontSize: 12,
    color: Colors.textDim,
  },
  requirementValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  objectivesSection: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  objectiveText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  required: {
    color: Colors.danger,
    fontWeight: '700',
  },
  moreObjectives: {
    fontSize: 11,
    color: Colors.textDim,
    fontStyle: 'italic',
    marginLeft: 18,
  },
  rewardsSection: {
    gap: 6,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textDim,
  },
  acceptButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  acceptButtonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
