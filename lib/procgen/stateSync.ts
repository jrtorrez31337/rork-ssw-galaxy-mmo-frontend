/**
 * State Synchronization
 *
 * Handles synchronization of sector state between client and server.
 * Fetches deltas from server and applies them to locally generated sectors.
 *
 * Flow:
 * 1. Client generates sector from seed (identical to server)
 * 2. Client fetches deltas since version 0 (or last known version)
 * 3. Client applies deltas to get current state
 * 4. Client subscribes to SSE for real-time delta updates
 */

import { config } from '@/constants/config';
import { storage } from '@/utils/storage';
import { sectorCache } from './cache';
import type { Sector, SectorDelta, DeltaType } from './types';

// Delta response from server
interface DeltaResponse {
  data: {
    sector_id: string;
    current_version: number;
    since_version: number;
    delta_count: number;
    deltas: ServerDelta[];
  };
}

// Bulk delta response
interface BulkDeltaResponse {
  data: {
    sector_count: number;
    sectors: Record<string, {
      current_version: number;
      delta_count: number;
      deltas: ServerDelta[];
    }>;
  };
}

// Server delta format
interface ServerDelta {
  id: string;
  sector_id: string;
  delta_type: DeltaType;
  target_id: string | null;
  target_type: string | null;
  changes: Record<string, any>;
  applied_at: string;
  version: number;
  caused_by_player_id: string | null;
  caused_by_event: string | null;
}

// Sector version response
interface VersionResponse {
  data: {
    sector_id: string;
    current_version: number;
    is_pristine: boolean;
    first_visited_at?: string;
    last_delta_at?: string;
    total_deltas?: number;
  };
}

// Sync result
export interface SyncResult {
  success: boolean;
  sectorId: string;
  appliedDeltas: number;
  currentVersion: number;
  error?: string;
}

class StateSync {
  private baseUrl: string;
  private pendingSync: Map<string, Promise<SyncResult>> = new Map();

  constructor() {
    // Use worldsim service URL from config
    this.baseUrl = config.API_URL;
  }

