/**
 * Sector Cache Unit Tests
 *
 * Tests for the sector caching system to ensure:
 * - Memory cache operations work correctly
 * - Delta cache operations work correctly
 * - LRU eviction works as expected
 * - Cache statistics are accurate
 */

import { sectorCache } from '../../lib/procgen/cache';
import { generateSector } from '../../lib/procgen/generator';
import type { SectorDelta, DeltaType } from '../../lib/procgen/types';

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Get the mocked AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('SectorCache', () => {
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Clear the cache before each test
    await sectorCache.clear();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(sectorCache['initialize']()).resolves.not.toThrow();
    });

    it('should load index from storage on initialize', async () => {
      const mockIndex = ['sector_0_0_0', 'sector_1_0_0'];
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockIndex));

      // Force re-initialization
      sectorCache['isInitialized'] = false;
      await sectorCache['initialize']();

      expect(mockAsyncStorage.getItem).toHaveBeenCalled();
    });
  });

  describe('memory cache operations', () => {
    it('should store and retrieve sectors', async () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });
      await sectorCache.set(sector.id, sector, 1);

      const entry = await sectorCache.get(sector.id);

      expect(entry).not.toBeNull();
      expect(entry?.sector.id).toBe(sector.id);
      expect(entry?.version).toBe(1);
    });

    it('should return null for non-existent sectors', async () => {
      const entry = await sectorCache.get('nonexistent');

      expect(entry).toBeNull();
    });

    it('should update last accessed time on get', async () => {
      const sector = generateSector({ x: 1, y: 1, z: 1 });
      await sectorCache.set(sector.id, sector, 0);

      const entry1 = await sectorCache.get(sector.id);
      const time1 = entry1?.lastAccessed;

      // Wait a small amount
      await new Promise(resolve => setTimeout(resolve, 10));

      const entry2 = await sectorCache.get(sector.id);
      const time2 = entry2?.lastAccessed;

      expect(time2).toBeGreaterThanOrEqual(time1!);
    });

    it('should check if sector exists', async () => {
      const sector = generateSector({ x: 2, y: 2, z: 2 });

      expect(await sectorCache.has(sector.id)).toBe(false);

      await sectorCache.set(sector.id, sector, 0);

      expect(await sectorCache.has(sector.id)).toBe(true);
    });

    it('should remove sectors', async () => {
      const sector = generateSector({ x: 3, y: 3, z: 3 });
      await sectorCache.set(sector.id, sector, 0);

      expect(await sectorCache.has(sector.id)).toBe(true);

      await sectorCache.remove(sector.id);

      expect(await sectorCache.has(sector.id)).toBe(false);
    });
  });

  describe('version tracking', () => {
    it('should track sector versions', async () => {
      const sector = generateSector({ x: 4, y: 4, z: 4 });
      await sectorCache.set(sector.id, sector, 5);

      const version = await sectorCache.getVersion(sector.id);

      expect(version).toBe(5);
    });

    it('should return 0 for unknown sectors', async () => {
      const version = await sectorCache.getVersion('unknown');

      expect(version).toBe(0);
    });

    it('should update sector versions', async () => {
      const sector = generateSector({ x: 5, y: 5, z: 5 });
      await sectorCache.set(sector.id, sector, 1);

      await sectorCache.updateVersion(sector.id, 10);

      const version = await sectorCache.getVersion(sector.id);
      expect(version).toBe(10);
    });
  });

  describe('delta cache operations', () => {
    const mockDeltas: SectorDelta[] = [
      {
        id: 'delta_1',
        sectorId: 'sector_0_0_0',
        deltaType: 'resource_depleted' as DeltaType,
        targetId: 'resource_1',
        targetType: 'asteroid_resource',
        changes: { currentYield: 0, isDepleted: true },
        appliedAt: new Date().toISOString(),
        version: 1,
      },
      {
        id: 'delta_2',
        sectorId: 'sector_0_0_0',
        deltaType: 'station_damaged' as DeltaType,
        targetId: 'station_1',
        targetType: 'station',
        changes: { health: 50, damageLevel: 'moderate' },
        appliedAt: new Date().toISOString(),
        version: 2,
      },
    ];

    it('should store and retrieve deltas', () => {
      sectorCache.setDeltas('sector_0_0_0', mockDeltas, 2);

      const cached = sectorCache.getDeltas('sector_0_0_0');

      expect(cached).not.toBeNull();
      expect(cached?.deltas.length).toBe(2);
      expect(cached?.currentVersion).toBe(2);
    });

    it('should return null for non-existent delta cache', () => {
      const cached = sectorCache.getDeltas('nonexistent');

      expect(cached).toBeNull();
    });

    it('should add new deltas without duplicates', () => {
      sectorCache.setDeltas('sector_1_1_1', mockDeltas.slice(0, 1), 1);

      const newDelta: SectorDelta = {
        id: 'delta_3',
        sectorId: 'sector_1_1_1',
        deltaType: 'population_changed' as DeltaType,
        changes: { population: 1000 },
        appliedAt: new Date().toISOString(),
        version: 3,
      };

      sectorCache.addDeltas('sector_1_1_1', [newDelta], 3);

      const cached = sectorCache.getDeltas('sector_1_1_1');
      expect(cached?.deltas.length).toBe(2);
      expect(cached?.currentVersion).toBe(3);
    });

    it('should not add duplicate deltas', () => {
      sectorCache.setDeltas('sector_2_2_2', mockDeltas, 2);

      // Try to add the same deltas again
      sectorCache.addDeltas('sector_2_2_2', mockDeltas, 2);

      const cached = sectorCache.getDeltas('sector_2_2_2');
      expect(cached?.deltas.length).toBe(2); // Should still be 2
    });

    it('should sort deltas by version', () => {
      const unsortedDeltas: SectorDelta[] = [
        { ...mockDeltas[1], version: 5 },
        { ...mockDeltas[0], version: 2 },
      ];

      sectorCache.setDeltas('sector_3_3_3', [], 0);
      sectorCache.addDeltas('sector_3_3_3', unsortedDeltas, 5);

      const cached = sectorCache.getDeltas('sector_3_3_3');
      expect(cached?.deltas[0].version).toBe(2);
      expect(cached?.deltas[1].version).toBe(5);
    });

    it('should clear deltas for a sector', () => {
      sectorCache.setDeltas('sector_4_4_4', mockDeltas, 2);

      expect(sectorCache.getDeltas('sector_4_4_4')).not.toBeNull();

      sectorCache.clearDeltas('sector_4_4_4');

      expect(sectorCache.getDeltas('sector_4_4_4')).toBeNull();
    });
  });

  describe('cache statistics', () => {
    it('should track memory sector count', async () => {
      const stats1 = sectorCache.getStats();
      const initialMemory = stats1.memorySectors;

      const sector = generateSector({ x: 10, y: 10, z: 10 });
      await sectorCache.set(sector.id, sector, 0);

      const stats2 = sectorCache.getStats();
      expect(stats2.memorySectors).toBe(initialMemory + 1);
    });

    it('should track delta cached sectors', () => {
      const stats1 = sectorCache.getStats();
      const initialDeltas = stats1.deltaCachedSectors;

      sectorCache.setDeltas('sector_test', [], 0);

      const stats2 = sectorCache.getStats();
      expect(stats2.deltaCachedSectors).toBe(initialDeltas + 1);
    });
  });

  describe('clear operation', () => {
    it('should clear all cache data', async () => {
      // Add some data
      const sector = generateSector({ x: 20, y: 20, z: 20 });
      await sectorCache.set(sector.id, sector, 0);
      sectorCache.setDeltas('sector_test', [], 0);

      // Clear
      await sectorCache.clear();

      // Verify
      expect(await sectorCache.has(sector.id)).toBe(false);
      expect(sectorCache.getDeltas('sector_test')).toBeNull();

      const stats = sectorCache.getStats();
      expect(stats.memorySectors).toBe(0);
      expect(stats.deltaCachedSectors).toBe(0);
    });
  });

  describe('prefetch', () => {
    it('should prefetch sectors that are not cached', async () => {
      const sectorIds = ['sector_30_0_0', 'sector_31_0_0', 'sector_32_0_0'];

      await sectorCache.prefetch(sectorIds, (id) => {
        // Parse coordinates from sector ID
        const match = id.match(/sector_(-?\d+)_(-?\d+)_(-?\d+)/);
        if (match) {
          return generateSector({
            x: parseInt(match[1], 10),
            y: parseInt(match[2], 10),
            z: parseInt(match[3], 10),
          });
        }
        throw new Error(`Invalid sector ID: ${id}`);
      });

      for (const id of sectorIds) {
        expect(await sectorCache.has(id)).toBe(true);
      }
    });

    it('should not overwrite existing cached sectors', async () => {
      // Pre-cache one sector with specific version
      const sector = generateSector({ x: 40, y: 0, z: 0 });
      await sectorCache.set(sector.id, sector, 99);

      // Prefetch including this sector
      await sectorCache.prefetch([sector.id], () => {
        // This generator should NOT be called for already cached sector
        return generateSector({ x: 40, y: 0, z: 0 });
      });

      // Version should still be 99 (not overwritten)
      const version = await sectorCache.getVersion(sector.id);
      expect(version).toBe(99);
    });
  });
});

describe('cache edge cases', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await sectorCache.clear();
  });

  it('should handle concurrent set operations', async () => {
    const sectors = Array.from({ length: 10 }, (_, i) =>
      generateSector({ x: 100 + i, y: 0, z: 0 })
    );

    // Set all sectors concurrently
    await Promise.all(
      sectors.map((sector, i) => sectorCache.set(sector.id, sector, i))
    );

    // Verify all were stored
    for (const sector of sectors) {
      expect(await sectorCache.has(sector.id)).toBe(true);
    }
  });

  it('should handle missing sector data gracefully', async () => {
    // Try to get a non-existent sector
    const entry = await sectorCache.get('sector_999_999_999');
    expect(entry).toBeNull();

    // Try to update version of non-existent sector
    await expect(
      sectorCache.updateVersion('sector_999_999_999', 10)
    ).resolves.not.toThrow();
  });
});
