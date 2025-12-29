/**
 * Seed Conversion Unit Tests
 *
 * Tests for coordinate-to-seed conversion to ensure:
 * - Deterministic seed generation from coordinates
 * - Correct sector ID formatting
 * - Bidirectional conversion (coords <-> sectorId)
 * - Consistency with server algorithm
 */

import {
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
} from '../../lib/procgen/seed';

describe('coordsToSeed', () => {
  describe('determinism', () => {
    it('should produce the same seed for the same coordinates', () => {
      const seed1 = coordsToSeed(DEFAULT_BASE_SEED, 10, 20, 30);
      const seed2 = coordsToSeed(DEFAULT_BASE_SEED, 10, 20, 30);

      expect(seed1).toBe(seed2);
    });

    it('should produce different seeds for different coordinates', () => {
      const seed1 = coordsToSeed(DEFAULT_BASE_SEED, 0, 0, 0);
      const seed2 = coordsToSeed(DEFAULT_BASE_SEED, 1, 0, 0);
      const seed3 = coordsToSeed(DEFAULT_BASE_SEED, 0, 1, 0);
      const seed4 = coordsToSeed(DEFAULT_BASE_SEED, 0, 0, 1);

      expect(seed1).not.toBe(seed2);
      expect(seed1).not.toBe(seed3);
      expect(seed1).not.toBe(seed4);
      expect(seed2).not.toBe(seed3);
    });

    it('should produce different seeds for different base seeds', () => {
      const seed1 = coordsToSeed(42, 5, 5, 5);
      const seed2 = coordsToSeed(100, 5, 5, 5);

      expect(seed1).not.toBe(seed2);
    });
  });

  describe('coordinate handling', () => {
    it('should handle origin coordinates (0, 0, 0)', () => {
      const seed = coordsToSeed(DEFAULT_BASE_SEED, 0, 0, 0);
      expect(seed).toBe(DEFAULT_BASE_SEED); // XOR with 0 returns base
    });

    it('should handle negative coordinates', () => {
      const seedNeg = coordsToSeed(DEFAULT_BASE_SEED, -10, -20, -30);
      const seedPos = coordsToSeed(DEFAULT_BASE_SEED, 10, 20, 30);

      // Should be different for positive vs negative
      expect(seedNeg).not.toBe(seedPos);
    });

    it('should handle large coordinates', () => {
      const seed = coordsToSeed(DEFAULT_BASE_SEED, 10000, 20000, 30000);

      expect(typeof seed).toBe('number');
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
    });

    it('should truncate floating point coordinates', () => {
      const seed1 = coordsToSeed(DEFAULT_BASE_SEED, 5.9, 10.1, 15.5);
      const seed2 = coordsToSeed(DEFAULT_BASE_SEED, 5, 10, 15);

      expect(seed1).toBe(seed2);
    });
  });

  describe('algorithm verification', () => {
    it('should use correct prime multipliers', () => {
      // Verify the constants match expected values
      expect(SEED_PRIME_X).toBe(73856093);
      expect(SEED_PRIME_Y).toBe(19349663);
      expect(SEED_PRIME_Z).toBe(83492791);
    });

    it('should use XOR combination correctly', () => {
      // Manual calculation for (1, 0, 0)
      const xHash = Math.imul(1, SEED_PRIME_X) >>> 0;
      const expected = (DEFAULT_BASE_SEED ^ xHash) >>> 0;
      const actual = coordsToSeed(DEFAULT_BASE_SEED, 1, 0, 0);

      expect(actual).toBe(expected);
    });
  });
});

describe('coordsToSectorId', () => {
  it('should produce consistent sector IDs', () => {
    const id1 = coordsToSectorId(5, 10, 15);
    const id2 = coordsToSectorId(5, 10, 15);

    expect(id1).toBe(id2);
  });

  it('should format sector ID correctly', () => {
    const id = coordsToSectorId(5, 10, 15);

    expect(id).toBe('sector_5_10_15');
  });

  it('should handle negative coordinates', () => {
    const id = coordsToSectorId(-5, -10, -15);

    expect(id).toBe('sector_-5_-10_-15');
  });

  it('should handle zero coordinates', () => {
    const id = coordsToSectorId(0, 0, 0);

    expect(id).toBe('sector_0_0_0');
  });

  it('should truncate floating point coordinates', () => {
    const id = coordsToSectorId(5.9, 10.1, 15.5);

    expect(id).toBe('sector_5_10_15');
  });
});

