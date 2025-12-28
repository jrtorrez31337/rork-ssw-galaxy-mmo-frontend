export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  session_id: string;
}

export interface UserProfile {
  account_id: string;
  email: string;
  status: string;
  home_region: string;
  profile_id: string;
  display_name: string;
  active_sessions: number;
  credits: string; // Decimal string for precision (Phase 1)
}

export interface CharacterAttributes {
  piloting: number;
  engineering: number;
  science: number;
  tactics: number;
  leadership: number;
}

export interface Character {
  id: string;
  profile_id: string;
  name: string;
  home_sector: string;
  attributes: CharacterAttributes;
  created_at: string;
}

export interface ShipStats {
  hull_strength: number;
  shield_capacity: number;
  speed: number;
  cargo_space: number;
  sensors: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type ShipType = 'scout' | 'fighter' | 'trader' | 'explorer';

export type TravelStatus = 'idle' | 'in_transit' | 'arriving';

export interface Ship {
  id: string;
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  hull_points: number;
  hull_max: number;
  shield_points: number;
  shield_max: number;
  cargo_capacity: number;
  current_cargo_used?: number;
  location_sector: string;
  position: Vector3;
  fuel_current: number;
  fuel_capacity: number;
  in_combat: boolean;
  docked_at?: string;
  last_jump_at?: string;
  created_at: string;
  stat_allocation?: ShipStats;
  // Async travel fields
  travel_status?: TravelStatus;
  current_travel_id?: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: ApiError;
}

// Reputation System Types
export type ReputationTier =
  | 'Reviled'
  | 'Hostile'
  | 'Unfriendly'
  | 'Neutral'
  | 'Friendly'
  | 'Honored'
  | 'Exalted';

export type ReputationEffect =
  | 'kill_on_sight'
  | 'no_access'
  | 'attack_on_sight'
  | 'higher_prices'
  | 'discounts'
  | 'special_missions'
  | 'best_prices'
  | 'exclusive_access';

export type ReputationChangeReason =
  | 'trade'
  | 'mission_complete'
  | 'combat_kill'
  | 'combat_assist'
  | 'defend_station'
  | 'attack_station'
  | 'betrayal'
  | 'smuggling'
  | 'piracy';

export interface FactionReputation {
  faction_id: string;
  score: number;
  tier: ReputationTier;
  effects: ReputationEffect[];
  updated_at: string;
}

export interface PlayerReputations {
  player_id: string;
  reputations: FactionReputation[];
}

export interface ReputationHistoryEvent {
  id: string;
  profile_id: string;
  faction_id: string;
  change_amount: number;
  reason: ReputationChangeReason;
  related_entity_id?: string;
  previous_standing: number;
  new_standing: number;
  created_at: string;
}

export interface ReputationHistory {
  player_id: string;
  events: ReputationHistoryEvent[];
  count: number;
}

export interface ReputationTierDefinition {
  name: ReputationTier;
  min_score: number;
  max_score: number;
  effects: ReputationEffect[];
}

export interface ReputationTiers {
  tiers: ReputationTierDefinition[];
}

export interface ReputationTierChangeEvent {
  player_id: string;
  faction_id: string;
  old_tier: ReputationTier;
  new_tier: ReputationTier;
  old_score: number;
  new_score: number;
  timestamp: number;
}
