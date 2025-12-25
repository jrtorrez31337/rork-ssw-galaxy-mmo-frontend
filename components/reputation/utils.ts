import { ReputationTier, ReputationChangeReason } from '@/types/api';

export function getTierColor(tier: ReputationTier): string {
  const colors: Record<ReputationTier, string> = {
    Reviled: '#8B0000',
    Hostile: '#DC143C',
    Unfriendly: '#FF6347',
    Neutral: '#808080',
    Friendly: '#4682B4',
    Honored: '#4169E1',
    Exalted: '#FFD700',
  };
  return colors[tier] || '#808080';
}

export function getFactionName(factionId: string): string {
  // Map faction IDs to display names
  const factionNames: Record<string, string> = {
    terran_federation: 'Terran Federation',
    void_consortium: 'Void Consortium',
    stellar_alliance: 'Stellar Alliance',
    crimson_fleet: 'Crimson Fleet',
    free_traders: 'Free Traders Guild',
    scientific_directorate: 'Scientific Directorate',
    mining_collective: 'Mining Collective',
    independent_systems: 'Independent Systems',
  };

  return factionNames[factionId] || formatFactionId(factionId);
}

function formatFactionId(factionId: string): string {
  return factionId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatReputationReason(reason: ReputationChangeReason): string {
  const reasons: Record<ReputationChangeReason, string> = {
    trade: 'Completed Trade',
    mission_complete: 'Completed Mission',
    combat_kill: 'Combat Victory',
    combat_assist: 'Combat Assist',
    defend_station: 'Defended Station',
    attack_station: 'Attacked Station',
    betrayal: 'Betrayal',
    smuggling: 'Smuggling',
    piracy: 'Piracy',
  };
  return reasons[reason] || reason;
}