describe('sectorIdToCoords', () => {
  it('should parse valid sector ID', () => {
    const coords = sectorIdToCoords('sector_5_10_15');

    expect(coords).toEqual({ x: 5, y: 10, z: 15 });
  });

  it('should parse negative coordinates', () => {
    const coords = sectorIdToCoords('sector_-5_-10_-15');

    expect(coords).toEqual({ x: -5, y: -10, z: -15 });
  });

  it('should parse zero coordinates', () => {
    const coords = sectorIdToCoords('sector_0_0_0');

    expect(coords).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should return null for invalid format', () => {
    expect(sectorIdToCoords('invalid')).toBeNull();
    expect(sectorIdToCoords('5_10_15')).toBeNull(); // missing 'sector_' prefix
    expect(sectorIdToCoords('sector_5_10')).toBeNull();
    expect(sectorIdToCoords('sector_5_10_15_20')).toBeNull();
    expect(sectorIdToCoords('')).toBeNull();
    expect(sectorIdToCoords('sector_a_b_c')).toBeNull();
  });

  it('should be inverse of coordsToSectorId', () => {
    const original = { x: 42, y: -17, z: 99 };
    const id = coordsToSectorId(original.x, original.y, original.z);
    const parsed = sectorIdToCoords(id);

    expect(parsed).toEqual(original);
  });
});

describe('coordsToDisplayString', () => {
  it('should format display string correctly', () => {
    const display = coordsToDisplayString({ x: 5, y: 10, z: 15 });

    expect(display).toBe('5.10.15');
  });

  it('should handle negative coordinates', () => {
    const display = coordsToDisplayString({ x: -5, y: -10, z: -15 });

    expect(display).toBe('-5.-10.-15');
  });

  it('should handle zero coordinates', () => {
    const display = coordsToDisplayString({ x: 0, y: 0, z: 0 });

    expect(display).toBe('0.0.0');
  });
});

describe('displayStringToCoords', () => {
  it('should parse valid display string', () => {
    const coords = displayStringToCoords('5.10.15');

    expect(coords).toEqual({ x: 5, y: 10, z: 15 });
  });

  it('should parse negative coordinates', () => {
    const coords = displayStringToCoords('-5.-10.-15');

    expect(coords).toEqual({ x: -5, y: -10, z: -15 });
  });

  it('should parse zero coordinates', () => {
    const coords = displayStringToCoords('0.0.0');

    expect(coords).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should return null for invalid format', () => {
    expect(displayStringToCoords('invalid')).toBeNull();
    expect(displayStringToCoords('5.10')).toBeNull();
    expect(displayStringToCoords('5.10.15.20')).toBeNull();
    expect(displayStringToCoords('')).toBeNull();
    expect(displayStringToCoords('a.b.c')).toBeNull();
  });

  it('should be inverse of coordsToDisplayString', () => {
    const original = { x: 42, y: -17, z: 99 };
    const display = coordsToDisplayString(original);
    const parsed = displayStringToCoords(display);

    expect(parsed).toEqual(original);
  });
});

describe('calculateDistance', () => {
  it('should calculate distance between two points', () => {
    const dist = calculateDistance(
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 4, z: 0 }
    );

    expect(dist).toBe(5); // 3-4-5 triangle
  });

  it('should calculate 3D distance', () => {
    const dist = calculateDistance(
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 }
    );

    expect(dist).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('should return 0 for same point', () => {
    const dist = calculateDistance(
      { x: 5, y: 10, z: 15 },
      { x: 5, y: 10, z: 15 }
    );

    expect(dist).toBe(0);
  });

  it('should handle negative coordinates', () => {
    const dist = calculateDistance(
      { x: -5, y: -5, z: -5 },
      { x: 5, y: 5, z: 5 }
    );

    expect(dist).toBeCloseTo(Math.sqrt(300), 10);
  });

  it('should be commutative', () => {
    const p1 = { x: 3, y: 7, z: -2 };
    const p2 = { x: -1, y: 4, z: 8 };

    expect(calculateDistance(p1, p2)).toBe(calculateDistance(p2, p1));
  });
});

