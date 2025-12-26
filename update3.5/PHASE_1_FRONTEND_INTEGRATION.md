# Phase 1: Credits & Station Services - Frontend Integration Guide

**Status**: ✅ **Production Ready**
**Backend Version**: v1.0.0
**Last Updated**: 2025-12-26

---

## Overview

Phase 1 implements the Credits & Fuel Economy foundation for SSW Galaxy MMO, adding:
- **Credits currency system** with complete audit trail
- **Station refuel service** with reputation-based pricing
- **Station repair service** for hull and shield restoration
- **Real-time SSE events** for all credit and service transactions

---

## New API Endpoints

### 1. Refuel Ship

**Endpoint**: `POST /v1/stations/refuel`
**Auth Required**: Yes (JWT token)
**Service**: WorldSim (port 8082)

#### Request Body
```json
{
  "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
  "amount": 20.0  // Fuel units to purchase (0 = fill tank)
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "success": true,
    "amount_added": 20.0,
    "cost_paid": "20.00",
    "fuel_remaining": 80.0,
    "credits_remaining": "980.00",
    "discount_applied": "2.00"  // Optional, if reputation discount applied
  }
}
```

#### Error Responses
```json
// 401 - Not authenticated
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required"
  }
}

// 400 - Ship not docked
{
  "error": {
    "code": "SHIP_NOT_DOCKED",
    "message": "Ship must be docked at a station to refuel"
  }
}

// 402 - Insufficient credits
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits to purchase fuel"
  }
}

// 400 - Tank already full
{
  "error": {
    "code": "FUEL_FULL",
    "message": "Fuel tank is already full"
  }
}
```

#### Pricing Formula
```
total_cost = base_price + (price_per_unit × amount)
discount = (player_reputation / 1000) × max_discount_percent
final_cost = total_cost × (1 - discount)
```

**Example**: New Eden Trade Hub
- Base price: 10 credits
- Price per unit: 0.50 credits
- Max discount: 20% (at 1000 reputation)
- Refueling 20 units at 500 reputation:
  - Base cost: 10 + (0.50 × 20) = 20 credits
  - Discount: (500/1000) × 20% = 10%
  - Final cost: 20 × 0.90 = 18 credits

---

### 2. Repair Ship

**Endpoint**: `POST /v1/stations/repair`
**Auth Required**: Yes (JWT token)
**Service**: WorldSim (port 8082)

#### Request Body
```json
{
  "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
  "repair_hull": true,
  "repair_shield": true  // At least one must be true
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "success": true,
    "hull_repaired": 30,
    "shield_repaired": 20,
    "cost_paid": "70.00",
    "hull_current": 900,
    "shield_current": 500,
    "credits_remaining": "910.00",
    "discount_applied": "0.00"
  }
}
```

#### Error Responses
```json
// 400 - Ship not docked
{
  "error": {
    "code": "SHIP_NOT_DOCKED",
    "message": "Ship must be docked at a station to repair"
  }
}

// 402 - Insufficient credits
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits to pay for repairs"
  }
}

// 400 - Already at full health
{
  "error": {
    "code": "SHIP_FULLY_REPAIRED",
    "message": "Ship is already at full health"
  }
}

// 400 - No repair type selected
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Must select at least one repair type (hull or shield)"
  }
}
```

#### Pricing Formula
```
total_damage = hull_damage + shield_damage
total_cost = base_price + (price_per_unit × total_damage)
discount = (player_reputation / 1000) × max_discount_percent
final_cost = total_cost × (1 - discount)
```

**Example**: New Eden Trade Hub
- Base price: 20 credits
- Price per unit: 1.00 credit per HP
- Ship needs 30 hull + 20 shield repair = 50 HP
- Cost: 20 + (1.00 × 50) = 70 credits

---

## Real-Time SSE Events

Phase 1 publishes three new event types. Frontend should subscribe to these events via the Fanout service SSE connection.

### Event: `fuel_purchased`

**NATS Subjects**:
- `game.services.fuel_purchase` (service-wide)
- `player.{player_id}` (player-specific)

**Event Structure**:
```json
{
  "id": "01JGXY...",
  "type": "fuel_purchased",
  "timestamp": 1735171200000,
  "payload": {
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "station_id": "00000000-0000-0000-0000-000000000101",
    "station_name": "New Eden Trade Hub",
    "amount": 20.0,
    "cost": 18.0,
    "fuel_remaining": 80.0
  }
}
```

**UI Actions**:
- Update ship fuel gauge
- Show toast notification: "Refueled {amount} units at {station_name} for {cost} credits"
- Update credits display
- Play refuel sound effect

