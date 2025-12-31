# Sector & World Simulation

## Overview

The sector system represents the game world as a procedurally-generated galaxy. Each sector contains entities like ships, stations, asteroids, and anomalies that update in real-time.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/entities/ships` | Get ships in sector |
| GET | `/entities/stations` | Get stations in sector |
| GET | `/entities` | Get all entities |
| GET | `/npcs/sector` | Get NPCs in sector |

## Data Types

### Sector Entity
```typescript
interface SectorEntity {
  id: string;
  type: 'ship' | 'station' | 'asteroid' | 'anomaly';
  position: Vector3;
  sector_id: string;
  faction_id?: string;
  name?: string;
}
```

### NPC
```typescript
interface NPC {
  id: string;
  name: string;
  ship_type: string;
  faction_id: string;
  behavior: 'patrol' | 'trade' | 'guard' | 'hostile';
  threat_rating: number;
  position: Vector3;
  sector_id: string;
}
```

### Sector Metadata
```typescript
interface SectorMetadata {
  sector_id: string;
  coordinates: [number, number, number];
  name: string;
  type: 'core' | 'frontier' | 'deep_space';
  hazard_level: number;
  controlling_faction: string | null;
  markers: SectorMarker[];
}
```

## Source Files

| File | Purpose |
|------|---------|
| `api/sectorEntities.ts` | Entity API client |
| `api/npc.ts` | NPC API client |
| `stores/procgenStore.ts` | Procgen state |
| `hooks/useProcgenEvents.ts` | SSE event handlers |
| `components/sector/SectorView.tsx` | Sector visualization |
| `components/hud/GalaxyMap.tsx` | Galaxy map |

## Procedural Generation

Sectors are procedurally generated based on coordinates:

- **Deterministic**: Same coordinates always produce same sector
- **Markers**: Anomalies, hazards, resources placed procedurally
- **Density**: Varies by region type

### Sector Types

| Type | Characteristics |
|------|-----------------|
| Core | High traffic, stations, safe |
| Frontier | Mixed traffic, moderate danger |
| Deep Space | Low traffic, high danger, rare resources |

## Real-Time Events

Sector events received via SSE:

| Event | Description |
|-------|-------------|
| `entity_spawn` | New entity appeared |
| `entity_move` | Entity changed position |
| `entity_despawn` | Entity removed |
| `sector_update` | Sector state changed |

## Components

### SectorView
- 2D/3D sector visualization
- Entity rendering
- Position updates

### GalaxyMap
- Star map overview
- Sector navigation
- Faction territories

### ProcgenMarkers
- Anomaly indicators
- Hazard warnings
- Resource deposits

## NPC System

NPCs populate sectors with various behaviors:

| Behavior | Description |
|----------|-------------|
| Patrol | Moves around sector |
| Trade | Travels between stations |
| Guard | Protects stations/areas |
| Hostile | Attacks players |

## Integration Points

- **Navigation**: Travel between sectors
- **Combat**: NPCs can be combat targets
- **Mining**: Resource nodes in sectors
- **Factions**: Sector control by factions
- **Scanning**: Detect sector entities
