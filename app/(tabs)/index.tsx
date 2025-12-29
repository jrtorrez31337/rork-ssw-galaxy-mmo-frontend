import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { npcApi } from '@/api/npc';
import { movementApi } from '@/api/movement';
import { useCombatEvents } from '@/hooks/useCombatEvents';
import { useTravelEvents } from '@/hooks/useTravelEvents';
import { useNPCStore } from '@/stores/npcStore';
import { useCombatStore } from '@/stores/combatStore';
import { useTravelStore } from '@/stores/travelStore';
import SectorView2D from '@/components/npc/SectorView2D';
import CombatHUD from '@/components/combat/CombatHUD';
import CombatResults from '@/components/combat/CombatResults';
import LootNotification from '@/components/loot/LootNotification';
import { MiniMap } from '@/components/hud/MiniMap';
import { Text } from '@/ui';

/**
 * Bridge - Primary Viewport
 *
 * Per UI/UX Doctrine:
 * - This is the main view area inside CockpitShell
 * - Shows sector view when in space, station interior when docked
 * - No chrome/navigation here - that's handled by shell components
 * - All overlays (combat HUD, alerts) render here
 */

export default function BridgeScreen() {
  const { profileId } = useAuth();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentSector = currentShip?.location_sector || '0,0,0';
  const isDocked = !!currentShip?.docked_at;

  // Fetch NPCs for sector view
  const { data: npcData } = useQuery({
    queryKey: ['npcs', currentSector],
    queryFn: () => npcApi.getNPCsInSector(currentSector),
    enabled: !!currentShip && !isDocked,
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch stations for mini-map
  const { data: stationsData } = useQuery({
    queryKey: ['stations', currentSector],
    queryFn: () => movementApi.getStations(currentSector),
    enabled: !!currentShip && !isDocked,
  });

  const { npcs, selectedNPC, setNPCs } = useNPCStore();
  const { isInCombat } = useCombatStore();

  // Sync NPCs from query to store
  React.useEffect(() => {
    if (npcData?.npcs) {
      setNPCs(npcData.npcs, currentSector);
    }
  }, [npcData, currentSector, setNPCs]);

  // Subscribe to real-time events
  useCombatEvents(profileId || '');
  useTravelEvents(profileId || '');

  // Player position for sector view (center)
  const playerPosition: [number, number, number] = [0, 0, 0];

  if (isDocked) {
    return (
      <View style={styles.dockedView}>
        <View style={styles.dockedContent}>
          <Text variant="heading" weight="bold" style={styles.dockedTitle}>
            DOCKED
          </Text>
          <Text variant="body" color={tokens.colors.text.secondary}>
            {currentShip?.docked_at}
          </Text>
          <Text variant="caption" color={tokens.colors.text.tertiary} style={styles.dockedHint}>
            Use OPS panel for station services
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.viewport}>
      {/* Primary Sector View */}
      <SectorView2D
        npcs={npcs}
        playerPosition={playerPosition}
        selectedNPCId={selectedNPC?.entity_id}
      />

      {/* Combat HUD Overlay - when in combat */}
      {isInCombat && <CombatHUD playerId={profileId || ''} />}

      {/* Combat Results Modal */}
      <CombatResults />

      {/* Loot Notification */}
      <LootNotification />

      {/* Mini-Map in corner */}
      <MiniMap
        ship={currentShip}
        stations={stationsData?.stations}
        npcCount={npcs.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: tokens.colors.background.space,
  },
  dockedView: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockedContent: {
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  dockedTitle: {
    color: tokens.colors.semantic.navigation,
  },
  dockedHint: {
    marginTop: tokens.spacing[4],
  },
});
