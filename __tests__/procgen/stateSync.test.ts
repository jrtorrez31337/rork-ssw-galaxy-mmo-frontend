/**
 * StateSync Unit Tests
 *
 * Tests for delta application logic to ensure:
 * - Deltas are correctly applied to sectors
 * - All delta types are handled properly
 * - State transitions are correct
 * - Version ordering is maintained
 */

import { stateSync } from '../../lib/procgen/stateSync';
import { generateSector } from '../../lib/procgen/generator';
import type {
  Sector,
  SectorDelta,
  DeltaType,
  Station,
  Anomaly,
  AsteroidField,
  NavigationHazard,
} from '../../lib/procgen/types';

// Helper to create a mock delta
function createDelta(
  sectorId: string,
  deltaType: DeltaType,
  changes: Record<string, any>,
  version: number,
  targetId?: string,
  targetType?: string
): SectorDelta {
  return {
    id: `delta-${version}`,
    sectorId,
    deltaType,
    targetId,
    targetType,
    changes,
    appliedAt: new Date().toISOString(),
    version,
  };
}

// Helper to create a sector with a station
function createSectorWithStation(): Sector {
  const sector = generateSector({ x: 100, y: 100, z: 100 });

  // Ensure sector has a station for testing
  if (sector.stations.length === 0) {
    const mockStation: Station = {
      id: 'station-1',
      name: 'Test Station',
      type: 'trade',
      size: 3,
      services: ['refuel', 'repair', 'market'],
      owner: 'federation',
      positionX: 100,
      positionY: 200,
      positionZ: 50,
      modelVariant: 1,
      rotationSpeed: 0.01,
      rotationAxis: [0, 1, 0],
      lightColor: '#FFFFFF',
      dockingBayCount: 4,
      antennaCount: 2,
    };
    sector.stations = [mockStation];
  }

  return sector;
}

// Helper to create a sector with an asteroid field
function createSectorWithAsteroids(): Sector {
  const sector = generateSector({ x: 200, y: 200, z: 200 });

  if (sector.asteroidFields.length === 0) {
    const mockField: AsteroidField = {
      id: 'field-1',
      density: 0.7,
      richness: 0.8,
      resourceTypes: ['ore', 'rare_metals'],
      resources: [
        {
          resourceId: 'res-1',
          resourceType: 'ore',
          baseYield: 100,
          currentYield: 100,
          quality: 0.8,
          isDepleted: false,
          positionX: 50,
          positionY: 50,
          positionZ: 50,
        },
        {
          resourceId: 'res-2',
          resourceType: 'rare_metals',
          baseYield: 50,
          currentYield: 50,
          quality: 0.9,
          isDepleted: false,
          positionX: 100,
          positionY: 100,
          positionZ: 100,
        },
      ],
      centerX: 0,
      centerY: 0,
      centerZ: 0,
      radiusX: 500,
      radiusY: 500,
      radiusZ: 500,
      asteroidCount: 200,
      asteroidSeed: 12345,
      dominantColor: '#808080',
      secondaryColor: '#606060',
      sizeVariation: 0.5,
    };
    sector.asteroidFields = [mockField];
  }

  return sector;
}

// Helper to create a sector with an anomaly
function createSectorWithAnomaly(): Sector {
  const sector = generateSector({ x: 300, y: 300, z: 300 });

  if (sector.anomalies.length === 0) {
    const mockAnomaly: Anomaly = {
      id: 'anomaly-1',
      type: 'wormhole',
      danger: 0.5,
      reward: 0.8,
      positionX: 100,
      positionY: 100,
      positionZ: 100,
      radius: 50,
      particleColor: '#FF00FF',
      secondaryColor: '#00FFFF',
      pulseFrequency: 0.5,
      intensity: 0.7,
      distortionStrength: 0.3,
      isActive: true,
    };
    sector.anomalies = [mockAnomaly];
  }

  return sector;
}

