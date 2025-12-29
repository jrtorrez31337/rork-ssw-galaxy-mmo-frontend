/**
 * Planet Generator
 *
 * Generates planets with moons, rings, and visual properties.
 * MUST match server: sector.go:336-480
 */

import { SeededRNG } from '../prng';
import { Star, Planet, PlanetType, PlanetaryRings, Moon, ResourceType } from '../types';
import { calculateHabitableZone } from './star';

/**
 * Planet type colors for rendering
 */
const PLANET_COLORS: Record<PlanetType, readonly string[]> = {
  molten: ['#FF4500', '#FF6B00', '#CC3300'],
  barren: ['#8B7355', '#A0826D', '#6B5344'],
  rocky: ['#808080', '#696969', '#778899'],
  terrestrial: ['#228B22', '#32CD32', '#006400'],
  ocean: ['#1E90FF', '#4169E1', '#0000CD'],
  gas_giant: ['#DAA520', '#CD853F', '#D2691E', '#CC9966'],
  ice_giant: ['#87CEEB', '#ADD8E6', '#B0E0E6', '#E0FFFF'],
};

/**
 * Atmosphere colors for rendering
 */
const ATMOSPHERE_COLORS: Record<PlanetType, readonly string[]> = {
  molten: ['#FF6347', '#FF4500'],
  barren: [],
  rocky: ['#D3D3D3', '#A9A9A9'],
  terrestrial: ['#87CEEB', '#B0E0E6'],
  ocean: ['#4682B4', '#5F9EA0'],
  gas_giant: ['#FFD700', '#DAA520'],
  ice_giant: ['#E0FFFF', '#AFEEEE'],
};

/**
 * Ring colors for gas/ice giants
 */
const RING_COLORS: readonly string[] = ['#D4AA6D', '#A0826D', '#C4B7A6', '#8B7355'];

/**
 * Generate all planets for a star system
 */
export function generatePlanets(rng: SeededRNG, star: Star): Planet[] {
  // Number of planets based on star type
  const maxPlanets = star.type === 'M' ? 6 : 10;
  const numPlanets = rng.nextInt(0, maxPlanets);

  const planets: Planet[] = [];
  const habZone = calculateHabitableZone(star);

  for (let i = 0; i < numPlanets; i++) {
    const planet = generatePlanet(rng, star, i, habZone);
    planets.push(planet);
  }

  return planets;
}

/**
 * Generate a single planet
 */
function generatePlanet(
  rng: SeededRNG,
  star: Star,
  index: number,
  habZone: { inner: number; outer: number }
): Planet {
  // Calculate orbit radius with some randomness
  const orbitRadius = 0.1 + index * 0.5 + rng.nextFloat(0, 0.5);

  // Determine planet type based on orbit
  const planetType = determinePlanetType(rng, star, orbitRadius, habZone);

  // Generate physical properties
  const mass = generatePlanetMass(rng, planetType);
  const radius = generatePlanetRadius(rng, planetType);
  const gravity = mass / (radius * radius); // Simplified surface gravity

  // Orbital properties
  const orbitPeriod = Math.sqrt(orbitRadius * orbitRadius * orbitRadius) * 365; // Kepler's 3rd law approximation
  const orbitEccentricity = rng.nextFloat(0, 0.15);
  const axialTilt = rng.nextFloat(0, 45);
  const rotationPeriod = rng.nextFloat(8, 48);

  // Atmospheric properties
  const hasAtmosphere = determineHasAtmosphere(rng, planetType);
  const atmosphereDensity = hasAtmosphere ? rng.nextFloat(0.1, 2.0) : 0;
  const atmosphereColor = hasAtmosphere ? pickAtmosphereColor(rng, planetType) : null;

  // Surface properties
  const hasWater = determineHasWater(rng, planetType);
  const surfaceColor = rng.pick(PLANET_COLORS[planetType]);
  const cloudCoverage = hasAtmosphere ? rng.nextFloat(0.1, 0.8) : 0;

  // Habitability
  const inHabZone = orbitRadius >= habZone.inner && orbitRadius <= habZone.outer;
  const habitable = inHabZone && hasAtmosphere && hasWater &&
    (planetType === 'terrestrial' || planetType === 'ocean');

  // Population
  const population = habitable && rng.next() < 0.3
    ? rng.nextInt(0, 10000000000)
    : 0;

  // Resources
  const resources = generatePlanetResources(rng, planetType);

  // Moons
  const moons = generateMoons(rng, planetType);

  // Rings (gas/ice giants)
  const rings = generateRings(rng, planetType, radius);

  // Visual seeds
  const surfaceTextureSeed = rng.nextInt(0, 2147483647);
  const cloudTextureSeed = rng.nextInt(0, 2147483647);

  // Generate unique ID based on RNG state
  const planetId = `planet_${index}_${rng.nextInt(0, 999999)}`;

  return {
    id: planetId,
    name: `Planet-${index + 1}`,
    type: planetType,
    orbitRadius,
    orbitPeriod,
    orbitEccentricity,
    axialTilt,
    mass,
    radius,
    gravity,
    rotationPeriod,
    hasAtmosphere,
    atmosphereDensity,
    atmosphereColor,
    hasWater,
    surfaceColor,
    cloudCoverage,
    habitable,
    population,
    resources,
    rings,
    moons,
    surfaceTextureSeed,
    cloudTextureSeed,
  };
}

