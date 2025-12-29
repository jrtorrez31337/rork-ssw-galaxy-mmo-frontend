# SSW Galaxy MMO - Appendices (vNext 2.0)

**Version**: 2.0 (vNext)
**Status**: Implementation-Grounded
**Last Verified**: 2025-12-27

---

## Document Purpose

This document provides **reference data** for the SSW Galaxy MMO API:
- Complete error code catalog (all 57 codes)
- HTTP status code conventions
- Shared field dictionary (UUIDs, timestamps, coordinates)
- Resource types catalog
- Ship type bonuses
- Faction list and reputation tiers
- NPC types and loot tables
- Glossary of terms

---

## Error Code Catalog

### Overview

SSW Galaxy MMO uses **57 distinct error codes** across all services. Error codes follow the format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

**Header**: `X-Request-ID` header contains request ID for error tracking (NOT in body)

**Code**: Error handling is consistent across all services via shared error writer functions

---

### Error Codes by HTTP Status

#### 400 Bad Request - Client Errors

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `VALIDATION_ERROR` | General validation failure | "Invalid request body" | All services |
| `VALIDATION_PASSWORD_WEAK` | Password too weak | "Password must be at least 8 characters with uppercase, lowercase, and numbers" | Identity/Auth |
| `INSUFFICIENT_POINTS` | Point allocation error | "Character attributes must sum to exactly 20" | Identity/Character |
| `ATTRIBUTE_OUT_OF_RANGE` | Attribute value invalid | "Attribute must be between 1 and 10" | Identity/Character |
| `STAT_OUT_OF_RANGE` | Ship stat value invalid | "Stat must be between 1 and 10" | Identity/Ship |
| `INVALID_SHIP_TYPE` | Unknown ship type | "Ship type must be scout, fighter, trader, or explorer" | Identity/Ship |
| `INSUFFICIENT_FUEL` | Not enough fuel for jump | "Ship requires 0.5 fuel units for this jump" | WorldSim/Movement |
| `SHIP_DOCKED` | Action not allowed while docked | "Cannot jump while docked at station" | WorldSim/Movement |
| `SHIP_NOT_DOCKED` | Must be docked for action | "Ship must be docked at a station to refuel" | WorldSim/Station |
| `SHIP_IN_COMBAT` | Action not allowed in combat | "Cannot dock while in active combat" | WorldSim/Movement |
| `JUMP_ON_COOLDOWN` | Jump cooldown active | "Must wait 7 seconds before next jump" | WorldSim/Movement |
| `NOT_IN_RANGE` | Entity too far away | "Ship must be within 5000 units of station to dock" | WorldSim/Movement |
| `NOT_IN_SECTOR` | Entities in different sectors | "Source and target must be in same sector" | WorldSim/Inventory |
| `STATION_FULL` | No docking capacity | "Station at maximum docking capacity" | WorldSim/Movement |
| `INSUFFICIENT_QUANTITY` | Not enough resources | "Source has only 10 units, requested 20" | WorldSim/Inventory |
| `CARGO_FULL` | No cargo space available | "Ship cargo capacity full" | WorldSim/Inventory |
| `INVALID_RESOURCE` | Unknown resource type | "Resource type 'unobtanium' does not exist" | WorldSim/Inventory |
| `QUALITY_MISMATCH` | Resource quality mismatch | "Source resource quality does not match requested quality" | WorldSim/Inventory |
| `INVALID_ID` | Invalid UUID format | "Invalid mission ID format" | Missions |
| `INVALID_PLAYER_ID` | Invalid player UUID | "Invalid player ID format" | Station Services |
| `INVALID_AMOUNT` | Invalid amount value | "Amount must be greater than 0" | Station Services |
| `FUEL_FULL` | Fuel tank already full | "Ship fuel tank at maximum capacity" | Station Services |
| `SHIP_FULLY_REPAIRED` | No damage to repair | "Ship already at full health" | Station Services |
| `SERVICE_NOT_AVAILABLE` | Station lacks service | "This station does not offer repair services" | Station Services |
| `NODE_DEPLETED` | Mining node exhausted | "Resource node has insufficient quantity" | Mining |
| `BAD_REQUEST` | Generic bad request | "Invalid request parameters" | Missions |
| `ACCEPT_FAILED` | Mission accept failed | "Failed to accept mission" | Missions |
| `ABANDON_FAILED` | Mission abandon failed | "Cannot abandon mission in current state" | Missions |
| `TRADE_FAILED` | Trade execution failed | "Insufficient credits or cargo space" | Economy |
| `ORDER_INVALID` | Invalid order parameters | "Price must be greater than 0" | Economy |

