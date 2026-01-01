import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { npcApi } from '@/api/npc';
import { sectorEntitiesApi, type SectorShip } from '@/api/sectorEntities';
import { useCombatEvents } from '@/hooks/useCombatEvents';
import { useTravelEvents } from '@/hooks/useTravelEvents';
import { useSectorDeltas } from '@/hooks/useProcgenEvents';
import { useNPCStore } from '@/stores/npcStore';
import { useProcgenStore } from '@/stores/procgenStore';
import { SectorGrid } from './SectorGrid';

/**
 * SectorViewport - Sector space view with data fetching
 *
 * Renders the SectorGrid with all necessary data:
 * - Player ship position
 * - NPCs in sector
 * - Database stations
 * - Other player ships
 *
 * No header, no MiniMap - those are handled elsewhere:
 * - Sector info → HeaderBar
 * - Radar/scanner → TAC LCARS LongRangeScanner
 */
export function SectorViewport() {
  const { profileId } = useAuth();

  // Fetch player's ship
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentSector = currentShip?.location_sector || '0.0.0';

  // Fetch NPCs in sector
  const { data: npcData } = useQuery({
    queryKey: ['npcs', currentSector],
    queryFn: () => npcApi.getNPCsInSector(currentSector),
    enabled: !!currentShip && !currentShip.docked_at,
    refetchInterval: 30000,
  });

  // Fetch stations in sector
  const { data: stationsData } = useQuery({
    queryKey: ['sector-stations', currentSector],
    queryFn: () => sectorEntitiesApi.getStations(currentSector),
    enabled: !!currentShip && !currentShip.docked_at,
    staleTime: 30000,
  });

  // Fetch other ships in sector
  const { data: shipsData } = useQuery({
    queryKey: ['sector-ships', currentSector, profileId],
    queryFn: () => sectorEntitiesApi.getShips(currentSector, profileId || undefined),
    enabled: !!currentShip && !currentShip.docked_at && !!profileId,
    staleTime: 3000,
    refetchInterval: 5000,
  });

  // Filter to other player ships only
  const otherShips: SectorShip[] = useMemo(() => {
    const allShips = shipsData?.ships || [];
    return allShips.filter(ship =>
      !ship.is_npc &&
      ship.id !== currentShip?.id
    );
  }, [shipsData?.ships, currentShip?.id]);

  // NPC store
  const { npcs, selectedNPC, setNPCs } = useNPCStore();

  // Sync NPCs from query to store
  useEffect(() => {
    if (npcData?.npcs) {
      setNPCs(npcData.npcs, currentSector);
    }
  }, [npcData, currentSector, setNPCs]);

  // Subscribe to real-time events
  useCombatEvents(profileId || '');
  useTravelEvents(profileId || '');

  // Subscribe to procgen sector updates
  useSectorDeltas(currentSector, (delta) => {
    console.debug('[SectorViewport] Sector delta:', delta.deltaType);
  });

  // Load procgen sector data
  const { enterSector, leaveSector } = useProcgenStore();

  useEffect(() => {
    if (currentShip && !currentShip.docked_at && currentSector) {
      enterSector(currentSector).catch((err) => {
        console.debug('[SectorViewport] Failed to load sector:', err);
      });
    }

    return () => {
      if (currentSector) {
        leaveSector(currentSector);
      }
    };
  }, [currentSector, currentShip?.docked_at, enterSector, leaveSector]);

  // Player position (center of sector view)
  const playerPosition: [number, number, number] = currentShip
    ? [currentShip.position_x || 0, currentShip.position_y || 0, currentShip.position_z || 0]
    : [0, 0, 0];

  return (
    <View style={styles.container}>
      <SectorGrid
        npcs={npcs}
        playerPosition={playerPosition}
        selectedNPCId={selectedNPC?.entity_id}
        sectorId={currentSector}
        showProcgen={true}
        dbStations={stationsData?.stations || []}
        otherShips={otherShips}
        currentShipId={currentShip?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.space,
  },
});