---

### Event: `repair_completed`

**NATS Subjects**:
- `game.services.repair` (service-wide)
- `player.{player_id}` (player-specific)

**Event Structure**:
```json
{
  "id": "01JGXY...",
  "type": "repair_completed",
  "timestamp": 1735171200000,
  "payload": {
    "ship_id": "e0e6768a-e172-4251-9cae-6130b20a6596",
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "station_id": "00000000-0000-0000-0000-000000000101",
    "station_name": "New Eden Trade Hub",
    "hull_repaired": 30,
    "shield_repaired": 20,
    "cost": 70.0,
    "hull_current": 900,
    "shield_current": 500
  }
}
```

**UI Actions**:
- Update hull/shield bars with animation
- Show toast notification: "Repaired {hull_repaired} hull + {shield_repaired} shield for {cost} credits"
- Update credits display
- Play repair sound effect

---

### Event: `credits_changed`

**NATS Subjects**:
- `game.economy.credits_changed` (economy-wide)
- `player.{player_id}` (player-specific)

**Event Structure**:
```json
{
  "id": "01JGXY...",
  "type": "credits_changed",
  "timestamp": 1735171200000,
  "payload": {
    "player_id": "df224ce3-1b63-4c0c-bba5-53d6b3e826dd",
    "old_balance": 1000.0,
    "new_balance": 980.0,
    "amount_changed": -20.0,
    "reason": "refuel_purchase",
    "transaction_id": "4dfd7bb9-b95d-4cb0-a20b-bea348e86a98"
  }
}
```

**Transaction Types** (reason field):
- `refuel_purchase` - Purchased fuel
- `repair_purchase` - Repaired ship
- `mission_reward` - Mission completion
- `trade_sale` - Sold commodities
- `trade_purchase` - Bought commodities
- `loot_reward` - Combat loot
- `admin_adjustment` - Admin credit adjustment
- `station_service` - Other station services
- `mining_sale` - Sold mined resources
- `initial_balance` - Starting credits

**UI Actions**:
- Animate credits counter (smooth transition)
- If negative change: red flash/particle effect
- If positive change: green flash/particle effect
- Show transaction reason as tooltip

---

## Database Schema Changes

### New Column: `player_profiles.credits`
```sql
ALTER TABLE player_profiles
ADD COLUMN credits DECIMAL(18,2) NOT NULL DEFAULT 1000.00
CHECK (credits >= 0);
```

- Type: DECIMAL(18,2) - precise currency handling
- Default: 1000 credits for new players
- Constraint: Cannot go negative
- All existing players seeded with 1000 credits

### New Table: `credit_transactions`
```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY,
    profile_id UUID REFERENCES player_profiles(id),
    amount DECIMAL(18,2) NOT NULL,
    balance_before DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    related_entity_id UUID,  -- ship_id, station_id, mission_id, etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Use Case**: Transaction history page, audit logs, admin tools

### New Table: `station_service_pricing`
```sql
CREATE TABLE station_service_pricing (
    id UUID PRIMARY KEY,
    station_id UUID REFERENCES stations(id),
    service_type VARCHAR(30) NOT NULL,  -- 'refuel', 'repair', 'market_fee'
    base_price DECIMAL(18,2) DEFAULT 0.00,
    price_per_unit DECIMAL(18,2),
    reputation_discount_enabled BOOL DEFAULT true,
    max_discount_percent DECIMAL(5,2) DEFAULT 20.00,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (station_id, service_type)
);
```

**Use Case**: Display station service pricing in UI before purchase

---

## Updated Data Models

### PlayerProfile (Identity Service)
```typescript
interface PlayerProfile {
  id: string;
  account_id: string;
  display_name: string;
  credits: string;  // NEW - Use decimal.js or string for precision
  preferences: Record<string, string>;
  achievements: string[];
  created_at: string;
}
```

**Important**: Always treat `credits` as a string or use a Decimal library (e.g., `decimal.js`, `big.js`) to avoid floating-point precision errors.

```typescript
// ❌ WRONG - Floating point errors
const newBalance = 1000.50 + 0.20;  // 1000.7000000000001

// ✅ CORRECT - Use Decimal
import Decimal from 'decimal.js';
const newBalance = new Decimal(1000.50).plus(0.20);  // 1000.70
```

---

## UI/UX Requirements

### 1. Credits Display (HUD)
**Location**: Top-right corner or status bar
**Format**: `1,234.56 CR` or `₡1,234.56`
**Behavior**:
- Animate on change (count-up/count-down)
- Flash green on increase, red on decrease
- Tooltip shows last transaction

**Example**:
```tsx
<CreditsDisplay
  credits={player.credits}
  animated={true}
  showLastTransaction={true}
