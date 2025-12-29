# Async Travel System - Frontend Integration Guide

## Overview

The travel system has been updated from **instant/synchronous jumps** to **async travel with real travel time**. Ships now take actual time to travel between sectors, creating opportunities for richer gameplay and UX.

### Key Changes

| Before (Instant) | After (Async) |
|------------------|---------------|
| `POST /actions/jump` → immediate arrival | `POST /v1/actions/travel` → returns `travel_id` + `arrives_at` |
| No travel state | Ship has `in_transit` status during travel |
| No cancellation | Travel can be cancelled with partial fuel refund |
| Single API call | Poll status or subscribe to SSE events |

---

## API Endpoints

### Base URL
```
https://api.ssw-galaxy.com/v1  (production)
http://localhost:8082          (local worldsim)
```

### 1. Initiate Travel

Start an async travel operation.

```http
POST /v1/actions/travel
Content-Type: application/json

{
  "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
  "target_sector": "5.3.2"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "from_sector": "0.0.0",
    "to_sector": "5.3.2",
    "distance": 6.557,
    "fuel_consumed": 1.31,
    "fuel_remaining": 48.69,
    "started_at": "2025-12-28T15:30:00Z",
    "arrives_at": "2025-12-28T15:30:45Z",
    "travel_time_seconds": 45,
    "status": "in_transit",
    "message": "Travel initiated. Arriving in 45 seconds"
  }
}
```

**Error Responses:**

| Code | Error | Description |
|------|-------|-------------|
| 400 | `SHIP_DOCKED` | Ship must undock before traveling |
| 400 | `SHIP_IN_COMBAT` | Cannot travel while in combat |
| 400 | `ALREADY_IN_TRANSIT` | Ship is already traveling |
| 400 | `JUMP_ON_COOLDOWN` | Jump drive cooling down (30s) |
| 400 | `INSUFFICIENT_FUEL` | Not enough fuel for journey |
| 400 | `INVALID_SECTOR` | Invalid sector format |
| 404 | `SHIP_NOT_FOUND` | Ship does not exist |

### 2. Get Travel Status

Query the current status of a travel operation.

```http
GET /v1/travel/{travel_id}
```

**Response:**
```json
{
  "data": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "from_sector": "0.0.0",
    "to_sector": "5.3.2",
    "distance": 6.557,
    "status": "in_transit",
    "started_at": "2025-12-28T15:30:00Z",
    "arrives_at": "2025-12-28T15:30:45Z",
    "completed_at": null,
    "remaining_seconds": 23,
    "progress_percent": 48.9,
    "fuel_consumed": 1.31
  }
}
```

### 3. Get Ship's Active Travel

Get the active travel for a specific ship.

```http
GET /v1/ships/{ship_id}/travel
```

**Response (in transit):** Same as above

**Response (not traveling):**
```json
{
  "error": {
    "code": "NOT_IN_TRANSIT",
    "message": "Ship is not currently traveling"
  }
}
```

### 4. Cancel Travel

Cancel an in-progress travel and return to origin sector.

```http
POST /v1/travel/{travel_id}/cancel
```

**Response:**
```json
{
  "data": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "from_sector": "0.0.0",
    "fuel_refund": 0.52,
    "message": "Travel cancelled. Partial fuel refunded."
  }
}
```

**Note:** Fuel refund is 80% of the remaining portion of fuel. If you cancel at 50% progress, you get back `fuel_consumed * 0.5 * 0.8`.

---

## Real-Time Events (SSE)

Subscribe to player events to receive travel updates in real-time.

### Event Types

#### `travel_started`
Fired when travel is initiated (by this client or another session).

```json
{
  "type": "travel_started",
  "timestamp": 1703776200000,
  "payload": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "from_sector": "0.0.0",
    "to_sector": "5.3.2",
    "distance": 6.557,
    "started_at": 1703776200,
    "arrives_at": 1703776245,
    "travel_time_seconds": 45,
    "fuel_consumed": 1.31
  }
}
```

#### `travel_completed`
Fired when ship arrives at destination.

```json
{
  "type": "travel_completed",
  "timestamp": 1703776245000,
  "payload": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "from_sector": "0.0.0",
    "to_sector": "5.3.2",
    "distance": 6.557,
    "arrived_at": 1703776245,
    "fuel_consumed": 1.31
  }
}
```

#### `travel_cancelled`
Fired when travel is cancelled.

```json
{
  "type": "travel_cancelled",
  "timestamp": 1703776220000,
  "payload": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "from_sector": "0.0.0",
    "to_sector": "5.3.2",
    "cancelled_at": 1703776220,
    "fuel_refund": 0.52
  }
}
```

