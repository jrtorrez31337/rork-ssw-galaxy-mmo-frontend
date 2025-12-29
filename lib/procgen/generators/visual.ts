/**
 * Visual Element Generator
 *
 * Generates environmental visual elements: space dust, cosmic rays,
 * background starfields, nebulae, and ambient lighting.
 *
 * These are client-side only extensions for visual richness.
 */

import { SeededRNG } from '../prng';
import { Coordinates, coordsToSeed } from '../seed';
import {
  Star,
  SectorType,
  SpaceDust,
  CosmicRays,
  BackgroundStarfield,
  AmbientLighting,
} from '../types';

/**
 * Space dust color palette
 */
const DUST_COLORS: readonly string[] = [
  '#FFE4C4', // Bisque
  '#F5DEB3', // Wheat
  '#DEB887', // Burlywood
  '#D2B48C', // Tan
  '#C4AE99', // Light brown
  '#B8A590', // Muted tan
];

/**
 * Cosmic ray colors
 */
const RAY_COLORS: readonly string[] = [
  '#FFFFFF', // White
  '#CCFFFF', // Light cyan
  '#FFCCCC', // Light red
  '#CCCCFF', // Light purple
];

/**
 * Ambient light base colors by sector type
 */
const AMBIENT_COLORS: Record<SectorType, readonly string[]> = {
  empty: ['hsl(220, 15%, 15%)', 'hsl(240, 10%, 12%)'],
  asteroid: ['hsl(30, 20%, 18%)', 'hsl(40, 15%, 15%)'],
  nebula: ['hsl(280, 30%, 20%)', 'hsl(300, 25%, 18%)', 'hsl(260, 35%, 22%)'],
  planetary: ['hsl(210, 20%, 20%)', 'hsl(200, 25%, 18%)'],
  station: ['hsl(180, 15%, 18%)', 'hsl(160, 20%, 15%)'],
  anomaly: ['hsl(320, 30%, 18%)', 'hsl(340, 25%, 20%)', 'hsl(300, 35%, 15%)'],
};

/**
 * Generate all visual elements for a sector
 */
export function generateVisualElements(
  rng: SeededRNG,
  coords: Coordinates,
  sectorType: SectorType,
  star: Star | null
): {
  spaceDust: SpaceDust;
  cosmicRays: CosmicRays;
  background: BackgroundStarfield;
  ambientLighting: AmbientLighting;
} {
  return {
    spaceDust: generateSpaceDust(rng, sectorType),
    cosmicRays: generateCosmicRays(rng),
    background: generateBackground(rng, coords, sectorType),
    ambientLighting: generateAmbientLighting(rng, sectorType, star),
  };
}

/**
 * Generate space dust properties
 */
function generateSpaceDust(rng: SeededRNG, sectorType: SectorType): SpaceDust {
  // Nebulae have more dust
  const baseDensity = sectorType === 'nebula' ? 0.4 : 0.2;
  const density = rng.nextFloat(0, baseDensity + 0.3);

  return {
    density,
    color: rng.pick(DUST_COLORS),
    particleSize: rng.nextFloat(0.5, 2.0),
    driftSpeed: rng.nextFloat(0.1, 0.5),
    seed: rng.nextInt(0, 2147483647),
  };
}

/**
 * Generate cosmic ray properties
 */
function generateCosmicRays(rng: SeededRNG): CosmicRays {
  // Normalize direction vector
  let dx = rng.next() - 0.5;
  let dy = rng.next() - 0.5;
  let dz = rng.next() - 0.5;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  dx /= length;
  dy /= length;
  dz /= length;

  return {
    intensity: rng.nextFloat(0, 0.3),
    direction: { x: dx, y: dy, z: dz },
    color: rng.pick(RAY_COLORS),
    frequency: rng.nextFloat(0.5, 3.0), // Rays per second
  };
}

/**
 * Generate background starfield and nebula
 */
