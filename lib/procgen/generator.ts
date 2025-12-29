/**
 * Sector Generator
 *
 * Main procedural generation engine for sector content.
 * CRITICAL: This must produce identical results to the Go server.
 *
 * Server reference: /services/procgen/internal/generator/sector.go
 */

import { SeededRNG } from './prng';
import { coordsToSeed, coordsToSectorId, distanceFromCenter, Coordinates } from './seed';
import {
  GeneratedSector,
  SectorType,
  SectorNavigationType,
  Star,
  StarType,
  Planet,
  PlanetType,
  AsteroidField,
  Station,
  StationType,
  Anomaly,
  AnomalyType,
  ResourceDeposit,
  ResourceType,
  NavigationHazard,
  HazardType,
  SpaceDust,
  CosmicRays,
  BackgroundStarfield,
  AmbientLighting,
  STATION_SERVICES,
  STAR_COLORS,
} from './types';

// Import sub-generators
import { generateStar } from './generators/star';
import { generatePlanets } from './generators/planet';
import { generateAsteroidFields } from './generators/asteroid';
import { generateStations } from './generators/station';
import { generateAnomalies } from './generators/anomaly';
import { generateHazards } from './generators/hazard';
import { generateVisualElements } from './generators/visual';

/**
 * Main Sector Generator
 */
export class SectorGenerator {
  private baseSeed: number;

  constructor(baseSeed: number = 42) {
    this.baseSeed = baseSeed;
  }

  /**
   * Generate a complete sector from coordinates
   */
  generate(coords: Coordinates): GeneratedSector {
    const sectorSeed = coordsToSeed(this.baseSeed, coords.x, coords.y, coords.z);
    const rng = new SeededRNG(sectorSeed);

    // Determine sector type based on galactic position
    const sectorType = this.determineSectorType(rng, coords);
    const navigationType = this.determineNavigationType(rng, sectorType);

    // Generate stellar content
    let star: Star | null = null;
    let planets: Planet[] = [];

    if (sectorType !== 'empty') {
      star = generateStar(rng, coords);
      if (star) {
        planets = generatePlanets(rng, star);
      }
    }

    // Generate asteroid fields
    const asteroidFields: AsteroidField[] = [];
    if (sectorType === 'asteroid' || rng.next() < 0.3) {
      asteroidFields.push(...generateAsteroidFields(rng));
    }

    // Generate stations
    const stations: Station[] = [];
    if (sectorType === 'station' || (sectorType === 'planetary' && rng.next() < 0.5)) {
      const sectorId = coordsToSectorId(coords.x, coords.y, coords.z);
      stations.push(...generateStations(rng, sectorId));
    }

    // Generate anomalies
    const anomalies: Anomaly[] = [];
    if (sectorType === 'anomaly' || rng.next() < 0.1) {
      anomalies.push(...generateAnomalies(rng));
    }

    // Generate resources
    const resources = this.generateResources(rng);

    // Generate navigation hazards
    const hazards = generateHazards(rng, sectorType);

    // Generate visual/environmental elements
    const { spaceDust, cosmicRays, background, ambientLighting } = generateVisualElements(
      rng,
      coords,
      sectorType,
      star
    );

    // Calculate gameplay properties
    const threatLevel = this.calculateThreatLevel(rng, coords, sectorType, anomalies, hazards);
    const totalPopulation = this.calculateTotalPopulation(planets, stations);

    return {
      id: coordsToSectorId(coords.x, coords.y, coords.z),
      coordinates: coords,
      type: sectorType,
      navigationType,
      seed: sectorSeed,
      generatedAt: Date.now(),
      star,
      planets,
      asteroidFields,
      stations,
      anomalies,
      resources,
      hazards,
      spaceDust,
      cosmicRays,
      background,
      ambientLighting,
      threatLevel,
      controllingFaction: null, // Set by server state
      population: totalPopulation,
    };
  }

