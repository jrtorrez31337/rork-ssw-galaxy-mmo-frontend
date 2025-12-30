import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  generateSector,
  sectorCache,
  stateSync,
  coordsToSectorId,
  sectorIdToCoords,
} from '@/lib/procgen';
import type {
  Sector,
  SectorDelta,
  Coordinates,
  SectorType,
  SectorMetadata,
} from '@/lib/procgen/types';
import { getSectorDisplayName, getFactionColor } from '@/lib/procgen/types';
import { config } from '@/constants/config';

/**
 * Procgen Store
 *
 * Manages procedurally generated sector state with delta synchronization.
 *
 * Flow:
 * 1. Generate sector locally from seed (instant, deterministic)
 * 2. Sync deltas from server (state changes)
 * 3. Apply real-time deltas via SSE
 */

/**
 * Sector state entry with version tracking
 */
interface SectorEntry {
  sector: Sector;
  version: number;
  syncedAt: number;
  isSyncing: boolean;
  syncError?: string;
}

/**
 * Sector metadata cache entry
 */
interface MetadataEntry {
  metadata: SectorMetadata;
  fetchedAt: number;
}

/**
 * Procgen store state
 */
interface ProcgenState {
  // Current sector the player is in
  currentSectorId: string | null;
  currentSector: Sector | null;
  currentVersion: number;

  // Loaded sectors cache (in-memory for quick access)
  loadedSectors: Map<string, SectorEntry>;

  // Sector metadata cache
  sectorMetadata: Map<string, MetadataEntry>;

  // Pending sync operations
  syncingCount: number;

  // Actions
  enterSector: (sectorId: string) => Promise<Sector>;
  leaveSector: (sectorId: string) => void;
  getSector: (sectorId: string) => Sector | null;
  getSectorVersion: (sectorId: string) => number | undefined;
  applyDelta: (delta: SectorDelta) => void;
  refreshSector: (sectorId: string) => Promise<void>;
  preloadSectors: (sectorIds: string[]) => Promise<void>;
  clearCache: () => void;
  getCacheStats: () => { loaded: number; syncing: number };

  // Metadata actions
  fetchSectorMetadata: (sectorId: string) => Promise<SectorMetadata | null>;
  getMetadata: (sectorId: string) => SectorMetadata | null;
  getDisplayName: (sectorId: string) => string;
  getFactionInfo: (sectorId: string) => { factionId: string | null; factionName: string | null; color: string };
}

