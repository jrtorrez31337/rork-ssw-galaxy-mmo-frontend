/**
 * Procedural Generation Library
 *
 * Client-side procedural generation for sector content.
 * Produces identical results to the Go server for validation.
 */

// Core modules
export { SeededRNG, createRNGFromCoords } from './prng';
export {
  coordsToSeed,
  coordsToSectorId,
  sectorIdToCoords,
  coordsToDisplayString,
  displayStringToCoords,
  calculateDistance,
  distanceFromCenter,
  getNeighborCoords,
  getDirectNeighborCoords,
  isValidSectorFormat,
  DEFAULT_BASE_SEED,
  SEED_PRIME_X,
  SEED_PRIME_Y,
  SEED_PRIME_Z,
} from './seed';
export type { Coordinates } from './seed';

// Type definitions
export * from './types';

// Main generator
export { SectorGenerator, defaultGenerator, generateSector } from './generator';

// Sub-generators (for advanced usage)
export { generateStar, calculateHabitableZone } from './generators/star';
export { generatePlanets } from './generators/planet';
export { generateAsteroidFields, generateAsteroidPositions } from './generators/asteroid';
export { generateStations, getStationTypePrefix } from './generators/station';
export {
  generateAnomalies,
  getAnomalyDescription,
  getAnomalyDangerLevel,
} from './generators/anomaly';
export {
  generateHazards,
  getHazardWarning,
  getHazardSeverityText,
  isInHazardZone,
} from './generators/hazard';
export {
  generateVisualElements,
  generateStarfieldPositions,
  generateNebulaClouds,
  generateDistantGalaxies,
} from './generators/visual';

// State management
export { sectorCache } from './cache';
export { stateSync } from './stateSync';
export type { SyncResult } from './stateSync';