**Total**: 30 error codes with status 400

---

#### 401 Unauthorized - Authentication Errors

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `AUTH_REQUIRED` | Missing authentication | "Authentication required for this endpoint" | All protected endpoints |
| `INVALID_TOKEN` | Invalid JWT token | "Invalid or malformed authentication token" | Middleware |
| `TOKEN_EXPIRED` | JWT token expired | "Authentication token has expired" | Middleware |
| `INVALID_CREDENTIALS` | Wrong email/password | "Invalid email or password" | Identity/Auth |
| `AUTH_INVALID_FORMAT` | Malformed auth header | "Authorization header must be 'Bearer <token>'" | Middleware |
| `AUTH_TOKEN_EXPIRED` | Token expiration (alt) | "Token has expired, please refresh" | Middleware |
| `UNAUTHORIZED` | General unauthorized | "Not authorized to perform this action" | Multiple services |

**Total**: 7 error codes with status 401

---

#### 402 Payment Required - Insufficient Credits

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `INSUFFICIENT_CREDITS` | Not enough credits | "Player has 500 credits, requires 1200" | Economy, Station Services |

**Total**: 1 error code with status 402

---

#### 403 Forbidden - Authorization Errors

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `ACCOUNT_SUSPENDED` | Account banned | "Account has been suspended" | Auth Middleware |
| `FORBIDDEN` | Not allowed (alt) | "You do not own this resource" | Multiple services |

**Total**: 2 error codes with status 403

---

#### 404 Not Found - Resource Not Found

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `NOT_FOUND` | Generic not found | "Resource not found" | All services |
| `SECTOR_NOT_FOUND` | Sector doesn't exist | "Sector 100,200,300 not found" | WorldSim |
| `STATION_NOT_FOUND` | Station doesn't exist | "Station not found" | WorldSim |
| `SHIP_NOT_FOUND` | Ship doesn't exist | "Ship not found" | WorldSim, Identity |
| `CHARACTER_NOT_FOUND` | Character doesn't exist | "Character not found" | Identity |
| `COMBAT_NOT_FOUND` | Combat instance not found | "Combat instance not found" | Combat |
| `ROOM_NOT_FOUND` | Chat room not found | "Chat room not found" | Chat |
| `MARKET_NOT_FOUND` | Market not found | "Market not found" | Economy |
| `FACTION_NOT_FOUND` | Faction doesn't exist | "Faction not found" | Social |
| `MISSION_NOT_FOUND` | Mission doesn't exist | "Mission not found" | Missions |
| `NODE_NOT_FOUND` | Mining node not found | "Resource node not found" | Mining |
| `NO_ROUTE_FOUND` | Trade route not found | "No trade route between sectors" | Economy |

**Total**: 12 error codes with status 404

---

#### 409 Conflict - State Conflicts

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `EMAIL_EXISTS` | Email already registered | "Email already in use" | Identity/Auth |
| `NAME_TAKEN` | Name already in use | "Character name already taken" | Identity/Character |
| `ROOM_FULL` | Chat room at capacity | "Chat room is full" | Chat |

**Total**: 3 error codes with status 409

---

#### 429 Too Many Requests - Rate Limiting

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `RATE_LIMITED` | Rate limit exceeded | "Rate limit exceeded. Retry after 45 seconds." | Gateway, Identity |

**Total**: 1 error code with status 429

---

#### 500 Internal Server Error - Server Errors

