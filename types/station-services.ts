/**
 * Phase 1: Station Services Types
 * Types for Credits & Fuel Economy system
 */

// ==================== TRANSACTION TYPES ====================

export type TransactionType =
  | 'refuel_purchase'
  | 'repair_purchase'
  | 'mission_reward'
  | 'trade_sale'
  | 'trade_purchase'
  | 'loot_reward'
  | 'admin_adjustment'
  | 'station_service'
  | 'mining_sale'
  | 'initial_balance';

export interface CreditTransaction {
  id: string;
  profile_id: string;
  amount: string; // Decimal string for precision
  balance_before: string;
  balance_after: string;
  transaction_type: TransactionType;
  related_entity_id?: string; // ship_id, station_id, mission_id, etc.
  description?: string;
  created_at: string;
}

// ==================== SERVICE PRICING ====================

export type ServiceType = 'refuel' | 'repair' | 'market_fee';

export interface StationServicePricing {
  id: string;
  station_id: string;
  service_type: ServiceType;
  base_price: string; // Decimal string
  price_per_unit: string; // Decimal string
  reputation_discount_enabled: boolean;
  max_discount_percent: string; // Decimal string (e.g., "20.00" for 20%)
  updated_at: string;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface RefuelRequest {
  ship_id: string;
  amount: number; // Fuel units to purchase (0 = fill tank)
}

export interface RefuelResponse {
  success: boolean;
  amount_added: number;
  cost_paid: string; // Decimal string
  fuel_remaining: number;
  credits_remaining: string; // Decimal string
  discount_applied?: string; // Decimal string, optional
}

export interface RepairRequest {
  ship_id: string;
  repair_hull: boolean;
  repair_shield: boolean; // At least one must be true
}

export interface RepairResponse {
  success: boolean;
  hull_repaired: number;
  shield_repaired: number;
  cost_paid: string; // Decimal string
  hull_current: number;
  shield_current: number;
  credits_remaining: string; // Decimal string
  discount_applied: string; // Decimal string
}

// ==================== ERROR CODES ====================

export type StationServiceErrorCode =
  | 'AUTH_REQUIRED'
  | 'SHIP_NOT_DOCKED'
  | 'SERVICE_NOT_AVAILABLE'
  | 'INSUFFICIENT_CREDITS'
  | 'FUEL_FULL'
  | 'SHIP_FULLY_REPAIRED'
  | 'SHIP_NOT_FOUND'
  | 'STATION_NOT_FOUND'
  | 'PRICING_ERROR'
  | 'VALIDATION_ERROR';

export interface StationServiceError {
  error: {
    code: StationServiceErrorCode;
    message: string;
  };
}

// ==================== SSE EVENT TYPES ====================

export interface FuelPurchasedEvent {
  id: string;
  type: 'fuel_purchased';
  timestamp: number;
  payload: {
    ship_id: string;
    player_id: string;
    station_id: string;
    station_name: string;
    amount: number;
    cost: number;
    fuel_remaining: number;
  };
}

export interface RepairCompletedEvent {
  id: string;
  type: 'repair_completed';
  timestamp: number;
  payload: {
    ship_id: string;
    player_id: string;
    station_id: string;
    station_name: string;
    hull_repaired: number;
    shield_repaired: number;
    cost: number;
    hull_current: number;
    shield_current: number;
  };
}

export interface CreditsChangedEvent {
  id: string;
  type: 'credits_changed';
  timestamp: number;
  payload: {
    player_id: string;
    old_balance: number;
    new_balance: number;
    amount_changed: number;
    reason: TransactionType;
    transaction_id: string;
  };
}

export type StationServiceEvent =
  | FuelPurchasedEvent
  | RepairCompletedEvent
  | CreditsChangedEvent;

// ==================== COST CALCULATION ====================

export interface RepairCostBreakdown {
  hull_damage: number;
  shield_damage: number;
  total_damage: number;
  base_price: string;
  damage_cost: string;
  subtotal: string;
  discount_percent: string;
  discount_amount: string;
  final_cost: string;
}

export interface RefuelCostBreakdown {
  amount: number;
  base_price: string;
  fuel_cost: string;
  subtotal: string;
  discount_percent: string;
  discount_amount: string;
  final_cost: string;
}
