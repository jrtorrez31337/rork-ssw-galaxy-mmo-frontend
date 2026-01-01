import { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw } from 'lucide-react-native';
import { Text, Button, EmptyState } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { npcApi } from '@/api/npc';
import { movementApi } from '@/api/movement';
import { sectorEntitiesApi, type SectorShip } from '@/api/sectorEntities';
import { characterApi } from '@/api/characters';
import { useCombatEvents } from '@/hooks/useCombatEvents';
import { useTravelEvents } from '@/hooks/useTravelEvents';
import { useSectorDeltas } from '@/hooks/useProcgenEvents';
import { useNPCStore } from '@/stores/npcStore';
import { useCombatStore } from '@/stores/combatStore';
import { useTravelStore } from '@/stores/travelStore';
import { useProcgenStore, selectCurrentSectorMetadata } from '@/stores/procgenStore';
import { SectorView } from '@/components/sector';
import CombatHUD from '@/components/combat/CombatHUD';
import CombatResults from '@/components/combat/CombatResults';
import LootNotification from '@/components/loot/LootNotification';
import { JumpPanel } from '@/components/movement/JumpPanel';
import { DockingPanel } from '@/components/movement/DockingPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MiniMap } from '@/components/hud/MiniMap';
import { ExpandedRadar } from '@/components/hud/ExpandedRadar';

