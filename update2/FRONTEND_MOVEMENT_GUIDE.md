# Frontend Implementation Guide: Movement & Docking System

**Feature**: Movement Validation System (Feature 2)
**Target Repo**: `ssw-fe-genspark`
**Backend Status**: ✅ Complete (merged to main)
**Estimated Effort**: 8-12 hours

---

## Table of Contents

1. [Overview](#overview)
2. [API Integration](#api-integration)
3. [TypeScript Types](#typescript-types)
4. [Component Specifications](#component-specifications)
5. [State Management](#state-management)
6. [SSE Event Handling](#sse-event-handling)
7. [UI/UX Guidelines](#uiux-guidelines)
8. [Implementation Checklist](#implementation-checklist)

---

## Overview

The Movement & Docking System enables players to:
- **Jump** between sectors using their ship's jump drive
- **Dock** at space stations for refueling, repairs, and trading
- **Undock** from stations to return to free flight
- Monitor **fuel consumption** and manage resources
- View **stations** in their current sector

### Key Mechanics

| Mechanic | Details |
|----------|---------|
| **Jump Cooldown** | 10 seconds between jumps (enforced server-side) |
| **Fuel Cost** | `distance × (1.0 / ship_speed) × sector_modifier` |
| **Docking Range** | 5000 units maximum distance |
| **Station Capacity** | Limited docking slots per station |
| **Combat Restriction** | No jumping/docking while in combat |

---

## API Integration

### Base URL

```typescript
const API_BASE = 'http://192.168.122.76:8080/v1';
```

### API Client Functions

Add these to `src/lib/api.ts` or your API client module:

```typescript
import { apiClient } from './apiClient';

// ==================== MOVEMENT ENDPOINTS ====================

/**
 * Execute a hyperspace jump to a target sector
 */
export async function jumpToSector(shipId: string, targetSector: string) {
  const response = await apiClient.post('/actions/jump', {
    ship_id: shipId,
    target_sector: targetSector,
  });
  return response.data;
}

/**
 * Dock at a space station
 */
export async function dockAtStation(shipId: string, stationId: string) {
  const response = await apiClient.post('/actions/dock', {
    ship_id: shipId,
    station_id: stationId,
  });
  return response.data;
}

/**
 * Undock from current station
 */
export async function undockFromStation(shipId: string) {
  const response = await apiClient.post('/actions/undock', {
    ship_id: shipId,
  });
  return response.data;
}

/**
 * Get list of stations in a sector
 */
export async function getStationsInSector(sector: string) {
  const response = await apiClient.get(`/stations?sector=${sector}`);
  return response.data;
}
```

### Error Handling

All movement endpoints may return these error codes:

```typescript
type MovementErrorCode =
  | 'INSUFFICIENT_FUEL'       // Not enough fuel for jump
  | 'SHIP_DOCKED'             // Ship must undock before jumping
  | 'SHIP_IN_COMBAT'          // Cannot move during combat
  | 'JUMP_ON_COOLDOWN'        // Jump drive recharging (10s)
  | 'INVALID_SECTOR'          // Invalid sector format
  | 'STATION_NOT_FOUND'       // Station doesn't exist
  | 'NOT_IN_RANGE'            // Ship too far from station (>5000 units)
  | 'STATION_FULL'            // No available docking slots
  | 'SHIP_NOT_DOCKED'         // Ship not currently docked
  | 'SHIP_NOT_FOUND'          // Ship doesn't exist
  | 'VALIDATION_ERROR';       // Invalid request parameters

interface ApiError {
  error: {
    code: MovementErrorCode;
    message: string;
  };
}
```

### Error Handler Helper

```typescript
export function handleMovementError(error: ApiError): string {
  const code = error.error?.code;

  switch (code) {
    case 'INSUFFICIENT_FUEL':
      return 'Not enough fuel for this jump. Find a station to refuel.';
    case 'SHIP_DOCKED':
      return 'You must undock from the station before jumping.';
    case 'SHIP_IN_COMBAT':
      return 'Cannot jump or dock while in combat!';
    case 'JUMP_ON_COOLDOWN':
      return 'Jump drive is recharging. Wait 10 seconds.';
    case 'INVALID_SECTOR':
      return 'Invalid sector coordinates. Use format: x.y.z';
    case 'STATION_NOT_FOUND':
      return 'Station not found in this sector.';
    case 'NOT_IN_RANGE':
      return 'Too far from station. Must be within 5000 units.';
    case 'STATION_FULL':
      return 'Station is at maximum capacity. Try another station.';
    case 'SHIP_NOT_DOCKED':
      return 'Ship is not currently docked at a station.';
    case 'SHIP_NOT_FOUND':
      return 'Ship not found.';
    default:
      return error.error?.message || 'An error occurred';
  }
}
```

---

## TypeScript Types

Add these type definitions to `src/types/movement.ts`:

```typescript
// ==================== CORE TYPES ====================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type StationType = 'trade' | 'military' | 'research' | 'mining';
export type StationService = 'market' | 'refuel' | 'repair' | 'missions';

export interface Station {
  id: string;
  name: string;
  location_sector: string;
  station_type: StationType;
  position: Vector3;
  faction_id?: string;
  services: StationService[];
  docking_capacity: number;
  docked_ships_count: number;
  created_at: string;
}

export interface Ship {
  id: string;
  owner_id: string;
  ship_type: string;
  name: string;
  location_sector: string;
  position: Vector3;
  docked_at?: string;  // Station ID if docked
  last_jump_at?: string;  // ISO timestamp
  fuel_current: number;
  fuel_capacity: number;
  in_combat: boolean;
  created_at: string;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface JumpRequest {
  ship_id: string;
  target_sector: string;
}

export interface JumpResponse {
  success: boolean;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  fuel_consumed: number;
  fuel_remaining: number;
  position: [number, number, number];
  message?: string;
}

export interface DockRequest {
  ship_id: string;
  station_id: string;
}

export interface DockResponse {
  success: boolean;
  ship_id: string;
  station: Station;
  message?: string;
}

export interface UndockRequest {
  ship_id: string;
}

export interface UndockResponse {
  success: boolean;
  ship_id: string;
  message?: string;
}

// ==================== SSE EVENT TYPES ====================

export interface ShipJumpedEvent {
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  fuel_consumed: number;
  fuel_remaining: number;
  position: [number, number, number];
}

export interface ShipDockedEvent {
  ship_id: string;
  player_id: string;
  station_id: string;
  station_name: string;
  sector: string;
}

export interface ShipUndockedEvent {
  ship_id: string;
  player_id: string;
  station_id: string;
  station_name: string;
  sector: string;
}

// ==================== UI STATE TYPES ====================

export interface JumpDialogState {
  isOpen: boolean;
  targetSector: string;
  fuelCost: number | null;
  isCalculating: boolean;
  error: string | null;
}

export interface DockingDialogState {
  isOpen: boolean;
  stations: Station[];
  selectedStation: Station | null;
  isLoading: boolean;
  error: string | null;
}

export interface MovementState {
  isJumping: boolean;
  isDocking: boolean;
  isUndocking: boolean;
  jumpCooldownRemaining: number;  // seconds
  lastError: string | null;
}
```

---

## Component Specifications

### 1. FuelGauge Component

**Purpose**: Display ship's current fuel level with visual indicator

**Location**: `src/components/Ship/FuelGauge.tsx`

```typescript
interface FuelGaugeProps {
  current: number;
  capacity: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function FuelGauge({ current, capacity, size = 'medium', showLabel = true }: FuelGaugeProps) {
  const percentage = (current / capacity) * 100;

  // Color coding
  const getColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fuel-gauge">
      {showLabel && (
        <div className="text-sm font-medium mb-1">
          Fuel: {current.toFixed(1)}/{capacity.toFixed(1)}
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {percentage < 20 && (
        <div className="text-xs text-red-400 mt-1">⚠️ Low fuel warning</div>
      )}
    </div>
  );
}
```

**Usage**:
```tsx
<FuelGauge current={ship.fuel_current} capacity={ship.fuel_capacity} />
```

---

### 2. JumpDialog Component

**Purpose**: Allow player to input target sector and execute jump

**Location**: `src/components/Movement/JumpDialog.tsx`

```typescript
interface JumpDialogProps {
  ship: Ship;
  isOpen: boolean;
  onClose: () => void;
  onJump: (targetSector: string) => Promise<void>;
}

export function JumpDialog({ ship, isOpen, onClose, onJump }: JumpDialogProps) {
  const [targetSector, setTargetSector] = useState('');
  const [fuelCost, setFuelCost] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJumping, setIsJumping] = useState(false);

  // Calculate fuel cost when target sector changes
  useEffect(() => {
    if (!targetSector) {
      setFuelCost(null);
      return;
    }

    try {
      const cost = calculateFuelCost(
        ship.location_sector,
        targetSector,
        5.0, // ship speed (get from ship.stats in real implementation)
        'normal' // sector type (could fetch from API)
      );
      setFuelCost(cost);
      setError(null);
    } catch (err) {
      setError('Invalid sector format. Use x.y.z (e.g., 1.0.0)');
      setFuelCost(null);
    }
  }, [targetSector, ship.location_sector]);

  const handleJump = async () => {
    if (!fuelCost || fuelCost > ship.fuel_current) {
      setError('Insufficient fuel for this jump');
      return;
    }

    setIsJumping(true);
    try {
      await onJump(targetSector);
      onClose();
    } catch (err: any) {
      setError(handleMovementError(err.response?.data));
    } finally {
      setIsJumping(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Jump to Sector</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          {/* Current location */}
          <div>
            <label className="text-sm text-gray-400">Current Sector</label>
            <div className="text-lg font-mono">{ship.location_sector}</div>
          </div>

          {/* Target sector input */}
          <div>
            <label className="text-sm text-gray-400">Target Sector</label>
            <input
              type="text"
              placeholder="e.g., 1.0.0"
              value={targetSector}
              onChange={(e) => setTargetSector(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            />
            <div className="text-xs text-gray-500 mt-1">
              Format: x.y.z (numbers separated by dots)
            </div>
          </div>

          {/* Fuel cost estimate */}
          {fuelCost !== null && (
            <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
              <div className="text-sm text-gray-300">Estimated fuel cost:</div>
              <div className="text-xl font-bold">{fuelCost.toFixed(2)} units</div>
              <div className="text-sm text-gray-400">
                Remaining after jump: {(ship.fuel_current - fuelCost).toFixed(2)}
              </div>
            </div>
          )}

          {/* Fuel gauge */}
          <FuelGauge current={ship.fuel_current} capacity={ship.fuel_capacity} />

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-300">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isJumping}>
          Cancel
        </Button>
        <Button
          onClick={handleJump}
          disabled={!fuelCost || fuelCost > ship.fuel_current || isJumping}
          variant="primary"
        >
          {isJumping ? 'Jumping...' : 'Execute Jump'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Helper function to calculate fuel cost
function calculateFuelCost(
  fromSector: string,
  toSector: string,
  shipSpeed: number,
  sectorType: 'normal' | 'nebula' | 'void' | 'hazard'
): number {
  const from = parseSectorCoords(fromSector);
  const to = parseSectorCoords(toSector);

  const distance = Math.sqrt(
    Math.pow(to.x - from.x, 2) +
    Math.pow(to.y - from.y, 2) +
    Math.pow(to.z - from.z, 2)
  );

  const sectorModifiers = {
    normal: 1.0,
    nebula: 1.5,
    void: 0.8,
    hazard: 2.0,
  };

  return distance * (1.0 / shipSpeed) * sectorModifiers[sectorType];
}

function parseSectorCoords(sector: string): Vector3 {
  const parts = sector.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid sector format');
  }
  return {
    x: parseFloat(parts[0]),
    y: parseFloat(parts[1]),
    z: parseFloat(parts[2]),
  };
}
```

---

### 3. DockingDialog Component

**Purpose**: Show stations in current sector and allow docking

**Location**: `src/components/Movement/DockingDialog.tsx`

```typescript
interface DockingDialogProps {
  ship: Ship;
  isOpen: boolean;
  onClose: () => void;
  onDock: (stationId: string) => Promise<void>;
}

export function DockingDialog({ ship, isOpen, onClose, onDock }: DockingDialogProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDocking, setIsDocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stations when dialog opens
  useEffect(() => {
    if (isOpen && ship.location_sector) {
      loadStations();
    }
  }, [isOpen, ship.location_sector]);

  const loadStations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getStationsInSector(ship.location_sector);
      setStations(response.data.stations || []);
    } catch (err) {
      setError('Failed to load stations');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (station: Station): number => {
    return Math.sqrt(
      Math.pow(station.position.x - ship.position.x, 2) +
      Math.pow(station.position.y - ship.position.y, 2) +
      Math.pow(station.position.z - ship.position.z, 2)
    );
  };

  const handleDock = async () => {
    if (!selectedStation) return;

    setIsDocking(true);
    try {
      await onDock(selectedStation.id);
      onClose();
    } catch (err: any) {
      setError(handleMovementError(err.response?.data));
    } finally {
      setIsDocking(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Station to Dock</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <div className="text-center py-8">Loading stations...</div>
        ) : stations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No stations in this sector
          </div>
        ) : (
          <div className="space-y-2">
            {stations.map((station) => {
              const distance = calculateDistance(station);
              const inRange = distance <= 5000;
              const hasCapacity = station.docked_ships_count < station.docking_capacity;
              const canDock = inRange && hasCapacity;

              return (
                <div
                  key={station.id}
                  onClick={() => canDock && setSelectedStation(station)}
                  className={`
                    p-4 border rounded cursor-pointer transition-colors
                    ${selectedStation?.id === station.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                    }
                    ${!canDock && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-lg">{station.name}</div>
                      <div className="text-sm text-gray-400">
                        {station.station_type.charAt(0).toUpperCase() + station.station_type.slice(1)} Station
                      </div>

                      {/* Services */}
                      <div className="flex gap-2 mt-2">
                        {station.services.map((service) => (
                          <span
                            key={service}
                            className="px-2 py-1 text-xs bg-gray-700 rounded"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status indicators */}
                    <div className="text-right">
                      {/* Distance */}
                      <div className={`text-sm ${inRange ? 'text-green-400' : 'text-red-400'}`}>
                        {distance.toFixed(0)} units
                        {!inRange && ' (out of range)'}
                      </div>

                      {/* Capacity */}
                      <div className={`text-sm mt-1 ${hasCapacity ? 'text-gray-400' : 'text-red-400'}`}>
                        {station.docked_ships_count}/{station.docking_capacity} docked
                        {!hasCapacity && ' (FULL)'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDocking}>
          Cancel
        </Button>
        <Button
          onClick={handleDock}
          disabled={!selectedStation || isDocking}
          variant="primary"
        >
          {isDocking ? 'Docking...' : 'Dock'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 4. JumpCooldownTimer Component

**Purpose**: Show countdown when jump drive is recharging

**Location**: `src/components/Movement/JumpCooldownTimer.tsx`

```typescript
interface JumpCooldownTimerProps {
  lastJumpAt: string | null;
  onCooldownComplete: () => void;
}

export function JumpCooldownTimer({ lastJumpAt, onCooldownComplete }: JumpCooldownTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!lastJumpAt) {
      setRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const jumpTime = new Date(lastJumpAt).getTime();
      const now = Date.now();
      const elapsed = (now - jumpTime) / 1000; // seconds
      const cooldown = 10; // 10 second cooldown
      const rem = Math.max(0, cooldown - elapsed);
      setRemaining(rem);

      if (rem === 0) {
        onCooldownComplete();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 100);

    return () => clearInterval(interval);
  }, [lastJumpAt, onCooldownComplete]);

  if (remaining === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-300">
      <div className="animate-pulse">⏳</div>
      <span className="text-sm">
        Jump drive recharging: {remaining.toFixed(1)}s
      </span>
    </div>
  );
}
```

---

### 5. ShipControlPanel Component

**Purpose**: Main control panel for ship movement

**Location**: `src/components/Ship/ShipControlPanel.tsx`

```typescript
interface ShipControlPanelProps {
  ship: Ship;
  onRefresh: () => void;
}

export function ShipControlPanel({ ship, onRefresh }: ShipControlPanelProps) {
  const [jumpDialogOpen, setJumpDialogOpen] = useState(false);
  const [dockDialogOpen, setDockDialogOpen] = useState(false);
  const [isUndocking, setIsUndocking] = useState(false);
  const [jumpOnCooldown, setJumpOnCooldown] = useState(false);

  const isDocked = !!ship.docked_at;

  const handleJump = async (targetSector: string) => {
    await jumpToSector(ship.id, targetSector);
    onRefresh();
  };

  const handleDock = async (stationId: string) => {
    await dockAtStation(ship.id, stationId);
    onRefresh();
  };

  const handleUndock = async () => {
    setIsUndocking(true);
    try {
      await undockFromStation(ship.id);
      onRefresh();
    } catch (err: any) {
      alert(handleMovementError(err.response?.data));
    } finally {
      setIsUndocking(false);
    }
  };

  return (
    <div className="ship-control-panel p-4 bg-gray-800 border border-gray-700 rounded">
      <h3 className="text-xl font-bold mb-4">Ship Controls</h3>

      {/* Ship status */}
      <div className="mb-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Location:</span>
          <span className="font-mono">{ship.location_sector}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={isDocked ? 'text-green-400' : 'text-blue-400'}>
            {isDocked ? 'Docked' : 'Free Flight'}
          </span>
        </div>
      </div>

      {/* Fuel gauge */}
      <div className="mb-4">
        <FuelGauge current={ship.fuel_current} capacity={ship.fuel_capacity} />
      </div>

      {/* Jump cooldown */}
      {ship.last_jump_at && (
        <JumpCooldownTimer
          lastJumpAt={ship.last_jump_at}
          onCooldownComplete={() => setJumpOnCooldown(false)}
        />
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {isDocked ? (
          <Button
            onClick={handleUndock}
            disabled={isUndocking}
            fullWidth
            variant="secondary"
          >
            {isUndocking ? 'Undocking...' : 'Undock from Station'}
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setJumpDialogOpen(true)}
              disabled={jumpOnCooldown || ship.in_combat}
              fullWidth
              variant="primary"
            >
              Jump to Sector
            </Button>
            <Button
              onClick={() => setDockDialogOpen(true)}
              disabled={ship.in_combat}
              fullWidth
              variant="secondary"
            >
              Dock at Station
            </Button>
          </>
        )}
      </div>

      {/* Dialogs */}
      <JumpDialog
        ship={ship}
        isOpen={jumpDialogOpen}
        onClose={() => setJumpDialogOpen(false)}
        onJump={handleJump}
      />
      <DockingDialog
        ship={ship}
        isOpen={dockDialogOpen}
        onClose={() => setDockDialogOpen(false)}
        onDock={handleDock}
      />
    </div>
  );
}
```

---

## State Management

### Using React Context (Recommended)

```typescript
// src/contexts/ShipContext.tsx
interface ShipContextType {
  ship: Ship | null;
  isLoading: boolean;
  error: string | null;
  refreshShip: () => Promise<void>;
  jump: (targetSector: string) => Promise<void>;
  dock: (stationId: string) => Promise<void>;
  undock: () => Promise<void>;
}

const ShipContext = createContext<ShipContextType | null>(null);

export function ShipProvider({ children, shipId }: { children: React.ReactNode; shipId: string }) {
  const [ship, setShip] = useState<Ship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshShip = async () => {
    try {
      const response = await apiClient.get(`/ships/${shipId}`);
      setShip(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load ship data');
    } finally {
      setIsLoading(false);
    }
  };

  const jump = async (targetSector: string) => {
    if (!ship) return;
    await jumpToSector(ship.id, targetSector);
    await refreshShip();
  };

  const dock = async (stationId: string) => {
    if (!ship) return;
    await dockAtStation(ship.id, stationId);
    await refreshShip();
  };

  const undock = async () => {
    if (!ship) return;
    await undockFromStation(ship.id);
    await refreshShip();
  };

  useEffect(() => {
    refreshShip();
  }, [shipId]);

  return (
    <ShipContext.Provider value={{ ship, isLoading, error, refreshShip, jump, dock, undock }}>
      {children}
    </ShipContext.Provider>
  );
}

export function useShip() {
  const context = useContext(ShipContext);
  if (!context) {
    throw new Error('useShip must be used within ShipProvider');
  }
  return context;
}
```

---

## SSE Event Handling

### Subscribe to Movement Events

```typescript
// src/hooks/useMovementEvents.ts
export function useMovementEvents(playerId: string, onEvent: (event: any) => void) {
  useEffect(() => {
    const eventSource = new EventSource(
      `${API_BASE}/events?channels=player.${playerId},game.movement.jump,game.movement.dock,game.movement.undock`
    );

    eventSource.addEventListener('SHIP_JUMPED', (e) => {
      const event: ShipJumpedEvent = JSON.parse(e.data);
      onEvent({ type: 'SHIP_JUMPED', data: event });
    });

    eventSource.addEventListener('SHIP_DOCKED', (e) => {
      const event: ShipDockedEvent = JSON.parse(e.data);
      onEvent({ type: 'SHIP_DOCKED', data: event });
    });

    eventSource.addEventListener('SHIP_UNDOCKED', (e) => {
      const event: ShipUndockedEvent = JSON.parse(e.data);
      onEvent({ type: 'SHIP_UNDOCKED', data: event });
    });

    return () => {
      eventSource.close();
    };
  }, [playerId, onEvent]);
}
```

### Integrate Events with Ship State

```typescript
// In ShipProvider or Dashboard component
const handleMovementEvent = (event: any) => {
  switch (event.type) {
    case 'SHIP_JUMPED':
      if (event.data.ship_id === ship?.id) {
        // Update own ship's location and fuel
        setShip(prev => prev ? {
          ...prev,
          location_sector: event.data.to_sector,
          fuel_current: event.data.fuel_remaining,
          last_jump_at: new Date().toISOString(),
        } : null);

        // Show notification
        toast.success(`Jumped to sector ${event.data.to_sector}`);
      }
      break;

    case 'SHIP_DOCKED':
      if (event.data.ship_id === ship?.id) {
        setShip(prev => prev ? {
          ...prev,
          docked_at: event.data.station_id,
        } : null);

        toast.success(`Docked at ${event.data.station_name}`);
      }
      break;

    case 'SHIP_UNDOCKED':
      if (event.data.ship_id === ship?.id) {
        setShip(prev => prev ? {
          ...prev,
          docked_at: undefined,
        } : null);

        toast.info('Undocked from station');
      }
      break;
  }
};

useMovementEvents(playerId, handleMovementEvent);
```

---

## UI/UX Guidelines

### Visual Feedback

1. **Jump Animation**:
   - Brief flash effect when jump completes
   - Sector coordinates update with fade transition
   - Fuel gauge animates to new level

2. **Docking Animation**:
   - Loading spinner while docking
   - Status changes to "Docked" with color change
   - Show station name in UI

3. **Cooldown Visual**:
   - Progress bar showing cooldown remaining
   - Disable jump button with visual indicator
   - Timer counts down in UI

### Color Coding

- **Green**: Good state (fuel > 50%, in range)
- **Yellow**: Warning state (fuel 20-50%, near range limit)
- **Red**: Critical state (fuel < 20%, out of range, errors)
- **Blue**: Neutral/info (current location, free flight)

### Accessibility

- Use ARIA labels for all interactive elements
- Provide keyboard shortcuts (J for jump, D for dock, U for undock)
- Screen reader support for fuel levels and status changes
- High contrast mode support

### Mobile Considerations

- Large touch targets for buttons (min 44x44px)
- Swipe gestures optional (buttons primary)
- Full-screen dialogs on small screens
- Simplified station list on mobile

---

## Implementation Checklist

### Phase 1: Core API Integration (2 hours)

- [ ] Add TypeScript types to `src/types/movement.ts`
- [ ] Implement API client functions in `src/lib/api.ts`
- [ ] Add error handler helper function
- [ ] Test API calls with Postman/curl

### Phase 2: Basic Components (3 hours)

- [ ] Create `FuelGauge` component
- [ ] Create `JumpCooldownTimer` component
- [ ] Create basic `ShipControlPanel` layout
- [ ] Add to ship dashboard/details page

### Phase 3: Jump System (2 hours)

- [ ] Create `JumpDialog` component
- [ ] Implement fuel cost calculator (client-side)
- [ ] Add sector coordinate validation
- [ ] Handle jump errors with user-friendly messages

### Phase 4: Docking System (2 hours)

- [ ] Create `DockingDialog` component
- [ ] Implement station list fetching
- [ ] Add distance calculator
- [ ] Show station capacity and services
- [ ] Handle docking errors

### Phase 5: Undocking (30 minutes)

- [ ] Add undock button to ship panel
- [ ] Implement undock API call
- [ ] Handle undock errors

### Phase 6: SSE Events (1 hour)

- [ ] Create `useMovementEvents` hook
- [ ] Subscribe to movement events
- [ ] Update ship state on events
- [ ] Add toast notifications for events

### Phase 7: Testing & Polish (2 hours)

- [ ] Test all success flows (jump, dock, undock)
- [ ] Test all error cases (see error codes)
- [ ] Verify fuel calculations
- [ ] Test jump cooldown timer
- [ ] Test proximity checks
- [ ] Verify SSE updates work
- [ ] Mobile responsiveness check
- [ ] Accessibility audit

---

## Testing Scenarios

### Scenario 1: Successful Jump

1. Ship at sector "0.0.0" with 100 fuel
2. Click "Jump to Sector"
3. Enter target "1.0.0"
4. See fuel cost: ~0.2 fuel
5. Click "Execute Jump"
6. Ship location updates to "1.0.0"
7. Fuel updates to 99.8
8. Jump cooldown activates (10s)

### Scenario 2: Insufficient Fuel

1. Ship with 0.1 fuel
2. Try to jump to far sector (5.0.0)
3. See error: "Not enough fuel for this jump"
4. Jump button disabled

### Scenario 3: Jump Cooldown

1. Jump to sector "1.0.0"
2. Immediately try to jump again
3. See countdown timer: "Jump drive recharging: 9.5s"
4. Jump button disabled
5. After 10s, button re-enables

### Scenario 4: Successful Docking

1. Ship in sector "0.0.0"
2. Click "Dock at Station"
3. See list of stations in sector
4. New Eden Trade Hub shows "100 units (in range)"
5. Select station and click "Dock"
6. Ship status changes to "Docked"
7. Jump/Dock buttons disabled, Undock enabled

### Scenario 5: Out of Range Docking

1. Ship 10,000 units from station
2. Try to dock
3. Station shows "10000 units (out of range)"
4. Station card disabled/grayed out
5. Cannot select out-of-range station

### Scenario 6: Station Full

1. Try to dock at full station
2. See "45/45 docked (FULL)"
3. Station card disabled
4. Cannot dock

---

## Notes

- **All movement is server-authoritative** - client shows estimates, server validates
- **Fuel is critical** - add warnings for low fuel (<20%)
- **Cooldown is strict** - no client-side bypasses
- **Proximity matters** - show distance to stations clearly
- **Real-time events** - keep ship state in sync via SSE

---

**Good luck with implementation!** 🚀

**Questions?** Check `API-BLUEPRINT.md` or `MOVEMENT_SYSTEM_SUMMARY.md` for more details.