/>
```

---

### 2. Station Services Panel (When Docked)

**Required Elements**:
- Ship status: Current fuel, hull, shield
- Service pricing with discounts
- "Refuel" and "Repair" buttons
- Cost preview
- Insufficient credits warning

**Mockup**:
```
┌─────────────────────────────────────┐
│  NEW EDEN TRADE HUB - Services      │
├─────────────────────────────────────┤
│  Your Ship: Stargazer               │
│  Fuel: [████████░░] 80/100          │
│  Hull: [██████████] 900/900         │
│  Shield: [██████████] 500/500       │
├─────────────────────────────────────┤
│  ⛽ REFUEL                           │
│  Fill Tank (20 units)               │
│  Cost: 20.00 CR (10% discount)      │
│  [Refuel Tank]                      │
├─────────────────────────────────────┤
│  🔧 REPAIR                           │
│  No repairs needed                  │
│  [ Repair Hull ] [ Repair Shield ]  │
├─────────────────────────────────────┤
│  Credits: 980.00 CR                 │
└─────────────────────────────────────┘
```

---

### 3. Refuel Flow

**User Action**: Click "Refuel Tank" button

**Frontend Steps**:
1. Disable button, show loading spinner
2. Calculate max fuel that can be purchased with current credits
3. POST to `/v1/stations/refuel` with `amount: 0` (fill tank)
4. On success:
   - Wait for SSE events (fuel_purchased, credits_changed)
   - Update UI from event payloads
   - Show success toast
5. On error:
   - Show error message from API
   - Re-enable button

**Code Example**:
```typescript
async function handleRefuel() {
  setLoading(true);
  try {
    const response = await fetch('/v1/stations/refuel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ship_id: currentShip.id,
        amount: 0  // Fill tank
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const data = await response.json();
    showToast(`Refueled ${data.data.amount_added} units for ${data.data.cost_paid} CR`, 'success');

    // State will update via SSE events
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setLoading(false);
  }
}
```

---

### 4. Repair Flow

**User Action**: Click "Repair Hull" or "Repair Shield"

**Frontend Steps**:
1. Show repair confirmation modal with cost preview
2. User confirms repair
3. POST to `/v1/stations/repair`
4. On success:
   - Wait for SSE events (repair_completed, credits_changed)
   - Animate HP bars restoring
   - Show success toast
5. On error:
   - Show error message

**Cost Preview Calculation**:
```typescript
function calculateRepairCost(ship: Ship, station: Station, repairHull: boolean, repairShield: boolean) {
  const pricing = station.servicePricing.repair;

  let damage = 0;
  if (repairHull) damage += ship.hull_max - ship.hull_points;
  if (repairShield) damage += ship.shield_max - ship.shield_points;

  const baseCost = new Decimal(pricing.base_price);
  const damageCost = new Decimal(pricing.price_per_unit).times(damage);
  const totalCost = baseCost.plus(damageCost);

  // Apply reputation discount
  if (pricing.reputation_discount_enabled && playerReputation > 0) {
    const discountPercent = new Decimal(playerReputation)
      .div(1000)
      .times(pricing.max_discount_percent)
      .div(100);
    return totalCost.times(new Decimal(1).minus(discountPercent));
  }

  return totalCost;
}
```

---

## SSE Integration

### Connecting to Events

The Fanout service broadcasts all events. Frontend should connect once and filter relevant events.

**Connection**:
```typescript
const eventSource = new EventSource(`${FANOUT_URL}/sse?channel=player.${playerId}`, {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  handleGameEvent(data);
});
```

**Event Handler**:
```typescript
function handleGameEvent(event: GameEvent) {
  switch (event.type) {
    case 'fuel_purchased':
      handleFuelPurchased(event.payload);
      break;
    case 'repair_completed':
      handleRepairCompleted(event.payload);
      break;
    case 'credits_changed':
      handleCreditsChanged(event.payload);
      break;
    // ... other event types
  }
}

function handleFuelPurchased(payload: FuelPurchasedPayload) {
  // Update ship fuel in state
  updateShip(payload.ship_id, { fuel_current: payload.fuel_remaining });

  // Show notification
  showToast(`⛽ Refueled ${payload.amount} units at ${payload.station_name}`, 'success');

  // Play sound
  playSound('refuel');
}

function handleCreditsChanged(payload: CreditsChangedPayload) {
  // Animate credits counter
  animateCredits(payload.old_balance, payload.new_balance);

  // Update player state
  updatePlayer({ credits: payload.new_balance });
}
```

---

## Error Handling

### Network Errors
```typescript
try {
  const response = await fetch('/v1/stations/refuel', { ... });
  if (!response.ok) {
    const error = await response.json();
    handleStationServiceError(error.error.code, error.error.message);
  }
} catch (error) {
  // Network failure
  showToast('Network error. Please check your connection.', 'error');
}
```

### Station Service Error Codes

| Code | User Message | Suggested Action |
|------|--------------|------------------|
| `AUTH_REQUIRED` | "You must be logged in" | Redirect to login |
| `SHIP_NOT_DOCKED` | "You must dock at a station first" | Show navigation to nearest station |
| `SERVICE_NOT_AVAILABLE` | "This station doesn't offer this service" | Disable service button |
| `INSUFFICIENT_CREDITS` | "Not enough credits. Need {amount} CR more." | Show cost vs. available credits |
| `FUEL_FULL` | "Your fuel tank is already full" | Disable refuel button |
| `SHIP_FULLY_REPAIRED` | "Your ship is already at full health" | Disable repair buttons |
| `SHIP_NOT_FOUND` | "Ship not found" | Reload ship data |
| `STATION_NOT_FOUND` | "Station not found" | Reload station data |
| `PRICING_ERROR` | "Service pricing unavailable" | Show error, disable service |

---

## Testing Checklist

### Unit Tests
- [ ] Credits display formats correctly (with commas, decimal places)
- [ ] Repair cost calculation matches backend formula
- [ ] Refuel cost calculation matches backend formula
- [ ] Reputation discount calculation is accurate
- [ ] Decimal precision handling (no floating point errors)

### Integration Tests
- [ ] Refuel API call succeeds when docked with sufficient credits
- [ ] Refuel API call fails with proper error when not docked
- [ ] Refuel API call fails when insufficient credits
- [ ] Repair API call succeeds when docked with sufficient credits
- [ ] Repair API call fails when ship is fully repaired
- [ ] SSE events update UI correctly
- [ ] Credits animate smoothly on change
- [ ] Transaction history displays correctly

### E2E Tests
- [ ] User can dock at station
- [ ] User can see station services panel
- [ ] User can refuel ship
- [ ] User sees credits deducted
- [ ] User sees fuel gauge update
- [ ] User can repair ship
- [ ] User sees HP bars animate
- [ ] User sees reputation discount applied
- [ ] User cannot refuel with insufficient credits
- [ ] User cannot refuel when tank is full

---

## Performance Considerations

1. **Decimal Library**: Use `decimal.js` or `big.js` for all credit calculations
2. **SSE Throttling**: Events are published immediately; no throttling needed
3. **Animation**: Keep credit counter animations under 500ms for responsiveness
4. **Caching**: Cache station pricing data (doesn't change frequently)
5. **Optimistic Updates**: Wait for SSE events instead of optimistically updating UI

---

## Migration Notes

### Existing Players
- All existing players have been credited with 1000 CR
- No frontend migration needed
- Credits will appear immediately on next login

### API Versioning
- Endpoints are versioned: `/v1/stations/...`
- No breaking changes to existing Identity service Ship API
- New field `credits` added to PlayerProfile (backwards compatible)

---

## Support

**Backend Team Contact**: [Your Team]
**API Documentation**: `/docs/api` (Swagger/OpenAPI)
**Test Environment**: `https://test.ssw-galaxy.com`
**Production Environment**: `https://api.ssw-galaxy.com`

**Known Issues**: None

**Next Phases**:
- Phase 2: Resource Gathering/Mining
- Phase 3: Trading & Economy Integration
- Phase 4: Mission System
- Phase 5: Combat Loot & NPCs

---

## Example Implementation

See `examples/phase1-station-ui.tsx` for a complete React implementation of the station services panel.

**Quick Start**:
```bash
npm install decimal.js
```

```typescript
import Decimal from 'decimal.js';
import { useSSE } from './hooks/useSSE';
import { StationServicesPanel } from './components/StationServicesPanel';

function StationView({ station, ship, player }) {
  useSSE('player.' + player.id, handleGameEvent);

  return (
    <StationServicesPanel
      station={station}
      ship={ship}
      player={player}
      onRefuel={handleRefuel}
      onRepair={handleRepair}
    />
  );
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-26
**Status**: Ready for Implementation ✅
