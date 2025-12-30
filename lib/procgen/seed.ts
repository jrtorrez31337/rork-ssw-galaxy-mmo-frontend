/**
 * Seed Management
 *
 * Handles coordinate-to-seed conversion and sector ID generation.
 * These functions MUST produce identical results to the Go server.
 *
 * Server reference: /services/procgen/internal/generator/sector.go:209-216
 */

// Prime numbers used for coordinate hashing
// These MUST match the server values exactly
export const SEED_PRIME_X = 73856093;
export const SEED_PRIME_Y = 19349663;
export const SEED_PRIME_Z = 83492791;

// Default base seed (matches server default)
export const DEFAULT_BASE_SEED = 42;

/**
 * Coordinates in 3D space
 */
export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert coordinates to a deterministic sector seed
 *
 * CRITICAL: This must produce identical results to the Go server:
 *   return g.seed ^ (coords.X * 73856093) ^ (coords.Y * 19349663) ^ (coords.Z * 83492791)
 *
 * JavaScript bitwise operations are 32-bit signed, so we use >>> 0 to ensure
 * unsigned behavior matching Go's int64 XOR behavior in the lower 32 bits.
 */
export function coordsToSeed(
  baseSeed: number,
  x: number,
  y: number,
  z: number
): number {
  // Ensure integers
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  // JavaScript's Math.imul handles 32-bit integer multiplication correctly
  // The >>> 0 ensures we get unsigned 32-bit behavior
  const xHash = Math.imul(ix, SEED_PRIME_X) >>> 0;
  const yHash = Math.imul(iy, SEED_PRIME_Y) >>> 0;
  const zHash = Math.imul(iz, SEED_PRIME_Z) >>> 0;

  // XOR all components together
  return ((baseSeed ^ xHash ^ yHash ^ zHash) >>> 0);
}

/**
 * Generate sector ID from coordinates
 *
 * Matches server format: "sector_X_Y_Z"
 * Server reference: sector.go:214-216
 */
export function coordsToSectorId(x: number, y: number, z: number): string {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  return `sector_${ix}_${iy}_${iz}`;
}

/**
 * Parse sector ID back to coordinates
 * Accepts both internal format "sector_X_Y_Z" and display format "X.Y.Z"
 */
export function sectorIdToCoords(sectorId: string): Coordinates | null {
  // Try internal format first: sector_X_Y_Z
  const internalMatch = sectorId.match(/^sector_(-?\d+)_(-?\d+)_(-?\d+)$/);
  if (internalMatch) {
    return {
      x: parseInt(internalMatch[1], 10),
      y: parseInt(internalMatch[2], 10),
      z: parseInt(internalMatch[3], 10),
    };
  }

  // Try display format: X.Y.Z (used by backend)
  const displayParts = sectorId.split('.');
  if (displayParts.length === 3) {
    const x = parseInt(displayParts[0], 10);
    const y = parseInt(displayParts[1], 10);
    const z = parseInt(displayParts[2], 10);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      return { x, y, z };
    }
  }

  return null;
}

/**
 * Generate display-friendly sector coordinates
 * Format: "X.Y.Z" (used in UI display)
 */
export function coordsToDisplayString(coords: Coordinates): string {
  return `${coords.x}.${coords.y}.${coords.z}`;
}

/**
 * Parse display string back to coordinates
 */
export function displayStringToCoords(display: string): Coordinates | null {
  const parts = display.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  const z = parseFloat(parts[2]);
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    return null;
  }
  return { x, y, z };
}

/**
 * Calculate 3D Euclidean distance between two coordinate sets
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate distance from galactic center (0,0,0)
 * Used for sector type distribution
 */
export function distanceFromCenter(coords: Coordinates): number {
  return Math.sqrt(
    coords.x * coords.x +
    coords.y * coords.y +
    coords.z * coords.z
  );
}

/**
 * Get neighboring sector coordinates
 * Returns all 26 adjacent sectors in 3D space
 */
export function getNeighborCoords(center: Coordinates): Coordinates[] {
  const neighbors: Coordinates[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        neighbors.push({
          x: center.x + dx,
          y: center.y + dy,
          z: center.z + dz,
        });
      }
    }
  }
  return neighbors;
}

/**
 * Get directly adjacent sector coordinates (face neighbors only)
 * Returns 6 adjacent sectors (no diagonals)
 */
export function getDirectNeighborCoords(center: Coordinates): Coordinates[] {
  return [
    { x: center.x - 1, y: center.y, z: center.z },
    { x: center.x + 1, y: center.y, z: center.z },
    { x: center.x, y: center.y - 1, z: center.z },
    { x: center.x, y: center.y + 1, z: center.z },
    { x: center.x, y: center.y, z: center.z - 1 },
    { x: center.x, y: center.y, z: center.z + 1 },
  ];
}

/**
 * Validate if a sector coordinate string is valid
 * Matches server validation
 */
export function isValidSectorFormat(sector: string): boolean {
  const parts = sector.split('.');
  if (parts.length !== 3) {
    return false;
  }
  for (const part of parts) {
    if (isNaN(parseFloat(part))) {
      return false;
    }
  }
  return true;
}