| Code | Description | Example Message | Used In |
|------|-------------|-----------------|---------|
| `SERVER_ERROR` | Generic server error | "An internal server error occurred" | All services |
| `GENERATION_ERROR` | Procedural gen failed | "Failed to generate sector data" | Procgen |
| `PUBLISH_ERROR` | Event publish failed | "Failed to publish event to NATS" | All services |
| `PRICING_ERROR` | Pricing calc failed | "Failed to calculate service pricing" | Station Services |
| `INTERNAL_ERROR` | Internal error (alt) | "Internal server error" | Missions |
| `ACTION_FAILED` | Admin action failed | "Failed to execute admin action" | Moderation |

**Total**: 6 error codes with status 500

---

### Total Error Codes

**Grand Total**: **57 error codes**

**Coverage**:
- 400 Bad Request: 30 codes
- 401 Unauthorized: 7 codes
- 402 Payment Required: 1 code
- 403 Forbidden: 2 codes
- 404 Not Found: 12 codes
- 409 Conflict: 3 codes
- 429 Too Many Requests: 1 code
- 500 Internal Server Error: 6 codes

---

## HTTP Status Code Conventions

### Success Codes

| Status | Usage | Response Envelope |
|--------|-------|-------------------|
| `200 OK` | Successful GET, POST (non-creation), PATCH, DELETE | `{"data": {...}}` |
| `201 Created` | Resource created (signup, character, ship, mission accept) | `{"data": {...}}` |

### Client Error Codes

| Status | Usage | When to Use |
|--------|-------|-------------|
| `400 Bad Request` | Validation errors, invalid input, business logic violations | Invalid JSON, missing fields, state violations (docked, in combat) |
| `401 Unauthorized` | Authentication failures | Missing token, invalid token, expired token, wrong credentials |
| `402 Payment Required` | Insufficient credits for economy operations | Refuel, repair, market trades when player lacks credits |
| `403 Forbidden` | Authorized but not permitted | Account suspended, resource not owned by requester |
| `404 Not Found` | Resource does not exist | Invalid UUIDs, sector not found, ship not found |
| `409 Conflict` | Conflict with current state | Email exists, name taken, room full, duplicate resource |
| `429 Too Many Requests` | Rate limit exceeded | Signup (3/hour), login (5/15min), general API (1000/min) |

### Server Error Codes

| Status | Usage | When to Use |
|--------|-------|-------------|
| `500 Internal Server Error` | Unexpected server errors | Database failures, NATS publish errors, procgen failures |

---

## Shared Field Dictionary

### UUID Format

**Standard**: UUID v4 (random)

**Format**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Example**: `38a87211-63b6-409b-b433-8f443e333953`

**Used For**:
- `id` (all entities)
- `profile_id` (player identity)
- `account_id` (authentication account)
- `session_id` (login session)
- `ship_id`
- `character_id`
- `station_id`
- `combat_id`
- `mission_id`
- `order_id`
- `room_id`
- `faction_id`
- `transfer_id`
- `resource_node_id`

**Validation**: Must be valid UUID v4 format, case-insensitive

**Code**: All services use `github.com/google/uuid` package

---

### Timestamp Format

**Standard**: ISO 8601 with UTC timezone

**Format**: `YYYY-MM-DDTHH:MM:SS.ssssssZ`

**Example**: `2025-12-27T12:34:56.123456Z`

**Fields**:
- `created_at` - Entity creation timestamp
- `updated_at` - Last modification timestamp
- `assigned_at` - Mission assignment timestamp
- `completed_at` - Mission completion timestamp
- `expires_at` - Mission expiration timestamp
- `last_jump_at` - Last hyperspace jump timestamp
- `timestamp` - Generic event timestamp

**Precision**: Microseconds (6 decimal places)

**Timezone**: Always UTC (Z suffix)

**Parsing**:
- JavaScript: `new Date("2025-12-27T12:34:56.123456Z")`
- Python: `datetime.fromisoformat("2025-12-27T12:34:56.123456Z")`
- Go: `time.Parse(time.RFC3339Nano, "2025-12-27T12:34:56.123456Z")`

---

### Sector Coordinates

**Format**: `x,y,z` or `x.y.z` (both accepted)

**Examples**:
- `0,0,0` - Sol System
- `1,2,-3` - Sector at (1, 2, -3)
- `0.0.0` - Alternative format (equivalent to `0,0,0`)

**Range**: Integer coordinates from -2,147,483,648 to 2,147,483,647 (int32)