function generateBackground(
  rng: SeededRNG,
  coords: Coordinates,
  sectorType: SectorType
): BackgroundStarfield {
  // Use a different seed offset for background consistency across adjacent sectors
  // This makes the background feel more continuous
  const bgSeed = coordsToSeed(1337, coords.x, coords.y, coords.z);

  // Star density varies slightly
  const density = rng.nextFloat(0.8, 1.5);
  const brightnessVariation = rng.nextFloat(0.3, 0.8);

  // Nebula properties
  const hasNebula = sectorType === 'nebula' || rng.next() < 0.3;
  const nebulaHue = rng.nextFloat(0, 360);
  const nebulaSaturation = hasNebula ? rng.nextFloat(0.3, 0.7) : 0;
  const nebulaIntensity = hasNebula
    ? sectorType === 'nebula'
      ? rng.nextFloat(0.4, 0.7)
      : rng.nextFloat(0.1, 0.3)
    : 0;
  const nebulaSeed = rng.nextInt(0, 2147483647);

  // Distant galaxies
  const galaxyCount = rng.nextInt(0, 4);
  const galaxySeed = rng.nextInt(0, 2147483647);

  return {
    seed: bgSeed,
    density,
    brightnessVariation,
    nebulaHue,
    nebulaSaturation,
    nebulaIntensity,
    nebulaSeed,
    galaxyCount,
    galaxySeed,
  };
}

/**
 * Generate ambient lighting
 */
function generateAmbientLighting(
  rng: SeededRNG,
  sectorType: SectorType,
  star: Star | null
): AmbientLighting {
  // Base color from sector type
  const baseColor = rng.pick(AMBIENT_COLORS[sectorType]);

  // Intensity varies
  let intensity = rng.nextFloat(0.1, 0.3);

  // Star influence on ambient light
  let starInfluence = 0;
  if (star && star.type !== 'none' && star.type !== 'black_hole') {
    starInfluence = rng.nextFloat(0.3, 0.7);
    // Brighter stars increase ambient intensity
    intensity += Math.min(0.2, star.luminosity * 0.01);
  }

  return {
    color: baseColor,
    intensity: Math.min(0.5, intensity),
    starInfluence,
  };
}

/**
 * Generate procedural starfield positions for rendering
 * Call this at render time for the actual star positions
 */
export function generateStarfieldPositions(
  background: BackgroundStarfield,
  count: number = 200
): Array<{ x: number; y: number; brightness: number; size: number }> {
  const rng = new SeededRNG(background.seed);
  const stars: Array<{ x: number; y: number; brightness: number; size: number }> = [];

  const targetCount = Math.floor(count * background.density);

  for (let i = 0; i < targetCount; i++) {
    const x = rng.next();
    const y = rng.next();

    // Brightness with variation
    const baseBrightness = rng.next();
    const brightness = baseBrightness * (1 - background.brightnessVariation) +
      rng.next() * background.brightnessVariation;

    // Size correlates with brightness
    const size = 0.5 + brightness * 2.0;

    stars.push({ x, y, brightness, size });
  }

  return stars;
}

/**
 * Generate nebula cloud positions for rendering
 */
export function generateNebulaClouds(
  background: BackgroundStarfield,
  count: number = 20
): Array<{ x: number; y: number; size: number; opacity: number; rotation: number }> {
  if (background.nebulaIntensity === 0) {
    return [];
  }

  const rng = new SeededRNG(background.nebulaSeed);
  const clouds: Array<{ x: number; y: number; size: number; opacity: number; rotation: number }> = [];

  for (let i = 0; i < count; i++) {
    clouds.push({
      x: rng.next(),
      y: rng.next(),
      size: rng.nextFloat(0.1, 0.4),
      opacity: rng.nextFloat(0.1, background.nebulaIntensity),
      rotation: rng.nextFloat(0, Math.PI * 2),
    });
  }

  return clouds;
}

/**
 * Generate distant galaxy positions for rendering
 */
export function generateDistantGalaxies(
  background: BackgroundStarfield
): Array<{ x: number; y: number; size: number; rotation: number; type: 'spiral' | 'elliptical' }> {
  if (background.galaxyCount === 0) {
    return [];
  }

  const rng = new SeededRNG(background.galaxySeed);
  const galaxies: Array<{ x: number; y: number; size: number; rotation: number; type: 'spiral' | 'elliptical' }> = [];

  for (let i = 0; i < background.galaxyCount; i++) {
    galaxies.push({
      x: rng.next(),
      y: rng.next(),
      size: rng.nextFloat(0.01, 0.05),
      rotation: rng.nextFloat(0, Math.PI * 2),
      type: rng.next() < 0.6 ? 'spiral' : 'elliptical',
    });
  }

  return galaxies;
}
