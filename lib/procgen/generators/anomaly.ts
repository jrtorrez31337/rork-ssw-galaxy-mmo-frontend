/**
 * Anomaly Generator
 *
 * Generates spatial anomalies with visual effects.
 * MUST match server: sector.go:546-562
 */

import { SeededRNG } from '../prng';
import { Anomaly, AnomalyType } from '../types';

/**
 * Anomaly types array
 */
const ANOMALY_TYPES: readonly AnomalyType[] = [
  'wormhole',
  'rift',
  'radiation_zone',
  'gravity_well',
  'temporal_distortion',
];

/**
 * Anomaly visual configurations
 */
interface AnomalyVisualConfig {
  primaryColors: readonly string[];
  secondaryColors: readonly string[];
  minRadius: number;
  maxRadius: number;
  distortionRange: [number, number];
}

const ANOMALY_VISUALS: Record<AnomalyType, AnomalyVisualConfig> = {
  wormhole: {
    primaryColors: ['#9900FF', '#6600CC', '#CC00FF'],
    secondaryColors: ['#0066FF', '#00CCFF', '#FF00FF'],
    minRadius: 100,
    maxRadius: 500,
    distortionRange: [0.5, 1.0],
  },
  rift: {
    primaryColors: ['#FF0000', '#CC0000', '#FF3300'],
    secondaryColors: ['#FF6600', '#FFCC00', '#000000'],
    minRadius: 50,
    maxRadius: 300,
    distortionRange: [0.3, 0.8],
  },
  radiation_zone: {
    primaryColors: ['#00FF00', '#33FF00', '#66FF00'],
    secondaryColors: ['#CCFF00', '#FFFF00', '#99FF00'],
    minRadius: 200,
    maxRadius: 1000,
    distortionRange: [0.0, 0.2],
  },
  gravity_well: {
    primaryColors: ['#000066', '#000033', '#330066'],
    secondaryColors: ['#0000FF', '#3300FF', '#6600FF'],
    minRadius: 150,
    maxRadius: 800,
    distortionRange: [0.7, 1.0],
  },
  temporal_distortion: {
    primaryColors: ['#00FFFF', '#00CCCC', '#66FFFF'],
    secondaryColors: ['#FFFFFF', '#CCFFFF', '#99FFFF'],
    minRadius: 80,
    maxRadius: 400,
    distortionRange: [0.4, 0.9],
  },
};

/**
 * Generate anomalies for a sector
 * MUST match server: sector.go:546-562
 */
export function generateAnomalies(rng: SeededRNG): Anomaly[] {
  const numAnomalies = rng.nextInt(1, 3);
  const anomalies: Anomaly[] = [];

  for (let i = 0; i < numAnomalies; i++) {
    const anomaly = generateAnomaly(rng, i);
    anomalies.push(anomaly);
  }

  return anomalies;
}

/**
 * Generate a single anomaly
 */
function generateAnomaly(rng: SeededRNG, index: number): Anomaly {
  const type = rng.pick(ANOMALY_TYPES);
  const config = ANOMALY_VISUALS[type];

  // Gameplay properties
  const danger = rng.next();
  const reward = rng.next();

  // Position within sector
  const positionX = rng.nextFloat(-6000, 6000);
  const positionY = rng.nextFloat(-6000, 6000);
  const positionZ = rng.nextFloat(-6000, 6000);

  // Visual properties
  const radius = rng.nextFloat(config.minRadius, config.maxRadius);
  const particleColor = rng.pick(config.primaryColors);
  const secondaryColor = rng.pick(config.secondaryColors);
  const pulseFrequency = rng.nextFloat(0.5, 3.0);
  const intensity = rng.nextFloat(0.5, 1.0);
  const distortionStrength = rng.nextFloat(
    config.distortionRange[0],
    config.distortionRange[1]
  );

  return {
    id: `anomaly_${index}`,
    type,
    danger,
    reward,
    positionX,
    positionY,
    positionZ,
    radius,
    particleColor,
    secondaryColor,
    pulseFrequency,
    intensity,
    distortionStrength,
  };
}

/**
 * Get anomaly description for UI
 */
export function getAnomalyDescription(type: AnomalyType): string {
  switch (type) {
    case 'wormhole':
      return 'A stable spatial tunnel connecting distant regions of space.';
    case 'rift':
      return 'A tear in spacetime leaking exotic energy.';
    case 'radiation_zone':
      return 'An area saturated with hazardous radiation.';
    case 'gravity_well':
      return 'An extreme gravitational distortion, possibly from collapsed matter.';
    case 'temporal_distortion':
      return 'A region where time flows differently.';
    default:
      return 'An unknown spatial anomaly.';
  }
}

/**
 * Get anomaly danger level text
 */
export function getAnomalyDangerLevel(danger: number): string {
  if (danger < 0.2) return 'Minimal';
  if (danger < 0.4) return 'Low';
  if (danger < 0.6) return 'Moderate';
  if (danger < 0.8) return 'High';
  return 'Extreme';
}
