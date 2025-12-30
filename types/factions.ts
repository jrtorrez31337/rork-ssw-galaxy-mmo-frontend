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

// Territory boundary types
export interface TerritoryBounds {
  type: 'sphere' | 'aabb' | 'convex_hull';
  center?: { x: number; y: number; z: number };
  radius?: number;
  vertices?: Array<[number, number, number]>;
}

// Faction metadata for character creation
export interface FactionMetadata {
  archetype: string;
  tagline: string;
  capitalSector: string;
  startingBenefits: string[];
  description: string;
}

// Faction UUIDs matching backend
export const FACTION_UUIDS: Record<Exclude<FactionId, 'neutral'>, string> = {
  terran_federation: '11111111-1111-1111-1111-111111111111',
  void_consortium: '22222222-2222-2222-2222-222222222222',
  stellar_imperium: '33333333-3333-3333-3333-333333333333',
  free_traders: '44444444-4444-4444-4444-444444444444',
  shadow_syndicate: '66666666-6666-6666-6666-666666666666',
  tech_collective: '77777777-7777-7777-7777-777777777777',
  outer_rim_alliance: '88888888-8888-8888-8888-888888888888',
  merchant_guild: '99999999-9999-9999-9999-999999999999',
  pirate_clans: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

// Full faction metadata for character creation UI
export const FACTION_METADATA: Record<Exclude<FactionId, 'neutral'>, FactionMetadata> = {
  terran_federation: {
    archetype: 'Diplomatic Peacekeepers',
    tagline: 'Unity through cooperation',
    capitalSector: '0.0.0',
    startingBenefits: [
      'Balanced reputation with most factions',
      'Access to diplomatic missions',
      'Federation Navy protection in core systems',
    ],
    description: 'The Terran Federation represents humanity\'s democratic ideals among the stars. Founded on principles of cooperation, exploration, and peaceful coexistence.',
  },
  stellar_imperium: {
    archetype: 'Military Empire',
    tagline: 'Order through strength',
    capitalSector: '50.-20.10',
    startingBenefits: [
      'Combat ship stat bonuses',
      'Military mission access',
      'Imperial Navy privileges',
    ],
    description: 'The Stellar Imperium traces its lineage to ancient Earth dynasties. They believe in order through strength, and their military is unmatched in discipline.',
  },
  void_consortium: {
    archetype: 'Corporate Megacorp',
    tagline: 'Profit is the prime directive',
    capitalSector: '30.40.5',
    startingBenefits: [
      'Trade profit bonuses',
      'Access to exclusive markets',
      'Corporate contract missions',
    ],
    description: 'The Void Consortium is a conglomerate of mega-corporations that control the most lucrative trade routes. Profit is the primary directive.',
  },
  free_traders: {
    archetype: 'Independent Merchants',
    tagline: 'Fortune favors the bold',
    capitalSector: '-20.15.0',
    startingBenefits: [
      'Smuggling route access',
      'Reduced docking fees',
      'Black market connections',
    ],
    description: 'The Free Traders League is a loose association of independent captains who value freedom above all else.',
  },
  shadow_syndicate: {
    archetype: 'Secretive Intelligence',
    tagline: 'Knowledge is power',
    capitalSector: '-40.-30.-15',
    startingBenefits: [
      'Intelligence gathering bonuses',
      'Covert mission access',
      'Enhanced sensor capabilities',
    ],
    description: 'The Shadow Syndicate operates in the spaces between. Part intelligence network, part criminal organization, they trade in secrets.',
  },
  tech_collective: {
    archetype: 'Cyborg Hive Mind',
    tagline: 'Perfection through synthesis',
    capitalSector: '60.0.-25',
    startingBenefits: [
      'Technology research bonuses',
      'Ship upgrade discounts',
      'Network data access',
    ],
    description: 'The Tech Collective seeks the perfection of synthesis between organic life and technology. They view advancement as the path to transcendence.',
  },
  outer_rim_alliance: {
    archetype: 'Frontier Rebels',
    tagline: 'Freedom at any cost',
    capitalSector: '-60.50.20',
    startingBenefits: [
      'Frontier exploration bonuses',
      'Guerrilla combat tactics',
      'Resistance network access',
    ],
    description: 'The Outer Rim Alliance is a coalition of frontier worlds fighting for independence from the core powers.',
  },
  merchant_guild: {
    archetype: 'Trade Diplomats',
    tagline: 'Credit makes the galaxy spin',
    capitalSector: '10.60.-10',
    startingBenefits: [
      'Banking and loan access',
      'Trade route optimization',
      'Neutral zone privileges',
    ],
    description: 'The Merchant Guild is an ancient order of traders and bankers who maintain neutrality and control the standardized credit system.',
  },
  pirate_clans: {
    archetype: 'Aggressive Raiders',
    tagline: 'Strength is the only law',
    capitalSector: '-50.-50.30',
    startingBenefits: [
      'Raiding combat bonuses',
      'Intimidation tactics',
      'Hidden base access',
    ],
    description: 'The Pirate Clans are a confederation of warriors, raiders, and outcasts who live by the code of strength. Honor is earned through combat.',
  },
};

// Playable factions (excludes neutral)
export const PLAYABLE_FACTIONS: Exclude<FactionId, 'neutral'>[] = [
  'terran_federation',
  'stellar_imperium',
  'void_consortium',
  'free_traders',
  'shadow_syndicate',
  'tech_collective',
  'outer_rim_alliance',
  'merchant_guild',
  'pirate_clans',
];
