import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ScrollText, Target, History } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useMissionStore } from '@/stores/missionStore';
import { useMissionEvents } from '@/hooks/useMissionEvents';
import MissionList from '@/components/missions/MissionList';
import ActiveMissionTracker from '@/components/missions/ActiveMissionTracker';
import MissionDetailModal from '@/components/missions/MissionDetailModal';
import type {
  MissionCompletedEvent,
  ObjectiveCompletedEvent,
  MissionExpiredEvent,
} from '@/types/missions';

type TabType = 'available' | 'active' | 'history';

/**
 * Missions screen
 * Main interface for browsing and managing missions
 */
export default function MissionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const {
    availableMissions,
    activeMissions,
    completedMissions,
    selectedMission,
    loadingAvailable,
    loadingActive,
    loadingCompleted,
    fetchAvailable,
    fetchActive,
    fetchCompleted,
    acceptMission,
    abandonMission,
    setSelectedMission,
  } = useMissionStore();

  // Subscribe to mission events
  useMissionEvents(user?.profile_id || '', {
    onMissionCompleted: handleMissionCompleted,
    onObjectiveCompleted: handleObjectiveCompleted,
    onMissionExpired: handleMissionExpired,
  });

  // Load initial data
  useEffect(() => {
    if (user?.profile_id) {
      fetchAvailable();
      fetchActive();
    }
  }, [user?.profile_id]);

  // Load completed missions when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && completedMissions.length === 0) {
      fetchCompleted();
    }
  }, [activeTab]);

  function handleMissionCompleted(event: MissionCompletedEvent) {
    Alert.alert(
      '🎉 Mission Completed!',
      `You completed "${event.template_name}"!\n\nRewards:\n• ${event.credits_awarded} Credits\n• ${event.reputation_awarded} Reputation${
        event.items_awarded.length > 0
          ? `\n• ${event.items_awarded.length} Items`
          : ''
      }`,
      [{ text: 'Awesome!', onPress: () => {} }]
    );
  }

  function handleObjectiveCompleted(event: ObjectiveCompletedEvent) {
    // Subtle notification for objective completion
    console.log(`✓ Objective completed: ${event.description}`);
  }

  function handleMissionExpired(event: MissionExpiredEvent) {
    Alert.alert(
      '⏱️ Mission Expired',
      `"${event.template_name}" has expired and been removed from your active missions.`,
      [{ text: 'OK' }]
    );
  }

  const handleAcceptMission = async (templateId: string) => {
    const mission = await acceptMission(templateId);
    if (mission) {
      Alert.alert(
        'Mission Accepted',
        `"${mission.template_name}" has been added to your active missions.`,
        [{ text: 'OK' }]
      );
      // Switch to active tab to show the new mission
      setActiveTab('active');
    }
  };

  const handleAbandonMission = async (missionId: string) => {
    await abandonMission(missionId);
    Alert.alert('Mission Abandoned', 'The mission has been removed.', [
      { text: 'OK' },
    ]);
  };

  const handleMissionPress = (mission: any) => {
    setSelectedMission(mission);
    setDetailModalVisible(true);
  };

  const handleRefresh = async () => {
    switch (activeTab) {
      case 'available':
        await fetchAvailable();
        break;
      case 'active':
        await fetchActive();
        break;
      case 'history':
        await fetchCompleted();
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mission Control</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <ScrollText
            size={20}
            color={activeTab === 'available' ? Colors.primary : Colors.textDim}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'available' && styles.tabTextActive,
            ]}
          >
            Available
          </Text>
          {availableMissions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{availableMissions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Target
            size={20}
            color={activeTab === 'active' ? Colors.primary : Colors.textDim}
          />
          <Text
            style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}
          >
            Active
          </Text>
          {activeMissions.length > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{activeMissions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <History
            size={20}
            color={activeTab === 'history' ? Colors.primary : Colors.textDim}
          />
          <Text
            style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'available' && (
          <MissionList
            missions={availableMissions}
            onAccept={handleAcceptMission}
            onRefresh={handleRefresh}
            loading={loadingAvailable}
          />
        )}

        {activeTab === 'active' && (
          <>
            {loadingActive ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading active missions...</Text>
              </View>
            ) : activeMissions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Target size={48} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No Active Missions</Text>
                <Text style={styles.emptyText}>
                  Accept missions from the Available tab to start tracking them here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setActiveTab('available')}
                >
                  <Text style={styles.emptyButtonText}>Browse Missions</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeContainer}>
                <ActiveMissionTracker
                  missions={activeMissions}
                  onMissionPress={handleMissionPress}
                />
              </View>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {loadingCompleted ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading mission history...</Text>
              </View>
            ) : completedMissions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <History size={48} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No Completed Missions</Text>
                <Text style={styles.emptyText}>
                  Your completed missions will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.historyContainer}>
                {/* TODO: Create a CompletedMissionList component */}
                <Text style={styles.comingSoonText}>
                  Mission history coming soon!
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Mission detail modal */}
      <MissionDetailModal
        mission={selectedMission}
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDim,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  activeContainer: {
    padding: 20,
  },
  historyContainer: {
    flex: 1,
    padding: 20,
  },
  comingSoonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