  /**
   * Determine sector type based on distance from galactic center
   * MUST match server: sector.go:218-269
   */
  private determineSectorType(rng: SeededRNG, coords: Coordinates): SectorType {
    const distance = distanceFromCenter(coords);
    const roll = rng.next();

    // Core regions (distance < 1000)
    if (distance < 1000) {
      if (roll < 0.4) return 'planetary';
      if (roll < 0.6) return 'station';
      if (roll < 0.75) return 'asteroid';
      if (roll < 0.85) return 'nebula';
      if (roll < 0.95) return 'anomaly';
      return 'empty';
    }

    // Mid-range (1000 <= distance < 5000)
    if (distance < 5000) {
      if (roll < 0.25) return 'planetary';
      if (roll < 0.35) return 'station';
      if (roll < 0.55) return 'asteroid';
      if (roll < 0.7) return 'nebula';
      if (roll < 0.8) return 'anomaly';
      return 'empty';
    }

    // Outer regions (distance >= 5000)
    if (roll < 0.1) return 'planetary';
    if (roll < 0.15) return 'station';
    if (roll < 0.35) return 'asteroid';
    if (roll < 0.5) return 'nebula';
    if (roll < 0.6) return 'anomaly';
    return 'empty';
  }

  /**
   * Determine navigation type (affects fuel cost)
   */
  private determineNavigationType(rng: SeededRNG, sectorType: SectorType): SectorNavigationType {
    if (sectorType === 'nebula') return 'nebula';
    if (sectorType === 'empty') {
      return rng.next() < 0.3 ? 'void' : 'normal';
    }
    if (sectorType === 'anomaly') {
      return rng.next() < 0.4 ? 'hazard' : 'normal';
    }
    return 'normal';
  }

  /**
   * Generate resource deposits
   * MUST match server: sector.go:564-580
   */
  private generateResources(rng: SeededRNG): ResourceDeposit[] {
    const resourceTypes: ResourceType[] = [
      'ore', 'gas', 'crystals', 'water', 'organic', 'rare_metals', 'fuel'
    ];

    const deposits: ResourceDeposit[] = [];

    for (const type of resourceTypes) {
      if (rng.next() < 0.3) {
        deposits.push({
          type,
          quantity: rng.nextInt(1000, 1001000),
          quality: rng.nextFloat(0.1, 1.0),
          positionX: rng.nextFloat(-5000, 5000),
          positionY: rng.nextFloat(-5000, 5000),
          positionZ: rng.nextFloat(-5000, 5000),
        });
      }
    }

    return deposits;
  }

  /**
   * Calculate threat level based on sector properties
   */
  private calculateThreatLevel(
    rng: SeededRNG,
    coords: Coordinates,
    sectorType: SectorType,
    anomalies: Anomaly[],
    hazards: NavigationHazard[]
  ): number {
    let baseThreat = 1;

    // Distance from center increases threat
    const distance = distanceFromCenter(coords);
    if (distance > 5000) baseThreat += 2;
    else if (distance > 2000) baseThreat += 1;

    // Sector type modifiers
    if (sectorType === 'anomaly') baseThreat += 2;
    if (sectorType === 'asteroid') baseThreat += 1;

    // Anomaly danger
    for (const anomaly of anomalies) {
      baseThreat += Math.floor(anomaly.danger * 2);
    }

    // Hazard severity
    for (const hazard of hazards) {
      baseThreat += Math.floor(hazard.severity);
    }

    // Random variation
    baseThreat += rng.nextInt(0, 2);

    return Math.min(10, Math.max(1, baseThreat));
  }

  /**
   * Calculate total population across planets and stations
   */
  private calculateTotalPopulation(planets: Planet[], stations: Station[]): number {
    let total = 0;

    for (const planet of planets) {
      total += planet.population;
    }

    // Stations add population based on size
    for (const station of stations) {
      total += station.size * 10000; // 10k-50k per station
    }

    return total;
  }

  /**
   * Get the base seed (for validation)
   */
  getBaseSeed(): number {
    return this.baseSeed;
  }
}

/**
 * Default generator instance with standard seed
 */
export const defaultGenerator = new SectorGenerator(42);

/**
 * Generate a sector using the default generator
 */
export function generateSector(coords: Coordinates): GeneratedSector {
  return defaultGenerator.generate(coords);
}
