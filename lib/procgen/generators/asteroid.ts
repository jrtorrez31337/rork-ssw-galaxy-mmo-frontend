/**
 * Asteroid Field Generator
 *
 * Generates asteroid fields with resources and visual properties.
 * MUST match server: sector.go:482-504
 */

import { SeededRNG } from '../prng';
import { AsteroidField, ResourceType } from '../types';

/**
 * Asteroid color palette
 */
const ASTEROID_COLORS: readonly string[] = [
  '#8B7355', // Brown
  '#696969', // Dark gray
  '#A0826D', // Tan
  '#556B2F', // Dark olive
  '#4A4A4A', // Charcoal
  '#8B8378', // Light gray-brown
];

/**
 * Generate asteroid fields for a sector
 * MUST match server: sector.go:482-504
 */
export function generateAsteroidFields(rng: SeededRNG): AsteroidField[] {
  const numFields = rng.nextInt(1, 4);
  const fields: AsteroidField[] = [];

  for (let i = 0; i < numFields; i++) {
    const field = generateAsteroidField(rng, i);
    fields.push(field);
  }

  return fields;
}

/**
 * Generate a single asteroid field
 */
function generateAsteroidField(rng: SeededRNG, index: number): AsteroidField {
  // Resource types - ore is always present
  const resourceTypes: ResourceType[] = ['ore'];
  if (rng.next() < 0.3) resourceTypes.push('crystals');
  if (rng.next() < 0.2) resourceTypes.push('rare_metals');

  // Position within sector
  const centerX = rng.nextFloat(-8000, 8000);
  const centerY = rng.nextFloat(-8000, 8000);
  const centerZ = rng.nextFloat(-8000, 8000);

  // Size of the field
  const radiusX = rng.nextFloat(500, 3000);
  const radiusY = rng.nextFloat(500, 3000);
  const radiusZ = rng.nextFloat(200, 1000);

  // Density and richness
  const density = rng.nextFloat(0.2, 1.0);
  const richness = rng.nextFloat(0.1, 1.0);

  // Visual properties
  const asteroidCount = Math.floor(50 + density * 450); // 50-500 asteroids
  const asteroidSeed = rng.nextInt(0, 2147483647);
  const dominantColor = rng.pick(ASTEROID_COLORS);
  const secondaryColor = rng.pick(ASTEROID_COLORS);
  const sizeVariation = rng.nextFloat(0.3, 0.8);

  return {
    id: `asteroid_field_${index}`,
    density,
    richness,
    resourceTypes,
    resources: [], // Populated by state sync from server deltas
    centerX,
    centerY,
    centerZ,
    radiusX,
    radiusY,
    radiusZ,
    asteroidCount,
    asteroidSeed,
    dominantColor,
    secondaryColor,
    sizeVariation,
  };
}

/**
 * Generate individual asteroid positions within a field
 * Call this at render time, not during sector generation
 */
export function generateAsteroidPositions(
  field: AsteroidField,
  count: number = field.asteroidCount
): Array<{ x: number; y: number; z: number; size: number; rotation: number }> {
  const rng = new SeededRNG(field.asteroidSeed);
  const asteroids: Array<{ x: number; y: number; z: number; size: number; rotation: number }> = [];

  for (let i = 0; i < count; i++) {
    // Ellipsoid distribution
    const u = rng.next();
    const v = rng.next();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    // Random distance from center (cube root for uniform volume distribution)
    const r = Math.cbrt(rng.next());

    const x = field.centerX + r * field.radiusX * Math.sin(phi) * Math.cos(theta);
    const y = field.centerY + r * field.radiusY * Math.sin(phi) * Math.sin(theta);
    const z = field.centerZ + r * field.radiusZ * Math.cos(phi);

    // Size varies based on field's size variation
    const baseSize = rng.nextFloat(1, 10);
    const size = baseSize * (1 - field.sizeVariation + rng.next() * field.sizeVariation * 2);

    // Random rotation for visual variety
    const rotation = rng.nextFloat(0, Math.PI * 2);

    asteroids.push({ x, y, z, size, rotation });
  }

  return asteroids;
}