describe('stateSync.applyDeltas', () => {
  describe('resource deltas', () => {
    it('should apply resource_depleted delta', () => {
      const sector = createSectorWithAsteroids();
      const resourceId = sector.asteroidFields[0].resources[0].resourceId;

      const delta = createDelta(
        sector.id,
        'resource_depleted',
        { currentYield: 0 },
        1,
        resourceId,
        'resource'
      );

      const updated = stateSync.applyDeltas(sector, [delta]);
      const resource = updated.asteroidFields[0].resources.find(
        r => r.resourceId === resourceId
      );

      expect(resource?.currentYield).toBe(0);
      expect(resource?.isDepleted).toBe(true);
    });

    it('should apply resource_respawned delta', () => {
      const sector = createSectorWithAsteroids();
      const resourceId = sector.asteroidFields[0].resources[0].resourceId;
      const baseYield = sector.asteroidFields[0].resources[0].baseYield;

      // First deplete, then respawn
      const depleteDelta = createDelta(
        sector.id,
        'resource_depleted',
        { currentYield: 0 },
        1,
        resourceId,
        'resource'
      );

      const respawnDelta = createDelta(
        sector.id,
        'resource_respawned',
        { currentYield: baseYield },
        2,
        resourceId,
        'resource'
      );

      const updated = stateSync.applyDeltas(sector, [depleteDelta, respawnDelta]);
      const resource = updated.asteroidFields[0].resources.find(
        r => r.resourceId === resourceId
      );

      expect(resource?.currentYield).toBe(baseYield);
      expect(resource?.isDepleted).toBe(false);
    });
  });

  describe('station deltas', () => {
    it('should apply station_damaged delta', () => {
      const sector = createSectorWithStation();
      const stationId = sector.stations[0].id;

      const delta = createDelta(
        sector.id,
        'station_damaged',
        { health: 50, damageLevel: 'moderate' },
        1,
        stationId,
        'station'
      );

      const updated = stateSync.applyDeltas(sector, [delta]);
      const station = updated.stations.find(s => s.id === stationId);

      expect(station?.health).toBe(50);
      expect(station?.damageLevel).toBe('moderate');
    });

    it('should apply station_repaired delta', () => {
      const sector = createSectorWithStation();
      const stationId = sector.stations[0].id;

      // First damage, then repair
      const damageDelta = createDelta(
        sector.id,
        'station_damaged',
        { health: 30, damageLevel: 'severe' },
        1,
        stationId,
        'station'
      );

      const repairDelta = createDelta(
        sector.id,
        'station_repaired',
        { health: 100 },
        2,
        stationId,
        'station'
      );

      const updated = stateSync.applyDeltas(sector, [damageDelta, repairDelta]);
      const station = updated.stations.find(s => s.id === stationId);

      expect(station?.health).toBe(100);
      expect(station?.damageLevel).toBeUndefined();
    });

    it('should apply station_destroyed delta', () => {
      const sector = createSectorWithStation();
      const stationId = sector.stations[0].id;

      const delta = createDelta(
        sector.id,
        'station_destroyed',
        {},
        1,
        stationId,
        'station'
      );

      const updated = stateSync.applyDeltas(sector, [delta]);
      const station = updated.stations.find(s => s.id === stationId);

      expect(station?.isDestroyed).toBe(true);
      expect(station?.health).toBe(0);
    });
  });

  describe('ownership deltas', () => {
    it('should apply ownership_changed delta for station', () => {
      const sector = createSectorWithStation();
      const stationId = sector.stations[0].id;

      const delta = createDelta(
        sector.id,
        'ownership_changed',
        { newOwner: 'pirates', previousOwner: 'federation' },
        1,
        stationId,
        'station'
      );

      const updated = stateSync.applyDeltas(sector, [delta]);
      const station = updated.stations.find(s => s.id === stationId);

      expect(station?.ownerFaction).toBe('pirates');
      expect(station?.previousOwner).toBe('federation');
    });

    it('should apply ownership_changed delta for sector', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });

      const delta = createDelta(
        sector.id,
        'ownership_changed',
        { newOwner: 'empire' },
        1
      );

      const updated = stateSync.applyDeltas(sector, [delta]);

      expect(updated.controllingFaction).toBe('empire');
    });
  });

  describe('population deltas', () => {
    it('should apply population_changed delta for sector', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });

      const delta = createDelta(
        sector.id,
        'population_changed',
        { population: 1000000 },
        1
      );

      const updated = stateSync.applyDeltas(sector, [delta]);

      expect(updated.population).toBe(1000000);
    });
  });

  describe('threat level deltas', () => {
    it('should apply threat_level_changed delta', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });

      const delta = createDelta(
        sector.id,
        'threat_level_changed',
        { threatLevel: 8 },
        1
      );

      const updated = stateSync.applyDeltas(sector, [delta]);

      expect(updated.threatLevel).toBe(8);
    });
  });

  describe('anomaly deltas', () => {
    it('should apply anomaly_triggered delta', () => {
      const sector = createSectorWithAnomaly();
      const anomalyId = sector.anomalies[0].id;

      const delta = createDelta(
        sector.id,
        'anomaly_triggered',
        {},
        1,
        anomalyId,
        'anomaly'
      );
      delta.causedByPlayerId = 'player-123';

      const updated = stateSync.applyDeltas(sector, [delta]);
      const anomaly = updated.anomalies.find(a => a.id === anomalyId);

      expect(anomaly?.isActive).toBe(false);
      expect(anomaly?.triggeredBy).toBe('player-123');
      expect(anomaly?.lastTriggered).toBeDefined();
    });

    it('should apply anomaly_reset delta', () => {
      const sector = createSectorWithAnomaly();
      const anomalyId = sector.anomalies[0].id;

      // First trigger, then reset
      const triggerDelta = createDelta(
        sector.id,
        'anomaly_triggered',
        {},
        1,
        anomalyId,
        'anomaly'
      );

      const resetDelta = createDelta(
        sector.id,
        'anomaly_reset',
        {},
        2,
        anomalyId,
        'anomaly'
      );

      const updated = stateSync.applyDeltas(sector, [triggerDelta, resetDelta]);
      const anomaly = updated.anomalies.find(a => a.id === anomalyId);

      expect(anomaly?.isActive).toBe(true);
      expect(anomaly?.triggeredBy).toBeUndefined();
      expect(anomaly?.lastTriggered).toBeUndefined();
    });
  });

  describe('hazard deltas', () => {
    it('should apply hazard_appeared delta', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });
      const initialHazardCount = sector.hazards.length;

      const delta = createDelta(
        sector.id,
        'hazard_appeared',
        {
          hazardType: 'radiation',
          position: { x: 100, y: 100, z: 100 },
          radius: 50,
          severity: 0.7,
        },
        1,
        'new-hazard-1',
        'hazard'
      );

      const updated = stateSync.applyDeltas(sector, [delta]);

      expect(updated.hazards.length).toBe(initialHazardCount + 1);
    });

    it('should apply hazard_cleared delta', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });

      // First add a hazard
      const hazard: NavigationHazard = {
        id: 'hazard-to-clear',
        type: 'debris_field',
        positionX: 50,
        positionY: 50,
        positionZ: 50,
        radius: 30,
        severity: 0.5,
        damagePerSecond: 10,
        visualIntensity: 0.6,
        warningColor: '#FF0000',
        particleCount: 100,
      };
      sector.hazards = [...sector.hazards, hazard];

      const delta = createDelta(
        sector.id,
        'hazard_cleared',
        {},
        1,
        'hazard-to-clear',
        'hazard'
      );

      const updated = stateSync.applyDeltas(sector, [delta]);
      const clearedHazard = updated.hazards.find(h => h.id === 'hazard-to-clear');

      expect(clearedHazard).toBeUndefined();
    });
  });

  describe('delta ordering', () => {
    it('should apply deltas in version order', () => {
      const sector = createSectorWithStation();
      const stationId = sector.stations[0].id;

      // Create deltas out of order
      const delta3 = createDelta(
        sector.id,
        'station_repaired',
        { health: 100 },
        3,
        stationId,
        'station'
      );

      const delta1 = createDelta(
        sector.id,
        'station_damaged',
        { health: 50, damageLevel: 'moderate' },
        1,
        stationId,
        'station'
      );

      const delta2 = createDelta(
        sector.id,
        'station_damaged',
        { health: 20, damageLevel: 'severe' },
        2,
        stationId,
        'station'
      );

      // Apply in wrong order - should still result in correct final state
      const updated = stateSync.applyDeltas(sector, [delta3, delta1, delta2]);
      const station = updated.stations.find(s => s.id === stationId);

      // Final state should be repaired (version 3)
      expect(station?.health).toBe(100);
    });

    it('should handle multiple deltas to same target', () => {
      const sector = createSectorWithAsteroids();
      const resourceId = sector.asteroidFields[0].resources[0].resourceId;

      // Multiple extractions
      const deltas = [
        createDelta(sector.id, 'resource_depleted', { currentYield: 80 }, 1, resourceId, 'resource'),
        createDelta(sector.id, 'resource_depleted', { currentYield: 50 }, 2, resourceId, 'resource'),
        createDelta(sector.id, 'resource_depleted', { currentYield: 20 }, 3, resourceId, 'resource'),
        createDelta(sector.id, 'resource_depleted', { currentYield: 0 }, 4, resourceId, 'resource'),
      ];

      const updated = stateSync.applyDeltas(sector, deltas);
      const resource = updated.asteroidFields[0].resources.find(
        r => r.resourceId === resourceId
      );

      expect(resource?.currentYield).toBe(0);
      expect(resource?.isDepleted).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should not mutate original sector', () => {
      const sector = createSectorWithStation();
      const originalJson = JSON.stringify(sector);
      const stationId = sector.stations[0].id;

      const delta = createDelta(
        sector.id,
        'station_damaged',
        { health: 50 },
        1,
        stationId,
        'station'
      );

      stateSync.applyDeltas(sector, [delta]);

      // Original should be unchanged
      expect(JSON.stringify(sector)).toBe(originalJson);
    });

    it('should return new sector object', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });

      const delta = createDelta(
        sector.id,
        'threat_level_changed',
        { threatLevel: 5 },
        1
      );

      const updated = stateSync.applyDeltas(sector, [delta]);

      expect(updated).not.toBe(sector);
    });
  });

  describe('empty/invalid deltas', () => {
    it('should return sector unchanged for empty delta array', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });
      const original = JSON.stringify(sector);

      const updated = stateSync.applyDeltas(sector, []);

      expect(JSON.stringify(updated)).toBe(original);
    });

    it('should handle unknown delta types gracefully', () => {
      const sector = generateSector({ x: 0, y: 0, z: 0 });

      const delta = createDelta(
        sector.id,
        'unknown_type' as DeltaType,
        { foo: 'bar' },
        1
      );

      // Should not throw
      expect(() => stateSync.applyDeltas(sector, [delta])).not.toThrow();
    });

    it('should handle missing target gracefully', () => {
      const sector = createSectorWithStation();

      const delta = createDelta(
        sector.id,
        'station_damaged',
        { health: 50 },
        1,
        'nonexistent-station',
        'station'
      );

      // Should not throw
      expect(() => stateSync.applyDeltas(sector, [delta])).not.toThrow();
    });
  });
});

describe('stateSync.applyRealtimeDelta', () => {
  it('should apply single delta and return updated sector', () => {
    const sector = createSectorWithStation();
    const stationId = sector.stations[0].id;

    const delta = createDelta(
      sector.id,
      'station_damaged',
      { health: 75, damageLevel: 'minor' },
      1,
      stationId,
      'station'
    );

    const updated = stateSync.applyRealtimeDelta(sector, delta);
    const station = updated.stations.find(s => s.id === stationId);

    expect(station?.health).toBe(75);
    expect(station?.damageLevel).toBe('minor');
  });
});
