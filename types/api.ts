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
