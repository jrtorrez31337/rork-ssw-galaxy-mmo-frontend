/**
 * Procedural Generation Type Definitions
 *
 * Comprehensive types for all procedurally generated sector content.
 * Matches server types from /services/procgen/internal/generator/sector.go
 * with additional visual elements for client-side rendering.
 */

import { Coordinates } from './seed';

// Re-export for convenience
export { Coordinates };

// =============================================================================
// SECTOR TYPES
// =============================================================================

/**
 * Sector type determines the overall character of the sector
 * Server reference: sector.go:14-23
 */
export type SectorType =
  | 'empty'      // Void space, sparse content
  | 'asteroid'   // Rich asteroid fields
  | 'nebula'     // Dense gas clouds
  | 'planetary'  // Star system with planets
  | 'station'    // Major station presence
  | 'anomaly';   // Unusual phenomena

/**
 * Sector navigation type (affects fuel cost)
 * Server reference: pkg/models/game.go:259-267
 */
export type SectorNavigationType =
  | 'normal'   // 1.0x fuel cost
  | 'nebula'   // 1.5x fuel cost (navigation interference)
  | 'void'     // 0.8x fuel cost (clear space)
  | 'hazard';  // 2.0x fuel cost (dangerous)

/**
 * Fuel modifiers per navigation type
 */
export const NAVIGATION_FUEL_MODIFIERS: Record<SectorNavigationType, number> = {
  normal: 1.0,
  nebula: 1.5,
  void: 0.8,
  hazard: 2.0,
};

// =============================================================================
// STELLAR OBJECTS
// =============================================================================

/**
 * Star spectral classification
 * Server reference: sector.go:26-39
 */
export type StarType =
  | 'none'        // No star (rare)
  | 'M'           // Red dwarf (76%)
  | 'K'           // Orange (12%)
  | 'G'           // Yellow/Sun-like (7%)
  | 'F'           // Yellow-white (3%)
  | 'A'           // White (1.3%)
  | 'B'           // Blue-white (0.5%)
  | 'O'           // Blue (0.01%)
  | 'neutron'     // Neutron star
  | 'black_hole'; // Black hole

/**
 * Star object with physical and visual properties
 */
export interface Star {
  type: StarType;

  // Physical properties (server-derived)
  mass: number;        // Solar masses
  luminosity: number;  // Solar luminosity
  age: number;         // Billions of years

  // Visual properties (client-side extension)
  color: string;           // Hex color for rendering
  radius: number;          // Visual radius multiplier (relative to solar)
  coronaIntensity: number; // 0.0-1.0, corona/flare brightness
  surfaceTextureSeed: number; // Sub-seed for procedural surface texture
}

/**
 * Star type visual presets
 */
export const STAR_COLORS: Record<StarType, string> = {
  none: '#000000',
  M: '#FF6B35',      // Red-orange
  K: '#FFB347',      // Orange
  G: '#FFFF66',      // Yellow
  F: '#FFFFCC',      // Yellow-white
  A: '#FFFFFF',      // White
  B: '#AACCFF',      // Blue-white
  O: '#6699FF',      // Blue
  neutron: '#CCCCFF', // Pale blue-white
  black_hole: '#000000',
};

// =============================================================================
// PLANETS
// =============================================================================

/**
 * Planet classification
 * Server reference: sector.go:42-52
 */
export type PlanetType =
  | 'barren'       // Rocky, no atmosphere
  | 'rocky'        // Rocky with thin atmosphere
  | 'ocean'        // Water world
  | 'terrestrial'  // Earth-like
  | 'gas_giant'    // Jupiter-like
  | 'ice_giant'    // Neptune-like
  | 'molten';      // Too close to star

/**
 * Planetary ring system
 */
export interface PlanetaryRings {
  innerRadius: number;   // Inner edge (planet radii)
  outerRadius: number;   // Outer edge (planet radii)
  density: number;       // 0.0-1.0, particle density
  color: string;         // Primary ring color
  tilt: number;          // Degrees of tilt
  gapCount: number;      // Number of Cassini-like gaps
}

