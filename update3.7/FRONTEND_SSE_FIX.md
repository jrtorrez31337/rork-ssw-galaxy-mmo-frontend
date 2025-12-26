# Frontend SSE Connection Fix - Station Services

**Issue**: Frontend getting 404 errors when trying to connect to station services SSE endpoint
**Status**: 🔴 **CONFIGURATION ERROR**
**Fix**: Update SSE connection URL

---

## Problem

Frontend is trying to connect to a station-specific SSE endpoint that doesn't exist:
```
ERROR  [SSE] Station services connection error: {"message": "404 page not found", "type": "error", "xhrStatus": 404}
```

**Root Cause**: There is no `/v1/stations/events` endpoint. All SSE events (including station services) are delivered through the **Fanout service** at `/events`.

---

## Solution

### 1. Correct SSE Connection URL

**WRONG** ❌:
```typescript
// Don't do this - endpoint doesn't exist
const eventSource = new EventSource('http://localhost:8002/v1/stations/events');
```

**CORRECT** ✅:
```typescript
// Connect to Fanout service
const eventSource = new EventSource('http://localhost:8085/events', {
  withCredentials: true
});
```

### 2. Service Ports Reference

| Service | Port | Health Check |
|---------|------|--------------|
| Gateway | 8000 | http://localhost:8000/health |
| Identity | 8001 | http://localhost:8001/health |
| WorldSim | 8002 | http://localhost:8002/health |
| Combat | 8003 | http://localhost:8003/health |
| Economy | 8004 | http://localhost:8004/health |
| **Fanout (SSE)** | **8085** | http://localhost:8085/health |
| Chat | 8007 | http://localhost:8007/health |
| ProcGen | 8008 | http://localhost:8008/health |

**Key Point**: SSE events are NOT served by individual services. All events flow through **Fanout** on port **8085**.

---

## Correct Implementation

### Updated `useStationServices.ts`

```typescript
import { useEffect, useRef, useState } from 'react';

const FANOUT_URL = process.env.NEXT_PUBLIC_FANOUT_URL || 'http://localhost:8085';

export function useStationServices(playerId: string, callbacks?: {
  onFuelPurchased?: (payload: any) => void;
  onRepairCompleted?: (payload: any) => void;
  onCreditsChanged?: (payload: any) => void;
  onError?: (error: any) => void;
}) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!playerId) return;

    // Connect to Fanout SSE endpoint
    const eventSource = new EventSource(`${FANOUT_URL}/events`, {
      withCredentials: true
    });

    eventSource.addEventListener('open', () => {
      console.log('[SSE] Connected to station services');
      setConnected(true);

      // Subscribe to player-specific channel
      fetch(`${FANOUT_URL}/events/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: [
            `player.${playerId}`,
            'game.services',
            'game.economy'
          ]
        })
      }).catch(err => console.error('[SSE] Subscribe error:', err));
    });

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different event types
        switch (data.type) {
          case 'fuel_purchased':
            callbacks?.onFuelPurchased?.(data.payload);
            break;
          case 'repair_completed':
            callbacks?.onRepairCompleted?.(data.payload);
            break;
          case 'credits_changed':
            callbacks?.onCreditsChanged?.(data.payload);
            break;
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error);
      }
    });

    eventSource.addEventListener('error', (error: any) => {
      console.error('[SSE] Connection error:', error);
      setConnected(false);
      callbacks?.onError?.(error);
    });

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [playerId]);

  return { connected };
}
```

---

## SSE Event Flow Architecture

```
┌─────────────┐
│  WorldSim   │ (Port 8002)
│  Service    │
└──────┬──────┘
       │
       │ 1. POST /v1/stations/refuel
       │ 2. Transaction commits
       │ 3. Publish to NATS: game.services.fuel_purchase
       ↓
