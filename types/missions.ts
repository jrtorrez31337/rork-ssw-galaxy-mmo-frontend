/**
 * Mission System Type Definitions
 * Matches backend API v1 specification
 */

/**
 * Mission objective status states
 */
export type ObjectiveStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Mission instance status states
 */
export type MissionStatus = 'active' | 'completed' | 'failed' | 'abandoned' | 'expired';

/**
 * Mission type categories
 */
export type MissionType =
  | 'combat'
  | 'mining'
  | 'trade'
  | 'exploration'
  | 'delivery'
  | 'escort'
  | 'patrol';

/**
 * Objective type identifiers for auto-tracking
 */
export type ObjectiveType =
  | 'combat_kills'
  | 'mine_resources'
  | 'visit_sector'
  | 'dock_at_station'
  | 'deliver_item'
  | 'trade_volume';

/**
 * Individual mission objective
 */
export interface Objective {
  id: string;
  description: string;
  objective_type: ObjectiveType;
  current_progress: number;
  target_quantity: number;
  status: ObjectiveStatus;
  is_required: boolean;
  target_entity_type?: string;
  target_sector?: string;
  target_station_id?: string;
}

/**
 * Reward item structure
 */
export interface RewardItem {
  resource_type: string;
  quantity: number;
  quality: number;
}

/**
 * Active mission instance
 */
export interface Mission {
  id: string;
  template_name: string;
  description: string;
  status: MissionStatus;
  assigned_at: string;
  expires_at?: string;
  completed_at?: string;
  progress_percentage: number;
  reward_credits: number;
  reward_reputation: number;
  reward_items?: RewardItem[];
  objectives: Objective[];
  mission_type?: MissionType;
  faction_name?: string;
}

/**
 * Template objective definition
 */
export interface TemplateObjective {
  description: string;
  objective_type: ObjectiveType;
  target_quantity: number;
  target_entity_type?: string;
  is_required: boolean;
}

/**
 * Mission template (available mission)
 */
export interface MissionTemplate {
  template_id: string;
  name: string;
  description: string;
  mission_type: MissionType;
  faction_name?: string;
  required_level: number;
  required_reputation: number;
  reward_credits: number;
  reward_reputation: number;
  reward_items: RewardItem[];
  is_repeatable: boolean;
  cooldown_duration?: string;
  time_limit?: string;
  objectives: TemplateObjective[];
}

/**
 * API Response: Get available missions
 */
export interface GetAvailableMissionsResponse {
  missions: MissionTemplate[];
}

/**
 * API Response: Get active missions
 */
export interface GetActiveMissionsResponse {
  missions: Mission[];
}

/**
 * API Response: Get mission details
 */
export interface GetMissionDetailsResponse {
  mission: Mission;
}

/**
 * API Response: Accept mission
 */
export interface AcceptMissionResponse {
  mission: Mission;
}

/**
 * API Response: Get completed missions
 */
export interface GetCompletedMissionsResponse {
  missions: Mission[];
  total: number;
}

/**
 * SSE Event: Mission assigned
 */
export interface MissionAssignedEvent {
  type: 'mission_assigned';
  player_id: string;
  mission_id: string;
  template_name: string;
  timestamp: string;
}

/**
 * SSE Event: Objective updated
 */
export interface ObjectiveUpdatedEvent {
  type: 'objective_updated';
  player_id: string;
  mission_id: string;
  objective_id: string;
  current_progress: number;
  target_quantity: number;
  status: ObjectiveStatus;
  timestamp: string;
}

/**
 * SSE Event: Objective completed
 */
export interface ObjectiveCompletedEvent {
  type: 'objective_completed';
  player_id: string;
  mission_id: string;
  objective_id: string;
  description: string;
  timestamp: string;
}

/**
 * SSE Event: Mission completed
 */
export interface MissionCompletedEvent {
  type: 'mission_completed';
  player_id: string;
  mission_id: string;
  template_name: string;
  credits_awarded: number;
  reputation_awarded: number;
  items_awarded: RewardItem[];
  timestamp: string;
}

/**
 * SSE Event: Mission expired
 */
export interface MissionExpiredEvent {
  type: 'mission_expired';
  player_id: string;
  mission_id: string;
  template_name: string;
  timestamp: string;
}

/**
 * Union type for all mission-related SSE events
 */
export type MissionEvent =
  | MissionAssignedEvent
  | ObjectiveUpdatedEvent
  | ObjectiveCompletedEvent
  | MissionCompletedEvent
  | MissionExpiredEvent;
