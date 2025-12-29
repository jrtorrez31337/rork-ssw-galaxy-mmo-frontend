import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Globe, TrendingUp } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import type { Faction } from '@/types/factions';

interface FactionCardProps {
  faction: Faction;
  playerReputation?: number;
  playerTier?: string;
  onPress: () => void;
}

export default function FactionCard({
  faction,
  playerReputation,
  playerTier,
  onPress,
}: FactionCardProps) {
  const formatMemberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getTierColor = (tier?: string): string => {
    switch (tier?.toLowerCase()) {
      case 'exalted':
        return tokens.colors.success;
      case 'revered':
        return '#22C55E';
      case 'honored':
        return '#84CC16';
      case 'friendly':
        return tokens.colors.primary.main;
      case 'neutral':
        return tokens.colors.text.secondary;
      case 'unfriendly':
        return tokens.colors.warning;
      case 'hostile':
        return tokens.colors.danger;
      case 'hated':
        return '#991B1B';
      default:
        return tokens.colors.text.tertiary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: faction.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.emblem, { backgroundColor: faction.color + '30' }]}>
          <Text style={[styles.emblemText, { color: faction.color }]}>
            {faction.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{faction.name}</Text>
          <Text style={styles.homeSystem}>Home: {faction.home_system}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {faction.description}
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Users size={14} color={tokens.colors.text.tertiary} />
          <Text style={styles.statValue}>{formatMemberCount(faction.member_count)}</Text>
          <Text style={styles.statLabel}>members</Text>
        </View>

        {faction.is_playable && (
          <View style={styles.playableBadge}>
            <Globe size={12} color={tokens.colors.success} />
            <Text style={styles.playableText}>Playable</Text>
          </View>
        )}
      </View>

      {/* Player Reputation (if available) */}
      {playerReputation !== undefined && (
        <View style={styles.reputationRow}>
          <TrendingUp size={14} color={getTierColor(playerTier)} />
          <Text style={styles.reputationLabel}>Your Standing:</Text>
          <Text style={[styles.reputationTier, { color: getTierColor(playerTier) }]}>
            {playerTier || 'Unknown'}
          </Text>
          <Text style={styles.reputationValue}>({playerReputation})</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[3],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },

  emblem: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emblemText: {
    fontSize: 24,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  headerInfo: {
    flex: 1,
    gap: tokens.spacing[1],
  },

  name: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  homeSystem: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  description: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  statValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },

  playableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    backgroundColor: tokens.colors.success + '20',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },

  playableText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.success,
  },

  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingTop: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
  },

  reputationLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },

  reputationTier: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  reputationValue: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