  /**
   * Fetch deltas for a sector since a given version
   */
  async fetchDeltas(
    sectorId: string,
    sinceVersion: number = 0
  ): Promise<{ deltas: SectorDelta[]; currentVersion: number }> {
    const token = await storage.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/v1/sectors/${encodeURIComponent(sectorId)}/deltas?since_version=${sinceVersion}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch deltas: ${response.status}`);
    }

    const data: DeltaResponse = await response.json();

    // Convert server deltas to client format
    const deltas: SectorDelta[] = data.data.deltas.map(this.convertServerDelta);

    return {
      deltas,
      currentVersion: data.data.current_version,
    };
  }

  /**
   * Fetch deltas for multiple sectors in bulk
   */
  async fetchBulkDeltas(
    requests: Array<{ sectorId: string; sinceVersion: number }>
  ): Promise<Map<string, { deltas: SectorDelta[]; currentVersion: number }>> {
    const token = await storage.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/v1/sectors/deltas/bulk`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectors: requests.map(r => ({
            sector_id: r.sectorId,
            since_version: r.sinceVersion,
          })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch bulk deltas: ${response.status}`);
    }

    const data: BulkDeltaResponse = await response.json();
    const results = new Map<string, { deltas: SectorDelta[]; currentVersion: number }>();

    for (const [sectorId, sectorData] of Object.entries(data.data.sectors)) {
      results.set(sectorId, {
        deltas: sectorData.deltas.map(this.convertServerDelta),
        currentVersion: sectorData.current_version,
      });
    }

    return results;
  }

  /**
   * Get current version for a sector
   */
  async getSectorVersion(sectorId: string): Promise<{
    version: number;
    isPristine: boolean;
  }> {
    const token = await storage.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${this.baseUrl}/v1/sectors/${encodeURIComponent(sectorId)}/version`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get sector version: ${response.status}`);
    }

    const data: VersionResponse = await response.json();

    return {
      version: data.data.current_version,
      isPristine: data.data.is_pristine,
    };
  }

  /**
   * Sync a sector - fetch and apply all deltas
   * Returns deduplicated promise if sync already in progress
   */
  async syncSector(
    sectorId: string,
    sector: Sector
  ): Promise<SyncResult> {
    // Check for existing sync operation
    const existing = this.pendingSync.get(sectorId);
    if (existing) {
      return existing;
    }

    // Start new sync
    const syncPromise = this.performSync(sectorId, sector);
    this.pendingSync.set(sectorId, syncPromise);

    try {
      return await syncPromise;
    } finally {
      this.pendingSync.delete(sectorId);
    }
  }

  /**
   * Perform actual sync operation
   */
  private async performSync(
    sectorId: string,
    sector: Sector
  ): Promise<SyncResult> {
    try {
      // Get cached version
      const cachedVersion = await sectorCache.getVersion(sectorId);

      // Fetch deltas from server
      const { deltas, currentVersion } = await this.fetchDeltas(sectorId, cachedVersion);

      if (deltas.length === 0) {
        // No new deltas, sector is current
        await sectorCache.set(sectorId, sector, currentVersion);
        return {
          success: true,
          sectorId,
          appliedDeltas: 0,
          currentVersion,
        };
      }

      // Apply deltas to sector
      const updatedSector = this.applyDeltas(sector, deltas);

      // Update cache
      await sectorCache.set(sectorId, updatedSector, currentVersion);
      sectorCache.setDeltas(sectorId, deltas, currentVersion);

      console.log(`[StateSync] Synced ${sectorId}: applied ${deltas.length} deltas, version ${currentVersion}`);

      return {
        success: true,
        sectorId,
        appliedDeltas: deltas.length,
        currentVersion,
      };
    } catch (error) {
      console.error(`[StateSync] Failed to sync ${sectorId}:`, error);
      return {
        success: false,
        sectorId,
        appliedDeltas: 0,
        currentVersion: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply a single delta from SSE event (real-time update)
   */
  applyRealtimeDelta(sector: Sector, delta: SectorDelta): Sector {
    // Add to delta cache
    sectorCache.addDeltas(sector.id, [delta], delta.version);

    // Apply and return updated sector
    return this.applyDeltas(sector, [delta]);
  }

  /**
   * Apply deltas to a sector, returning updated sector
   */
  applyDeltas(sector: Sector, deltas: SectorDelta[]): Sector {
    // Clone sector to avoid mutation
    let updated = this.cloneSector(sector);

    // Sort deltas by version and apply in order
    const sorted = [...deltas].sort((a, b) => a.version - b.version);

    for (const delta of sorted) {
      updated = this.applySingleDelta(updated, delta);
    }

    return updated;
  }

  /**
   * Apply a single delta to sector
   */
  private applySingleDelta(sector: Sector, delta: SectorDelta): Sector {
    switch (delta.deltaType) {
      case 'resource_depleted':
        return this.applyResourceDepleted(sector, delta);

      case 'resource_respawned':
        return this.applyResourceRespawned(sector, delta);

      case 'station_damaged':
        return this.applyStationDamaged(sector, delta);

      case 'station_repaired':
        return this.applyStationRepaired(sector, delta);

      case 'station_destroyed':
        return this.applyStationDestroyed(sector, delta);

      case 'ownership_changed':
        return this.applyOwnershipChanged(sector, delta);

      case 'population_changed':
        return this.applyPopulationChanged(sector, delta);

      case 'threat_level_changed':
        return this.applyThreatLevelChanged(sector, delta);

      case 'npc_spawned':
        return this.applyNpcSpawned(sector, delta);

      case 'npc_destroyed':
        return this.applyNpcDestroyed(sector, delta);

      case 'anomaly_triggered':
        return this.applyAnomalyTriggered(sector, delta);

      case 'anomaly_reset':
        return this.applyAnomalyReset(sector, delta);

      case 'hazard_appeared':
        return this.applyHazardAppeared(sector, delta);

      case 'hazard_cleared':
        return this.applyHazardCleared(sector, delta);

      default:
        console.warn(`[StateSync] Unknown delta type: ${delta.deltaType}`);
        return sector;
    }
  }

  // Delta application methods

  private applyResourceDepleted(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.asteroidFields) return sector;

    const fields = sector.asteroidFields.map(field => {
      const resources = field.resources.map(resource => {
        if (resource.resourceId === delta.targetId) {
          return {
            ...resource,
            currentYield: delta.changes.currentYield ?? 0,
            isDepleted: true,
          };
        }
        return resource;
      });
      return { ...field, resources };
    });

    return { ...sector, asteroidFields: fields };
  }

  private applyResourceRespawned(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.asteroidFields) return sector;

    const fields = sector.asteroidFields.map(field => {
      const resources = field.resources.map(resource => {
        if (resource.resourceId === delta.targetId) {
          return {
            ...resource,
            currentYield: delta.changes.currentYield ?? resource.baseYield,
            isDepleted: false,
          };
        }
        return resource;
      });
      return { ...field, resources };
    });

    return { ...sector, asteroidFields: fields };
  }

  private applyStationDamaged(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.stations) return sector;

    const stations = sector.stations.map(station => {
      if (station.id === delta.targetId) {
        return {
          ...station,
          health: delta.changes.health ?? station.health,
          damageLevel: delta.changes.damageLevel ?? 'minor',
        };
      }
      return station;
    });

    return { ...sector, stations };
  }

  private applyStationRepaired(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.stations) return sector;

    const stations = sector.stations.map(station => {
      if (station.id === delta.targetId) {
        return {
          ...station,
          health: delta.changes.health ?? 100,
          damageLevel: undefined,
        };
      }
      return station;
    });

    return { ...sector, stations };
  }

  private applyStationDestroyed(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.stations) return sector;

    // Mark station as destroyed (don't remove - show debris)
    const stations = sector.stations.map(station => {
      if (station.id === delta.targetId) {
        return {
          ...station,
          isDestroyed: true,
          health: 0,
        };
      }
      return station;
    });

    return { ...sector, stations };
  }

  private applyOwnershipChanged(sector: Sector, delta: SectorDelta): Sector {
    if (delta.targetType === 'station' && delta.targetId && sector.stations) {
      const stations = sector.stations.map(station => {
        if (station.id === delta.targetId) {
          return {
            ...station,
            ownerFaction: delta.changes.newOwner,
            previousOwner: delta.changes.previousOwner,
          };
        }
        return station;
      });
      return { ...sector, stations };
    }

    // Sector-level ownership change
    return {
      ...sector,
      controllingFaction: delta.changes.newOwner,
    };
  }

  private applyPopulationChanged(sector: Sector, delta: SectorDelta): Sector {
    if (delta.targetId && sector.planets) {
      const planets = sector.planets.map(planet => {
        if (planet.id === delta.targetId) {
          return {
            ...planet,
            population: delta.changes.population ?? planet.population,
          };
        }
        return planet;
      });
      return { ...sector, planets };
    }

    return {
      ...sector,
      population: delta.changes.population,
    };
  }

  private applyThreatLevelChanged(sector: Sector, delta: SectorDelta): Sector {
    return {
      ...sector,
      threatLevel: delta.changes.threatLevel,
    };
  }

  private applyNpcSpawned(sector: Sector, delta: SectorDelta): Sector {
    // NPCs are handled by separate NPC system, just track in deltas
    return sector;
  }

  private applyNpcDestroyed(sector: Sector, delta: SectorDelta): Sector {
    // NPCs are handled by separate NPC system, just track in deltas
    return sector;
  }

  private applyAnomalyTriggered(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.anomalies) return sector;

    const anomalies = sector.anomalies.map(anomaly => {
      if (anomaly.id === delta.targetId) {
        return {
          ...anomaly,
          isActive: false,
          lastTriggered: delta.appliedAt,
          triggeredBy: delta.causedByPlayerId,
        };
      }
      return anomaly;
    });

    return { ...sector, anomalies };
  }

  private applyAnomalyReset(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.anomalies) return sector;

    const anomalies = sector.anomalies.map(anomaly => {
      if (anomaly.id === delta.targetId) {
        return {
          ...anomaly,
          isActive: true,
          lastTriggered: undefined,
          triggeredBy: undefined,
        };
      }
      return anomaly;
    });

    return { ...sector, anomalies };
  }

  private applyHazardAppeared(sector: Sector, delta: SectorDelta): Sector {
    // New hazard - add to hazards array
    if (!sector.hazards) {
      return sector;
    }

    const newHazard = {
      id: delta.targetId ?? `hazard_${Date.now()}`,
      type: delta.changes.hazardType,
      position: delta.changes.position,
      radius: delta.changes.radius,
      severity: delta.changes.severity,
    };

    return {
      ...sector,
      hazards: [...sector.hazards, newHazard],
    };
  }

  private applyHazardCleared(sector: Sector, delta: SectorDelta): Sector {
    if (!delta.targetId || !sector.hazards) return sector;

    const hazards = sector.hazards.filter(h => h.id !== delta.targetId);
    return { ...sector, hazards };
  }

  /**
   * Deep clone a sector
   */
  private cloneSector(sector: Sector): Sector {
    return JSON.parse(JSON.stringify(sector));
  }

  /**
   * Convert server delta format to client format
   */
  private convertServerDelta = (server: ServerDelta): SectorDelta => {
    return {
      id: server.id,
      sectorId: server.sector_id,
      deltaType: server.delta_type,
      targetId: server.target_id ?? undefined,
      targetType: server.target_type ?? undefined,
      changes: server.changes,
      appliedAt: server.applied_at,
      version: server.version,
      causedByPlayerId: server.caused_by_player_id ?? undefined,
      causedByEvent: server.caused_by_event ?? undefined,
    };
  };
}

// Export singleton instance
export const stateSync = new StateSync();
