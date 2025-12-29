/**
 * Sector Cache
 *
 * In-memory cache for generated sector data with AsyncStorage persistence.
 * Cache is for PERFORMANCE ONLY - not for offline play.
 *
 * Per plan: "Online only - Cache for performance, require connection for play"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sector, SectorDelta } from './types';

// Cache entry with version tracking
interface CacheEntry {
  sector: Sector;
  version: number;
  lastAccessed: number;
  lastSynced: number;
}

// Delta cache for pending/applied deltas
interface DeltaCache {
  sectorId: string;
  deltas: SectorDelta[];
  currentVersion: number;
  lastFetched: number;
}

// Storage keys
const STORAGE_KEY_PREFIX = 'procgen_cache_';
const DELTA_STORAGE_KEY_PREFIX = 'procgen_deltas_';
const CACHE_INDEX_KEY = 'procgen_cache_index';

// Cache configuration
const MAX_MEMORY_ENTRIES = 50;  // Max sectors in memory
const MAX_STORAGE_ENTRIES = 200; // Max sectors in AsyncStorage
const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutes in memory
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in storage

class SectorCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private deltaCache: Map<string, DeltaCache> = new Map();
  private cacheIndex: Set<string> = new Set();
  private isInitialized: boolean = false;

  /**
   * Initialize cache by loading index from AsyncStorage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const indexJson = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexJson) {
        const index = JSON.parse(indexJson);
        this.cacheIndex = new Set(index);
      }
      this.isInitialized = true;
      console.log(`[SectorCache] Initialized with ${this.cacheIndex.size} stored sectors`);
    } catch (error) {
      console.error('[SectorCache] Failed to initialize:', error);
      this.isInitialized = true; // Continue without persistence
    }
  }

  /**
   * Get a sector from cache (memory first, then storage)
   */
  async get(sectorId: string): Promise<CacheEntry | null> {
    await this.initialize();

    // Check memory cache first
    const memEntry = this.memoryCache.get(sectorId);
    if (memEntry) {
      // Update last accessed
      memEntry.lastAccessed = Date.now();
      return memEntry;
    }

    // Check storage
    if (this.cacheIndex.has(sectorId)) {
      try {
        const json = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${sectorId}`);
        if (json) {
          const entry: CacheEntry = JSON.parse(json);

          // Check if storage entry is still valid
          if (Date.now() - entry.lastSynced < STORAGE_TTL_MS) {
            // Promote to memory cache
            entry.lastAccessed = Date.now();
            this.addToMemoryCache(sectorId, entry);
            return entry;
          } else {
            // Entry expired, remove it
            await this.removeFromStorage(sectorId);
          }
        }
      } catch (error) {
        console.error(`[SectorCache] Failed to load ${sectorId} from storage:`, error);
      }
    }

    return null;
  }

  /**
   * Get sector version (for delta sync)
   */
  async getVersion(sectorId: string): Promise<number> {
    const entry = await this.get(sectorId);
    return entry?.version ?? 0;
  }

  /**
   * Store a sector in cache
   */
  async set(sectorId: string, sector: Sector, version: number = 0): Promise<void> {
    await this.initialize();

    const entry: CacheEntry = {
      sector,
      version,
      lastAccessed: Date.now(),
      lastSynced: Date.now(),
    };

    // Add to memory cache
    this.addToMemoryCache(sectorId, entry);

    // Persist to storage (async)
    this.persistToStorage(sectorId, entry).catch(err =>
      console.error(`[SectorCache] Failed to persist ${sectorId}:`, err)
    );
  }

  /**
   * Update sector version after delta sync
   */
  async updateVersion(sectorId: string, version: number): Promise<void> {
    const entry = await this.get(sectorId);
    if (entry) {
      entry.version = version;
      entry.lastSynced = Date.now();
      this.memoryCache.set(sectorId, entry);

      // Update storage async
      this.persistToStorage(sectorId, entry).catch(err =>
        console.error(`[SectorCache] Failed to update version for ${sectorId}:`, err)
      );
    }
  }

  /**
   * Store deltas for a sector
   */
  setDeltas(sectorId: string, deltas: SectorDelta[], currentVersion: number): void {
    this.deltaCache.set(sectorId, {
      sectorId,
      deltas,
      currentVersion,
      lastFetched: Date.now(),
    });
  }

  /**
   * Get cached deltas for a sector
   */
  getDeltas(sectorId: string): DeltaCache | null {
    return this.deltaCache.get(sectorId) ?? null;
  }

  /**
   * Add deltas to existing cache
   */
  addDeltas(sectorId: string, newDeltas: SectorDelta[], newVersion: number): void {
    const existing = this.deltaCache.get(sectorId);
    if (existing) {
      // Filter out any duplicates and add new
      const existingVersions = new Set(existing.deltas.map(d => d.version));
      const uniqueNew = newDeltas.filter(d => !existingVersions.has(d.version));
      existing.deltas.push(...uniqueNew);
      existing.deltas.sort((a, b) => a.version - b.version);
      existing.currentVersion = newVersion;
      existing.lastFetched = Date.now();
    } else {
      this.setDeltas(sectorId, newDeltas, newVersion);
    }
  }

  /**
   * Clear deltas for a sector (e.g., after full resync)
   */
  clearDeltas(sectorId: string): void {
    this.deltaCache.delete(sectorId);
  }

  /**
   * Add entry to memory cache with LRU eviction
   */
  private addToMemoryCache(sectorId: string, entry: CacheEntry): void {
    // Evict oldest entries if at capacity
    if (this.memoryCache.size >= MAX_MEMORY_ENTRIES) {
      this.evictOldestMemoryEntries(10);
    }

    this.memoryCache.set(sectorId, entry);
  }

  /**
   * Evict oldest entries from memory cache
   */
  private evictOldestMemoryEntries(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    for (let i = 0; i < count && i < entries.length; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * Persist entry to AsyncStorage
   */
  private async persistToStorage(sectorId: string, entry: CacheEntry): Promise<void> {
    try {
      // Check storage limit
      if (this.cacheIndex.size >= MAX_STORAGE_ENTRIES && !this.cacheIndex.has(sectorId)) {
        await this.evictOldestStorageEntries(20);
      }

      await AsyncStorage.setItem(
        `${STORAGE_KEY_PREFIX}${sectorId}`,
        JSON.stringify(entry)
      );

      // Update index
      this.cacheIndex.add(sectorId);
      await this.saveIndex();
    } catch (error) {
      console.error(`[SectorCache] Storage persist failed for ${sectorId}:`, error);
    }
  }

  /**
   * Remove entry from storage
   */
  private async removeFromStorage(sectorId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${sectorId}`);
      await AsyncStorage.removeItem(`${DELTA_STORAGE_KEY_PREFIX}${sectorId}`);
      this.cacheIndex.delete(sectorId);
      await this.saveIndex();
    } catch (error) {
      console.error(`[SectorCache] Failed to remove ${sectorId} from storage:`, error);
    }
  }

  /**
   * Evict oldest entries from storage
   */
  private async evictOldestStorageEntries(count: number): Promise<void> {
    const entries: Array<{ id: string; lastSynced: number }> = [];

    // Get timestamps for all stored entries
    for (const sectorId of this.cacheIndex) {
      try {
        const json = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${sectorId}`);
        if (json) {
          const entry = JSON.parse(json);
          entries.push({ id: sectorId, lastSynced: entry.lastSynced });
        }
      } catch {
        entries.push({ id: sectorId, lastSynced: 0 }); // Treat errors as oldest
      }
    }

    // Sort by oldest and evict
    entries.sort((a, b) => a.lastSynced - b.lastSynced);
    for (let i = 0; i < count && i < entries.length; i++) {
      await this.removeFromStorage(entries[i].id);
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveIndex(): Promise<void> {
    await AsyncStorage.setItem(
      CACHE_INDEX_KEY,
      JSON.stringify(Array.from(this.cacheIndex))
    );
  }

  /**
   * Check if sector is cached (memory or storage)
   */
  async has(sectorId: string): Promise<boolean> {
    await this.initialize();
    return this.memoryCache.has(sectorId) || this.cacheIndex.has(sectorId);
  }

  /**
   * Clear specific sector from cache
   */
  async remove(sectorId: string): Promise<void> {
    this.memoryCache.delete(sectorId);
    this.deltaCache.delete(sectorId);
    await this.removeFromStorage(sectorId);
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.deltaCache.clear();

    // Clear storage
    for (const sectorId of this.cacheIndex) {
      try {
        await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${sectorId}`);
        await AsyncStorage.removeItem(`${DELTA_STORAGE_KEY_PREFIX}${sectorId}`);
      } catch {
        // Ignore errors during clear
      }
    }

    this.cacheIndex.clear();
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);

    console.log('[SectorCache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySectors: number;
    storageSectors: number;
    deltaCachedSectors: number;
  } {
    return {
      memorySectors: this.memoryCache.size,
      storageSectors: this.cacheIndex.size,
      deltaCachedSectors: this.deltaCache.size,
    };
  }

  /**
   * Prefetch adjacent sectors (call during idle time)
   */
  async prefetch(sectorIds: string[], generator: (id: string) => Sector): Promise<void> {
    for (const sectorId of sectorIds) {
      if (!await this.has(sectorId)) {
        const sector = generator(sectorId);
        await this.set(sectorId, sector, 0);
      }
    }
  }
}

// Export singleton instance
export const sectorCache = new SectorCache();
