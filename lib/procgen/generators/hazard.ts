/**
 * Navigation Hazard Generator
 *
 * Generates navigation hazards that affect travel and combat.
 * MUST match server: sector.go:582-598
 */

import { SeededRNG } from '../prng';
import { NavigationHazard, HazardType, SectorType } from '../types';

/**
 * Hazard types array
 */
const HAZARD_TYPES: readonly HazardType[] = [
  'asteroid_dense',
  'radiation',
  'gravity_anomaly',
  'debris_field',
  'solar_flare',
];

/**
 * Hazard configuration by type
 */
interface HazardConfig {
  warningColor: string;
  baseDamage: number;
  minRadius: number;
  maxRadius: number;
  particleCount: number;
}

const HAZARD_CONFIGS: Record<HazardType, HazardConfig> = {
  asteroid_dense: {
    warningColor: '#FF6600',
    baseDamage: 5,
    minRadius: 500,
    maxRadius: 3000,
    particleCount: 200,
  },
  radiation: {
    warningColor: '#00FF00',
    baseDamage: 10,
    minRadius: 1000,
    maxRadius: 5000,
    particleCount: 50,
  },
  gravity_anomaly: {
    warningColor: '#9900FF',
    baseDamage: 15,
    minRadius: 200,
    maxRadius: 1500,
    particleCount: 30,
  },
  debris_field: {
    warningColor: '#FFCC00',
    baseDamage: 3,
    minRadius: 800,
    maxRadius: 4000,
    particleCount: 150,
  },
  solar_flare: {
    warningColor: '#FF3300',
    baseDamage: 20,
    minRadius: 2000,
    maxRadius: 8000,
    particleCount: 100,
  },
};

/**
 * Generate hazards for a sector
 * MUST match server: sector.go:582-598
 */
export function generateHazards(rng: SeededRNG, sectorType: SectorType): NavigationHazard[] {
  const hazards: NavigationHazard[] = [];

  for (const hazardType of HAZARD_TYPES) {
    // 20% base chance for each hazard type
    let probability = 0.2;

    // Sector type modifiers
    if (sectorType === 'asteroid' && hazardType === 'asteroid_dense') {
      probability = 0.6;
    }
    if (sectorType === 'nebula' && hazardType === 'radiation') {
      probability = 0.4;
    }
    if (sectorType === 'anomaly' && hazardType === 'gravity_anomaly') {
      probability = 0.5;
    }

    if (rng.next() < probability) {
      const hazard = generateHazard(rng, hazardType);
      hazards.push(hazard);
    }
  }

  return hazards;
}

/**
 * Generate a single hazard
 */
function generateHazard(rng: SeededRNG, type: HazardType): NavigationHazard {
  const config = HAZARD_CONFIGS[type];

  // Position within sector
  const positionX = rng.nextFloat(-7000, 7000);
  const positionY = rng.nextFloat(-7000, 7000);
  const positionZ = rng.nextFloat(-7000, 7000);

  // Size
  const radius = rng.nextFloat(config.minRadius, config.maxRadius);

  // Severity affects damage and visual intensity
  const severity = rng.nextFloat(0.1, 1.0);
  const damagePerSecond = config.baseDamage * severity;

  // Visual properties
  const visualIntensity = rng.nextFloat(0.3, 1.0);
  const particleCount = Math.floor(config.particleCount * (0.5 + severity * 0.5));

  return {
    id: `hazard_${type}_${rng.nextInt(0, 999999)}`,
    type,
    positionX,
    positionY,
    positionZ,
    radius,
    severity,
    damagePerSecond,
    visualIntensity,
    warningColor: config.warningColor,
    particleCount,
  };
}

/**
 * Get hazard warning message
 */
export function getHazardWarning(type: HazardType): string {
  switch (type) {
    case 'asteroid_dense':
      return 'Dense asteroid field detected. Navigation hazard.';
    case 'radiation':
      return 'High radiation levels detected. Shield damage likely.';
    case 'gravity_anomaly':
      return 'Gravitational distortion detected. Navigation impaired.';
    case 'debris_field':
      return 'Debris field detected. Hull damage possible.';
    case 'solar_flare':
      return 'Solar flare activity detected. Extreme radiation hazard.';
    default:
      return 'Unknown hazard detected.';
  }
}

/**
 * Get hazard severity text
 */
export function getHazardSeverityText(severity: number): string {
  if (severity < 0.2) return 'Minor';
  if (severity < 0.4) return 'Moderate';
  if (severity < 0.6) return 'Significant';
  if (severity < 0.8) return 'Severe';
  return 'Critical';
}

/**
 * Check if a position is within a hazard zone
 */
export function isInHazardZone(
  hazard: NavigationHazard,
  x: number,
  y: number,
  z: number
): boolean {
  const dx = x - hazard.positionX;
  const dy = y - hazard.positionY;
  const dz = z - hazard.positionZ;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance <= hazard.radius;
}
