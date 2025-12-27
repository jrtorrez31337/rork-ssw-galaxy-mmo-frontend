import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollText, Target, TrendingUp, Pickaxe, Radar, Anchor } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TopBar, Text, Button, EmptyState, Card, Divider } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import ActiveMissionTracker from '@/components/missions/ActiveMissionTracker';
import MissionDetailModal from '@/components/missions/MissionDetailModal';
import { useMissionEvents } from '@/hooks/useMissionEvents';
import { useMissionStore } from '@/stores/missionStore';

export default function OpsTab() {
  const router = useRouter();
  const { user, profileId } = useAuth();
  const [missionDetailVisible, setMissionDetailVisible] = useState(false);

  const {
    activeMissions,
    selectedMission,
    fetchActive,
    fetchAvailable,
    setSelectedMission,
    abandonMission,
  } = useMissionStore();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;

  // Load active missions on mount
  useEffect(() => {
    if (profileId) {
      fetchActive();
    }
  }, [profileId, fetchActive]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        ship={currentShip}
        location={currentShip?.location_sector || 'Unknown'}
        dockedAt={currentShip?.docked_at}
        credits={parseFloat(user?.credits || '0')}
        quickActions={[]}
      />

      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Operations
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Missions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ScrollText size={20} color={tokens.colors.primary.main} />
              <Text variant="heading" weight="bold">
                Active Missions
              </Text>
            </View>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => router.push('/missions')}
            >
              View All
            </Button>
          </View>

          {activeMissions.length > 0 ? (
            <ActiveMissionTracker
              missions={activeMissions}
              onMissionPress={handleMissionPress}
              compact
            />
          ) : (
            <EmptyState
              icon={Target}
              title="No active missions"
              description="Visit Mission Control to accept new missions"
              action={{
                label: 'Mission Control',
                onPress: () => router.push('/missions'),
              }}
            />
          )}
        </View>

        <Divider />

        {/* Context-Aware Actions Section */}
        {currentShip?.docked_at ? (
          // Station Services (when docked)
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Anchor size={20} color={tokens.colors.primary.main} />
                <Text variant="heading" weight="bold">
                  Station Services
                </Text>
              </View>
            </View>
            <Text variant="body" color={tokens.colors.text.secondary} style={styles.sectionSubtitle}>
              Docked at {currentShip.docked_at}
            </Text>

            <View style={styles.actionGrid}>
              <Card variant="default" padding={4} onPress={() => router.push('/missions')}>
                <View style={styles.actionCard}>
                  <ScrollText size={32} color={tokens.colors.primary.main} />
                  <Text variant="body" weight="semibold" align="center">
                    Mission Control
                  </Text>
                  <Text variant="caption" color={tokens.colors.text.secondary} align="center">
                    Accept new missions
                  </Text>
                </View>
              </Card>

              <Card
                variant="default"
                padding={4}
                onPress={() => currentShip && router.push({ pathname: '/trading' as any, params: { shipId: currentShip.id } })}
              >
                <View style={styles.actionCard}>
                  <TrendingUp size={32} color={tokens.colors.primary.main} />
                  <Text variant="body" weight="semibold" align="center">
                    Trading
                  </Text>
                  <Text variant="caption" color={tokens.colors.text.secondary} align="center">
                    Buy and sell goods
                  </Text>
                </View>
              </Card>
            </View>
          </View>
        ) : (
          // Quick Actions (when in space)
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Target size={20} color={tokens.colors.primary.main} />
                <Text variant="heading" weight="bold">
                  Quick Actions
                </Text>
              </View>
            </View>
            <Text variant="body" color={tokens.colors.text.secondary} style={styles.sectionSubtitle}>
              In space: {currentShip?.location_sector || 'Unknown'}
            </Text>

            <View style={styles.actionGrid}>
              <Card
                variant="default"
                padding={4}
                onPress={() => currentShip && router.push({ pathname: '/mining' as any, params: { shipId: currentShip.id } })}
              >
                <View style={styles.actionCard}>
                  <Pickaxe size={32} color={tokens.colors.primary.main} />
                  <Text variant="body" weight="semibold" align="center">
                    Mining
                  </Text>
                  <Text variant="caption" color={tokens.colors.text.secondary} align="center">
                    Extract resources
                  </Text>
                </View>
              </Card>

              <Card
                variant="default"
                padding={4}
                onPress={() => currentShip && router.push({ pathname: '/sector' as any, params: { shipId: currentShip.id } })}
              >
                <View style={styles.actionCard}>
                  <Radar size={32} color={tokens.colors.primary.main} />
                  <Text variant="body" weight="semibold" align="center">
                    Sector View
                  </Text>
                  <Text variant="caption" color={tokens.colors.text.secondary} align="center">
                    Scan for targets
                  </Text>
                </View>
              </Card>
            </View>
          </View>
        )}
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
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
  sectionSubtitle: {
    marginTop: -tokens.spacing[2],
  },
  actionGrid: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  actionCard: {
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
  },
});
