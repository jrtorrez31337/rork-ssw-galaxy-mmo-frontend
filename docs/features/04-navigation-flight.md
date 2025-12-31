# Navigation & Flight

## Overview

The navigation system handles all ship movement: hyperspace jumps between sectors, sublight movement within sectors, station docking, and arcade-style flight controls.

## Movement Types

### Hyperspace Travel
Long-distance travel between sectors using jump drive.

### Sublight Movement
In-sector movement at impulse speeds with client-predicted positions.

### Station Docking
Range-based docking/undocking at stations.

### Arcade Flight
Cinematic flight model with attitude controls.

---

## Hyperspace Travel

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/actions/travel` | Start travel to target sector |
| GET | `/v1/travel/{id}` | Get travel status |
| GET | `/v1/ships/{id}/travel` | Get active travel for ship |
| POST | `/v1/travel/{id}/cancel` | Cancel travel (80% fuel refund) |

### Travel Phases
1. **Calculating** - Computing route
2. **Spooling** - Jump drive charging
3. **Transit** - In hyperspace
4. **Cooldown** - Drive recovering after exit

### Error Codes
- `SHIP_DOCKED` - Must undock first
- `SHIP_IN_COMBAT` - Cannot travel in combat
- `ALREADY_IN_TRANSIT` - Cancel current travel first
- `JUMP_ON_COOLDOWN` - Drive recharging
- `INSUFFICIENT_FUEL` - Need more fuel

---

## Sublight Movement

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/actions/move` | Submit position update |
| GET | `/ships/{id}/position` | Get authoritative position |

### Position Update Request
```typescript
interface PositionUpdateRequest {
  ship_id: string;
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  timestamp: number;
}
```

### Server Reconciliation
- Client sends position updates every 200ms
- Server validates against ship capabilities
- Server returns authoritative position
- Client interpolates toward server position if correction needed

---

## Flight Control System

### Flight Store

The `useFlightStore` manages cinematic flight state:

```typescript
interface FlightState {
  profile: FlightHandlingProfile;
  throttle: ThrottleState;
  attitude: AttitudeState;
  axisCouplingEnabled: boolean;
  controlsLocked: boolean;
  controlsLockReason: string | null;
}
```

### Throttle
```typescript
interface ThrottleState {
  target: number;   // 0-1, what player is requesting
  current: number;  // 0-1, smoothly interpolated
  speed: number;    // Current speed in m/s
}
```

### Attitude (3-Axis)
```typescript
interface AttitudeState {
  pitch: AxisInput;  // Nose up/down
  roll: AxisInput;   // Bank left/right
  yaw: AxisInput;    // Turn left/right
}

interface AxisInput {
  raw: number;      // -1 to 1, direct input
  smoothed: number; // -1 to 1, after inertia
}
```

### Handling Profiles

Different ship types have different flight characteristics:

| Ship Type | Max Speed | Acceleration | Pitch/Roll/Yaw | Response |
|-----------|-----------|--------------|----------------|----------|
| Scout | 150 | 0.8 | 60/90/45 | 0.25 |
| Fighter | 120 | 0.7 | 75/100/50 | 0.30 |
| Trader | 80 | 0.3 | 30/40/20 | 0.10 |
| Explorer | 100 | 0.5 | 45/60/30 | 0.15 |

### Axis Coupling
Optional mode that couples roll input to yaw for more intuitive flight.

### Control Locking
Controls can be locked during:
- Hyperspace transit
- Docking sequences
- Combat events
- Cutscenes

---

## Position Management

### Position Store

The `usePositionStore` tracks ship position:

```typescript
interface PositionState {
  serverPosition: Vector3;
  clientPosition: Vector3;
  velocity: Vector3;
  heading: number;
  pitch: number;
  roll: number;
  sectorId: string;
  lastServerUpdate: number;
}
```

### Sync Behavior
- Position synced every 200ms
- Client prediction for smooth visuals
- Server reconciliation on deviations > threshold

---

## Travel State Management

### Travel State Store

The `useTravelStateStore` tracks navigation mode:

```typescript
interface TravelState {
  mode: 'idle' | 'sublight' | 'hyperspace';
  hyperspacePhase: HyperspacePhase | null;
  sublightSpeed: SublightSpeedState;
  destination: string | null;
  route: string[];
  fuelSufficient: boolean;
  gravityWellClear: boolean;
}
```

---

## Source Files

| File | Purpose |
|------|---------|
| `api/travel.ts` | Hyperspace travel API |
| `api/sublight.ts` | In-sector movement API |
| `api/movement.ts` | Docking/undocking API |
| `stores/flightStore.ts` | Flight controls state |
| `stores/positionStore.ts` | Position tracking |
| `stores/travelStateStore.ts` | Travel mode state |
| `hooks/usePositionSync.ts` | Position sync logic |
| `components/panels/NavigationPanel.tsx` | Navigation UI |
| `components/viewport/FlightViewport.tsx` | Flight controls UI |

## Components

### NavigationPanel
- Sector selection for jumps
- Travel status display
- Jump cooldown timer

### FlightViewport
- Throttle slider
- Attitude joystick
- Yaw pedals
- Flight HUD overlay

### TravelProgressBar
- Visual progress during hyperspace

---

## Integration Points

- **Ship Systems**: Fuel consumption, engine damage affects speed
- **Combat**: Cannot travel during combat
- **Stations**: Must undock before moving
- **Sectors**: Travel moves between sectors
