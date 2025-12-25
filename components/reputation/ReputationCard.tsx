import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield } from 'lucide-react-native';
import { FactionReputation } from '@/types/api';
import Colors from '@/constants/colors';
import { getTierColor, getFactionName } from './utils';

interface ReputationCardProps {
  reputation: FactionReputation;
  onPress?: () => void;
}

export default function ReputationCard({ reputation, onPress }: ReputationCardProps) {
  const tierColor = getTierColor(reputation.tier);
  const progress = ((reputation.score + 1000) / 2000) * 100;
  const factionName = getFactionName(reputation.faction_id);

  const CardWrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <CardWrapper style={styles.card} {...wrapperProps}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Shield size={20} color={tierColor} />
          <Text style={styles.factionName}>{factionName}</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <Text style={styles.tierText}>{reputation.tier}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: tierColor },
            ]}
          />
        </View>
        <Text style={styles.scoreText}>
          {reputation.score} / 1000
        </Text>
      </View>

      {reputation.effects.length > 0 && (
        <View style={styles.effectsContainer}>
          {reputation.effects.map((effect) => (
            <View key={effect} style={styles.effectTag}>
              <Text style={styles.effectText}>{formatEffect(effect)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.updatedAt}>
        Updated {new Date(reputation.updated_at).toLocaleDateString()}
      </Text>
    </CardWrapper>
  );
}

function formatEffect(effect: string): string {
  return effect
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  factionName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  effectTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  effectText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  updatedAt: {
    fontSize: 11,
    color: Colors.textDim,
    textAlign: 'right',
  },
});
