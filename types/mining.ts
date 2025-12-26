// Mining System Types (Phase 2)

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface ResourceNode {
  id: string;
  sector: string;
  position: Position3D;
  resource_type: string;
  richness: number;
  quantity_remaining: number;
  quality_mean: string; // Decimal string for precision
  quality_stddev?: string; // Optional standard deviation
  respawns: boolean;
}

export interface ResourceNodesResponse {
  sector: string;
  nodes: ResourceNode[];
}

export interface ExtractionRequest {
  ship_id: string;
  resource_node_id: string;
  quantity: number;
}

export interface ExtractionResult {
  extraction_id: string;
  quantity_extracted: number;
  quality: string; // Decimal string for precision
  node_quantity_remaining: number;
  ship_cargo_used: number;
  ship_cargo_capacity: number;
  extraction_time_seconds: number;
}

// SSE Event Types

export interface ResourceExtractedEvent {
  type: 'resource_extracted';
  payload: {
    ship_id: string;
    player_id: string;
    resource_type: string;
    quantity: number;
    quality: string;
    node_quantity_remaining: number;
    sector: string;
  };
}

export interface MiningInventoryUpdateEvent {
  type: 'inventory_update';
  payload: {
    player_id: string;
    ship_id: string;
    reason: 'mining';
  };
}

export type MiningEvent = ResourceExtractedEvent | MiningInventoryUpdateEvent;

// Error Codes

export type MiningErrorCode =
  | 'MINING_SHIP_NOT_FOUND'
  | 'MINING_NODE_NOT_FOUND'
  | 'MINING_OUT_OF_RANGE'
  | 'MINING_CARGO_FULL'
  | 'MINING_NODE_DEPLETED'
  | 'MINING_IN_COMBAT'
  | 'MINING_DOCKED';

export interface MiningError {
  code: MiningErrorCode;
  message: string;
}

// Resource Types (common ores)
export const RESOURCE_TYPES = [
  'iron_ore',
  'copper_ore',
  'gold_ore',
  'titanium_ore',
  'platinum_ore',
  'uranium_ore',
  'ice',
  'helium',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

// Quality Tiers
export type QualityTier = 'poor' | 'average' | 'good' | 'excellent';

export interface QualityInfo {
  tier: QualityTier;
  color: string;
  label: string;
}

/**
 * Get quality tier and display info from numeric quality value
 * @param quality - Quality value (0.50 - 2.00)
 * @returns Quality tier information
 */
export function getQualityInfo(quality: number | string): QualityInfo {
  const q = typeof quality === 'string' ? parseFloat(quality) : quality;

  if (q < 0.8) {
    return { tier: 'poor', color: '#EF4444', label: 'Poor' }; // Red
  } else if (q < 1.2) {
    return { tier: 'average', color: '#F59E0B', label: 'Average' }; // Yellow
  } else if (q < 1.6) {
    return { tier: 'good', color: '#10B981', label: 'Good' }; // Green
  } else {
    return { tier: 'excellent', color: '#8B5CF6', label: 'Excellent' }; // Purple
  }
}

/**
 * Get color for resource type
 * @param resourceType - Resource type string
 * @returns Hex color code
 */
export function getResourceColor(resourceType: string): string {
  const colorMap: Record<string, string> = {
    iron_ore: '#CD7F32',
    copper_ore: '#B87333',
    gold_ore: '#FFD700',
    titanium_ore: '#878681',
    platinum_ore: '#E5E4E2',
    uranium_ore: '#39FF14',
    ice: '#ADD8E6',
    helium: '#FFC0CB',
  };

  return colorMap[resourceType] || '#9CA3AF'; // Default gray
}

/**
 * Calculate distance between two 3D positions
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns Distance in units
 */
export function calculateDistance(pos1: Position3D, pos2: Position3D): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const dz = pos2.z - pos1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a position is within mining range (1000 units)
 * @param shipPos - Ship position
 * @param nodePos - Node position
 * @returns True if in range
 */
export function isInMiningRange(
  shipPos: Position3D,
  nodePos: Position3D
): boolean {
  return calculateDistance(shipPos, nodePos) <= 1000;
}