export default function MapTab() {
  const { user, profileId } = useAuth();
  const [isLoadingNPCs, setIsLoadingNPCs] = useState(false);
  const [playerPosition] = useState<[number, number, number]>([0, 0, 0]); // TODO: Get from ship state
  const [jumpPanelOpen, setJumpPanelOpen] = useState(false);
  const [dockPanelOpen, setDockPanelOpen] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [radarExpanded, setRadarExpanded] = useState(false);
  const [jumpTargetSector, setJumpTargetSector] = useState<string | undefined>();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  // Fetch character to get faction_id for chat
  const { data: characters } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentCharacter = characters?.[0] || null;
  const currentSector = currentShip?.location_sector || '0.0.0';

  // Fetch stations in current sector (always visible - no scan required)
  const { data: stationsData } = useQuery({
    queryKey: ['sector-stations', currentSector],
    queryFn: () => sectorEntitiesApi.getStations(currentSector),
    enabled: !!currentShip && !currentShip.docked_at,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch ships in current sector (other players only, not NPCs)
  // Pass profileId to update activity timestamp on each fetch
  const { data: shipsData } = useQuery({
    queryKey: ['sector-ships', currentSector, profileId],
    queryFn: () => sectorEntitiesApi.getShips(currentSector, profileId || undefined),
    enabled: !!currentShip && !currentShip.docked_at && !!profileId,
    staleTime: 3000, // Cache for 3 seconds
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Extract data from responses
  const dbStations = stationsData?.stations || [];

  // Filter to only show other player ships (not NPCs, not current player)
  const otherShips: SectorShip[] = useMemo(() => {
    const allShips = shipsData?.ships || [];
    return allShips.filter(ship =>
      !ship.is_npc && // Only player ships
      ship.id !== currentShip?.id // Exclude current player's ship
    );
  }, [shipsData?.ships, currentShip?.id]);

  const { npcs, selectedNPC, setNPCs, setLoading, setError } = useNPCStore();
  const { isInCombat } = useCombatStore();
  const { isInTransit } = useTravelStore();
  const { enterSector, leaveSector, fetchSectorMetadata, getDisplayName, getFactionInfo } = useProcgenStore();
  const currentMetadata = useProcgenStore(selectCurrentSectorMetadata);

  // Subscribe to combat events
  useCombatEvents(profileId || '');

  // Subscribe to real-time sector delta updates (procgen changes)
  useSectorDeltas(currentSector, (delta) => {
    console.log('[MapTab] Sector delta received:', delta.deltaType);
  });

  // Subscribe to travel events with callbacks for notifications
  useTravelEvents(profileId || '', {
    onTravelCompleted: (event) => {
      Alert.alert(
        'Arrived!',
        `You have arrived at sector ${event.to_sector}`,
        [{ text: 'OK' }]
      );
      // Reload NPCs for the new sector
      loadNPCs();
    },
    onTravelCancelled: (event) => {
      Alert.alert(
        'Travel Cancelled',
        `Returned to sector ${event.from_sector}. Fuel refunded: ${event.fuel_refund.toFixed(1)} units`
      );
    },
    onTravelInterrupted: (event) => {
      Alert.alert(
        'Travel Interrupted!',
        `Your ship was interdicted and dropped out at sector ${event.drop_sector}`,
        [{ text: 'OK' }]
      );
      // Reload NPCs for the drop sector
      loadNPCs();
    },
  });

  // Load NPCs when sector changes or when undocked
  useEffect(() => {
    if (currentShip && !currentShip.docked_at) {
      loadNPCs();
    }
  }, [currentSector, currentShip?.docked_at]);

  // Load procgen sector data when entering a sector
  useEffect(() => {
    if (currentShip && !currentShip.docked_at && currentSector) {
      enterSector(currentSector).catch((err) => {
        console.debug('[MapTab] Failed to load procgen sector:', err);
      });

      // Fetch sector metadata (name, faction info)
      fetchSectorMetadata(currentSector).catch((err) => {
        console.debug('[MapTab] Failed to load sector metadata:', err);
      });
    }

    // Cleanup: leave sector when unmounting or changing sectors
    return () => {
      if (currentSector) {
        leaveSector(currentSector);
      }
    };
  }, [currentSector, currentShip?.docked_at, enterSector, leaveSector, fetchSectorMetadata]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
                {currentMetadata?.name || 'Sector View'}
              </Text>
              <View style={styles.sectorInfo}>
                <Text variant="caption" color={tokens.colors.text.secondary}>
                  {currentSector}
                </Text>
                {currentMetadata?.factionName && (
                  <Text
                    variant="caption"
                    style={{ marginLeft: tokens.spacing[2] }}
                    color={getFactionInfo(currentSector).color}
                  >
                    [{currentMetadata.factionTag}]
                  </Text>
                )}
                {currentMetadata?.isContested && (
                  <Text
                    variant="caption"
                    style={{ marginLeft: tokens.spacing[2] }}
                    color={tokens.colors.warning}
                  >
                    Contested
                  </Text>
                )}
              </View>
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

          <View style={styles.content}>
            {/* Sector View (2D or 3D based on settings) */}
            <View style={styles.sectorViewContainer}>
              <SectorView
                npcs={npcs}
                playerPosition={playerPosition}
                selectedNPCId={selectedNPC?.entity_id}
                sectorId={currentSector}
                showProcgen={true}
                dbStations={dbStations}
                otherShips={otherShips}
                currentShipId={currentShip?.id}
              />
            </View>
          </View>

          {/* Combat HUD Overlay */}
          {isInCombat && <CombatHUD playerId={profileId || ''} />}

          {/* Combat Results Modal */}
          <CombatResults />

          {/* Loot Notification Modal */}
          <LootNotification />

          {/* Mini-Map / Radar */}
          <MiniMap
            ship={currentShip}
            stations={dbStations}
            npcCount={npcs.length}
            onTap={() => setRadarExpanded(true)}
          />

          {/* Expanded Radar Panel */}
          <ExpandedRadar
            visible={radarExpanded}
            onClose={() => setRadarExpanded(false)}
            ship={currentShip}
            stations={dbStations}
            npcs={npcs}
            onSectorTap={(sector) => {
              setJumpTargetSector(sector);
              setRadarExpanded(false);
              setJumpPanelOpen(true);
            }}
          />

          {/* Jump Panel */}
          {currentShip && jumpPanelOpen && (
            <JumpPanel
              ship={currentShip}
              targetSector={jumpTargetSector}
              isVisible={jumpPanelOpen}
              onClose={() => {
                setJumpPanelOpen(false);
                setJumpTargetSector(undefined);
              }}
              onJumpSuccess={() => {
                setJumpPanelOpen(false);
                setJumpTargetSector(undefined);
              }}
            />
          )}

          {/* Docking Panel */}
          {currentShip && dockPanelOpen && (
            <DockingPanel
              ship={currentShip}
              isVisible={dockPanelOpen}
              onClose={() => setDockPanelOpen(false)}
              onDockSuccess={() => setDockPanelOpen(false)}
            />
          )}

          {/* Chat Panel Modal */}
          <Modal
            visible={chatPanelOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setChatPanelOpen(false)}
          >
            <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.surface.base }} edges={['top', 'bottom']}>
              <ChatPanel
                playerId={profileId || ''}
                factionId={currentCharacter?.faction_id}
                currentSector={currentShip?.location_sector}
                isVisible={chatPanelOpen}
                onClose={() => setChatPanelOpen(false)}
              />
            </SafeAreaView>
          </Modal>
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
  sectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  sectorViewContainer: {
    flex: 1,
    padding: tokens.spacing[4],
  },
});
