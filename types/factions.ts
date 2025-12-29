/**
 * Faction Types
 * Based on 03F-SOCIAL.apib specification
 */

export interface Faction {
  id: string;
  name: string;
  description: string;
  color: string; // Hex color code for UI
  emblem: string; // Asset identifier
  home_system: string;
  member_count: number;
  founded: string; // ISO timestamp
  is_playable: boolean;
}

export interface FactionDetails extends Faction {
  controlled_sectors: number;
  total_influence: number;
  capital_sector: string;
}

export interface FactionMember {
  player_id: string;
  player_name: string;
  reputation: number;
  reputation_tier: string;
  joined_at: string;
  rank: string;
}

export interface FactionMembersResponse {
  items: FactionMember[];
  total: number;
  limit: number;
  offset: number;
}

export interface FactionRelation {
  faction_id: string;
  faction_name: string;
  status: 'allied' | 'friendly' | 'neutral' | 'unfriendly' | 'hostile' | 'at_war';
  standing: number; // -100 to 100
  trade_modifier: number; // Percentage modifier for trade
  combat_status: 'peace' | 'tension' | 'conflict' | 'war';
}

export interface FactionRelations {
  faction_id: string;
  relations: FactionRelation[];
}

export interface FactionTerritory {
  faction_id: string;
  controlled_sectors: string[]; // Sector coordinates
  capital_sector: string;
  total_influence: number;
  border_sectors: string[];
}

export interface SectorInfluence {
  sector: string;
  influences: {
    faction_id: string;
    faction_name: string;
    influence: number; // 0-100 percentage
    is_controlling: boolean;
  }[];
  controlling_faction?: string;
}

export interface GalaxyInfluenceMap {
  sectors: SectorInfluence[];
  updated_at: string;
}

// Faction IDs enum for type safety
export type FactionId =
  | 'terran_federation'
  | 'void_consortium'
  | 'stellar_imperium'
  | 'free_traders'
  | 'shadow_syndicate'
  | 'tech_collective'
  | 'outer_rim_alliance'
  | 'merchant_guild'
  | 'pirate_clans'
  | 'neutral';

// Faction colors map (matching backend)
export const FACTION_COLORS: Record<FactionId, string> = {
  terran_federation: '#3B82F6',
  void_consortium: '#10B981',
  stellar_imperium: '#EF4444',
  free_traders: '#F59E0B',
  shadow_syndicate: '#8B5CF6',
  tech_collective: '#06B6D4',
  outer_rim_alliance: '#F97316',
  merchant_guild: '#84CC16',
  pirate_clans: '#DC2626',
  neutral: '#6B7280',
};