#### `travel_interrupted`
Fired if travel is interrupted (e.g., interdiction by another player).

```json
{
  "type": "travel_interrupted",
  "timestamp": 1703776230000,
  "payload": {
    "travel_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "from_sector": "0.0.0",
    "to_sector": "5.3.2",
    "interrupted_at": 1703776230,
    "interrupted_by": "hostile-ship-id",
    "reason": "interdiction",
    "drop_sector": "2.1.1"
  }
}
```

---

## State Management

### Ship Travel States

```typescript
type ShipTravelStatus = 'idle' | 'in_transit' | 'arriving';

interface Ship {
  id: string;
  travel_status: ShipTravelStatus;
  current_travel_id: string | null;
  location_sector: string;
  // ... other fields
}
```

### Travel State Machine

```
┌─────────┐   initiate   ┌────────────┐   arrives_at   ┌───────────┐
│  IDLE   │ ───────────► │ IN_TRANSIT │ ─────────────► │ COMPLETED │
└─────────┘              └────────────┘                └───────────┘
     ▲                         │
     │         cancel          │
     └─────────────────────────┘
                               │
                               │  interrupted
                               ▼
                        ┌─────────────┐
                        │ INTERRUPTED │
                        └─────────────┘
```

### Recommended State Structure

```typescript
interface TravelState {
  // Active travel (null if not traveling)
  activeTravel: {
    travelId: string;
    shipId: string;
    fromSector: string;
    toSector: string;
    startedAt: Date;
    arrivesAt: Date;
    distance: number;
    fuelConsumed: number;
  } | null;

  // Computed/derived
  isInTransit: boolean;
  remainingSeconds: number;
  progressPercent: number;

  // UI state
  showTravelModal: boolean;
  showCancelConfirm: boolean;
}
```

---

## UX Recommendations

### 1. Travel Initiation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TRAVEL TO SECTOR 5.3.2                              │   │
│  │                                                      │   │
│  │  Distance:        6.6 units                          │   │
│  │  Travel Time:     ~45 seconds                        │   │
│  │  Fuel Required:   1.3 units                          │   │
│  │  Fuel Remaining:  48.7 units (after travel)          │   │
│  │                                                      │   │
│  │  ┌──────────────┐    ┌──────────────────────────┐   │   │
│  │  │    Cancel    │    │   ◀━━ Initiate Travel    │   │   │
│  │  └──────────────┘    └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Show estimated travel time prominently
- Display fuel cost and remaining fuel
- Warn if fuel will be critically low after travel
- Consider showing what's at the destination (stations, threats, etc.)

### 2. In-Transit UI

#### Option A: Full-Screen Travel View (Immersive)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ╭─────────────────╮                      │
│                    │   IN TRANSIT    │                      │
│                    ╰─────────────────╯                      │
│                                                             │
│           0.0.0  ━━━━━━━━●━━━━━━━━━━━━━━━  5.3.2           │
│                         ▲                                   │
│                      48.9%                                  │
│                                                             │
│                    ┌───────────────┐                        │
│                    │  0:23 remaining │                       │
│                    └───────────────┘                        │
│                                                             │
│                 [ Cancel Travel ]                           │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  While traveling, you can:                          │   │
│   │  • Review ship systems                              │   │
│   │  • Check market prices at destination               │   │
│   │  • Plan your next move                              │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### Option B: Persistent Status Bar (Non-Blocking)

```
┌─────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════╗   │
│ ║ 🚀 Traveling to 5.3.2  ━━━━━━━━●━━━━━━  0:23  [Cancel] ║   │
│ ╚═══════════════════════════════════════════════════════╝   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │           (Rest of game UI continues)               │   │
│  │                                                     │   │
│  │     Player can browse inventory, check markets,     │   │
│  │     manage other ships, etc.                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Recommendation:** Use Option B (persistent status bar) to allow players to remain productive during travel. Consider Option A for the first few seconds or for very long journeys.

### 3. Progress Indicator Patterns

#### Countdown Timer
```typescript
// Update every second
const remainingSeconds = Math.max(0,
  Math.floor((arrivesAt.getTime() - Date.now()) / 1000)
);