**Validation Regex**: `^-?\d+[,\.]-?\d+[,\.]-?\d+$`

**Canonical Form**: `x,y,z` (comma-separated, used in responses)

**Usage**:
- `location_sector` - Ship/character current sector
- `sector_id` - Query parameter for sector-specific requests
- `from_sector`, `to_sector` - Movement events
- `home_sector` - Character starting sector

**Distance Calculation**: 3D Euclidean distance
```
distance = sqrt((x2-x1)² + (y2-y1)² + (z2-z1)²)
```

---

### Vector3 Position

**Format**: Object with `x`, `y`, `z` float64 coordinates

**Example**:
```json
{
  "x": 1500.5,
  "y": -200.3,
  "z": 800.0
}
```

**Range**: Floating point coordinates within sector bounds

**Typical Sector Size**: -10,000 to 10,000 units per axis

**Usage**:
- `position` - Ship position in 3D space
- `velocity` - Ship velocity vector
- Station positions
- Resource node positions
- NPC positions

**Distance Calculation**: 3D Euclidean distance
```
distance = sqrt((x2-x1)² + (y2-y1)² + (z2-z1)²)
```

**Critical Ranges**:
- **Docking Range**: 5,000 units
- **Mining Range**: 1,000 units
- **Ship-to-Ship Transfer Range**: 1,000 units

---

### Decimal Strings

**Format**: String representation of decimal number

**Example**: `"1234.56"` (not `1234.56` as number)

**Used For**:
- `credits` - Player credit balance
- `cost_paid` - Service costs
- `price` - Market prices
- `base_price` - Pricing configurations

**Rationale**: Prevents floating-point precision errors in financial calculations

**Parsing**:
- JavaScript: `parseFloat("1234.56")`
- Python: `Decimal("1234.56")`
- Go: `decimal.NewFromString("1234.56")` (shopspring/decimal)

**Precision**: Up to 2 decimal places for credits, variable for other values

---

## Resource Types Catalog

### Tier 1 - Common Resources

Found in most sectors, basic materials for crafting and trading.

| Resource Type | Description | Unit Volume | Typical Quality | Uses |
|---------------|-------------|-------------|-----------------|------|
| `iron_ore` | Basic metallic ore | 1.0 | 0.8 - 1.2 | Hull repairs, construction |
| `ice_water` | Frozen water ice | 1.0 | 0.9 - 1.1 | Life support, fuel processing |
| `silicates` | Silicon-based minerals | 1.0 | 0.8 - 1.2 | Electronics, sensors |
| `hydrogen` | Hydrogen gas | 1.0 | 1.0 | Fuel (1 unit = 10 LY jump) |
| `carbon` | Carbon compounds | 1.0 | 0.9 - 1.1 | Shields, advanced materials |

**Availability**: 80%+ of sectors have at least one Tier 1 resource

**Market Value**: Low (10-50 credits per unit)

---

### Tier 2 - Uncommon Resources

Found in specific sector types (nebulae, asteroid belts, specific faction territories).

| Resource Type | Description | Unit Volume | Typical Quality | Uses |
|---------------|-------------|-------------|-----------------|------|
| `titanium_ore` | Rare metallic ore | 1.5 | 1.0 - 1.4 | Advanced hull plating |
| `platinum` | Precious metal | 0.5 | 1.2 - 1.6 | High-efficiency power systems |
| `rare_earth` | Rare earth elements | 0.8 | 1.1 - 1.5 | Sensor arrays, jump drives |
| `xenon_gas` | Noble gas | 1.2 | 1.0 - 1.4 | Shield boosters |

**Availability**: 30%+ of sectors, concentrated in specific types

**Market Value**: Medium (100-500 credits per unit)

---

### Tier 3 - Rare Resources

Found in anomalies, special events, high-threat sectors, and mission rewards.

| Resource Type | Description | Unit Volume | Typical Quality | Uses |
|---------------|-------------|-------------|-----------------|------|
| `antimatter` | Exotic matter | 0.2 | 1.5 - 2.0 | Weapons, experimental tech |
| `exotic_crystals` | Crystalline structures | 0.3 | 1.6 - 2.0 | Legendary equipment |
| `ancient_artifacts` | Alien relics | 0.5 | 1.8 - 2.0 | Faction reputation, research |

