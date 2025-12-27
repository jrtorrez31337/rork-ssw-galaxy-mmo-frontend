import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native';
import { TopBar, Text, Button, EmptyState } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { npcApi } from '@/api/npc';
import { combatApi } from '@/api/combat';
import { useCombatEvents } from '@/hooks/useCombatEvents';
import { useNPCStore } from '@/stores/npcStore';
import { useCombatStore } from '@/stores/combatStore';
import SectorView2D from '@/components/npc/SectorView2D';
import NPCList from '@/components/npc/NPCList';
import CombatHUD from '@/components/combat/CombatHUD';
import CombatResults from '@/components/combat/CombatResults';
import LootNotification from '@/components/loot/LootNotification';

export default function MapTab() {
  const { user, profileId } = useAuth();
  const [isLoadingNPCs, setIsLoadingNPCs] = useState(false);
  const [playerPosition] = useState<[number, number, number]>([0, 0, 0]); // TODO: Get from ship state

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentSector = currentShip?.location_sector || '0,0,0';

  const { npcs, selectedNPC, setNPCs, setSelectedNPC, setLoading, setError } = useNPCStore();
  const { isInCombat, setCombatInstance } = useCombatStore();

  // Subscribe to combat events
  useCombatEvents(profileId || '');

  // Load NPCs when sector changes or when undocked
  useEffect(() => {
    if (currentShip && !currentShip.docked_at) {
      loadNPCs();
    }
  }, [currentSector, currentShip?.docked_at]);

  const loadNPCs = async () => {
    try {
      setLoading(true);
      setIsLoadingNPCs(true);
      const response = await npcApi.getNPCsInSector(currentSector);
      setNPCs(response.npcs, currentSector);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load NPCs:', error);
      setError(error.message || 'Failed to load NPCs');
    } finally {
      setLoading(false);
      setIsLoadingNPCs(false);
    }
  };

  const handleSelectNPC = (npcId: string) => {
    const npc = npcs.find((n) => n.entity_id === npcId);
    if (npc) {
      setSelectedNPC(selectedNPC?.entity_id === npcId ? null : npc);
    }
  };

  const handleInitiateCombat = async (npcId: string) => {
    if (!profileId || !currentShip) {
      Alert.alert('Error', 'User or ship not found');
      return;
    }

    if (isInCombat) {
      Alert.alert('Already in Combat', 'You are already engaged in combat');
      return;
    }

    Alert.alert(
      'Initiate Combat',
      'Are you sure you want to engage this ship in combat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Engage',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await combatApi.initiateCombat({
                player_id: profileId,
                ship_id: currentShip.id,
                target_entity_id: npcId,
              });

              setCombatInstance(response.combat);
              Alert.alert('Combat Started', response.message);
            } catch (error: any) {
              console.error('Failed to initiate combat:', error);
              Alert.alert('Combat Failed', error.message || 'Failed to initiate combat');
            }
          },
        },
      ]
    );
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

      {currentShip?.docked_at ? (
        // Show message when docked
        <View style={styles.dockedContainer}>
          <EmptyState
            icon={RefreshCw}
            title="Docked at Station"
            description={`You are currently docked at ${currentShip.docked_at}. Undock to view the sector map.`}
          />
        </View>
      ) : (
        // Show sector view when in space
        <>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="heading" weight="bold">
                Sector View
              </Text>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                {currentSector}
              </Text>
            </View>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onPress={loadNPCs}
              disabled={isLoadingNPCs}
            >
              Scan
            </Button>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 2D Sector View */}
            <View style={styles.section}>
              <SectorView2D
                npcs={npcs}
                playerPosition={playerPosition}
                selectedNPCId={selectedNPC?.entity_id}
              />
            </View>

            {/* NPC List */}
            <View style={styles.section}>
              <View style={styles.listContainer}>
                <NPCList
                  onSelectNPC={handleSelectNPC}
                  onInitiateCombat={handleInitiateCombat}
                />
              </View>
            </View>
          </ScrollView>

          {/* Combat HUD Overlay */}
          {isInCombat && <CombatHUD playerId={profileId || ''} />}

          {/* Combat Results Modal */}
          <CombatResults />

          {/* Loot Notification Modal */}
          <LootNotification />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  dockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  headerContent: {
    gap: tokens.spacing[1],
  },
  content: {
    flex: 1,
  },
  section: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  listContainer: {
    height: 400,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
});
