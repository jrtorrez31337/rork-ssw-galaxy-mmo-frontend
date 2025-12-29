/**
 * Station Generator
 *
 * Generates space stations with services and visual properties.
 * MUST match server: sector.go:506-544
 */

import { SeededRNG } from '../prng';
import { Station, StationType, STATION_SERVICES } from '../types';

/**
 * Station types array for random selection
 */
const STATION_TYPES: readonly StationType[] = [
  'trade',
  'military',
  'research',
  'mining',
  'residential',
];

/**
 * Station light colors by type
 */
const STATION_LIGHTS: Record<StationType, readonly string[]> = {
  trade: ['#00FF00', '#FFFF00', '#00FFFF'],
  military: ['#FF0000', '#FF6600', '#FFCC00'],
  research: ['#0066FF', '#00CCFF', '#9900FF'],
  mining: ['#FF9900', '#FFCC00', '#996600'],
  residential: ['#FFFFFF', '#FFFFCC', '#CCFFCC'],
};

/**
 * Generate stations for a sector
 * MUST match server: sector.go:506-527
 */
export function generateStations(rng: SeededRNG, sectorId: string): Station[] {
  const numStations = rng.nextInt(1, 4);
  const stations: Station[] = [];

  for (let i = 0; i < numStations; i++) {
    const station = generateStation(rng, sectorId, i);
    stations.push(station);
  }

  return stations;
}

/**
 * Generate a single station
 */
function generateStation(rng: SeededRNG, sectorId: string, index: number): Station {
  const type = rng.pick(STATION_TYPES);
  const size = rng.nextInt(1, 6); // 1-5

  // Position within sector
  const positionX = rng.nextFloat(-5000, 5000);
  const positionY = rng.nextFloat(-5000, 5000);
  const positionZ = rng.nextFloat(-5000, 5000);

  // Visual properties
  const modelVariant = rng.nextInt(0, 5);
  const rotationSpeed = rng.nextFloat(0.001, 0.01);
  const rotationAxis: [number, number, number] = [
    rng.nextFloat(-1, 1),
    rng.nextFloat(-1, 1),
    rng.nextFloat(-1, 1),
  ];
  // Normalize rotation axis
  const axisLength = Math.sqrt(
    rotationAxis[0] ** 2 + rotationAxis[1] ** 2 + rotationAxis[2] ** 2
  );
  rotationAxis[0] /= axisLength;
  rotationAxis[1] /= axisLength;
  rotationAxis[2] /= axisLength;

  const lightColor = rng.pick(STATION_LIGHTS[type]);
  const dockingBayCount = Math.max(2, size * 2 + rng.nextInt(0, 3));
  const antennaCount = rng.nextInt(2, 8);

  return {
    id: `station_${index}`,
    name: `Station ${sectorId}-${index + 1}`,
    type,
    size,
    services: [...STATION_SERVICES[type]],
    owner: null, // Set by server state
    positionX,
    positionY,
    positionZ,
    modelVariant,
    rotationSpeed,
    rotationAxis,
    lightColor,
    dockingBayCount,
    antennaCount,
  };
}

/**
 * Get station name prefix by type
 */
export function getStationTypePrefix(type: StationType): string {
  switch (type) {
    case 'trade': return 'Commerce Hub';
    case 'military': return 'Military Outpost';
    case 'research': return 'Research Station';
    case 'mining': return 'Mining Platform';
    case 'residential': return 'Habitat';
    default: return 'Station';
  }
}