**Availability**: <5% of sectors, special conditions required

**Market Value**: High (1,000-10,000+ credits per unit)

---

### Quality System

**Range**: 0.5 (poor) to 2.0 (exceptional)

**Quality Multiplier Effects**:
- **Sell Price**: `base_price × quality`
- **Crafting Outcomes**: Higher quality inputs = better crafted items
- **Faction Reputation**: Delivering high-quality resources increases reputation gains

**Quality Tiers**:
| Quality Range | Tier | Description |
|---------------|------|-------------|
| 0.50 - 0.79 | Poor | Damaged or contaminated resources |
| 0.80 - 1.19 | Standard | Typical market quality |
| 1.20 - 1.49 | Good | Above-average quality |
| 1.50 - 1.79 | Excellent | High-grade materials |
| 1.80 - 2.00 | Exceptional | Pristine, rare quality |

---

## Ship Types and Bonuses

### Ship Type Bonuses

When creating a ship, the `ship_type` applies automatic stat bonuses:

| Ship Type | Speed Bonus | Cargo Bonus | Hull Bonus | Shield Bonus | Sensor Bonus | Description |
|-----------|-------------|-------------|------------|--------------|--------------|-------------|
| `scout` | +3 | +0 | +0 | +0 | +3 | Fast, long-range sensors |
| `fighter` | +1 | +0 | +2 | +2 | +0 | Combat-focused, durable |
| `trader` | +0 | +5 | +0 | +0 | +0 | Maximum cargo capacity |
| `explorer` | +1 | +1 | +1 | +1 | +1 | Balanced stats |

**Stat Allocation**:
- Players allocate **30 points** across 5 stats (speed, cargo, hull, shield, sensor)
- Bonuses are applied **after** player allocation
- Total effective stats = player allocation + type bonus

**Example**:
```
Player allocates: speed=8, cargo=5, hull=6, shield=6, sensor=5 (total=30)
Ship type: scout (+3 speed, +3 sensor)
Final stats: speed=11, cargo=5, hull=6, shield=6, sensor=8
```

**Code**: `/services/identity/internal/handlers/ship.go:142-210`

---

### Ship Stat Effects

| Stat | Effect | Formula |
|------|--------|---------|
| **Speed** | Jump fuel cost | `fuel_cost = distance × (1.0 / speed) × sector_modifier` |
| **Cargo** | Cargo capacity | `capacity = base_capacity + (cargo × 10)` cubic meters |
| **Hull** | Hull hit points | `hull_max = 100 + (hull × 50)` |
| **Shield** | Shield hit points | `shield_max = 50 + (shield × 25)` |
| **Sensor** | Sensor range | `sensor_range = 1000 + (sensor × 500)` units |

---

## Faction List

### Major Factions

| Faction ID | Faction Name | Description | Home Sectors | Default Reputation |
|------------|--------------|-------------|--------------|---------------------|
| `terran_federation` | Terran Federation | Human alliance, lawful | Sol (0,0,0) and core systems | 0 (Neutral) |
| `mars_collective` | Mars Collective | Martian independence movement | Mars and nearby | 0 (Neutral) |
| `outer_rim_alliance` | Outer Rim Alliance | Frontier colonists | Frontier sectors | 0 (Neutral) |
| `red_hand_pirates` | Red Hand Pirates | Pirate faction, hostile | Scattered outposts | -500 (Unfriendly) |
| `zenith_corporation` | Zenith Corporation | Megacorp, trade-focused | Corporate sectors | 0 (Neutral) |
| `void_seekers` | Void Seekers | Exploration guild | Deep space | 0 (Neutral) |

---

### Minor Factions

| Faction ID | Faction Name | Description | Alignment |
|------------|--------------|-------------|-----------|
| `asteroid_miners_guild` | Asteroid Miners Guild | Mining union | Neutral |
| `free_traders_coalition` | Free Traders Coalition | Independent traders | Neutral |
| `scientific_enclave` | Scientific Enclave | Research organization | Neutral |
| `mercenary_brotherhood` | Mercenary Brotherhood | Hired guns | Neutral |

**Total Factions**: 10