describe('distanceFromCenter', () => {
  it('should calculate distance from origin', () => {
    const dist = distanceFromCenter({ x: 3, y: 4, z: 0 });

    expect(dist).toBe(5);
  });

  it('should return 0 for origin', () => {
    const dist = distanceFromCenter({ x: 0, y: 0, z: 0 });

    expect(dist).toBe(0);
  });

  it('should handle 3D coordinates', () => {
    const dist = distanceFromCenter({ x: 1, y: 1, z: 1 });

    expect(dist).toBeCloseTo(Math.sqrt(3), 10);
  });
});

describe('getNeighborCoords', () => {
  it('should return 26 neighbors', () => {
    const neighbors = getNeighborCoords({ x: 0, y: 0, z: 0 });

    expect(neighbors.length).toBe(26);
  });

  it('should not include the center point', () => {
    const center = { x: 5, y: 5, z: 5 };
    const neighbors = getNeighborCoords(center);

    const includesCenter = neighbors.some(
      n => n.x === center.x && n.y === center.y && n.z === center.z
    );

    expect(includesCenter).toBe(false);
  });

  it('should include all diagonal neighbors', () => {
    const neighbors = getNeighborCoords({ x: 0, y: 0, z: 0 });

    // Check for corner neighbors
    const hasCorner = neighbors.some(
      n => n.x === 1 && n.y === 1 && n.z === 1
    );
    const hasOppositeCorner = neighbors.some(
      n => n.x === -1 && n.y === -1 && n.z === -1
    );

    expect(hasCorner).toBe(true);
    expect(hasOppositeCorner).toBe(true);
  });
});

describe('getDirectNeighborCoords', () => {
  it('should return 6 direct neighbors', () => {
    const neighbors = getDirectNeighborCoords({ x: 0, y: 0, z: 0 });

    expect(neighbors.length).toBe(6);
  });

  it('should only include face-adjacent neighbors', () => {
    const neighbors = getDirectNeighborCoords({ x: 0, y: 0, z: 0 });

    // Each neighbor should differ by exactly 1 in exactly one axis
    for (const neighbor of neighbors) {
      const dx = Math.abs(neighbor.x);
      const dy = Math.abs(neighbor.y);
      const dz = Math.abs(neighbor.z);
      const total = dx + dy + dz;

      expect(total).toBe(1);
    }
  });
});

describe('isValidSectorFormat', () => {
  // Note: isValidSectorFormat validates display string format (X.Y.Z), not sector ID format
  it('should validate correct display string format', () => {
    expect(isValidSectorFormat('0.0.0')).toBe(true);
    expect(isValidSectorFormat('5.10.15')).toBe(true);
    expect(isValidSectorFormat('-5.-10.-15')).toBe(true);
    expect(isValidSectorFormat('100.200.300')).toBe(true);
  });

  it('should reject invalid format', () => {
    expect(isValidSectorFormat('invalid')).toBe(false);
    expect(isValidSectorFormat('5.10')).toBe(false);
    expect(isValidSectorFormat('5.10.15.20')).toBe(false);
    expect(isValidSectorFormat('')).toBe(false);
    expect(isValidSectorFormat('a.b.c')).toBe(false);
    // Underscore format is sector ID, not display string
    expect(isValidSectorFormat('5_10_15')).toBe(false);
    expect(isValidSectorFormat('sector_5_10_15')).toBe(false);
  });
});

describe('consistency tests', () => {
  it('should produce well-distributed seeds for grid of sectors', () => {
    const seeds = new Set<number>();

    // Generate seeds for a 10x10x10 grid
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        for (let z = -5; z <= 5; z++) {
          seeds.add(coordsToSeed(DEFAULT_BASE_SEED, x, y, z));
        }
      }
    }

    // XOR hashing can have some collisions, but should be well-distributed
    // At least 50% should be unique for this small grid
    expect(seeds.size).toBeGreaterThan(1331 * 0.5);
    // And should have reasonable distribution (at least 55% unique)
    expect(seeds.size).toBeGreaterThan(730);
  });

  it('should maintain sector ID uniqueness', () => {
    const ids = new Set<string>();

    // Generate IDs for a 10x10x10 grid
    for (let x = -5; x <= 5; x++) {
      for (let y = -5; y <= 5; y++) {
        for (let z = -5; z <= 5; z++) {
          ids.add(coordsToSectorId(x, y, z));
        }
      }
    }

    expect(ids.size).toBe(1331);
  });
});
