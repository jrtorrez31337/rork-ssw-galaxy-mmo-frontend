# Async Travel API - Quick Reference

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/actions/travel` | Start travel |
| `GET` | `/v1/travel/{travel_id}` | Get travel status |
| `GET` | `/v1/ships/{ship_id}/travel` | Get ship's active travel |
| `POST` | `/v1/travel/{travel_id}/cancel` | Cancel travel |

## Initiate Travel

```bash
curl -X POST http://localhost:8082/v1/actions/travel \
  -H "Content-Type: application/json" \
  -d '{"ship_id": "UUID", "target_sector": "5.3.2"}'
```

**Response:** `travel_id`, `arrives_at`, `travel_time_seconds`, `fuel_consumed`

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `SHIP_DOCKED` | Ship is docked | Undock first |
| `SHIP_IN_COMBAT` | Ship in combat | Wait for combat end |
| `ALREADY_IN_TRANSIT` | Already traveling | Show current travel |
| `JUMP_ON_COOLDOWN` | 30s cooldown active | Show cooldown timer |
| `INSUFFICIENT_FUEL` | Not enough fuel | Find refuel station |
| `INVALID_SECTOR` | Bad sector format | Validate input |

## SSE Events

```typescript
// Subscribe to player events
eventSource.addEventListener('travel_started', handleStart);
eventSource.addEventListener('travel_completed', handleComplete);
eventSource.addEventListener('travel_cancelled', handleCancel);
eventSource.addEventListener('travel_interrupted', handleInterrupt);
```

## Time Display

```typescript
const formatRemaining = (seconds: number): string => {
  if (seconds < 3) return 'Arriving...';
  if (seconds >= 60) return `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`;
  return `${seconds}s`;
};
```

## Progress Calculation

```typescript
const progress = Math.min(100,
  ((Date.now() - startedAt) / (arrivesAt - startedAt)) * 100
);
```

## State Check

```typescript
// Before any ship action:
if (ship.travel_status === 'in_transit') {
  showTravelInProgress();
  return;
}
```

## Cancel Refund

- 80% of remaining fuel portion is refunded
- Example: Cancel at 50% = `fuel * 0.5 * 0.8` refund