**Code**: `/services/social/internal/repository/factions.go`

---

## Reputation System

### Reputation Tiers

| Tier | Reputation Range | Faction Standing | Effects |
|------|------------------|------------------|---------|
| **Exalted** | 751 to 1000 | Revered hero | Max discounts (20%), exclusive missions, faction ships |
| **Honored** | 501 to 750 | Highly respected | High discounts (15%), rare missions |
| **Friendly** | 251 to 500 | Trusted ally | Moderate discounts (10%), special missions |
| **Neutral** | -250 to 250 | Neither friend nor foe | Standard prices, basic missions |
| **Unfriendly** | -500 to -251 | Disliked | Price markup (10%), limited access |
| **Hostile** | -750 to -501 | Enemy | Price markup (25%), KOS in faction space |
| **Hated** | -1000 to -751 | Arch-enemy | Cannot dock at faction stations, KOS |

**Reputation Range**: -1000 (Hated) to +1000 (Exalted)

**Starting Reputation**: 0 (Neutral) for all factions except Red Hand Pirates (-500, Unfriendly)

---

### Reputation Gains/Losses

| Action | Reputation Change | Faction Affected |
|--------|-------------------|------------------|
| Complete faction mission | +10 to +50 | Mission-giving faction |
| Deliver high-quality resources | +5 to +20 | Receiving faction |
| Trade at faction market (per 1000 credits) | +1 | Market faction |
| Kill faction NPC | -25 to -100 | NPC's faction |
| Destroy faction station (not implemented) | -500 | Station's faction |
| Abandon faction mission | -10 to -30 | Mission-giving faction |

**Code**: `/services/social/internal/service/reputation.go`

---

## NPC Types and Loot Tables

### NPC Ship Types

| NPC Type | Threat Rating | Hull | Shield | Weapons | Avg Credits Loot | Avg Resource Loot |
|----------|---------------|------|--------|---------|------------------|-------------------|
| `pirate_scout` | 1 | 300 | 100 | Light | 50-150 | 0-10 units |
| `pirate_frigate` | 3 | 600 | 250 | Medium | 200-500 | 10-30 units |
| `pirate_cruiser` | 5 | 1200 | 500 | Heavy | 500-1500 | 30-60 units |
| `mercenary_fighter` | 2 | 450 | 150 | Medium | 100-300 | 5-20 units |
| `mercenary_gunship` | 4 | 900 | 400 | Heavy | 300-900 | 20-50 units |
| `federation_patrol` | 2 | 500 | 200 | Medium | 0 (friendly) | N/A |
| `rogue_drone` | 1 | 200 | 50 | Light | 0 | 5-15 units (salvage) |
| `elite_bounty_hunter` | 6 | 1500 | 600 | Legendary | 1000-3000 | 50-100 units |

**Threat Rating**: 1 (easiest) to 6 (extremely dangerous)

**Spawn Rate**: Higher threat ratings have lower spawn rates

---

### Loot Tables

**Loot Drop Chance** (per NPC kill):
- Credits: 100% (always drops)
- Resources: 60% chance
- Equipment: 20% chance
- Rare loot: 5% chance (Tier 2-3 resources, equipment blueprints)

**Loot Quality**:
- NPC threat rating affects loot quality
- Higher threat = higher quality resources and equipment

**Code**: `/services/combat/internal/loot/tables.go`

---

## Glossary of Terms

