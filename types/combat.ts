// Combat System Types (Phase 5)

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// NPC Entity Types

export type NPCType = 'pirate' | 'trader' | 'patrol';

export interface NPCEntity {
  entity_id: string;
  entity_type: 'npc';
  position: [number, number, number];
  velocity: [number, number, number];
  name: string;
  faction?: string;
  npc_type: NPCType;
  hull: number;
  hull_max: number;
  shield: number;
  shield_max: number;
  level?: number;
}

// Combat Types

export interface CombatParticipant {
  player_id: string;
  ship_id: string;
  name: string;
  hull: number;
  hull_max: number;
  shield: number;
  shield_max: number;
  is_alive: boolean;
  is_npc: boolean;
}

export interface CombatInstance {
  combat_id: string;
  sector: string;
  participants: CombatParticipant[];
  tick: number;
  status: 'active' | 'ended';
  started_at: string;
}

export interface InitiateCombatRequest {
  player_id: string;
  ship_id: string;
  target_entity_id: string;
}

export interface InitiateCombatResponse {
  combat: CombatInstance;
  message: string;
}

// Combat Tick Events

export type CombatTickEventType = 'damage' | 'shield_break' | 'death';

export interface CombatTickEvent {
  type: CombatTickEventType;
  attacker?: string;
  target?: string;
  damage?: number;
  damage_type?: string;
  target_hull?: number;
  target_shield?: number;
}

// SSE Event Types

export interface CombatOutcomeEvent {
  type: 'combat_outcome';
  payload: {
    combat_id: string;
    tick: number;
    events: CombatTickEvent[];
  };
}

export interface LootedResource {
  resource_type: string;
  quantity: number;
  quality: string; // Decimal string for precision
}

export interface LootReceivedEvent {
  type: 'loot_received';
  payload: {
    combat_id: string;
    player_id: string;
    credits: number;
    resources: LootedResource[];
  };
}

export type CombatEndReason = 'victory' | 'defeat' | 'flee' | 'timeout';

export interface CombatEndedEvent {
  type: 'combat_ended';
  payload: {
    combat_id: string;
    tick: number;
    end_reason: CombatEndReason;
  };
}

export type CombatEvent = CombatOutcomeEvent | LootReceivedEvent | CombatEndedEvent;

// Loot Types

export interface LootDrop {
  credits: number;
  resources: LootedResource[];
  timestamp: number;
}

// Damage Number Animation

export interface DamageNumber {
  id: string;
  damage: number;
  position: { x: number; y: number };
  timestamp: number;
  targetId: string;
}

// NPC Colors

export const NPC_COLORS: Record<NPCType, string> = {
  pirate: '#ef4444', // Red
  trader: '#3b82f6', // Blue
  patrol: '#10b981', // Green
};

// Helper Functions

export function getNPCColor(npcType: NPCType): string {
  return NPC_COLORS[npcType] || '#9ca3af';
}

export function getHealthPercentage(current: number, max: number): number {
  return Math.max(0, Math.min(100, (current / max) * 100));
}

export function getTotalHealth(participant: CombatParticipant): number {
  return participant.hull + participant.shield;
}

export function getTotalMaxHealth(participant: CombatParticipant): number {
  return participant.hull_max + participant.shield_max;
}