/**
 * Moon object
 */
export interface Moon {
  name: string;
  orbitRadius: number;   // Distance from planet (planet radii)
  radius: number;        // Moon size (relative)
  color: string;         // Surface color
  tidallyLocked: boolean;
}

/**
 * Planet with all properties
 */
export interface Planet {
  id: string;
  name: string;
  type: PlanetType;

  // Orbital properties
  orbitRadius: number;     // AU from star
  orbitPeriod: number;     // Days (derived from radius)
  orbitEccentricity: number; // 0.0-0.3 typically
  axialTilt: number;       // Degrees

  // Physical properties
  mass: number;            // Earth masses
  radius: number;          // Earth radii
  gravity: number;         // Surface gravity (g)
  rotationPeriod: number;  // Hours

  // Atmospheric properties
  hasAtmosphere: boolean;
  atmosphereDensity: number; // 0.0-2.0 (Earth = 1.0)
  atmosphereColor: string | null;

  // Surface properties
  hasWater: boolean;
  surfaceColor: string;
  cloudCoverage: number;   // 0.0-1.0

  // Habitability
  habitable: boolean;
  population: number;

  // Resources
  resources: ResourceType[];

  // Additional features
  rings: PlanetaryRings | null;
  moons: Moon[];

  // Visual seeds for procedural textures
  surfaceTextureSeed: number;
  cloudTextureSeed: number;
}

// =============================================================================
// ASTEROID FIELDS
// =============================================================================

/**
 * Resource node within an asteroid field (with state tracking)
 */
export interface AsteroidResource {
  resourceId: string;
  resourceType: ResourceType;
  baseYield: number;
  currentYield: number;
  quality: number;
  isDepleted: boolean;
  positionX: number;
  positionY: number;
  positionZ: number;
}

/**
 * Asteroid field properties
 * Server reference: sector.go:97-103
 */
export interface AsteroidField {
  id: string;

  // Physical properties
  density: number;      // 0.0-1.0, asteroid concentration
  richness: number;     // 0.0-1.0, resource quality
  resourceTypes: ResourceType[];

  // Resource nodes with state
  resources: AsteroidResource[];

  // Spatial extent
  centerX: number;
  centerY: number;
  centerZ: number;
  radiusX: number;
  radiusY: number;
  radiusZ: number;

  // Visual properties
  asteroidCount: number;      // Number of visible asteroids
  asteroidSeed: number;       // Sub-seed for individual asteroid placement
  dominantColor: string;      // Primary asteroid color
  secondaryColor: string;     // Secondary color variation
  sizeVariation: number;      // 0.0-1.0, size randomness
}

// =============================================================================
// STATIONS
// =============================================================================

/**
 * Station classification
 * Server reference: sector.go:105-113
 */
export type StationType =
  | 'trade'       // Commerce hub
  | 'military'    // Defense/weapons
  | 'research'    // Science/upgrades
  | 'mining'      // Resource processing
  | 'residential'; // Living quarters

/**
 * Station services by type
 */
export const STATION_SERVICES: Record<StationType, string[]> = {
  trade: ['market', 'refuel', 'repair', 'storage'],
  military: ['refuel', 'repair', 'weapons', 'bounties'],
  research: ['refuel', 'data_trade', 'upgrades'],
  mining: ['refuel', 'ore_processing', 'storage'],
  residential: ['refuel', 'repair', 'recreation', 'recruitment'],
};

/**
 * Station object
 */
export interface Station {
  id: string;
  name: string;
  type: StationType;
  size: number;         // 1-5 scale
  services: string[];
  owner: string | null; // Faction ID

  // Position within sector
  positionX: number;
  positionY: number;
  positionZ: number;

  // Visual properties
  modelVariant: number;    // 0-4, which model to use
  rotationSpeed: number;   // Radians per second
  rotationAxis: [number, number, number]; // Rotation axis
  lightColor: string;      // Primary lighting color
  dockingBayCount: number; // Visual docking bay count
  antennaCount: number;    // Visual antenna/sensor count