export const useProcgenStore = create<ProcgenState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentSectorId: null,
    currentSector: null,
    currentVersion: 0,
    loadedSectors: new Map(),
    sectorMetadata: new Map(),
    syncingCount: 0,

    /**
     * Enter a sector - generate and sync
     */
    enterSector: async (sectorId: string): Promise<Sector> => {
      const state = get();

      // Check if already loaded
      const existing = state.loadedSectors.get(sectorId);
      if (existing && !existing.isSyncing) {
        set({
          currentSectorId: sectorId,
          currentSector: existing.sector,
          currentVersion: existing.version,
        });
        return existing.sector;
      }

      // Parse coordinates from sector ID
      const coords = sectorIdToCoords(sectorId);
      if (!coords) {
        throw new Error(`Invalid sector ID: ${sectorId}`);
      }

      // Generate sector locally (instant)
      console.log(`[ProcgenStore] Generating sector: ${sectorId}`);
      const generatedSector = generateSector(coords);

      // Create entry and mark as syncing
      const entry: SectorEntry = {
        sector: generatedSector,
        version: 0,
        syncedAt: 0,
        isSyncing: true,
      };

      const newLoaded = new Map(state.loadedSectors);
      newLoaded.set(sectorId, entry);

      set({
        currentSectorId: sectorId,
        currentSector: generatedSector,
        currentVersion: 0,
        loadedSectors: newLoaded,
        syncingCount: state.syncingCount + 1,
      });

      // Sync deltas from server (async)
      try {
        const result = await stateSync.syncSector(sectorId, generatedSector);

        if (result.success) {
          // Get updated sector from cache (has deltas applied)
          const cached = await sectorCache.get(sectorId);
          const updatedSector = cached?.sector ?? generatedSector;

          // Update entry
          const finalEntry: SectorEntry = {
            sector: updatedSector,
            version: result.currentVersion,
            syncedAt: Date.now(),
            isSyncing: false,
          };

          const updatedLoaded = new Map(get().loadedSectors);
          updatedLoaded.set(sectorId, finalEntry);

          // Only update current if still in this sector
          const currentState = get();
          if (currentState.currentSectorId === sectorId) {
            set({
              currentSector: updatedSector,
              currentVersion: result.currentVersion,
              loadedSectors: updatedLoaded,
              syncingCount: Math.max(0, currentState.syncingCount - 1),
            });
          } else {
            set({
              loadedSectors: updatedLoaded,
              syncingCount: Math.max(0, currentState.syncingCount - 1),
            });
          }

          console.log(`[ProcgenStore] Synced ${sectorId}: version ${result.currentVersion}, ${result.appliedDeltas} deltas`);
          return updatedSector;
        } else {
          // Sync failed - update with error
          const errorEntry: SectorEntry = {
            sector: generatedSector,
            version: 0,
            syncedAt: Date.now(),
            isSyncing: false,
            syncError: result.error,
          };

          const errorLoaded = new Map(get().loadedSectors);
          errorLoaded.set(sectorId, errorEntry);

          set({
            loadedSectors: errorLoaded,
            syncingCount: Math.max(0, get().syncingCount - 1),
          });

          console.warn(`[ProcgenStore] Sync failed for ${sectorId}:`, result.error);
          return generatedSector;
        }
      } catch (error) {
        // Network error - continue with generated sector
        const errorEntry: SectorEntry = {
          sector: generatedSector,
          version: 0,
          syncedAt: Date.now(),
          isSyncing: false,
          syncError: error instanceof Error ? error.message : 'Network error',
        };

        const errorLoaded = new Map(get().loadedSectors);
        errorLoaded.set(sectorId, errorEntry);

        set({
          loadedSectors: errorLoaded,
          syncingCount: Math.max(0, get().syncingCount - 1),
        });

        console.error(`[ProcgenStore] Sync error for ${sectorId}:`, error);
        return generatedSector;
      }
    },

    /**
     * Leave a sector (keeps it in cache)
     */
    leaveSector: (sectorId: string) => {
      const state = get();
      if (state.currentSectorId === sectorId) {
        set({
          currentSectorId: null,
          currentSector: null,
          currentVersion: 0,
        });
      }
    },

    /**
     * Get a loaded sector (or null if not loaded)
     */
    getSector: (sectorId: string): Sector | null => {
      const entry = get().loadedSectors.get(sectorId);
      return entry?.sector ?? null;
    },

    /**
     * Get sector version (for delta comparison)
     */
    getSectorVersion: (sectorId: string): number | undefined => {
      const entry = get().loadedSectors.get(sectorId);
      return entry?.version;
    },

    /**
     * Apply a delta to a sector (from SSE event)
     */
    applyDelta: (delta: SectorDelta) => {
      const state = get();
      const entry = state.loadedSectors.get(delta.sectorId);

      if (!entry) {
        console.log(`[ProcgenStore] Delta for unloaded sector: ${delta.sectorId}`);
        return;
      }

      // Only apply if newer
      if (delta.version <= entry.version) {
        console.log(`[ProcgenStore] Skipping stale delta: ${delta.version} <= ${entry.version}`);
        return;
      }

      // Apply delta
      const updatedSector = stateSync.applyRealtimeDelta(entry.sector, delta);

      // Update entry
      const updatedEntry: SectorEntry = {
        ...entry,
        sector: updatedSector,
        version: delta.version,
      };

      const newLoaded = new Map(state.loadedSectors);
      newLoaded.set(delta.sectorId, updatedEntry);

      // Update current if this is the current sector
      if (state.currentSectorId === delta.sectorId) {
        set({
          currentSector: updatedSector,
          currentVersion: delta.version,
          loadedSectors: newLoaded,
        });
      } else {
        set({ loadedSectors: newLoaded });
      }

      console.log(`[ProcgenStore] Applied delta to ${delta.sectorId}: ${delta.deltaType} v${delta.version}`);
    },

    /**
     * Force refresh a sector from server
     */
    refreshSector: async (sectorId: string) => {
      const state = get();
      const entry = state.loadedSectors.get(sectorId);

      if (!entry) {
        console.log(`[ProcgenStore] Cannot refresh unloaded sector: ${sectorId}`);
        return;
      }

      // Mark as syncing
      const syncingEntry = { ...entry, isSyncing: true };
      const newLoaded = new Map(state.loadedSectors);
      newLoaded.set(sectorId, syncingEntry);
      set({
        loadedSectors: newLoaded,
        syncingCount: state.syncingCount + 1,
      });

      try {
        // Clear cache to force full resync
        sectorCache.clearDeltas(sectorId);
        await sectorCache.updateVersion(sectorId, 0);

        // Resync
        const result = await stateSync.syncSector(sectorId, entry.sector);

        if (result.success) {
          const cached = await sectorCache.get(sectorId);
          const updatedSector = cached?.sector ?? entry.sector;

          const finalEntry: SectorEntry = {
            sector: updatedSector,
            version: result.currentVersion,
            syncedAt: Date.now(),
            isSyncing: false,
          };

          const finalLoaded = new Map(get().loadedSectors);
          finalLoaded.set(sectorId, finalEntry);

          const currentState = get();
          if (currentState.currentSectorId === sectorId) {
            set({
              currentSector: updatedSector,
              currentVersion: result.currentVersion,
              loadedSectors: finalLoaded,
              syncingCount: Math.max(0, currentState.syncingCount - 1),
            });
          } else {
            set({
              loadedSectors: finalLoaded,
              syncingCount: Math.max(0, currentState.syncingCount - 1),
            });
          }
        }
      } catch (error) {
        const errorEntry: SectorEntry = {
          ...entry,
          isSyncing: false,
          syncError: error instanceof Error ? error.message : 'Refresh failed',
        };

        const errorLoaded = new Map(get().loadedSectors);
        errorLoaded.set(sectorId, errorEntry);

        set({
          loadedSectors: errorLoaded,
          syncingCount: Math.max(0, get().syncingCount - 1),
        });
      }
    },

    /**
     * Preload sectors (for adjacent sectors)
     */
    preloadSectors: async (sectorIds: string[]) => {
      const state = get();
      const toLoad = sectorIds.filter(id => !state.loadedSectors.has(id));

      if (toLoad.length === 0) return;

      console.log(`[ProcgenStore] Preloading ${toLoad.length} sectors`);

      // Generate all sectors first (synchronous)
      const entries: Array<[string, SectorEntry]> = [];
      for (const sectorId of toLoad) {
        const coords = sectorIdToCoords(sectorId);
        if (coords) {
          const sector = generateSector(coords);
          entries.push([sectorId, {
            sector,
            version: 0,
            syncedAt: 0,
            isSyncing: true,
          }]);
        }
      }

      // Add to loaded map
      const newLoaded = new Map(get().loadedSectors);
      for (const [id, entry] of entries) {
        newLoaded.set(id, entry);
      }
      set({
        loadedSectors: newLoaded,
        syncingCount: get().syncingCount + entries.length,
      });

      // Sync all in bulk
      try {
        const requests = entries.map(([id]) => ({
          sectorId: id,
          sinceVersion: 0,
        }));

        const results = await stateSync.fetchBulkDeltas(requests);

        // Apply results
        const finalLoaded = new Map(get().loadedSectors);
        let syncedCount = 0;

        for (const [sectorId, entry] of entries) {
          const deltaResult = results.get(sectorId);
          if (deltaResult) {
            const updatedSector = stateSync.applyDeltas(entry.sector, deltaResult.deltas);
            finalLoaded.set(sectorId, {
              sector: updatedSector,
              version: deltaResult.currentVersion,
              syncedAt: Date.now(),
              isSyncing: false,
            });
            syncedCount++;
          } else {
            finalLoaded.set(sectorId, {
              ...entry,
              syncedAt: Date.now(),
              isSyncing: false,
            });
          }
        }

        set({
          loadedSectors: finalLoaded,
          syncingCount: Math.max(0, get().syncingCount - entries.length),
        });

        console.log(`[ProcgenStore] Preloaded ${syncedCount}/${entries.length} sectors`);
      } catch (error) {
        // Mark all as done with error
        const errorLoaded = new Map(get().loadedSectors);
        for (const [sectorId, entry] of entries) {
          errorLoaded.set(sectorId, {
            ...entry,
            isSyncing: false,
            syncError: 'Bulk sync failed',
          });
        }
        set({
          loadedSectors: errorLoaded,
          syncingCount: Math.max(0, get().syncingCount - entries.length),
        });
      }
    },

    /**
     * Clear all loaded sectors
     */
    clearCache: () => {
      sectorCache.clear();
      set({
        currentSectorId: null,
        currentSector: null,
        currentVersion: 0,
        loadedSectors: new Map(),
        sectorMetadata: new Map(),
        syncingCount: 0,
      });
      console.log('[ProcgenStore] Cache cleared');
    },

    /**
     * Get cache statistics
     */
    getCacheStats: () => {
      const state = get();
      return {
        loaded: state.loadedSectors.size,
        syncing: state.syncingCount,
      };
    },

    /**
     * Fetch sector metadata from server
     */
    fetchSectorMetadata: async (sectorId: string): Promise<SectorMetadata | null> => {
      const state = get();

      // Check cache first (5 minute TTL)
      const cached = state.sectorMetadata.get(sectorId);
      if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) {
        return cached.metadata;
      }

      try {
        const response = await fetch(`${config.API_BASE_URL}/sectors/${sectorId}/metadata`);
        if (!response.ok) {
          console.warn(`[ProcgenStore] Failed to fetch metadata for ${sectorId}: ${response.status}`);
          return null;
        }

        const json = await response.json();
        if (!json.data) {
          return null;
        }

        // Map snake_case to camelCase
        const metadata: SectorMetadata = {
          sectorId: json.data.sector_id,
          name: json.data.name || null,
          factionId: json.data.faction_id || null,
          factionName: json.data.faction_name || null,
          factionTag: json.data.faction_tag || null,
          controlType: json.data.control_type,
          influenceScores: json.data.influence_scores,
          isContested: json.data.is_contested,
          population: json.data.population,
          threatLevel: json.data.threat_level,
          sectorType: json.data.sector_type,
          description: json.data.description || null,
          discoveredBy: json.data.discovered_by || null,
          discoveredAt: json.data.discovered_at || null,
          createdAt: json.data.created_at,
          updatedAt: json.data.updated_at,
        };

        // Update cache
        const newMetadata = new Map(get().sectorMetadata);
        newMetadata.set(sectorId, {
          metadata,
          fetchedAt: Date.now(),
        });
        set({ sectorMetadata: newMetadata });

        console.log(`[ProcgenStore] Fetched metadata for ${sectorId}: ${metadata.name || 'Unnamed'}`);
        return metadata;
      } catch (error) {
        console.error(`[ProcgenStore] Error fetching metadata for ${sectorId}:`, error);
        return null;
      }
    },

    /**
     * Get cached metadata for a sector
     */
    getMetadata: (sectorId: string): SectorMetadata | null => {
      const entry = get().sectorMetadata.get(sectorId);
      return entry?.metadata || null;
    },

    /**
     * Get display name for a sector (name if set, otherwise coordinates)
     */
    getDisplayName: (sectorId: string): string => {
      const entry = get().sectorMetadata.get(sectorId);
      return getSectorDisplayName(entry?.metadata || null, sectorId);
    },

    /**
     * Get faction info for a sector
     */
    getFactionInfo: (sectorId: string): { factionId: string | null; factionName: string | null; color: string } => {
      const entry = get().sectorMetadata.get(sectorId);
      const metadata = entry?.metadata;
      return {
        factionId: metadata?.factionId || null,
        factionName: metadata?.factionName || null,
        color: getFactionColor(metadata?.factionId || null),
      };
    },
  }))
);

// Selectors
export const selectCurrentSector = (state: ProcgenState) => state.currentSector;
export const selectCurrentVersion = (state: ProcgenState) => state.currentVersion;
export const selectIsSyncing = (state: ProcgenState) => state.syncingCount > 0;
export const selectSectorEntry = (sectorId: string) => (state: ProcgenState) =>
  state.loadedSectors.get(sectorId);
export const selectSectorMetadata = (sectorId: string) => (state: ProcgenState) =>
  state.sectorMetadata.get(sectorId)?.metadata || null;
export const selectCurrentSectorMetadata = (state: ProcgenState) =>
  state.currentSectorId ? state.sectorMetadata.get(state.currentSectorId)?.metadata || null : null;
