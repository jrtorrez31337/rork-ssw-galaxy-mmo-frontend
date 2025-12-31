# Ship Management

## Overview

The ship management system handles ship creation, customization, visualization, and operational status. Ships are the player's primary vehicle for navigation, combat, and commerce.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ships` | Create new ship |
| GET | `/ships/{id}` | Get ship by ID |
| GET | `/ships/by-owner/{ownerId}` | Get all ships for owner |
| PATCH | `/ships/{id}` | Update ship name |

## Data Types

### CreateShipRequest
```typescript
interface CreateShipRequest {
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  stat_allocation: ShipStats;
}
```

### ShipType
```typescript
type ShipType = 'scout' | 'fighter' | 'trader' | 'explorer';
```

### ShipStats
```typescript
interface ShipStats {
  hull_strength: number;
  shield_capacity: number;
  speed: number;
  cargo_space: number;
  sensors: number;
}
```

### Ship
```typescript
interface Ship {
  id: string;
  owner_id: string;
  ship_type: ShipType;
  name: string;
  hull_points: number;
  hull_max: number;
  shield_points: number;
  shield_max: number;
  cargo_capacity: number;
  location_sector: string;
  // ... additional fields
}
```

## Source Files

| File | Purpose |
|------|---------|
| `api/ships.ts` | API client methods |
| `app/ship-customize.tsx` | Ship customization screen |
| `stores/shipSystemsStore.ts` | Ship systems state |
| `components/ShipPreview3D.tsx` | 3D ship visualization |
| `components/flight/ShipVisualization3DNew.tsx` | Flight mode 3D visualization |
| `ui/components/ShipCard.tsx` | Ship status card |

## Ship Types

| Type | Geometry | Color | Characteristics |
|------|----------|-------|-----------------|
| Scout | Dodecahedron | Cyan | Fast, stealthy, high sensors |
| Fighter | Octahedron | Red | Combat-focused, agile, high damage |
| Trader | Box | Amber | High cargo, durable hull |
| Explorer | Cone | Purple | Balanced, long-range capable |

## Ship Systems Store

The `useShipSystemsStore` manages operational state:

### Vitals
```typescript
interface Vitals {
  hull: { current, max, percentage, isCritical, isDamaged };
  shields: { current, max, percentage, isDown, isRecharging };
  fuel: { current, max, percentage, isCritical, isLow };
}
```

### Systems
- **Weapons**: Offensive capability
- **Shields**: Defensive systems
- **Engines**: Propulsion
- **Sensors**: Detection and scanning
- **Reactor**: Power generation

### Power Distribution
```typescript
interface PowerDistribution {
  weapons: number;  // 0-100
  shields: number;  // 0-100
  engines: number;  // 0-100
  systems: number;  // 0-100
}
```

### Repair Queue
Ships can queue repairs for damaged systems with progress tracking.

## 3D Visualization

Ships are rendered using React Three Fiber:

- **Geometric primitives** per ship type
- **PBR materials** with metallic finish
- **Emissive glow** for accent lighting
- **Auto-rotation** in preview mode
- **Flight-responsive** rotation in flight mode

## Components

### ShipPreview3D
- Used in ship creation/customization
- Static preview with auto-rotation
- Starfield background

### ShipVisualization3DNew
- Used in flight mode
- Responds to pitch/roll/yaw from flightStore
- Engine glow based on throttle
- Parallax starfield

### ShipCard
- Displays ship summary
- Hull/shield/fuel bars
- Location and docking status

## Integration Points

- **Flight System**: Ships have handling profiles
- **Combat System**: Ship stats affect combat
- **Trading System**: Cargo capacity limits trades
- **Navigation**: Ships travel between sectors
- **Station Services**: Refuel/repair at stations
