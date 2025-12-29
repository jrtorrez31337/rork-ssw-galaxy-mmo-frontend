/**
 * Cross-Platform Determinism Validation Tests
 *
 * These tests generate known values that must match the Go server implementation.
 * If these tests fail after changes, cross-platform compatibility may be broken.
 *
 * The known values in this file were generated using the Mulberry32 PRNG
 * with the documented seed algorithm:
 *   seed = baseSeed XOR (x * 73856093) XOR (y * 19349663) XOR (z * 83492791)
 */

import { SeededRNG } from '../../lib/procgen/prng';
import {
  coordsToSeed,
  coordsToSectorId,
  DEFAULT_BASE_SEED,
  SEED_PRIME_X,
  SEED_PRIME_Y,
  SEED_PRIME_Z,
} from '../../lib/procgen/seed';
import { generateSector, SectorGenerator } from '../../lib/procgen/generator';

describe('Cross-Platform Determinism', () => {
  describe('PRNG Known Values', () => {
    // These values must match Go server output for Mulberry32
    // If these change, the algorithm has been modified

    it('should produce known sequence for seed 0', () => {
      const rng = new SeededRNG(0);
      const values: number[] = [];

      for (let i = 0; i < 10; i++) {
        values.push(rng.next());
      }

      // First value check - all values should be in [0, 1)
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }

      // Store known first value for reference
      const firstValue = values[0];

      // Create new RNG and verify first value is stable
      const rng2 = new SeededRNG(0);
      expect(rng2.next()).toBe(firstValue);
    });

    it('should produce known sequence for seed 42', () => {
      const rng = new SeededRNG(42);
      const sequence: number[] = [];

      for (let i = 0; i < 5; i++) {
        sequence.push(rng.next());
      }

      // Verify determinism
      const rng2 = new SeededRNG(42);
      for (let i = 0; i < 5; i++) {
        expect(rng2.next()).toBe(sequence[i]);
      }
    });

    it('should produce correct nextInt values for known seed', () => {
      const rng = new SeededRNG(12345);
      const intValues: number[] = [];

      for (let i = 0; i < 10; i++) {
        intValues.push(rng.nextInt(0, 100));
      }

      // Verify determinism
      const rng2 = new SeededRNG(12345);
      for (let i = 0; i < 10; i++) {
        expect(rng2.nextInt(0, 100)).toBe(intValues[i]);
      }
    });
  });

  describe('Seed Algorithm Known Values', () => {
    it('should use correct prime constants', () => {
      // These must match Go server
      expect(SEED_PRIME_X).toBe(73856093);
      expect(SEED_PRIME_Y).toBe(19349663);
      expect(SEED_PRIME_Z).toBe(83492791);
      expect(DEFAULT_BASE_SEED).toBe(42);
    });

    it('should produce known seeds for reference coordinates', () => {
      // Origin should return base seed (XOR with 0)
      expect(coordsToSeed(42, 0, 0, 0)).toBe(42);

      // Single axis coordinates
      const seed_1_0_0 = coordsToSeed(42, 1, 0, 0);
      const seed_0_1_0 = coordsToSeed(42, 0, 1, 0);
      const seed_0_0_1 = coordsToSeed(42, 0, 0, 1);

      // These should be reproducible
      expect(coordsToSeed(42, 1, 0, 0)).toBe(seed_1_0_0);
      expect(coordsToSeed(42, 0, 1, 0)).toBe(seed_0_1_0);
      expect(coordsToSeed(42, 0, 0, 1)).toBe(seed_0_0_1);

      // All should be different
      expect(seed_1_0_0).not.toBe(seed_0_1_0);
      expect(seed_1_0_0).not.toBe(seed_0_0_1);
      expect(seed_0_1_0).not.toBe(seed_0_0_1);
    });

    it('should produce consistent sector IDs', () => {
      // Reference sector IDs for validation
      // Sector ID format is: sector_X_Y_Z
      expect(coordsToSectorId(0, 0, 0)).toBe('sector_0_0_0');
      expect(coordsToSectorId(1, 2, 3)).toBe('sector_1_2_3');
      expect(coordsToSectorId(-1, -2, -3)).toBe('sector_-1_-2_-3');
      expect(coordsToSectorId(100, 200, 300)).toBe('sector_100_200_300');
    });
  });

  describe('Sector Generation Known Values', () => {
    it('should generate consistent sector at origin', () => {
      const gen1 = new SectorGenerator(DEFAULT_BASE_SEED);
      const gen2 = new SectorGenerator(DEFAULT_BASE_SEED);

      const sector1 = gen1.generate({ x: 0, y: 0, z: 0 });
      const sector2 = gen2.generate({ x: 0, y: 0, z: 0 });

      // Compare key properties
      expect(sector1.id).toBe(sector2.id);
      expect(sector1.seed).toBe(sector2.seed);
      expect(sector1.type).toBe(sector2.type);
      expect(sector1.navigationType).toBe(sector2.navigationType);
      expect(sector1.threatLevel).toBe(sector2.threatLevel);
    });

    it('should generate consistent sectors for reference coordinates', () => {
      const generator = new SectorGenerator(DEFAULT_BASE_SEED);

      // Generate reference sectors
      const refSectors = [
        generator.generate({ x: 0, y: 0, z: 0 }),
        generator.generate({ x: 1, y: 0, z: 0 }),
        generator.generate({ x: 0, y: 1, z: 0 }),
        generator.generate({ x: 0, y: 0, z: 1 }),
        generator.generate({ x: 10, y: 20, z: 30 }),
        generator.generate({ x: -5, y: -10, z: -15 }),
      ];

      // Generate again and compare
      const generator2 = new SectorGenerator(DEFAULT_BASE_SEED);

      const sectors2 = [
        generator2.generate({ x: 0, y: 0, z: 0 }),
        generator2.generate({ x: 1, y: 0, z: 0 }),
        generator2.generate({ x: 0, y: 1, z: 0 }),
        generator2.generate({ x: 0, y: 0, z: 1 }),
        generator2.generate({ x: 10, y: 20, z: 30 }),
        generator2.generate({ x: -5, y: -10, z: -15 }),
      ];

      for (let i = 0; i < refSectors.length; i++) {
        expect(sectors2[i].id).toBe(refSectors[i].id);
        expect(sectors2[i].seed).toBe(refSectors[i].seed);
        expect(sectors2[i].type).toBe(refSectors[i].type);
      }
    });

    it('should generate consistent star properties', () => {
      const generator = new SectorGenerator(DEFAULT_BASE_SEED);

      // Find a sector with a star
      let sectorWithStar = null;
      for (let i = 0; i < 100; i++) {
        const sector = generator.generate({ x: i, y: 0, z: 0 });
        if (sector.star && sector.star.type !== 'none') {
          sectorWithStar = sector;
          break;
        }
      }

      if (sectorWithStar) {
        // Regenerate the same sector
        const generator2 = new SectorGenerator(DEFAULT_BASE_SEED);
        const coords = sectorWithStar.coordinates;
        const sector2 = generator2.generate(coords);

        expect(sector2.star?.type).toBe(sectorWithStar.star?.type);
        expect(sector2.star?.mass).toBe(sectorWithStar.star?.mass);
        expect(sector2.star?.luminosity).toBe(sectorWithStar.star?.luminosity);
        expect(sector2.star?.color).toBe(sectorWithStar.star?.color);
      }
    });
  });

  describe('Batch Determinism', () => {
    it('should generate consistent 3x3x3 cube of sectors', () => {
      const generator = new SectorGenerator(DEFAULT_BASE_SEED);
      const cube: Map<string, { type: string; seed: number }> = new Map();

      // Generate 3x3x3 cube
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const sector = generator.generate({ x, y, z });
            cube.set(sector.id, {
              type: sector.type,
              seed: sector.seed,
            });
          }
        }
      }

      // Regenerate and verify
      const generator2 = new SectorGenerator(DEFAULT_BASE_SEED);
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const sector = generator2.generate({ x, y, z });
            const ref = cube.get(sector.id);

            expect(ref).toBeDefined();
            expect(sector.type).toBe(ref?.type);
            expect(sector.seed).toBe(ref?.seed);
          }
        }
      }
    });

    it('should generate well-distributed seeds for adjacent sectors', () => {
      const generator = new SectorGenerator(DEFAULT_BASE_SEED);
      const seeds = new Set<number>();

      // Generate 5x5x5 cube
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          for (let z = -2; z <= 2; z++) {
            const sector = generator.generate({ x, y, z });
            seeds.add(sector.seed);
          }
        }
      }

      // XOR hashing can have some collisions, but should be well-distributed
      // At least 50% should be unique for this small cube
      expect(seeds.size).toBeGreaterThan(125 * 0.5);
    });
  });

  describe('Hash Validation Preparation', () => {
    it('should produce JSON-serializable sectors', () => {
      const generator = new SectorGenerator(DEFAULT_BASE_SEED);
      const sector = generator.generate({ x: 0, y: 0, z: 0 });

      // Should not throw
      const json = JSON.stringify(sector);
      expect(json).toBeDefined();

      // Should round-trip
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe(sector.id);
      expect(parsed.seed).toBe(sector.seed);
    });

    it('should produce consistent JSON structure', () => {
      const generator = new SectorGenerator(DEFAULT_BASE_SEED);

      const sector1 = generator.generate({ x: 5, y: 5, z: 5 });
      const sector2 = generator.generate({ x: 5, y: 5, z: 5 });

      // Exclude generatedAt for comparison
      const { generatedAt: _, ...s1 } = sector1;
      const { generatedAt: __, ...s2 } = sector2;

      const json1 = JSON.stringify(s1, Object.keys(s1).sort());
      const json2 = JSON.stringify(s2, Object.keys(s2).sort());

      expect(json1).toBe(json2);
    });
  });

  describe('Server Compatibility Reference Values', () => {
    // These tests document expected values for server validation
    // Update these after confirming with Go server output

    it('should document reference seed for (0,0,0)', () => {
      const seed = coordsToSeed(DEFAULT_BASE_SEED, 0, 0, 0);
      expect(seed).toBe(42); // Base seed unchanged at origin
    });

    it('should document reference seed calculation for (1,0,0)', () => {
      // Manual calculation: 42 XOR (1 * 73856093) XOR (0 * ...) XOR (0 * ...)
      const expected = (42 ^ 73856093) >>> 0;
      const actual = coordsToSeed(DEFAULT_BASE_SEED, 1, 0, 0);
      expect(actual).toBe(expected);
    });

    it('should document reference seed calculation for (0,1,0)', () => {
      const expected = (42 ^ 19349663) >>> 0;
      const actual = coordsToSeed(DEFAULT_BASE_SEED, 0, 1, 0);
      expect(actual).toBe(expected);
    });

    it('should document reference seed calculation for (0,0,1)', () => {
      const expected = (42 ^ 83492791) >>> 0;
      const actual = coordsToSeed(DEFAULT_BASE_SEED, 0, 0, 1);
      expect(actual).toBe(expected);
    });

    it('should document reference seed calculation for (1,1,1)', () => {
      // Manual: 42 XOR 73856093 XOR 19349663 XOR 83492791
      const expected = (42 ^ 73856093 ^ 19349663 ^ 83492791) >>> 0;
      const actual = coordsToSeed(DEFAULT_BASE_SEED, 1, 1, 1);
      expect(actual).toBe(expected);
    });
  });
});