| Term | Definition |
|------|------------|
| **Access Token** | Short-lived JWT (15 minutes) for API authentication |
| **Active Ship** | The ship currently controlled by player |
| **Attribute** | Character stat (piloting, engineering, science, tactics, leadership) |
| **Base Price** | Starting price before quality/reputation modifiers |
| **Cargo Capacity** | Maximum volume of resources a ship can carry (cubic meters) |
| **Character** | Player-created persona with attributes and home sector |
| **Combat Instance** | Isolated combat session between ships |
| **Cooldown** | Time restriction between repeated actions (e.g., 10s jump cooldown) |
| **Credits** | In-game currency for purchases and trades |
| **Discount** | Percentage reduction in price based on reputation |
| **Docking** | Ship anchored at station, enabling station services |
| **ECDSA-256** | Elliptic Curve Digital Signature Algorithm for JWT signing |
| **Faction** | Organized group with territory, reputation, and missions |
| **Fuel** | Consumable resource for hyperspace jumps |
| **Galaxy Seed** | Deterministic seed for procedural generation (currently 42) |
| **Home Sector** | Character's starting location |
| **Hull Points** | Ship structural hit points |
| **Hyperspace Jump** | Faster-than-light travel between sectors |
| **Idempotency Key** | Header to prevent duplicate requests (planned, not enforced) |
| **Influence** | Faction control percentage in a sector (0-100%) |
| **Inventory** | Collection of resources owned by ship/station/planet |
| **ISO 8601** | Timestamp format standard (YYYY-MM-DDTHH:MM:SS.ssssssZ) |
| **JWT** | JSON Web Token for authentication |
| **Last-Event-ID** | SSE reconnection header (planned, not implemented) |
| **Loot Table** | Probability distribution of rewards from NPCs |
| **Mining** | Resource extraction from nodes |
| **Mission** | Trackable objective with rewards |
| **NATS** | Event bus for real-time pub/sub messaging |
| **NPC** | Non-Player Character (AI-controlled ship) |
| **Orderbook** | Collection of buy/sell orders in market |
| **Pagination** | Splitting large result sets into pages |
| **Point-Buy** | Stat allocation system (20 pts for character, 30 for ship) |
| **Procgen** | Procedural generation (deterministic sector creation) |
| **Profile ID** | Player account identity (UUID in JWT `sub` claim) |
| **Quality** | Resource quality multiplier (0.5 to 2.0) |
| **Rate Limiting** | Request throttling to prevent abuse |
| **Refresh Token** | Long-lived JWT (30 days) for obtaining new access tokens |
| **Reputation** | Standing with faction (-1000 to +1000) |
| **Resource Node** | Minable location in sector with specific resource type |
| **Richness** | Node quality (0.0 to 1.0), affects extraction rate |
| **Sector** | 3D coordinate location in galaxy (x,y,z) |
| **Sensor Range** | Maximum distance ship can detect entities |
| **Session** | Authenticated login session tracked by session ID |
| **Session ID** | UUID identifying login session (in JWT `sid` claim) |
| **Shield Points** | Ship energy shield hit points |
| **Ship** | Player-owned spacecraft with stats and cargo |
| **Ship Owner ID** | Profile ID that owns a ship |
| **Ship Type** | Class of ship (scout, fighter, trader, explorer) |
| **SSE** | Server-Sent Events for unidirectional real-time push |
| **Stat** | Ship numerical attribute (speed, cargo, hull, shield, sensor) |
| **Station** | Fixed structure in sector offering services |
| **Station Services** | Refuel, repair, market, missions offered by stations |
| **Threat Level** | Sector danger rating (1=safe, 5=extreme) |
| **Tick** | Server simulation cycle for respawning, NPC spawns, etc. |
| **Token Rotation** | Refresh endpoint returns NEW refresh token (old revoked) |
| **Transfer** | Moving resources between inventories |
| **UUID** | Universally Unique Identifier (v4, random) |
| **Vector3** | 3D coordinate object with x, y, z float64 values |
| **VWAP** | Volume-Weighted Average Price in markets |

---

## Summary

This appendix provides critical reference data for the SSW Galaxy MMO API:

- **57 error codes** across all services with descriptions and examples
- **HTTP status conventions** for consistent error handling
- **Shared field formats** (UUIDs, timestamps, coordinates, vectors)
- **Resource types** (Tier 1-3 with quality system)
- **Ship types** with stat bonuses
- **Factions** (10 total) and reputation system
- **NPC types** with loot tables
- **Glossary** of 50+ terms

**Critical References**:
- Use error code catalog for frontend error handling
- Use field dictionary for request/response validation
- Use resource catalog for inventory UI
- Use faction list for reputation tracking
- Use glossary for understanding API concepts

**Next Steps**:
- Return to `00-INDEX.md` for file navigation
- Read service-specific documents (03A-03H) for endpoint details
- Read `04-REALTIME-SSE.apib` for event schemas

---

**End of 06-APPENDICES.md**