┌─────────────────────────────────────────┐
│          NATS Message Broker            │
│  Subjects:                              │
│  - game.services.*                      │
│  - game.economy.*                       │
│  - player.{player_id}                   │
└──────────────┬──────────────────────────┘
               │
               │ Subscribe to game.* subjects
               ↓
       ┌───────────────┐
       │    Fanout     │ (Port 8085)
       │   Service     │
       │ /events (SSE) │
       └───────┬───────┘
               │
               │ SSE Stream
               ↓
       ┌───────────────┐
       │   Frontend    │
       │  EventSource  │
       └───────────────┘
```

**Important**: Frontend connects to Fanout (port 8085), NOT to WorldSim (port 8002).

---

## Testing the Fix

### 1. Test SSE Connection
```bash
# Should return SSE stream (keeps connection open)
curl -N http://localhost:8085/events
```

### 2. Test Fanout Health
```bash
# Should return {"status":"ok"}
curl http://localhost:8085/health
```

### 3. Test Event Subscription
```bash
# Subscribe to player channel
curl -X POST http://localhost:8085/events/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["player.df224ce3-1b63-4c0c-bba5-53d6b3e826dd"]
  }'
```

### 4. Trigger Event (Refuel)
```bash
# Trigger a refuel event (should see it in SSE stream)
curl -X POST http://localhost:8002/v1/stations/refuel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "amount": 10
  }'
```

---

## Environment Configuration

### Development `.env`
```bash
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FANOUT_URL=http://localhost:8085
```

### Production `.env`
```bash
# Frontend .env.production
NEXT_PUBLIC_API_URL=https://api.ssw-galaxy.com
NEXT_PUBLIC_FANOUT_URL=https://sse.ssw-galaxy.com
```

---

## Common Mistakes

### ❌ WRONG: Connecting to each service individually
```typescript
// Don't do this!
const worldSimEvents = new EventSource('http://localhost:8002/events');
const economyEvents = new EventSource('http://localhost:8004/events');
const socialEvents = new EventSource('http://localhost:8085/events');
```

### ✅ CORRECT: Single connection to Fanout
```typescript
// Do this!
const eventSource = new EventSource('http://localhost:8085/events');
// All events from all services come through this one connection
```

---

## Fanout API Reference

### GET `/events`
**Description**: Connect to SSE stream
**Response**: Server-Sent Events stream
**Example**:
```javascript
const eventSource = new EventSource('http://localhost:8085/events');
```

### POST `/events/subscribe`
**Description**: Subscribe to specific channels
**Body**:
```json
{
  "channels": ["player.{player_id}", "game.services", "game.economy"]
}
```

### POST `/events/unsubscribe`
**Description**: Unsubscribe from channels
**Body**:
```json
{
  "channels": ["player.{player_id}"]
}
```

### GET `/events/stats`
**Description**: Get connection statistics
**Response**:
```json
{
  "total_subscribers": 42,
  "total_channels": 15,
  "channel_counts": {
    "player.df224ce3...": 1,
    "game.services": 12
  }
}
```

---

## Debugging

### Check if Fanout is receiving events
```bash
# In one terminal, subscribe to events
curl -N http://localhost:8085/events

# In another terminal, trigger a refuel
curl -X POST http://localhost:8002/v1/stations/refuel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"ship_id":"...","amount":10}'

# You should see the fuel_purchased event appear in the first terminal
```

### Check NATS message flow
```bash
# Subscribe to all game events in NATS
nats sub "game.>" --server=localhost:4222

# Trigger an action, should see NATS messages
```

---

## Summary

**The Fix**:
1. ✅ Change SSE connection from `localhost:8002/v1/stations/events` to `localhost:8085/events`
2. ✅ Use Fanout service (port 8085) for ALL SSE events
3. ✅ Subscribe to channels after connection: `player.{player_id}`, `game.services`, `game.economy`

**Why This Happened**:
- Fanout is the SSE gateway - all events flow through it
- Individual services (WorldSim, Economy, etc.) publish to NATS
- Fanout subscribes to NATS and broadcasts to frontend via SSE
- No service except Fanout should have an `/events` endpoint

**Status After Fix**: Frontend should connect successfully and receive station service events in real-time.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-26
**Status**: Ready for Implementation ✅