// Format as MM:SS or just SS for short trips
const formatTime = (seconds: number) => {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
};
```

#### Progress Bar
```typescript
const progressPercent = Math.min(100, Math.max(0,
  ((Date.now() - startedAt.getTime()) / (arrivesAt.getTime() - startedAt.getTime())) * 100
));
```

#### Animated Ship Icon
```css
/* Ship moves along progress bar */
.travel-ship-icon {
  animation: pulse 1s ease-in-out infinite;
  left: calc(var(--progress) * 1%);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### 4. Time Representation Guidelines

| Duration | Display Format | Example |
|----------|----------------|---------|
| < 60s | Seconds only | "45s" |
| 1-10 min | Minutes:Seconds | "3:45" |
| > 10 min | "About X minutes" | "About 15 minutes" |

**Best Practices:**
- Use relative time ("23 seconds remaining") not absolute ("arrives at 3:45 PM")
- Update countdown every second for trips < 2 minutes
- Update every 5 seconds for longer trips
- Show "Arriving..." when < 3 seconds remaining
- Add slight buffer to avoid showing "0s" (complete at 2s remaining visually)

### 5. Cancellation UX

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CANCEL TRAVEL?                                      │   │
│  │                                                      │   │
│  │  Your ship will return to sector 0.0.0               │   │
│  │                                                      │   │
│  │  Fuel refund: 0.52 units (of 1.31 consumed)          │   │
│  │  ⚠️  You will lose 0.79 units of fuel                │   │
│  │                                                      │   │
│  │  ┌───────────────────┐    ┌──────────────────────┐  │   │
│  │  │  Continue Travel  │    │   Cancel & Return    │  │   │
│  │  └───────────────────┘    └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6. Arrival Notification

```typescript
// When travel_completed event received:
showNotification({
  type: 'success',
  title: 'Arrived!',
  message: `You have arrived at sector ${toSector}`,
  duration: 5000,
  action: {
    label: 'View Sector',
    onClick: () => navigateToSectorView()
  }
});

// Also update the sector view automatically
refreshSectorData(toSector);
```

### 7. Error State Handling

```typescript
const handleTravelError = (error: TravelError) => {
  switch (error.code) {
    case 'SHIP_DOCKED':
      showToast({
        type: 'warning',
        message: 'Undock from the station before traveling',
        action: { label: 'Undock', onClick: handleUndock }
      });
      break;

    case 'INSUFFICIENT_FUEL':
      showToast({
        type: 'error',
        message: `Need ${requiredFuel} fuel, you have ${currentFuel}`,
        action: { label: 'Find Station', onClick: showNearbyStations }
      });
      break;

    case 'JUMP_ON_COOLDOWN':
      // Show cooldown timer
      showCooldownOverlay(remainingCooldown);
      break;

    case 'ALREADY_IN_TRANSIT':
      // Sync state - ship is already traveling
      fetchActiveTravel(shipId);
      break;

    default:
      showToast({ type: 'error', message: error.message });
  }
};
```

### 8. Offline/Reconnection Handling

```typescript
// On app load or reconnect, check for active travel
const syncTravelState = async (shipId: string) => {
  try {
    const travel = await api.getShipTravel(shipId);
    if (travel) {
      // Ship was traveling - restore UI state
      setActiveTravel(travel);

      // Check if we missed the arrival
      if (new Date(travel.arrives_at) < new Date()) {
        // Should have arrived - poll for completion
        await pollUntilComplete(travel.travel_id);
      }
    }
  } catch (error) {
    if (error.code === 'NOT_IN_TRANSIT') {
      // Ship is not traveling - clear any stale state
      clearActiveTravel();
    }
  }
};
```

---

## Code Examples

### React Hook: useTravelState

```typescript
import { useState, useEffect, useCallback } from 'react';

interface TravelData {
  travelId: string;
  shipId: string;
  fromSector: string;
  toSector: string;
  startedAt: Date;
  arrivesAt: Date;
  fuelConsumed: number;
}

interface UseTravelStateReturn {
  activeTravel: TravelData | null;
  isInTransit: boolean;
  remainingSeconds: number;
  progressPercent: number;
  initiateTravel: (shipId: string, targetSector: string) => Promise<void>;
  cancelTravel: () => Promise<void>;
}

export function useTravelState(shipId: string): UseTravelStateReturn {
  const [activeTravel, setActiveTravel] = useState<TravelData | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Update countdown every second
  useEffect(() => {
    if (!activeTravel) return;

    const updateProgress = () => {
      const now = Date.now();
      const start = activeTravel.startedAt.getTime();
      const end = activeTravel.arrivesAt.getTime();

      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      const progress = Math.min(100, ((now - start) / (end - start)) * 100);

      setRemainingSeconds(remaining);
      setProgressPercent(progress);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [activeTravel]);

  // Listen for SSE events
  useEffect(() => {
    const handleTravelCompleted = (event: TravelCompletedEvent) => {
      if (event.payload.ship_id === shipId) {
        setActiveTravel(null);
        // Trigger sector refresh, notifications, etc.
      }
    };

    const handleTravelCancelled = (event: TravelCancelledEvent) => {
      if (event.payload.ship_id === shipId) {
        setActiveTravel(null);
      }
    };

    eventBus.on('travel_completed', handleTravelCompleted);
    eventBus.on('travel_cancelled', handleTravelCancelled);

    return () => {
      eventBus.off('travel_completed', handleTravelCompleted);
      eventBus.off('travel_cancelled', handleTravelCancelled);
    };
  }, [shipId]);

  const initiateTravel = useCallback(async (shipId: string, targetSector: string) => {
    const response = await api.initiateTravel(shipId, targetSector);

    setActiveTravel({
      travelId: response.travel_id,
      shipId: response.ship_id,
      fromSector: response.from_sector,
      toSector: response.to_sector,
      startedAt: new Date(response.started_at),
      arrivesAt: new Date(response.arrives_at),
      fuelConsumed: response.fuel_consumed,
    });
  }, []);

  const cancelTravel = useCallback(async () => {
    if (!activeTravel) return;

    await api.cancelTravel(activeTravel.travelId);
    setActiveTravel(null);
  }, [activeTravel]);

  return {
    activeTravel,
    isInTransit: activeTravel !== null,
    remainingSeconds,
    progressPercent,
    initiateTravel,
    cancelTravel,
  };
}
```

### Travel Progress Component

```tsx
interface TravelProgressProps {
  fromSector: string;
  toSector: string;
  progressPercent: number;
  remainingSeconds: number;
  onCancel: () => void;
}

export function TravelProgress({
  fromSector,
  toSector,
  progressPercent,
  remainingSeconds,
  onCancel,
}: TravelProgressProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 3) return 'Arriving...';
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="travel-progress">
      <div className="travel-header">
        <span className="travel-icon">🚀</span>
        <span>Traveling to {toSector}</span>
      </div>

      <div className="travel-bar-container">
        <span className="sector-label">{fromSector}</span>
        <div className="travel-bar">
          <div
            className="travel-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="travel-ship"
            style={{ left: `${progressPercent}%` }}
          >
            ▶
          </div>
        </div>
        <span className="sector-label">{toSector}</span>
      </div>

      <div className="travel-footer">
        <span className="travel-time">{formatTime(remainingSeconds)}</span>
        <button
          className="cancel-button"
          onClick={onCancel}
          disabled={remainingSeconds < 3}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Initiate travel from sector map
- [ ] Verify progress bar updates smoothly
- [ ] Verify countdown timer is accurate
- [ ] Cancel travel mid-journey
- [ ] Verify fuel refund on cancellation
- [ ] Verify arrival notification appears
- [ ] Verify sector view updates on arrival
- [ ] Test with slow network (3G simulation)
- [ ] Test app backgrounding during travel
- [ ] Test page refresh during travel
- [ ] Verify error handling for all error codes

### API Test Endpoints

```bash
# Test travel flow
./scripts/test/test-travel-api.sh

# Check travel system health
./scripts/health/check-travel.sh

# Admin tools for testing
./scripts/admin/manage-travel.sh list
./scripts/admin/manage-travel.sh force-complete --travel-id "xxx"
```

---

## Migration Notes

### Breaking Changes

1. **`POST /actions/jump` is deprecated** - Use `POST /v1/actions/travel` instead
2. **Ship location is not immediately updated** - Location changes only after `arrives_at`
3. **New ship state: `in_transit`** - Check `travel_status` before allowing actions

### Backwards Compatibility

The old `/actions/jump` endpoint will continue to work for a transition period but will be removed in v2.0. It now:
- Internally creates a travel job with minimum travel time (5 seconds)
- Returns immediately but ship won't be at destination for 5 seconds
- Logs deprecation warnings

### Feature Flags

```typescript
// Check if async travel is enabled (always true now)
const ASYNC_TRAVEL_ENABLED = true;

// Minimum travel time (seconds) - can be adjusted server-side
const MIN_TRAVEL_TIME = 5;

// Maximum travel time (seconds)
const MAX_TRAVEL_TIME = 300; // 5 minutes
```

---

## Questions?

Contact the backend team or check:
- API Blueprint: `/docs/api/worldsim-api.md`
- Travel admin tools: `./scripts/admin/manage-travel.sh --help`
- Health monitoring: `./scripts/health/check-travel.sh --help`