/**
 * Determine planet type based on orbit position
 * MUST match server: sector.go:378-412
 */
function determinePlanetType(
  rng: SeededRNG,
  star: Star,
  orbitRadius: number,
  habZone: { inner: number; outer: number }
): PlanetType {
  // Too close - molten
  if (orbitRadius < habZone.inner * 0.5) {
    return 'molten';
  }

  // Between molten zone and hab zone inner edge
  if (orbitRadius < habZone.inner) {
    return rng.next() < 0.5 ? 'rocky' : 'barren';
  }

  // In habitable zone
  if (orbitRadius <= habZone.outer) {
    const roll = rng.next();
    if (roll < 0.3) return 'terrestrial';
    if (roll < 0.5) return 'ocean';
    return 'rocky';
  }

  // Beyond hab zone but not too far
  if (orbitRadius < habZone.outer * 3) {
    return rng.next() < 0.7 ? 'gas_giant' : 'ice_giant';
  }

  // Far outer system
  return 'ice_giant';
}

/**
 * Generate planet mass based on type
 * MUST match server: sector.go:414-425
 */
function generatePlanetMass(rng: SeededRNG, type: PlanetType): number {
  switch (type) {
    case 'gas_giant': return rng.nextFloat(50, 350);
    case 'ice_giant': return rng.nextFloat(10, 30);
    case 'terrestrial':
    case 'ocean': return rng.nextFloat(0.5, 2.5);
    default: return rng.nextFloat(0.1, 1.1);
  }
}

/**
 * Generate planet radius based on type
 * MUST match server: sector.go:427-438
 */
function generatePlanetRadius(rng: SeededRNG, type: PlanetType): number {
  switch (type) {
    case 'gas_giant': return rng.nextFloat(5, 15);
    case 'ice_giant': return rng.nextFloat(3, 6);
    case 'terrestrial':
    case 'ocean': return rng.nextFloat(0.8, 1.2);
    default: return rng.nextFloat(0.3, 0.8);
  }
}

/**
 * Determine if planet has atmosphere
 */
function determineHasAtmosphere(rng: SeededRNG, type: PlanetType): boolean {
  switch (type) {
    case 'gas_giant':
    case 'ice_giant': return true;
    case 'terrestrial':
    case 'ocean': return rng.next() < 0.8;
    case 'rocky': return rng.next() < 0.2;
    default: return false;
  }
}

/**
 * Determine if planet has water
 */
function determineHasWater(rng: SeededRNG, type: PlanetType): boolean {
  switch (type) {
    case 'ocean': return true;
    case 'ice_giant': return true;
    case 'terrestrial': return rng.next() < 0.4;
    default: return false;
  }
}

/**
 * Pick atmosphere color for rendering
 */
function pickAtmosphereColor(rng: SeededRNG, type: PlanetType): string | null {
  const colors = ATMOSPHERE_COLORS[type];
  if (colors.length === 0) return null;
  return rng.pick(colors);
}

/**
 * Generate resources for a planet
 * MUST match server: sector.go:449-480
 */
function generatePlanetResources(rng: SeededRNG, type: PlanetType): ResourceType[] {
  const resources: ResourceType[] = [];

  switch (type) {
    case 'rocky':
    case 'barren':
      if (rng.next() < 0.7) resources.push('ore');
      if (rng.next() < 0.3) resources.push('crystals');
      break;
    case 'terrestrial':
      if (rng.next() < 0.5) resources.push('organic');
      if (rng.next() < 0.4) resources.push('water');
      break;
    case 'gas_giant':
      resources.push('gas');
      if (rng.next() < 0.3) resources.push('fuel');
      break;
    case 'ice_giant':
      resources.push('water');
      if (rng.next() < 0.4) resources.push('gas');
      break;
  }

  return resources;
}

/**
 * Generate moons for a planet
 */
function generateMoons(rng: SeededRNG, type: PlanetType): Moon[] {
  const maxMoons = type === 'gas_giant' ? 8 : type === 'ice_giant' ? 5 : 2;
  const numMoons = rng.nextInt(0, maxMoons + 1);

  const moons: Moon[] = [];
  const moonColors = ['#888888', '#AAAAAA', '#666666', '#9A9A9A'];

  for (let i = 0; i < numMoons; i++) {
    moons.push({
      name: `Moon-${i + 1}`,
      orbitRadius: 1.5 + i * 0.5 + rng.nextFloat(0, 0.3),
      radius: rng.nextFloat(0.1, 0.4),
      color: rng.pick(moonColors),
      tidallyLocked: rng.next() < 0.7,
    });
  }

  return moons;
}

/**
 * Generate planetary rings
 */
function generateRings(rng: SeededRNG, type: PlanetType, planetRadius: number): PlanetaryRings | null {
  // Only gas/ice giants can have rings
  if (type !== 'gas_giant' && type !== 'ice_giant') {
    return null;
  }

  // 40% chance of rings
  if (rng.next() >= 0.4) {
    return null;
  }

  return {
    innerRadius: planetRadius * 1.5,
    outerRadius: planetRadius * rng.nextFloat(2.0, 3.5),
    density: rng.nextFloat(0.3, 0.9),
    color: rng.pick(RING_COLORS),
    tilt: rng.nextFloat(0, 30),
    gapCount: rng.nextInt(0, 4),
  };
}
