import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useCombatEvents } from '@/hooks/useCombatEvents';
import { useNPCStore } from '@/stores/npcStore';
import { useCombatStore } from '@/stores/combatStore';
import { npcApi } from '@/api/npc';
import { combatApi } from '@/api/combat';
import { SectorView } from '@/components/sector';
import NPCList from '@/components/npc/NPCList';
import CombatHUD from '@/components/combat/CombatHUD';
import CombatResults from '@/components/combat/CombatResults';
import LootNotification from '@/components/loot/LootNotification';

/**
 * Sector view screen with 2D display, NPC list, and combat
 * Full-screen interface for sector exploration and combat
 */
export default function SectorScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Auto-redirect to main view (sector view is now in Viewscreen)
  useEffect(() => {
    router.replace('/(tabs)');
  }, [router]);
  const [isLoadingNPCs, setIsLoadingNPCs] = useState(false);
  const [currentSector] = useState('0,0,0'); // TODO: Get from ship/player state
  const [playerPosition] = useState<[number, number, number]>([0, 0, 0]); // TODO: Get from ship state

  const { npcs, selectedNPC, setNPCs, setSelectedNPC, setLoading, setError } =
    useNPCStore();
  const { isInCombat, setCombatInstance } = useCombatStore();

  // Subscribe to combat events
  useCombatEvents(user?.profile_id || '');

  // Load NPCs when screen loads
  useEffect(() => {
    loadNPCs();
  }, [currentSector]);

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
    if (!user?.profile_id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (isInCombat) {
      Alert.alert('Already in Combat', 'You are already engaged in combat');
      return;
    }

    try {
      // TODO: Get actual ship_id from player state
      const shipId = 'player-ship-id';

      Alert.alert(
        'Initiate Combat',
        'Are you sure you want to engage this ship in combat?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Engage',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await combatApi.initiateCombat({
                  player_id: user.profile_id,
                  ship_id: shipId,
                  target_entity_id: npcId,
                });

                // Set combat instance in store
                setCombatInstance(response.combat);

                Alert.alert('Combat Started', response.message);
              } catch (error: any) {
                console.error('Failed to initiate combat:', error);
                Alert.alert(
                  'Combat Failed',
                  error.message || 'Failed to initiate combat'
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error preparing combat:', error);
      Alert.alert('Error', error.message || 'Failed to prepare combat');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sector View</Text>
          <Text style={styles.subtitle}>Sector: {currentSector}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadNPCs}
          disabled={isLoadingNPCs}
          activeOpacity={0.7}
        >
          {isLoadingNPCs ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.refreshText}>Scan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sector View (2D or 3D based on settings) */}
        <View style={styles.section}>
          <SectorView
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
      {isInCombat && <CombatHUD playerId={user?.profile_id || ''} />}

      {/* Combat Results Modal */}
      <CombatResults />

      {/* Loot Notification Modal */}
      <LootNotification />
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
    paddingHorizontal: 16,
    paddingTop: 50, // Account for status bar
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  refreshButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 12,
  },
  listContainer: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
