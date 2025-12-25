# Fuel System Implementation - Backend Fix Complete

## Issue Summary

The frontend team reported that the Ship API was not returning the required fuel and movement fields, causing warnings and preventing real fuel data from displaying.

## Required Fields (from Frontend Team)

```json
{
  "id": "ship-uuid",
  "fuel_current": 75.5,
  "fuel_capacity": 100.0,
  "position": { "x": 0, "y": 0, "z": 0 },
  "in_combat": false,
  "docked_at": null,
  "last_jump_at": null
}
```

## Root Cause

While the Ship model (`pkg/models/game.go`) had all the required fields defined, the Identity service's repository layer was **not querying or populating** these fields from the database.

### What Was Missing:

1. **Repository Layer** (`services/identity/internal/repository/ship.go`):
   - `GetShip()` SELECT query didn't include fuel/movement columns
   - `GetShipsByOwner()` SELECT query didn't include fuel/movement columns
   - `CreateShip()` INSERT query didn't set fuel values

2. **Service Layer** (`services/identity/internal/service/ship.go`):
   - `CreateShip()` didn't initialize fuel fields
   - `ShipResponse` struct didn't expose fuel/movement fields
   - `toResponse()` helper didn't map fuel/movement fields

## Changes Made

### 1. Repository Layer Updates (`services/identity/internal/repository/ship.go`)

#### GetShip Method
- **Added to SELECT**: `docked_at`, `last_jump_at`, `fuel_current`, `fuel_capacity`, `in_combat`
- **Added to Scan**: All corresponding fields

#### GetShipsByOwner Method
- **Added to SELECT**: `docked_at`, `last_jump_at`, `fuel_current`, `fuel_capacity`, `in_combat`
- **Added to Scan**: All corresponding fields

#### CreateShip Method
- **Added to INSERT**: `fuel_current`, `fuel_capacity`, `in_combat`
- **Added to VALUES**: Corresponding parameters

### 2. Service Layer Updates (`services/identity/internal/service/ship.go`)

#### ShipResponse Struct
Added fields:
```go
Position       models.Vector3    `json:"position"`
FuelCurrent    float64           `json:"fuel_current"`
FuelCapacity   float64           `json:"fuel_capacity"`
InCombat       bool              `json:"in_combat"`
DockedAt       *uuid.UUID        `json:"docked_at,omitempty"`
LastJumpAt     *time.Time        `json:"last_jump_at,omitempty"`
```

#### CreateShip Method
Initializes new ships with:
```go
FuelCurrent:    100.0,    // Start with full fuel
FuelCapacity:   100.0,    // Default fuel capacity
InCombat:       false,    // Not in combat initially
```

#### toResponse Helper
Now maps all fuel and movement fields from the ship model to the response.

## API Response Changes

### Before (Missing Fields):
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "ship_type": "scout",
  "hull_points": 1000,
  "hull_max": 1000,
  "shield_points": 500,
  "shield_max": 500,
  "cargo_capacity": 100,
  "location_sector": "sol"
}
```

### After (All Required Fields):
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "ship_type": "scout",
  "hull_points": 1000,
  "hull_max": 1000,
  "shield_points": 500,
  "shield_max": 500,
  "cargo_capacity": 100,
  "location_sector": "sol",
  "position": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "fuel_current": 100.0,
  "fuel_capacity": 100.0,
  "in_combat": false,
  "docked_at": null,
  "last_jump_at": null
}
```

## Database Schema Requirements

The fix assumes the following columns exist in the `ships` table:

```sql
-- These columns should already exist from migration 004
ALTER TABLE ships ADD COLUMN docked_at UUID REFERENCES stations(id);
ALTER TABLE ships ADD COLUMN last_jump_at TIMESTAMPTZ;
ALTER TABLE ships ADD COLUMN fuel_current DOUBLE PRECISION NOT NULL DEFAULT 100.0;
ALTER TABLE ships ADD COLUMN fuel_capacity DOUBLE PRECISION NOT NULL DEFAULT 100.0;
ALTER TABLE ships ADD COLUMN in_combat BOOLEAN NOT NULL DEFAULT false;
```

## Deployment Steps

1. **Build the updated identity service**:
   ```bash
   cd services/identity
   go build -o identity ./cmd
   ```

2. **Restart the identity service** to pick up the changes

3. **For existing ships in the database**, if the columns don't have values, they will use the defaults:
   - `fuel_current`: 100.0
   - `fuel_capacity`: 100.0
   - `in_combat`: false

4. **New ships** created after deployment will be properly initialized with fuel values

## Impact on Frontend

### No Frontend Changes Required! 🎉

The frontend code **does not need any modifications**. Once the backend is deployed:

1. The warning about missing fields will disappear
2. Real fuel levels will automatically display
3. All movement and combat state will be available

### Affected Endpoints

- `GET /api/ships/:id` - Returns full ship data with fuel fields
- `GET /api/ships/by-owner/:owner_id` - Returns all ships with fuel fields
- `POST /api/ships` - Creates ships with initialized fuel values

## Testing

### Manual Test (after deployment):

```bash
# Get a ship
curl -X GET http://localhost:8081/api/ships/{ship-id} \
  -H "Authorization: Bearer {token}"

# Expected response includes:
# "fuel_current": 100.0,
# "fuel_capacity": 100.0,
# "position": { "x": 0, "y": 0, "z": 0 },
# "in_combat": false,
# "docked_at": null,
# "last_jump_at": null
```

## Files Modified

1. `services/identity/internal/repository/ship.go` - Repository layer queries
2. `services/identity/internal/service/ship.go` - Service layer models and logic

## Next Steps for Fuel Consumption

These changes provide the **foundation** for the fuel system. The movement system in the WorldSim service will consume fuel during jumps using this formula:

```
fuel_cost = base_distance × (1.0 / ship_speed_stat) × sector_modifier
```

The WorldSim service will update `fuel_current` and `last_jump_at` when ships make jumps.

## Contact

If you have any questions or issues with the updated API responses, please reach out to the backend team.
