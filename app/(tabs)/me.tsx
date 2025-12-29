import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Plus, Shield, LogOut, Flag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TopBar, Text, Button, CharacterCard, EmptyState, Spinner, BottomSheet, Divider, CharacterCardSkeleton } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { characterApi } from '@/api/characters';
import { reputationApi } from '@/api/reputation';
import ReputationList from '@/components/reputation/ReputationList';
import ReputationHistory from '@/components/reputation/ReputationHistory';
import { ReputationCardSkeleton } from '@/components/reputation/ReputationCardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useReputationEvents } from '@/hooks/useReputationEvents';
import { getFactionName } from '@/components/reputation/utils';
import { CharacterEditPanel } from '@/components/character/CharacterEditPanel';
import type { ReputationTierChangeEvent, Character } from '@/types/api';

export default function MeTab() {
  const router = useRouter();
  const { user, profileId, logout } = useAuth();
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const { data: characters, isLoading: loadingCharacters } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId,
  });

  const { data: reputations, isLoading: loadingReputations } = useQuery({
    queryKey: ['reputations', profileId],
    queryFn: () => reputationApi.getAllReputations(profileId!),
    enabled: !!profileId,
  });

  const { data: reputationHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['reputationHistory', profileId, selectedFactionId],
    queryFn: () =>
      reputationApi.getReputationHistory(profileId!, {
        faction_id: selectedFactionId || undefined,
        limit: 50,
      }),
    enabled: !!profileId && !!selectedFactionId && historyVisible,
  });

  const currentShip = ships?.[0] || null;

  const handleFactionPress = useCallback((factionId: string) => {
    setSelectedFactionId(factionId);
    setHistoryVisible(true);
  }, []);

  const handleReputationTierChange = (event: ReputationTierChangeEvent) => {
    const factionName = getFactionName(event.faction_id);
    Alert.alert(
      'Reputation Changed',
      `Your reputation with ${factionName} changed from ${event.old_tier} to ${event.new_tier}!`,
      [{ text: 'OK' }]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  // Subscribe to real-time reputation events
  useReputationEvents(profileId || '', {
    onTierChange: handleReputationTierChange,
  });

  return (
    <ErrorBoundary fallbackTitle="Profile Tab Error">
      <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        ship={currentShip}
        location={currentShip?.location_sector || 'Unknown'}
        dockedAt={currentShip?.docked_at}
        credits={parseFloat(user?.credits || '0')}
        quickActions={[]}
      />

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text variant="caption" color={tokens.colors.text.secondary}>
            Welcome back,
          </Text>
          <Text variant="title" weight="bold">
            {user?.display_name}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} color={tokens.colors.danger} />
          <Text variant="caption" weight="semibold" color={tokens.colors.danger}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ type: 'characters' as const }, { type: 'reputation' as const }]}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => {
          if (item.type === 'characters') {
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <User size={20} color={tokens.colors.primary.main} />
                    <Text variant="heading" weight="bold">
                      Characters
                    </Text>
                  </View>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onPress={() => router.push('/character-create')}
                  >
                    New
                  </Button>
                </View>

                {loadingCharacters ? (
                  <View style={styles.cardList}>
                    <CharacterCardSkeleton />
                    <CharacterCardSkeleton />
                  </View>
                ) : characters && characters.length > 0 ? (
                  <View style={styles.cardList}>
                    {characters.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        onEdit={setEditingCharacter}
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon={User}
                    title="No characters yet"
                    description="Create your first character to start your journey"
                    action={{
                      label: 'Create Character',
                      onPress: () => router.push('/character-create'),
                    }}
                  />
                )}
              </View>
            );
          }

          return (
            <>
              <Divider />
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Shield size={20} color={tokens.colors.primary.main} />
                    <Text variant="heading" weight="bold">
                      Faction Reputation
                    </Text>
                  </View>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Flag}
                    onPress={() => router.push('/factions')}
                  >
                    All Factions
                  </Button>
                </View>

                {loadingReputations ? (
                  <View>
                    <ReputationCardSkeleton />
                    <ReputationCardSkeleton />
                    <ReputationCardSkeleton />
                  </View>
                ) : reputations && reputations.reputations.length > 0 ? (
                  <ReputationList
                    reputations={reputations.reputations}
                    onFactionPress={handleFactionPress}
                  />
                ) : (
                  <EmptyState
                    icon={Shield}
                    title="No reputation data"
                    description="Your faction standings will appear here"
                  />
                )}
              </View>
            </>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Reputation History Modal */}
      {selectedFactionId && (
        <BottomSheet
          visible={historyVisible}
          height="threequarter"
          onClose={() => setHistoryVisible(false)}
          showHandle
          backdrop
        >
          <Text variant="title" weight="bold" style={styles.modalTitle}>
            Reputation History
          </Text>
          <ReputationHistory
            events={reputationHistory?.events || []}
            isLoading={loadingHistory}
          />
        </BottomSheet>
      )}

      {/* Character Edit Panel */}
      {editingCharacter && (
        <CharacterEditPanel
          character={editingCharacter}
          visible={!!editingCharacter}
          onClose={() => setEditingCharacter(null)}
        />
      )}
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
    backgroundColor: tokens.colors.surface.base,
  },
  profileInfo: {
    gap: tokens.spacing[1],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
  },
  content: {
    flex: 1,
  },
  section: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  loadingContainer: {
    padding: tokens.spacing[8],
    alignItems: 'center',
  },
  cardList: {
    gap: tokens.spacing[3],
  },
  modalTitle: {
    marginBottom: tokens.spacing[4],
  },
});
