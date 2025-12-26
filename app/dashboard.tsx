import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { User, Ship, LogOut, Plus, Package, Navigation, Shield, TrendingUp, Pickaxe, Radar, ScrollText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { characterApi } from '@/api/characters';
import { shipApi } from '@/api/ships';
import { reputationApi } from '@/api/reputation';
import ShipControlPanel from '@/components/movement/ShipControlPanel';
import ReputationList from '@/components/reputation/ReputationList';
import ReputationHistory from '@/components/reputation/ReputationHistory';
import CreditsDisplay from '@/components/credits/CreditsDisplay';
import ActiveMissionTracker from '@/components/missions/ActiveMissionTracker';
import MissionDetailModal from '@/components/missions/MissionDetailModal';
import { useReputationEvents } from '@/hooks/useReputationEvents';
import { useStationServices } from '@/hooks/useStationServices';
import { useMissionEvents } from '@/hooks/useMissionEvents';
import { useMissionStore } from '@/stores/missionStore';
import { getFactionName } from '@/components/reputation/utils';
import Colors from '@/constants/colors';
import type { Ship as ShipType, ReputationTierChangeEvent } from '@/types/api';
import type { CreditsChangedEvent } from '@/types/station-services';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profileId, logout } = useAuth();
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [controlsModalVisible, setControlsModalVisible] = useState(false);
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [missionDetailVisible, setMissionDetailVisible] = useState(false);

  const {
    activeMissions,
    selectedMission,
    fetchActive,
    fetchAvailable,
    setSelectedMission,
    abandonMission,
  } = useMissionStore();

  const { data: characters, isLoading: loadingCharacters } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId,
  });

  const { data: ships, isLoading: loadingShips } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
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
    enabled: !!profileId && !!selectedFactionId && historyModalVisible,
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleFactionPress = (factionId: string) => {
    setSelectedFactionId(factionId);
    setHistoryModalVisible(true);
  };

  const handleReputationTierChange = (event: ReputationTierChangeEvent) => {
    const factionName = getFactionName(event.faction_id);
    Alert.alert(
      'Reputation Changed',
      `Your reputation with ${factionName} changed from ${event.old_tier} to ${event.new_tier}!`,
      [{ text: 'OK' }]
    );
  };

  const handleCreditsChanged = (event: CreditsChangedEvent['payload']) => {
    // Credits are automatically refreshed via query invalidation in the hook
    const sign = event.amount_changed > 0 ? '+' : '';
    const reasonText = event.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log(`[Credits] ${reasonText}: ${sign}${event.amount_changed.toFixed(2)} CR`);

    // Show subtle alert for credit changes
    if (Math.abs(event.amount_changed) > 0) {
      const message = `${reasonText}\n${sign}${event.amount_changed.toFixed(2)} CR`;
      Alert.alert('Credits Updated', message, [{ text: 'OK' }]);
    }
  };

  // Subscribe to real-time reputation events
  // Note: This requires SSE implementation (see useReputationEvents.ts)
  useReputationEvents(profileId || '', {
    onTierChange: handleReputationTierChange,
  });

  // Subscribe to real-time station service events (Phase 1)
  useStationServices(profileId || '', {
    onCreditsChanged: handleCreditsChanged,
  });

  // Subscribe to real-time mission events
  useMissionEvents(profileId || '', {
    onMissionCompleted: (event) => {
      Alert.alert(
        '🎉 Mission Completed!',
        `You completed "${event.template_name}"!\n\nRewards:\n• ${event.credits_awarded} Credits\n• ${event.reputation_awarded} Reputation`,
        [{ text: 'OK' }]
      );
      fetchActive();
      fetchAvailable();
    },
  });

  const handleMissionPress = (mission: any) => {
    setSelectedMission(mission);
    setMissionDetailVisible(true);
  };

  const handleAbandonMission = async (missionId: string) => {
    await abandonMission(missionId);
    setMissionDetailVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.displayName}>{user?.display_name}</Text>
          </View>
          {user?.credits && (
            <CreditsDisplay credits={user.credits} size="medium" animated />
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <User size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Characters</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/character-create')}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          {loadingCharacters ? (
            <Text style={styles.loadingText}>Loading characters...</Text>
          ) : characters && characters.length > 0 ? (
            <View style={styles.cardList}>
              {characters.map((character) => (
                <View key={character.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{character.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    Sector: {character.home_sector}
                  </Text>
                  <View style={styles.attributesGrid}>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Piloting</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.piloting}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Engineering</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.engineering}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Science</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.science}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Tactics</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.tactics}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Leadership</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.leadership}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No characters yet</Text>
              <Text style={styles.emptySubtext}>Create your first character to start your journey</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ship size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Ships</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/ship-customize')}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          {loadingShips ? (
            <Text style={styles.loadingText}>Loading ships...</Text>
          ) : ships && ships.length > 0 ? (
            <View style={styles.cardList}>
              {ships.map((ship) => (
                <View key={ship.id} style={styles.card}>
                  <View style={styles.shipHeader}>
                    <Text style={styles.cardTitle}>{ship.name || 'Unnamed Ship'}</Text>
                    <View style={styles.shipTypeBadge}>
                      <Text style={styles.shipTypeText}>{ship.ship_type}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Location: {ship.location_sector}
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Hull</Text>
                      <Text style={styles.statValue}>
                        {ship.hull_points}/{ship.hull_max}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Shield</Text>
                      <Text style={styles.statValue}>
                        {ship.shield_points}/{ship.shield_max}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Cargo</Text>
                      <Text style={styles.statValue}>{ship.cargo_capacity}</Text>
                    </View>
                  </View>
                  <View style={styles.shipActions}>
                    <TouchableOpacity
                      style={styles.shipActionButton}
                      onPress={() => {
                        setSelectedShip(ship);
                        setControlsModalVisible(true);
                      }}
                    >
                      <Navigation size={16} color={Colors.primary} />
                      <Text style={styles.shipActionButtonText}>Ship Controls</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shipActionButton}
                      onPress={() => router.push({ pathname: '/ship-inventory' as any, params: { shipId: ship.id } })}
                    >
                      <Package size={16} color={Colors.primary} />
                      <Text style={styles.shipActionButtonText}>Inventory</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shipActions}>
                    <TouchableOpacity
                      style={[styles.shipActionButton, !ship.docked_at && styles.shipActionButtonDisabled]}
                      onPress={() => {
                        if (ship.docked_at) {
                          router.push({ pathname: '/trading' as any, params: { shipId: ship.id } });
                        } else {
                          Alert.alert('Not Docked', 'You must be docked at a station to access trading', [{ text: 'OK' }]);
                        }
                      }}
                    >
                      <TrendingUp size={16} color={ship.docked_at ? Colors.primary : Colors.textDim} />
                      <Text style={[styles.shipActionButtonText, !ship.docked_at && styles.shipActionButtonTextDisabled]}>
                        Trading {!ship.docked_at && '(Dock Required)'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.shipActionButton, ship.docked_at && styles.shipActionButtonDisabled]}
                      onPress={() => {
                        if (!ship.docked_at) {
                          router.push({ pathname: '/mining' as any, params: { shipId: ship.id } });
                        } else {
                          Alert.alert('Cannot Mine', 'You must undock before mining', [{ text: 'OK' }]);
                        }
                      }}
                    >
                      <Pickaxe size={16} color={!ship.docked_at ? Colors.primary : Colors.textDim} />
                      <Text style={[styles.shipActionButtonText, ship.docked_at && styles.shipActionButtonTextDisabled]}>
                        Mining {ship.docked_at && '(Undock Required)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.shipActions}>
                    <TouchableOpacity
                      style={[styles.shipActionButton, ship.docked_at && styles.shipActionButtonDisabled]}
                      onPress={() => {
                        if (!ship.docked_at) {
                          router.push({ pathname: '/sector' as any, params: { shipId: ship.id } });
                        } else {
                          Alert.alert('Cannot Scan', 'You must undock to access sector view', [{ text: 'OK' }]);
                        }
                      }}
                    >
                      <Radar size={16} color={!ship.docked_at ? Colors.primary : Colors.textDim} />
                      <Text style={[styles.shipActionButtonText, ship.docked_at && styles.shipActionButtonTextDisabled]}>
                        Sector View {ship.docked_at && '(Undock Required)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No ships yet</Text>
              <Text style={styles.emptySubtext}>Customize your first ship to explore the galaxy</Text>
            </View>
          )}
        </View>

        {/* Missions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ScrollText size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Active Missions</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/missions')}
            >
              <Text style={styles.addButtonText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeMissions.length > 0 ? (
            <ActiveMissionTracker
              missions={activeMissions}
              onMissionPress={handleMissionPress}
              compact
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active missions</Text>
              <Text style={styles.emptySubtext}>
                Visit Mission Control to accept new missions
              </Text>
            </View>
          )}
        </View>

        {/* Reputation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Shield size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Faction Reputation</Text>
            </View>
          </View>

          {loadingReputations ? (
            <Text style={styles.loadingText}>Loading reputation...</Text>
          ) : reputations && reputations.reputations.length > 0 ? (
            <ReputationList
              reputations={reputations.reputations}
              onFactionPress={handleFactionPress}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reputation data</Text>
              <Text style={styles.emptySubtext}>
                Your faction standings will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ship Controls Modal */}
      {selectedShip && (
        <Modal
          visible={controlsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setControlsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedShip.name || 'Unnamed Ship'}</Text>
                  <TouchableOpacity
                    onPress={() => setControlsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ShipControlPanel ship={selectedShip} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Reputation History Modal */}
      {selectedFactionId && (
        <Modal
          visible={historyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setHistoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reputation History</Text>
                <TouchableOpacity
                  onPress={() => setHistoryModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ReputationHistory
                events={reputationHistory?.events || []}
                isLoading={loadingHistory}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Mission Detail Modal */}
      <MissionDetailModal
        mission={selectedMission}
        visible={missionDetailVisible}
        onClose={() => {
          setMissionDetailVisible(false);
          setSelectedMission(null);
        }}
        onAbandon={handleAbandonMission}
      />
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    gap: 12,
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  loadingText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeItem: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attributeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  shipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shipTypeBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shipTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
  },
  shipActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  shipActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  shipActionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  shipActionButtonDisabled: {
    opacity: 0.5,
    borderColor: Colors.border,
  },
  shipActionButtonTextDisabled: {
    color: Colors.textDim,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
});
