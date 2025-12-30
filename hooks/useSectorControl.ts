import { useQuery } from '@tanstack/react-query';
import { factionsApi } from '@/api/factions';
import type { SectorInfluence, FactionId, FACTION_COLORS } from '@/types/factions';

/**
 * Sector control status types
 */
export type SectorControlStatus = 'controlled' | 'contested' | 'neutral';

/**
 * Computed sector control data for UI consumption
 */
export interface SectorControlData {
  /** Current sector coordinates */
  sector: string;
  /** Control status */
  status: SectorControlStatus;
  /** Controlling faction info (if any) */
  controllingFaction: {
    id: string;
    name: string;
    color: string;
    influence: number;
  } | null;
  /** Second highest influence faction (for contested zones) */
  contestingFaction: {
    id: string;
    name: string;
    color: string;
    influence: number;
  } | null;
  /** All faction influences in this sector */
  allInfluences: Array<{
    factionId: string;
    factionName: string;
    influence: number;
    isControlling: boolean;
    color: string;
  }>;
  /** Is this sector contested (multiple factions with significant presence)? */
  isContested: boolean;
  /** Is this sector in a war zone (hostile factions present)? */
  isWarZone: boolean;
  /** Threat level 0-100 based on hostile faction presence */
  threatLevel: number;
}

/**
 * Faction colors fallback (matches backend seed data)
 */
const FACTION_COLOR_MAP: Record<string, string> = {
  'terran_federation': '#3B82F6',
  'void_consortium': '#10B981',
  'stellar_imperium': '#EF4444',
  'free_traders': '#F59E0B',
  'shadow_syndicate': '#8B5CF6',
  'tech_collective': '#06B6D4',
  'outer_rim_alliance': '#F97316',
  'merchant_guild': '#84CC16',
  'pirate_clans': '#DC2626',
  // UUID-based faction IDs from backend
  '11111111-1111-1111-1111-111111111111': '#3B82F6', // Terran Federation
  '22222222-2222-2222-2222-222222222222': '#10B981', // Void Consortium
  '33333333-3333-3333-3333-333333333333': '#EF4444', // Stellar Imperium
  '44444444-4444-4444-4444-444444444444': '#F59E0B', // Free Traders
  '66666666-6666-6666-6666-666666666666': '#8B5CF6', // Shadow Syndicate
  '77777777-7777-7777-7777-777777777777': '#06B6D4', // Tech Collective
  '88888888-8888-8888-8888-888888888888': '#F97316', // Outer Rim Alliance
  '99999999-9999-9999-9999-999999999999': '#84CC16', // Merchant Guild
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': '#DC2626', // Pirate Clans
};

/**
 * Get faction color by ID
 */
function getFactionColor(factionId: string): string {
  return FACTION_COLOR_MAP[factionId] || '#6B7280'; // Default gray for unknown
}

/**
 * Threshold for contested status (if second faction has >= this % of leader, it's contested)
 */
const CONTESTED_THRESHOLD = 0.7; // 70% of leader's influence

/**
 * Threshold for significant presence (faction must have >= this % to count)
 */
const PRESENCE_THRESHOLD = 10; // 10% influence minimum

/**
 * Hook to fetch and compute sector control status
 *
 * @param sectorId - Sector coordinates (e.g., "0.0.0")
 * @param playerFactionId - Optional player's faction ID for threat calculation
 * @returns Sector control data and query state
 */
export function useSectorControl(
  sectorId: string | undefined,
  playerFactionId?: string
) {
  const query = useQuery({
    queryKey: ['sector-influence', sectorId],
    queryFn: () => factionsApi.getSectorInfluence(sectorId!),
    enabled: !!sectorId,
    staleTime: 5 * 60 * 1000, // 5 minutes (backend updates every 30 min)
    refetchOnWindowFocus: false,
  });

  // Compute control data from raw influence data
  const controlData = computeSectorControl(
    query.data,
    sectorId || '',
    playerFactionId
  );

  return {
    ...query,
    controlData,
  };
}

/**
 * Compute sector control status from raw influence data
 */
function computeSectorControl(
  data: SectorInfluence | undefined,
  sectorId: string,
  playerFactionId?: string
): SectorControlData {
  // Default neutral state
  const defaultData: SectorControlData = {
    sector: sectorId,
    status: 'neutral',
    controllingFaction: null,
    contestingFaction: null,
    allInfluences: [],
    isContested: false,
    isWarZone: false,
    threatLevel: 0,
  };

  if (!data || !data.influences || data.influences.length === 0) {
    return defaultData;
  }

  // Sort influences by percentage (highest first)
  const sortedInfluences = [...data.influences].sort(
    (a, b) => b.influence - a.influence
  );

  // Map to enriched format with colors
  const allInfluences = sortedInfluences.map((inf) => ({
    factionId: inf.faction_id,
    factionName: inf.faction_name,
    influence: inf.influence,
    isControlling: inf.is_controlling,
    color: getFactionColor(inf.faction_id),
  }));

  // Get controlling faction
  const leader = sortedInfluences[0];
  const controllingFaction =
    leader && leader.influence >= PRESENCE_THRESHOLD
      ? {
          id: leader.faction_id,
          name: leader.faction_name,
          color: getFactionColor(leader.faction_id),
          influence: leader.influence,
        }
      : null;

  // Check for contesting faction
  const secondPlace = sortedInfluences[1];
  const isContested = Boolean(
    controllingFaction &&
    secondPlace &&
    secondPlace.influence >= PRESENCE_THRESHOLD &&
    secondPlace.influence >= leader.influence * CONTESTED_THRESHOLD
  );

  const contestingFaction = isContested
    ? {
        id: secondPlace.faction_id,
        name: secondPlace.faction_name,
        color: getFactionColor(secondPlace.faction_id),
        influence: secondPlace.influence,
      }
    : null;

  // Determine status
  let status: SectorControlStatus = 'neutral';
  if (controllingFaction) {
    status = isContested ? 'contested' : 'controlled';
  }

  // Calculate threat level based on hostile faction presence
  let threatLevel = 0;
  let isWarZone = false;

  if (playerFactionId && controllingFaction) {
    // If player faction doesn't control this sector, calculate threat
    if (controllingFaction.id !== playerFactionId) {
      // Base threat from non-allied faction control
      threatLevel = Math.min(controllingFaction.influence, 100);

      // Known hostile factions (Pirate Clans, Shadow Syndicate are generally hostile)
      const hostileFactions = [
        'pirate_clans',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      ];

      if (hostileFactions.includes(controllingFaction.id)) {
        threatLevel = Math.min(threatLevel * 1.5, 100);
        isWarZone = true;
      }
    } else {
      // Player faction controls, but check for hostiles contesting
      if (isContested && contestingFaction) {
        threatLevel = contestingFaction.influence * 0.5;
        isWarZone = true;
      }
    }
  }

  return {
    sector: sectorId,
    status,
    controllingFaction,
    contestingFaction,
    allInfluences,
    isContested,
    isWarZone,
    threatLevel: Math.round(threatLevel),
  };
}

/**
 * Hook to get multiple sectors' control data (for galaxy map)
 */
export function useGalaxyInfluence() {
  return useQuery({
    queryKey: ['galaxy-influence-map'],
    queryFn: () => factionsApi.getGalaxyInfluenceMap(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get all factions (for legends and UI)
 */
export function useFactions() {
  return useQuery({
    queryKey: ['factions'],
    queryFn: () => factionsApi.listFactions(),
    staleTime: 30 * 60 * 1000, // 30 minutes (factions rarely change)
    refetchOnWindowFocus: false,
  });
}