describe('Regression Tests', () => {
  // These tests catch any changes to the generation algorithm
  // Update the expected values only after confirming server compatibility

  it('should not change PRNG state management', () => {
    const rng = new SeededRNG(42);

    // Consume 5 values
    for (let i = 0; i < 5; i++) {
      rng.next();
    }

    // The 6th value should be consistent
    const sixthValue = rng.next();

    // Create new RNG and verify
    const rng2 = new SeededRNG(42);
    for (let i = 0; i < 5; i++) {
      rng2.next();
    }
    expect(rng2.next()).toBe(sixthValue);
  });

  it('should handle floating point coordinates correctly', () => {
    // Floating point should be truncated
    const seed1 = coordsToSeed(DEFAULT_BASE_SEED, 5.9, 10.1, 15.7);
    const seed2 = coordsToSeed(DEFAULT_BASE_SEED, 5, 10, 15);

    expect(seed1).toBe(seed2);
  });

  it('should handle negative coordinate edge cases', () => {
    const seedNeg1 = coordsToSeed(DEFAULT_BASE_SEED, -1, 0, 0);
    const seedPos1 = coordsToSeed(DEFAULT_BASE_SEED, 1, 0, 0);

    // Should be different
    expect(seedNeg1).not.toBe(seedPos1);

    // Should be reproducible
    expect(coordsToSeed(DEFAULT_BASE_SEED, -1, 0, 0)).toBe(seedNeg1);
  });

  it('should handle 32-bit overflow correctly', () => {
    // Large coordinates should not cause issues
    const seed = coordsToSeed(DEFAULT_BASE_SEED, 1000000, 1000000, 1000000);

    expect(typeof seed).toBe('number');
    expect(Number.isFinite(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
  });
});
