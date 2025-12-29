/**
 * Star Generator
 *
 * Generates stellar objects with physical and visual properties.
 * MUST match server: sector.go:271-334
 */

import { SeededRNG } from '../prng';
import { Coordinates } from '../seed';
import { Star, StarType, STAR_COLORS } from '../types';

/**
 * Star type distribution based on real stellar population
 * Format: [type, cumulative probability threshold]
 */
const STAR_TYPE_DISTRIBUTION: readonly [StarType, number][] = [
  ['M', 0.76],           // Red dwarf - most common
  ['K', 0.88],           // Orange
  ['G', 0.95],           // Yellow (Sun-like)
  ['F', 0.98],           // Yellow-white
  ['A', 0.993],          // White
  ['B', 0.998],          // Blue-white
  ['O', 0.9999],         // Blue (very rare)
  ['neutron', 0.99995],  // Neutron star
  ['black_hole', 1.0],   // Black hole
];

/**
 * Star configuration by type
 */
interface StarConfig {
  massMin: number;
  massMax: number;
  luminosityMin: number;
  luminosityMax: number;
  ageMin: number;
  ageMax: number;
  radiusMin: number;
  radiusMax: number;
}

const STAR_CONFIGS: Record<StarType, StarConfig> = {
  none: { massMin: 0, massMax: 0, luminosityMin: 0, luminosityMax: 0, ageMin: 0, ageMax: 0, radiusMin: 0, radiusMax: 0 },
  M: { massMin: 0.08, massMax: 0.5, luminosityMin: 0.0001, luminosityMax: 0.08, ageMin: 1, ageMax: 13, radiusMin: 0.3, radiusMax: 0.6 },
  K: { massMin: 0.45, massMax: 0.8, luminosityMin: 0.08, luminosityMax: 0.6, ageMin: 1, ageMax: 11, radiusMin: 0.6, radiusMax: 0.9 },
  G: { massMin: 0.8, massMax: 1.04, luminosityMin: 0.6, luminosityMax: 1.5, ageMin: 0.5, ageMax: 10.5, radiusMin: 0.9, radiusMax: 1.1 },
  F: { massMin: 1.04, massMax: 1.4, luminosityMin: 1.5, luminosityMax: 5, ageMin: 0.5, ageMax: 4.5, radiusMin: 1.1, radiusMax: 1.4 },
  A: { massMin: 1.4, massMax: 2.1, luminosityMin: 5, luminosityMax: 25, ageMin: 0.1, ageMax: 2.1, radiusMin: 1.4, radiusMax: 1.8 },
  B: { massMin: 2.1, massMax: 15.1, luminosityMin: 25, luminosityMax: 25025, ageMin: 0.01, ageMax: 0.51, radiusMin: 1.8, radiusMax: 4.0 },
  O: { massMin: 16, massMax: 150, luminosityMin: 30000, luminosityMax: 1030000, ageMin: 0.001, ageMax: 0.011, radiusMin: 4.0, radiusMax: 10.0 },
  neutron: { massMin: 1.4, massMax: 2.0, luminosityMin: 0.00001, luminosityMax: 0.00001, ageMin: 0.001, ageMax: 10.001, radiusMin: 0.00001, radiusMax: 0.00001 },
  black_hole: { massMin: 5, massMax: 55, luminosityMin: 0, luminosityMax: 0, ageMin: 0.001, ageMax: 10.001, radiusMin: 0.05, radiusMax: 0.2 },
};

/**
 * Generate a star for a sector
 */
export function generateStar(rng: SeededRNG, coords: Coordinates): Star | null {
  const roll = rng.next();

  // Determine star type from distribution
  let starType: StarType = 'M';
  for (const [type, threshold] of STAR_TYPE_DISTRIBUTION) {
    if (roll < threshold) {
      starType = type;
      break;
    }
  }

  const config = STAR_CONFIGS[starType];

  // Generate physical properties
  const mass = rng.nextFloat(config.massMin, config.massMax);
  const luminosity = rng.nextFloat(config.luminosityMin, config.luminosityMax);
  const age = rng.nextFloat(config.ageMin, config.ageMax);
  const radius = rng.nextFloat(config.radiusMin, config.radiusMax);

  // Generate visual properties
  const coronaIntensity = rng.nextFloat(0.3, 1.0);
  const surfaceTextureSeed = rng.nextInt(0, 2147483647);

  return {
    type: starType,
    mass,
    luminosity,
    age,
    color: STAR_COLORS[starType],
    radius,
    coronaIntensity,
    surfaceTextureSeed,
  };
}

/**
 * Calculate habitable zone boundaries for a star
 */
export function calculateHabitableZone(star: Star): { inner: number; outer: number } {
  const inner = Math.sqrt(star.luminosity) * 0.75;
  const outer = Math.sqrt(star.luminosity) * 1.5;
  return { inner, outer };
}