  // State (modified by deltas)
  health?: number;           // 0-100
  damageLevel?: string;      // 'minor' | 'moderate' | 'severe'
  isDestroyed?: boolean;
  ownerFaction?: string;
  previousOwner?: string;
}

// =============================================================================
// ANOMALIES
// =============================================================================

/**
 * Anomaly classification
 * Server reference: sector.go:115-121
 */
export type AnomalyType =
  | 'wormhole'            // Spatial shortcut
  | 'rift'                // Dimensional tear
  | 'radiation_zone'      // Hazardous radiation
  | 'gravity_well'        // Extreme gravity
  | 'temporal_distortion'; // Time anomaly

/**
 * Anomaly object
 */
export interface Anomaly {
  id: string;
  type: AnomalyType;

  // Gameplay properties
  danger: number;    // 0.0-1.0
  reward: number;    // 0.0-1.0 (loot/discovery value)

  // Position
  positionX: number;
  positionY: number;
  positionZ: number;

  // Visual properties
  radius: number;           // Effect radius
  particleColor: string;    // Primary particle color
  secondaryColor: string;   // Secondary effect color
  pulseFrequency: number;   // Animation speed (Hz)
  intensity: number;        // 0.0-1.0, visual intensity
  distortionStrength: number; // Space distortion effect

  // State (modified by deltas)
  isActive?: boolean;
  lastTriggered?: string;   // ISO timestamp
  triggeredBy?: string;     // Player ID
}

// =============================================================================
// NAVIGATION HAZARDS
// =============================================================================

/**
 * Navigation hazard types
 * Server reference: sector.go:130-135
 */
export type HazardType =
  | 'asteroid_dense'    // Thick asteroid field
  | 'radiation'         // Radiation belt
  | 'gravity_anomaly'   // Gravity disturbance
  | 'debris_field'      // Wreckage/debris
  | 'solar_flare';      // Solar radiation

/**
 * Navigation hazard object
 */
export interface NavigationHazard {
  id: string;
  type: HazardType;

  // Position and extent
  positionX: number;
  positionY: number;
  positionZ: number;
  radius: number;

  // Gameplay
  severity: number;       // 0.0-1.0
  damagePerSecond: number;

  // Visual
  visualIntensity: number; // 0.0-1.0
  warningColor: string;    // UI warning color
  particleCount: number;   // Particles to render
}

// =============================================================================
// RESOURCES
// =============================================================================

/**
 * Resource types
 * Server reference: sector.go:564-574
 */
export type ResourceType =
  | 'ore'          // Basic metals
  | 'gas'          // Gaseous resources
  | 'crystals'     // Crystal formations
  | 'water'        // H2O
  | 'organic'      // Biological matter
  | 'rare_metals'  // Rare/precious metals
  | 'fuel';        // Starship fuel

/**
 * Resource deposit
 */
export interface ResourceDeposit {
  type: ResourceType;
  quantity: number;   // Total available
  quality: number;    // 0.0-1.0
  positionX: number;
  positionY: number;
  positionZ: number;
}

// =============================================================================
// ENVIRONMENTAL/VISUAL ELEMENTS
// =============================================================================

/**
 * Space dust particles (ambient)
 */
export interface SpaceDust {
  density: number;      // 0.0-1.0
  color: string;        // Particle color
  particleSize: number; // Relative size
  driftSpeed: number;   // Movement speed
  seed: number;         // Placement seed
}

/**
 * Cosmic ray effects
 */
export interface CosmicRays {
  intensity: number;    // 0.0-1.0
  direction: Coordinates; // Average direction
  color: string;        // Ray color
  frequency: number;    // Rays per second
}

/**
 * Background starfield and nebula
 */
export interface BackgroundStarfield {
  seed: number;           // Generation seed
  density: number;        // Star density 0.5-2.0
  brightnessVariation: number; // 0.0-1.0

