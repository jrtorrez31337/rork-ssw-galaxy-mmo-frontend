# Respawn System

## Overview

The respawn system handles ship destruction and player recovery. When a ship is destroyed, the player is moved to a respawn location based on their faction and death location.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/respawn/location` | Get respawn location |
| POST | `/respawn/execute` | Execute respawn |
| GET | `/stations/nearest` | Get nearest stations |

## Data Types

### RespawnLocation
```typescript
interface RespawnLocation {
  sector: string;
  station_id: string | null;
  station_name: string | null;
  respawn_type: 'faction_station' | 'home_sector';
  distance_from_death: number;
}
```

### RespawnResult
```typescript
interface RespawnResult {
  ship_id: string;
  respawn_sector: string;
  station_id: string | null;
  hull_percent: number;
  shield_percent: number;
  fuel_percent: number;
}
```

### NearestStation
```typescript
interface NearestStation {
  station_id: string;
  station_name: string;
  sector: string;
  distance: number;
  faction_id: string;
  faction_name: string;
}
```

## Respawn Types

| Type | Description |
|------|-------------|
| faction_station | Nearest faction-controlled station |
| home_sector | Player's designated home sector |

## Source Files

| File | Purpose |
|------|---------|
| `api/respawn.ts` | API client methods |
| `stores/respawnStore.ts` | Respawn state |
| `components/respawn/` | Respawn UI components |

## Respawn Flow

1. **Ship Destroyed**
   - Combat ends in defeat
   - Ship hull reaches 0

2. **Respawn Location Calculated**
   - Based on faction
   - Nearest friendly station
   - Or home sector fallback

3. **Respawn UI**
   - Show respawn location
   - Confirm respawn button

4. **Execute Respawn**
   - Ship moved to location
   - Stats reset (partial)
   - Player resumes play

## Stat Reset

On respawn, ship stats are partially restored:

| Stat | Reset Value |
|------|-------------|
| Hull | 25% |
| Shields | 25% |
| Fuel | 50% |

## Nearest Stations

The API can find nearest stations:

- Filter by faction
- Limit number of results
- Calculate distances

## Respawn Store

```typescript
interface RespawnState {
  isDestroyed: boolean;
  respawnLocation: RespawnLocation | null;
  isLoading: boolean;
  error: string | null;
}
```

## Components

- Respawn overlay when destroyed
- Location display
- Confirm button
- Loading state

## Integration Points

- **Combat**: Triggers on defeat
- **Factions**: Respawn at faction stations
- **Ship Systems**: Stats reset on respawn
- **Navigation**: Moved to new sector
