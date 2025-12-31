# Station Services

## Overview

Station services provide essential maintenance functions for ships when docked. Players can refuel, repair hull damage, and repair shield damage at stations.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stations/refuel` | Refuel ship |
| POST | `/stations/repair` | Repair ship |

## Data Types

### RefuelRequest
```typescript
interface RefuelRequest {
  ship_id: string;
  amount: number;  // 0 = fill tank
}
```

### RefuelResponse
```typescript
interface RefuelResponse {
  ship_id: string;
  fuel_before: number;
  fuel_after: number;
  fuel_max: number;
  credits_charged: number;
  credits_remaining: number;
}
```

### RepairRequest
```typescript
interface RepairRequest {
  ship_id: string;
  repair_hull: boolean;
  repair_shield: boolean;
}
```

### RepairResponse
```typescript
interface RepairResponse {
  ship_id: string;
  hull_before: number;
  hull_after: number;
  hull_max: number;
  shield_before: number;
  shield_after: number;
  shield_max: number;
  credits_charged: number;
  credits_remaining: number;
}
```

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Not logged in |
| SHIP_NOT_DOCKED | Must dock first |
| SERVICE_NOT_AVAILABLE | Station doesn't offer service |
| INSUFFICIENT_CREDITS | Not enough money |
| FUEL_FULL | Tank already full |
| SHIP_FULLY_REPAIRED | Already at max health |
| SHIP_NOT_FOUND | Invalid ship ID |
| STATION_NOT_FOUND | Invalid station |
| PRICING_ERROR | Pricing unavailable |

## Source Files

| File | Purpose |
|------|---------|
| `api/station-services.ts` | API client methods |
| `hooks/useStationServices.ts` | SSE event handlers |

## Service Flow

### Refuel
1. Ship must be docked
2. Select amount (or full tank)
3. Credits deducted
4. Fuel added to ship

### Repair
1. Ship must be docked
2. Select hull and/or shield repair
3. Credits deducted based on damage
4. Ship restored to max

## Pricing

- **Fuel**: Per unit cost varies by station
- **Hull Repair**: Cost per HP restored
- **Shield Repair**: Cost per SP restored
- **Station Markup**: Some stations charge more

## Real-Time Events

Station service events received via SSE:

| Event | Description |
|-------|-------------|
| `service_complete` | Service finished |
| `credits_deducted` | Payment processed |
| `ship_updated` | Ship stats changed |

## Components

- Station service UI when docked
- Fuel gauge display
- Repair cost calculator
- Credits display

## Integration Points

- **Ship Systems**: Updates hull/shields/fuel
- **Credits**: Deducts from balance
- **Docking**: Must be docked to use
- **Navigation**: Affects travel capability (fuel)
