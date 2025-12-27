import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Shield } from 'lucide-react-native';
import { FactionReputation } from '@/types/api';
import Colors from '@/constants/colors';
import ReputationCard from './ReputationCard';

interface ReputationListProps {
  reputations: FactionReputation[];
  isLoading?: boolean;
  onFactionPress?: (factionId: string) => void;
}

const ReputationList = React.memo(function ReputationList({
  reputations,
  isLoading,
  onFactionPress,
}: ReputationListProps) {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading reputation data...</Text>
      </View>
    );
  }

  if (!reputations || reputations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Shield size={48} color={Colors.textDim} />
        <Text style={styles.emptyText}>No Faction Reputations</Text>
        <Text style={styles.emptySubtext}>
          Complete missions and trade to build your reputation
        </Text>
      </View>
    );
  }

  // Sort by score descending - memoized to prevent re-sorting on every render
  const sortedReputations = useMemo(
    () => [...reputations].sort((a, b) => b.score - a.score),
    [reputations]
  );

  return (
    <View style={styles.container}>
      {sortedReputations.map((reputation) => (
        <ReputationCard
          key={reputation.faction_id}
          reputation={reputation}
          onPress={
            onFactionPress
              ? () => onFactionPress(reputation.faction_id)
              : undefined
          }
        />
      ))}
    </View>
  );
});

export default ReputationList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
});
