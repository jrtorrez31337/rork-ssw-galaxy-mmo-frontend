import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/ui';
import { useQuery } from '@tanstack/react-query';
import { factionsApi } from '@/api/factions';
import { reputationApi } from '@/api/reputation';
import { useAuth } from '@/contexts/AuthContext';
import { tokens } from '@/ui/theme';
import FactionCard from './FactionCard';
import type { Faction } from '@/types/factions';
import type { FactionReputation } from '@/types/api';

interface FactionsListProps {
  onFactionPress: (faction: Faction) => void;
}

export default function FactionsList({ onFactionPress }: FactionsListProps) {
  const { profileId } = useAuth();

  const {
    data: factions,
    isLoading: loadingFactions,
    refetch: refetchFactions,
    isRefetching,
  } = useQuery({
    queryKey: ['factions'],
    queryFn: factionsApi.listFactions,
  });

  const { data: playerReputations } = useQuery({
    queryKey: ['reputations', profileId],
    queryFn: () => reputationApi.getAllReputations(profileId!),
    enabled: !!profileId,
  });

  // Create a map of faction reputations for quick lookup
  const reputationMap = new Map<string, FactionReputation>();
  if (playerReputations?.reputations) {
    playerReputations.reputations.forEach((rep) => {
      reputationMap.set(rep.faction_id, rep);
    });
  }

  if (loadingFactions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary.main} />
        <Text variant="body" color={tokens.colors.text.secondary}>
          Loading factions...
        </Text>
      </View>
    );
  }

  if (!factions || factions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="heading" weight="semibold" color={tokens.colors.text.secondary}>
          No Factions Found
        </Text>
        <Text variant="body" color={tokens.colors.text.tertiary}>
          Unable to load faction data
        </Text>
      </View>
    );
  }

  const renderFaction = ({ item }: { item: Faction }) => {
    const rep = reputationMap.get(item.id);
    return (
      <FactionCard
        faction={item}
        playerReputation={rep?.score}
        playerTier={rep?.tier}
        onPress={() => onFactionPress(item)}
      />
    );
  };

  return (
    <FlatList
      data={factions}
      keyExtractor={(item) => item.id}
      renderItem={renderFaction}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetchFactions}
          tintColor={tokens.colors.primary.main}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[6],
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[6],
  },

  listContent: {
    padding: tokens.spacing[4],
  },

  separator: {
    height: tokens.spacing[3],
  },
});