  // Nebula properties (optional overlay)
  nebulaHue: number;      // 0-360 degrees
  nebulaSaturation: number; // 0.0-1.0
  nebulaIntensity: number; // 0.0-1.0
  nebulaSeed: number;     // Nebula texture seed

  // Distant galaxy
  galaxyCount: number;    // 0-5 visible galaxies
  galaxySeed: number;     // Galaxy placement seed
}

/**
 * Ambient lighting conditions
 */
export interface AmbientLighting {
  color: string;          // Ambient light color
  intensity: number;      // 0.0-1.0
  starInfluence: number;  // How much star affects ambient (0.0-1.0)
}

// =============================================================================
// GENERATED SECTOR
// =============================================================================

/**
 * Complete procedurally generated sector
 */
export interface GeneratedSector {
  // Identity
  id: string;
  coordinates: Coordinates;
  type: SectorType;
  navigationType: SectorNavigationType;

  // Generation metadata
  seed: number;
  generatedAt: number;  // Unix timestamp

  // Stellar content
  star: Star | null;
  planets: Planet[];

  // Space objects
  asteroidFields: AsteroidField[];
  stations: Station[];
  anomalies: Anomaly[];
  resources: ResourceDeposit[];
  hazards: NavigationHazard[];

  // Environmental/visual
  spaceDust: SpaceDust;
  cosmicRays: CosmicRays;
  background: BackgroundStarfield;
  ambientLighting: AmbientLighting;

  // Gameplay properties (can be modified by deltas)
  threatLevel: number;         // 1-10
  controllingFaction: string | null;
  population: number;          // Total across all bodies
}

// =============================================================================
// SECTOR STATE (FOR DELTA TRACKING)
// =============================================================================

/**
 * Delta types for state changes
 */
export type DeltaType =
  | 'resource_depleted'
  | 'resource_respawned'
  | 'station_damaged'
  | 'station_repaired'
  | 'station_destroyed'
  | 'ownership_changed'
  | 'population_changed'
  | 'threat_level_changed'
  | 'npc_spawned'
  | 'npc_destroyed'
  | 'anomaly_triggered'
  | 'anomaly_reset'
  | 'hazard_appeared'
  | 'hazard_cleared';

/**
 * State delta from server
 */
export interface SectorDelta {
  id: string;
  sectorId: string;
  deltaType: DeltaType;
  targetId?: string;
  targetType?: string;
  changes: Record<string, any>;
  appliedAt: string;  // ISO timestamp
  version: number;
  causedByPlayerId?: string;
  causedByEvent?: string;
}

/**
 * Sector with applied state
 */
export interface SectorWithState {
  sector: GeneratedSector;
  version: number;
  deltas: SectorDelta[];
  lastSyncAt: number;
}

// =============================================================================
// HASH VALIDATION
// =============================================================================

/**
 * Fields included in sector hash for validation
 * Only procedurally generated static fields - no state
 */
export interface SectorHashData {
  id: string;
  coordinates: Coordinates;
  type: SectorType;
  seed: number;
  star: Star | null;
  planets: Planet[];
  asteroids: AsteroidField[];
  stations: Station[];
  anomalies: Anomaly[];
  resources: ResourceDeposit[];
  navigationHazards: NavigationHazard[];
}

/**
 * Extract hashable data from sector
 */
export function extractHashData(sector: GeneratedSector): SectorHashData {
  return {
    id: sector.id,
    coordinates: sector.coordinates,
    type: sector.type,
    seed: sector.seed,
    star: sector.star,
    planets: sector.planets,
    asteroids: sector.asteroidFields,
    stations: sector.stations,
    anomalies: sector.anomalies,
    resources: sector.resources,
    navigationHazards: sector.hazards,
  };
}

// =============================================================================
// TYPE ALIASES
// =============================================================================

/**
 * Sector type alias for convenience
 * Used by stateSync and cache modules
 */
export type Sector = GeneratedSector;
