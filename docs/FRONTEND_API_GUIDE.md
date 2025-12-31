# Frontend API Integration Guide

**Target Audience**: Agentic AI / Doctorate-level Software Engineer
**Codebase**: SSW Galaxy MMO Frontend (Expo/React Native)
**Version**: December 2025

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [API Client](#2-api-client)
3. [Authentication API](#3-authentication-api)
4. [Character API](#4-character-api)
5. [Ship API](#5-ship-api)
6. [Movement API](#6-movement-api)
7. [Travel API](#7-travel-api)
8. [Combat API](#8-combat-api)
9. [Missions API](#9-missions-api)
10. [Economy/Trading API](#10-economytrading-api)
11. [Mining API](#11-mining-api)
12. [Inventory API](#12-inventory-api)
13. [Factions API](#13-factions-api)
14. [Reputation API](#14-reputation-api)
15. [Station Services API](#15-station-services-api)
16. [Scan API](#16-scan-api)
17. [NPC API](#17-npc-api)
18. [Chat API](#18-chat-api)
19. [Sector Entities API](#19-sector-entities-api)
20. [Respawn API](#20-respawn-api)
21. [Sublight Movement API](#21-sublight-movement-api)
22. [SSE Real-Time Events](#22-sse-real-time-events)
23. [State Management](#23-state-management)
24. [Type Definitions](#24-type-definitions)

---

## 1. Architecture Overview

### Tech Stack
- **Framework**: Expo ~54.0.30 + React Native 0.81.5
- **State Management**: Zustand 5.0.2 (19 domain-specific stores)
- **Server State**: TanStack React Query 5.90.12
- **Real-Time**: Server-Sent Events via `react-native-sse`
- **3D Rendering**: React Three Fiber 9.5.0

### Data Flow Pattern
```
API Module (api/*.ts)
    | HTTP Request
Backend Server (REST API)
    | JSON Response
apiClient.ts (Token handling, error unwrapping)
    | Typed Response<T>
Zustand Store OR React Query Cache
    | Subscription/Hook
React Component
```

### File Structure
```
/api/           # API client modules (20 files)
/types/         # TypeScript type definitions (12 files)
/stores/        # Zustand stores (19 files)
/hooks/         # React hooks including SSE consumers (19 files)
/contexts/      # React contexts (Auth, SSE)
/lib/           # Core libraries (sseManager, procgen, flight)
/constants/     # Configuration (config.ts, colors.ts)
/utils/         # Utilities (storage.ts, validation.ts)
```

### Configuration
**Source**: `constants/config.ts:1-14`
```typescript
export const config = {
  API_BASE_URL: 'http://<host>:8080/v1',  // REST API base
  FANOUT_URL: 'http://<host>:8080',       // SSE Gateway endpoint
} as const;
```

---

## 2. API Client

**Source**: `api/client.ts:1-283`

### Overview
Singleton HTTP client with comprehensive authentication handling.

### Features
- Automatic Bearer token injection
- 401 error handling with token refresh
- Token rotation (access + refresh tokens updated together)
- Debounced logout to prevent race conditions
- Exponential backoff reconnection

### Core Methods
```typescript
class ApiClient {
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, body?: unknown): Promise<T>
  async patch<T>(endpoint: string, body?: unknown): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}

export const apiClient = new ApiClient();
```

### Response Unwrapping
All responses are wrapped in `ApiResponse<T>`. The client automatically unwraps:
```typescript
// api/client.ts:160-163
if (isJson) {
  const data = (await response.json()) as ApiResponse<T>;
  return data.data;  // Returns unwrapped T, not ApiResponse<T>
}
```

### Error Types
**Source**: `types/api.ts:86-97`
```typescript
interface ApiError {
  code: string;
  message: string;
}

interface ApiResponse<T> {
  data: T;
}

interface ApiErrorResponse {
  error: ApiError;
}
```

### Token Refresh Flow
**Source**: `api/client.ts:168-228`
```
401 Received -> Check if refreshing -> Refresh token -> Retry request -> Success/Logout
```

---

## 3. Authentication API

**Source**: `api/auth.ts:1-105`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/auth/signup` | Register new account | 47-48 |
| POST | `/auth/login` | Login to existing account | 54-55 |
| POST | `/auth/refresh` | Refresh access token | 61-62 |
| GET | `/auth/me` | Get current user profile | 68 |
| POST | `/auth/logout` | Logout (optional: all sessions) | 74-75 |
| POST | `/auth/password` | Change password | 81-82 |
| GET | `/auth/sessions` | List active sessions | 88-89 |
| DELETE | `/auth/sessions/{session_id}` | Revoke specific session | 95-96 |
| DELETE | `/auth/account` | Delete account (30-day grace) | 102-103 |

### Request/Response Types

```typescript
// api/auth.ts:4-40
interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
}

interface Session {
  session_id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}
```

### Response: AuthResponse
**Source**: `types/api.ts:1-7`
```typescript
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  session_id: string;
}
```

### Response: UserProfile
**Source**: `types/api.ts:9-18`
```typescript
interface UserProfile {
  account_id: string;
  email: string;
  status: string;
  home_region: string;
  profile_id: string;
  display_name: string;
  active_sessions: number;
  credits: string;  // Decimal string for precision
}
```

### Usage Pattern (via AuthContext)
**Source**: `contexts/AuthContext.tsx:133-163`
```typescript
const { user, login, signup, logout, isAuthenticated } = useAuth();

// Login
await login({ email: 'user@example.com', password: 'secret' });

// Signup
await signup({ email: 'new@example.com', password: 'secret', display_name: 'Player1' });

// Logout
await logout();
```

### Token Storage
**Source**: `utils/storage.ts:1-41`
```typescript
const storage = {
  getAccessToken(): Promise<string | null>,
  setAccessToken(token: string): Promise<void>,
  getRefreshToken(): Promise<string | null>,
  setRefreshToken(token: string): Promise<void>,
  getProfileId(): Promise<string | null>,
  setProfileId(id: string): Promise<void>,
  clearAll(): Promise<void>,
}
```

---

## 4. Character API

**Source**: `api/characters.ts:1-24`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/characters` | Create character | 14 |
| GET | `/characters/{id}` | Get character by ID | 16 |
| GET | `/characters/by-profile/{profileId}` | Get characters for profile | 18-19 |
| PATCH | `/characters/{id}` | Update character name | 21-22 |

### Request Type
```typescript
// api/characters.ts:4-10
interface CreateCharacterRequest {
  profile_id: string;
  name: string;
  faction_id: string;
  home_sector: string;
  attributes: CharacterAttributes;
}
```

### Response Type: Character
**Source**: `types/api.ts:28-36`
```typescript
interface CharacterAttributes {
  piloting: number;
  engineering: number;
  science: number;
  tactics: number;
  leadership: number;
}

interface Character {
  id: string;
  profile_id: string;
  name: string;
  home_sector: string;
  faction_id?: string;
  attributes: CharacterAttributes;
  created_at: string;
}
```

### Usage
```typescript
import { characterApi } from '@/api/characters';

// Create character
const character = await characterApi.create({
  profile_id: 'uuid',
  name: 'Commander Nova',
  faction_id: FACTION_UUIDS.terran_federation,
  home_sector: '0.0.0',
  attributes: { piloting: 3, engineering: 2, science: 2, tactics: 2, leadership: 1 }
});

// Get by profile
const characters = await characterApi.getByProfile(profileId);
```

---

## 5. Ship API

**Source**: `api/ships.ts:1-22`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/ships` | Create ship | 12 |
| GET | `/ships/{id}` | Get ship by ID | 14 |
| GET | `/ships/by-owner/{ownerId}` | Get ships for owner | 16-17 |
| PATCH | `/ships/{id}` | Update ship name | 19-20 |

### Request Type
```typescript
// api/ships.ts:4-9
interface CreateShipRequest {
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  stat_allocation: ShipStats;
}
```

### Response Type: Ship
**Source**: `types/api.ts:38-84`
```typescript
type ShipType = 'scout' | 'fighter' | 'trader' | 'explorer';
type TravelStatus = 'idle' | 'in_transit' | 'arriving';

interface ShipStats {
  hull_strength: number;
  shield_capacity: number;
  speed: number;
  cargo_space: number;
  sensors: number;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Ship {
  id: string;
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  hull_points: number;
  hull_max: number;
  shield_points: number;
  shield_max: number;
  cargo_capacity: number;
  current_cargo_used?: number;
  location_sector: string;
  position: Vector3;
  fuel_current: number;
  fuel_capacity: number;
  in_combat: boolean;
  docked_at?: string;
  last_jump_at?: string;
  created_at: string;
  stat_allocation?: ShipStats;
  travel_status?: TravelStatus;
  current_travel_id?: string;
  sensor_range?: number;
  signature?: number;
  faction_id?: string;
}
```

### Usage
```typescript
import { shipApi } from '@/api/ships';

// Create ship
const ship = await shipApi.create({
  owner_id: profileId,
  ship_type: 'scout',
  name: 'SS Voyager',
  stat_allocation: { hull_strength: 2, shield_capacity: 2, speed: 3, cargo_space: 2, sensors: 1 }
});

// Get player's ships
const ships = await shipApi.getByOwner(profileId);
```

---

## 6. Movement API

**Source**: `api/movement.ts:1-94`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/actions/jump` | Execute hyperspace jump | 17-22 |
| POST | `/actions/dock` | Dock at station | 27-33 |
| POST | `/actions/undock` | Undock from station | 38-43 |
| GET | `/stations?sector={sector}` | Get stations in sector | 49-53 |

### Request/Response Types
**Source**: `types/movement.ts:1-121`

```typescript
// Jump
interface JumpRequest {
  ship_id: string;
  target_sector: string;
}

interface JumpResponse {
  success: boolean;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  fuel_consumed: number;
  fuel_remaining: number;
  position: [number, number, number];
  message?: string;
}

// Dock
interface DockRequest {
  ship_id: string;
  station_id: string;
}

interface DockResponse {
  success: boolean;
  ship_id: string;
  station: Station;
  message?: string;
}

// Station
interface Station {
  id: string;
  name: string;
  location_sector: string;
  station_type: 'trade' | 'military' | 'research' | 'mining';
  position: Vector3;
  faction_id?: string;
  services: ('market' | 'refuel' | 'repair' | 'missions')[];
  docking_capacity: number;
  docked_ships_count: number;
}
```

### Error Handling
**Source**: `api/movement.ts:58-85`
```typescript
type MovementErrorCode =
  | 'INSUFFICIENT_FUEL'
  | 'SHIP_DOCKED'
  | 'SHIP_IN_COMBAT'
  | 'JUMP_ON_COOLDOWN'
  | 'INVALID_SECTOR'
  | 'STATION_NOT_FOUND'
  | 'NOT_IN_RANGE'
  | 'STATION_FULL'
  | 'SHIP_NOT_DOCKED'
  | 'SHIP_NOT_FOUND'
  | 'VALIDATION_ERROR';

function handleMovementError(errorCode: MovementErrorCode): string {
  // Returns user-friendly error message
}
```

### Usage
```typescript
import { movementApi } from '@/api/movement';

// Jump to sector
const jumpResult = await movementApi.jump(shipId, '5.10.-3');

// Dock at station
const dockResult = await movementApi.dock(shipId, stationId);

// Undock
await movementApi.undock(shipId);

// Get stations
const stations = await movementApi.getStations('0.0.0');
```

### SSE Events
**Source**: `types/movement.ts:89-121`
```typescript
interface ShipJumpedEvent {
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  fuel_consumed: number;
  fuel_remaining: number;
  position: [number, number, number];
}

interface ShipDockedEvent {
  ship_id: string;
  player_id: string;
  station_id: string;
  station_name: string;
  sector: string;
}
```

---

## 7. Travel API

**Source**: `api/travel.ts:1-96`

### Overview
Async travel system where ships take real time to travel between sectors.

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/v1/actions/travel` | Start async travel | 14-18 |
| GET | `/v1/travel/{travelId}` | Get travel status | 24-28 |
| GET | `/v1/ships/{shipId}/travel` | Get active travel for ship | 35-48 |
| POST | `/v1/travel/{travelId}/cancel` | Cancel travel (80% refund) | 54-58 |

### Request/Response Types
**Source**: `types/travel.ts:1-132`

```typescript
type TravelStatus = 'idle' | 'in_transit' | 'arriving';

interface TravelResponse {
  travel_id: string;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  fuel_consumed: number;
  fuel_remaining: number;
  started_at: string;
  arrives_at: string;
  travel_time_seconds: number;
  status: TravelStatus;
}

interface TravelStatusResponse {
  travel_id: string;
  ship_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  status: TravelStatus;
  started_at: string;
  arrives_at: string;
  completed_at: string | null;
  remaining_seconds: number;
  progress_percent: number;
  fuel_consumed: number;
}

interface TravelCancelResponse {
  travel_id: string;
  ship_id: string;
  from_sector: string;
  fuel_refund: number;
  message: string;
}
```

### Error Codes
```typescript
type TravelErrorCode =
  | 'SHIP_DOCKED'
  | 'SHIP_IN_COMBAT'
  | 'ALREADY_IN_TRANSIT'
  | 'JUMP_ON_COOLDOWN'
  | 'INSUFFICIENT_FUEL'
  | 'INVALID_SECTOR'
  | 'SHIP_NOT_FOUND'
  | 'TRAVEL_NOT_FOUND'
  | 'NOT_IN_TRANSIT';
```

### SSE Events
```typescript
interface TravelStartedEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  started_at: number;
  arrives_at: number;
  travel_time_seconds: number;
  fuel_consumed: number;
}

interface TravelCompletedEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  distance: number;
  arrived_at: number;
  fuel_consumed: number;
}

interface TravelInterruptedEvent {
  travel_id: string;
  ship_id: string;
  player_id: string;
  from_sector: string;
  to_sector: string;
  interrupted_at: number;
  interrupted_by: string;
  reason: 'interdiction' | 'combat';
  drop_sector: string;
}
```

### Usage
```typescript
import { travelApi } from '@/api/travel';

// Start travel
const travel = await travelApi.start(shipId, '15.20.5');

// Check status
const status = await travelApi.getStatus(travel.travel_id);

// Cancel (80% fuel refund)
const cancel = await travelApi.cancel(travel.travel_id);
```

---

## 8. Combat API

**Source**: `api/combat.ts:1-50`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/combat/initiate` | Start combat with target | 22-25 |
| GET | `/combat/{combatId}` | Get combat instance | 35-36 |
| POST | `/combat/{combatId}/flee` | Flee from combat | 46-47 |

### Request/Response Types
**Source**: `types/combat.ts:1-159`

```typescript
interface InitiateCombatRequest {
  player_id: string;
  ship_id: string;
  target_entity_id: string;
}

interface CombatParticipant {
  player_id: string;
  ship_id: string;
  name: string;
  hull: number;
  hull_max: number;
  shield: number;
  shield_max: number;
  is_alive: boolean;
  is_npc: boolean;
}

interface CombatInstance {
  combat_id: string;
  sector: string;
  participants: CombatParticipant[];
  tick: number;
  status: 'active' | 'ended';
  started_at: string;
}

interface InitiateCombatResponse {
  combat: CombatInstance;
  message: string;
}
```

### NPC Types
```typescript
type NPCType = 'pirate' | 'trader' | 'patrol';

interface NPCEntity {
  entity_id: string;
  entity_type: 'npc';
  position: [number, number, number];
  velocity: [number, number, number];
  name: string;
  faction?: string;
  npc_type: NPCType;
  hull: number;
  hull_max: number;
  shield: number;
  shield_max: number;
  level?: number;
}

// NPC Colors for UI
const NPC_COLORS: Record<NPCType, string> = {
  pirate: '#ef4444',  // Red
  trader: '#3b82f6',  // Blue
  patrol: '#10b981',  // Green
};
```

### SSE Events
```typescript
interface CombatOutcomeEvent {
  type: 'combat_outcome';
  payload: {
    combat_id: string;
    tick: number;
    events: CombatTickEvent[];
  };
}

interface CombatTickEvent {
  type: 'damage' | 'shield_break' | 'death';
  attacker?: string;
  target?: string;
  damage?: number;
  damage_type?: string;
  target_hull?: number;
  target_shield?: number;
}

interface LootReceivedEvent {
  type: 'loot_received';
  payload: {
    combat_id: string;
    player_id: string;
    credits: number;
    resources: LootedResource[];
  };
}

type CombatEndReason = 'victory' | 'defeat' | 'flee' | 'timeout';

interface CombatEndedEvent {
  type: 'combat_ended';
  payload: {
    combat_id: string;
    tick: number;
    end_reason: CombatEndReason;
  };
}
```

### Helper Functions
```typescript
// types/combat.ts:144-158
function getNPCColor(npcType: NPCType): string;
function getHealthPercentage(current: number, max: number): number;
function getTotalHealth(participant: CombatParticipant): number;
function getTotalMaxHealth(participant: CombatParticipant): number;
```

### Usage
```typescript
import { combatApi } from '@/api/combat';

// Initiate combat
const combat = await combatApi.initiateCombat({
  player_id: profileId,
  ship_id: shipId,
  target_entity_id: npcId
});

// Get combat state
const state = await combatApi.getCombat(combat.combat.combat_id);

// Attempt to flee
await combatApi.fleeCombat(combatId, profileId);
```

---

## 9. Missions API

**Source**: `api/missions.ts:1-155`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/missions/available?player_id=xxx` | Get available missions | 37-40 |
| GET | `/missions/active?player_id=xxx` | Get active missions | 65-66 |
| GET | `/missions/{missionId}` | Get mission details | 87-90 |
| POST | `/missions/{templateId}/accept` | Accept mission | 102-105 |
| POST | `/missions/{missionId}/abandon` | Abandon mission | 116 |
| GET | `/missions/completed?player_id=xxx` | Get completed missions | 139-140 |

### Request/Response Types
**Source**: `types/missions.ts:1-222`

```typescript
type MissionType = 'combat' | 'mining' | 'trade' | 'exploration' | 'delivery' | 'escort' | 'patrol';
type MissionStatus = 'active' | 'completed' | 'failed' | 'abandoned' | 'expired';
type ObjectiveStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
type ObjectiveType = 'combat_kills' | 'mine_resources' | 'visit_sector' | 'dock_at_station' | 'deliver_item' | 'trade_volume';

interface Objective {
  id: string;
  description: string;
  objective_type: ObjectiveType;
  current_progress: number;
  target_quantity: number;
  status: ObjectiveStatus;
  is_required: boolean;
  target_entity_type?: string;
  target_sector?: string;
  target_station_id?: string;
}

interface RewardItem {
  resource_type: string;
  quantity: number;
  quality: number;
}

interface Mission {
  id: string;
  template_name: string;
  description: string;
  status: MissionStatus;
  assigned_at: string;
  expires_at?: string;
  completed_at?: string;
  progress_percentage: number;
  reward_credits: number;
  reward_reputation: number;
  reward_items?: RewardItem[];
  objectives: Objective[];
  mission_type?: MissionType;
  faction_name?: string;
}

interface MissionTemplate {
  template_id: string;
  name: string;
  description: string;
  mission_type: MissionType;
  faction_name?: string;
  required_level: number;
  required_reputation: number;
  reward_credits: number;
  reward_reputation: number;
  reward_items: RewardItem[];
  is_repeatable: boolean;
  cooldown_duration?: string;
  time_limit?: string;
  objectives: TemplateObjective[];
}
```

### SSE Events
```typescript
interface MissionAssignedEvent {
  type: 'mission_assigned';
  player_id: string;
  mission_id: string;
  template_name: string;
  timestamp: string;
}

interface ObjectiveUpdatedEvent {
  type: 'objective_updated';
  player_id: string;
  mission_id: string;
  objective_id: string;
  current_progress: number;
  target_quantity: number;
  status: ObjectiveStatus;
  timestamp: string;
}

interface MissionCompletedEvent {
  type: 'mission_completed';
  player_id: string;
  mission_id: string;
  template_name: string;
  credits_awarded: number;
  reputation_awarded: number;
  items_awarded: RewardItem[];
  timestamp: string;
}
```

### Usage
```typescript
import { missionsApi } from '@/api/missions';

// Get available missions
const available = await missionsApi.getAvailable();

// Accept mission
const mission = await missionsApi.accept(templateId);

// Get active missions
const active = await missionsApi.getActive();

// Abandon mission
await missionsApi.abandon(missionId);

// Get completed history
const { missions, total } = await missionsApi.getCompleted(20, 0);
```

---

## 10. Economy/Trading API

**Source**: `api/economy.ts:1-102`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/markets/{marketId}/orders` | Place buy/sell order | 29-35 |
| GET | `/markets/{marketId}/orderbook?commodity=xxx` | Get orderbook | 50-52 |
| GET | `/markets/{marketId}/trades?commodity=xxx&limit=N` | Get trade history | 69-71 |
| GET | `/markets/orders?player_id=xxx` | Get player's orders | 78-79 |
| DELETE | `/markets/{marketId}/orders/{orderId}?commodity=xxx&side=xxx` | Cancel order | 97-99 |

### Request/Response Types
**Source**: `types/economy.ts:1-133`

```typescript
type OrderSide = 'buy' | 'sell';
type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled';

interface PlaceOrderRequest {
  player_id: string;
  commodity: string;
  side: OrderSide;
  price: string;  // Decimal string for precision
  quantity: number;
}

interface OrderFill {
  fill_id: string;
  matched_order_id: string;
  price: string;
  quantity: number;
  timestamp: string;
}

interface PlaceOrderResponse {
  order_id: string;
  status: OrderStatus;
  fills: OrderFill[];
}

interface OrderbookLevel {
  price: string;
  quantity: number;
}

interface Orderbook {
  bids: OrderbookLevel[];  // Buy orders (descending by price)
  asks: OrderbookLevel[];  // Sell orders (ascending by price)
  spread: string;
  midpoint: string;
}

interface Trade {
  trade_id: string;
  commodity: string;
  quantity: number;
  price: string;
  total: string;
  executed_at: string;
}

// Available commodities
const COMMODITIES = ['ore', 'fuel', 'water', 'food', 'electronics', 'weapons', 'medicine', 'luxury_goods'];
```

### SSE Events
```typescript
interface TradeExecutedEvent {
  type: 'trade_executed';
  payload: {
    trade_id: string;
    order_id: string;
    commodity: string;
    quantity: number;
    price: number;
    total: number;
    role: 'buyer' | 'seller';
  };
}

interface CreditsChangedEvent {
  type: 'credits_changed';
  payload: {
    player_id: string;
    old_balance: number;
    new_balance: number;
    amount_changed: number;
    reason: string;
    transaction_id: string;
  };
}
```

### Usage
```typescript
import { economyApi } from '@/api/economy';

// Place order
const order = await economyApi.placeOrder(marketId, playerId, {
  commodity: 'ore',
  side: 'buy',
  price: '100.00',
  quantity: 50
});

// Get orderbook
const orderbook = await economyApi.getOrderbook(marketId, 'ore');

// Get trade history
const history = await economyApi.getTradeHistory(marketId, 'ore', 50);

// Cancel order
await economyApi.cancelOrder(marketId, orderId, 'ore', 'buy');
```

---

## 11. Mining API

**Source**: `api/mining.ts:1-58`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/mining/nodes?sector=xxx` | Get resource nodes | 31-33 |
| POST | `/mining/extract` | Extract resources | 47 |
| GET | `/mining/nodes/{nodeId}` | Get specific node | 55 |

### Request/Response Types
**Source**: `types/mining.ts:1-171`

```typescript
interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface ResourceNode {
  id: string;
  sector: string;
  position: Position3D;
  resource_type: string;
  richness: number;
  quantity_remaining: number;
  quality_mean: string;  // Decimal string
  quality_stddev?: string;
  respawns: boolean;
}

interface ExtractionRequest {
  ship_id: string;
  resource_node_id: string;
  quantity: number;
}

interface ExtractionResult {
  extraction_id: string;
  quantity_extracted: number;
  quality: string;  // Decimal string
  node_quantity_remaining: number;
  ship_cargo_used: number;
  ship_cargo_capacity: number;
  extraction_time_seconds: number;
}

// Resource types
const RESOURCE_TYPES = ['iron_ore', 'copper_ore', 'gold_ore', 'titanium_ore', 'platinum_ore', 'uranium_ore', 'ice', 'helium'];
```

### Helper Functions
**Source**: `types/mining.ts:112-170`
```typescript
// Get quality tier info from numeric value
function getQualityInfo(quality: number | string): {
  tier: 'poor' | 'average' | 'good' | 'excellent';
  color: string;
  label: string;
}

// Get resource color for UI
function getResourceColor(resourceType: string): string;

// Calculate 3D distance
function calculateDistance(pos1: Position3D, pos2: Position3D): number;

// Check mining range (1000 units)
function isInMiningRange(shipPos: Position3D, nodePos: Position3D): boolean;
```

### SSE Events
```typescript
interface ResourceExtractedEvent {
  type: 'resource_extracted';
  payload: {
    ship_id: string;
    player_id: string;
    resource_type: string;
    quantity: number;
    quality: string;
    node_quantity_remaining: number;
    sector: string;
  };
}
```

### Usage
```typescript
import { miningApi } from '@/api/mining';
import { isInMiningRange, getQualityInfo } from '@/types/mining';

// Get nodes in sector
const response = await miningApi.getNodes('0.0.0', 'iron_ore');

// Check range before mining
if (isInMiningRange(shipPosition, node.position)) {
  const result = await miningApi.extractResources({
    ship_id: shipId,
    resource_node_id: node.id,
    quantity: 10
  });

  const quality = getQualityInfo(result.quality);
  console.log(`Extracted ${quality.label} quality ore`);
}
```

---

## 12. Inventory API

**Source**: `api/inventory.ts:1-88`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/inventory/{ownerId}?owner_type=xxx` | Get inventory | 74-76 |
| POST | `/inventory/transfer` | Transfer items | 81-84 |

### Request/Response Types
```typescript
// api/inventory.ts:3-86
type OwnerType = 'ship' | 'station' | 'planet';

type ResourceType =
  | 'iron_ore' | 'ice_water' | 'silicates' | 'hydrogen' | 'carbon'
  | 'titanium_ore' | 'platinum' | 'rare_earth' | 'xenon_gas' | 'antimatter'
  | 'exotic_crystals' | 'ancient_artifacts';

type ResourceRarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';

interface InventoryItem {
  id: string;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
  unit_volume: number;
  total_volume: number;
}

interface Inventory {
  owner_id: string;
  owner_type: OwnerType;
  capacity: number;
  used: number;
  items: InventoryItem[];
}

interface TransferRequest {
  source_id: string;
  source_type: OwnerType;
  target_id: string;
  target_type: OwnerType;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
}

interface TransferResponse {
  transfer_id: string;
  source_remaining: number;
  target_new_total: number;
  timestamp: string;
}
```

### Usage
```typescript
import { inventoryApi } from '@/api/inventory';

// Get ship inventory
const inventory = await inventoryApi.getInventory(shipId, 'ship');

// Filter by resource
const oreInventory = await inventoryApi.getInventory(shipId, 'ship', 'iron_ore');

// Transfer to station
const transfer = await inventoryApi.transfer({
  source_id: shipId,
  source_type: 'ship',
  target_id: stationId,
  target_type: 'station',
  resource_type: 'iron_ore',
  quantity: 50,
  quality: 1.2
});
```

---

## 13. Factions API

**Source**: `api/factions.ts:1-104`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/v1/factions` | List all factions | 23-25 |
| GET | `/v1/factions/{factionId}` | Get faction details | 32-35 |
| GET | `/v1/factions/{factionId}/members` | Get faction members | 42-58 |
| GET | `/v1/factions/{factionId}/relations` | Get diplomatic relations | 64-68 |
| GET | `/v1/factions/{factionId}/territory` | Get faction territory | 75-79 |
| GET | `/v1/sectors/{sectorId}/influence` | Get sector influence | 86-90 |
| GET | `/v1/galaxy/influence-map` | Get galaxy influence map | 97-101 |

### Types
**Source**: `types/factions.ts:1-250`

```typescript
interface Faction {
  id: string;
  name: string;
  description: string;
  color: string;
  emblem: string;
  home_system: string;
  member_count: number;
  founded: string;
  is_playable: boolean;
}

interface FactionDetails extends Faction {
  controlled_sectors: number;
  total_influence: number;
  capital_sector: string;
}

interface FactionRelation {
  faction_id: string;
  faction_name: string;
  status: 'allied' | 'friendly' | 'neutral' | 'unfriendly' | 'hostile' | 'at_war';
  standing: number;  // -100 to 100
  trade_modifier: number;
  combat_status: 'peace' | 'tension' | 'conflict' | 'war';
}

interface SectorInfluence {
  sector: string;
  influences: {
    faction_id: string;
    faction_name: string;
    influence: number;  // 0-100
    is_controlling: boolean;
  }[];
  controlling_faction?: string;
}

interface GalaxyInfluenceMap {
  sectors: SectorInfluence[];
  updated_at: string;
}

// Playable faction IDs
type FactionId =
  | 'terran_federation' | 'void_consortium' | 'stellar_imperium'
  | 'free_traders' | 'shadow_syndicate' | 'tech_collective'
  | 'outer_rim_alliance' | 'merchant_guild' | 'pirate_clans' | 'neutral';

// Faction UUIDs (for API calls)
const FACTION_UUIDS: Record<FactionId, string> = {
  terran_federation: '11111111-1111-1111-1111-111111111111',
  // ... etc
};

// Faction metadata for character creation
const FACTION_METADATA: Record<FactionId, FactionMetadata>;
const FACTION_COLORS: Record<FactionId, string>;
```

### Usage
```typescript
import { factionsApi } from '@/api/factions';
import { FACTION_UUIDS, FACTION_COLORS, FACTION_METADATA } from '@/types/factions';

// List all factions
const factions = await factionsApi.listFactions();

// Get faction details
const details = await factionsApi.getFaction(FACTION_UUIDS.terran_federation);

// Get relations
const relations = await factionsApi.getFactionRelations(factionId);

// Get galaxy map
const galaxyMap = await factionsApi.getGalaxyInfluenceMap();
```

---

## 14. Reputation API

**Source**: `api/reputation.ts:1-50`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/v1/players/{playerId}/reputation` | Get all reputations | 16-17 |
| GET | `/v1/players/{playerId}/reputation/{factionId}` | Get faction reputation | 22-25 |
| GET | `/v1/players/{playerId}/reputation/history` | Get reputation history | 29-43 |
| GET | `/v1/reputation/tiers` | Get tier definitions | 47-48 |

### Types
**Source**: `types/api.ts:99-181`

```typescript
type ReputationTier = 'Reviled' | 'Hostile' | 'Unfriendly' | 'Neutral' | 'Friendly' | 'Honored' | 'Exalted';

type ReputationEffect =
  | 'kill_on_sight' | 'no_access' | 'attack_on_sight' | 'higher_prices'
  | 'discounts' | 'special_missions' | 'best_prices' | 'exclusive_access';

type ReputationChangeReason =
  | 'trade' | 'mission_complete' | 'combat_kill' | 'combat_assist'
  | 'defend_station' | 'attack_station' | 'betrayal' | 'smuggling' | 'piracy';

interface FactionReputation {
  faction_id: string;
  score: number;
  tier: ReputationTier;
  effects: ReputationEffect[];
  updated_at: string;
}

interface PlayerReputations {
  player_id: string;
  reputations: FactionReputation[];
}

interface ReputationHistoryEvent {
  id: string;
  profile_id: string;
  faction_id: string;
  change_amount: number;
  reason: ReputationChangeReason;
  related_entity_id?: string;
  previous_standing: number;
  new_standing: number;
  created_at: string;
}

interface ReputationTierDefinition {
  name: ReputationTier;
  min_score: number;
  max_score: number;
  effects: ReputationEffect[];
}
```

### Usage
```typescript
import { reputationApi } from '@/api/reputation';

// Get all reputations
const reps = await reputationApi.getAllReputations(playerId);

// Get specific faction
const fedRep = await reputationApi.getFactionReputation(playerId, factionId);

// Get history
const history = await reputationApi.getReputationHistory(playerId, {
  faction_id: factionId,
  limit: 20
});

// Get tier definitions
const tiers = await reputationApi.getTiers();
```

---

## 15. Station Services API

**Source**: `api/station-services.ts:1-86`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/stations/refuel` | Refuel ship | 18-22 |
| POST | `/stations/repair` | Repair ship | 38-43 |

### Request/Response Types
**Source**: `types/station-services.ts:1-177`

```typescript
interface RefuelRequest {
  ship_id: string;
  amount: number;  // 0 = fill tank
}

interface RefuelResponse {
  success: boolean;
  amount_added: number;
  cost_paid: string;  // Decimal string
  fuel_remaining: number;
  credits_remaining: string;
  discount_applied?: string;
}

interface RepairRequest {
  ship_id: string;
  repair_hull: boolean;
  repair_shield: boolean;  // At least one must be true
}

interface RepairResponse {
  success: boolean;
  hull_repaired: number;
  shield_repaired: number;
  cost_paid: string;
  hull_current: number;
  shield_current: number;
  credits_remaining: string;
  discount_applied: string;
}

type StationServiceErrorCode =
  | 'AUTH_REQUIRED' | 'SHIP_NOT_DOCKED' | 'SERVICE_NOT_AVAILABLE'
  | 'INSUFFICIENT_CREDITS' | 'FUEL_FULL' | 'SHIP_FULLY_REPAIRED'
  | 'SHIP_NOT_FOUND' | 'STATION_NOT_FOUND' | 'PRICING_ERROR' | 'VALIDATION_ERROR';
```

### Usage
```typescript
import { stationServicesApi } from '@/api/station-services';

// Refuel (0 = fill tank)
const refuel = await stationServicesApi.refuel(shipId, 0);

// Repair hull and shields
const repair = await stationServicesApi.repair(shipId, true, true);

// Handle errors
try {
  await stationServicesApi.refuel(shipId, 100);
} catch (error) {
  const message = stationServicesApi.handleError(error.code);
}
```

---

## 16. Scan API

**Source**: `api/scan.ts:1-120`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/actions/scan` | Execute scan | 62 |

### Request/Response Types
```typescript
// api/scan.ts:8-54
interface ScanRequest {
  ship_id: string;
  scan_type: 'passive' | 'active';
  target_id?: string;  // For active scans
}

interface ScannerInfo {
  range: number;
  resolution: number;
  science_bonus: number;
}

interface ContactInfo {
  entity_id: string;
  entity_type: 'ship' | 'station' | 'asteroid' | 'anomaly';
  position: [number, number, number];
  position_accuracy: number;
  distance: number;
  signal_strength: number;
  velocity?: [number, number, number];
  heading?: number;
  classification: 'unknown' | 'friendly' | 'neutral' | 'hostile';
  details?: {
    name?: string;
    ship_type?: string;
    faction?: string;
  };
}

interface SectorScanInfo {
  hazards_detected: number;
  anomalies_detected: number;
  resource_nodes: number;
  ships_detected: number;
  stations_detected: number;
}

interface ScanResponse {
  scan_id: string;
  scanner: ScannerInfo;
  contacts: ContactInfo[];
  sector_info: SectorScanInfo;
  timestamp: number;
}
```

### Helper Functions
```typescript
// api/scan.ts:89-119
function getClassificationColor(classification: ContactInfo['classification']): string;
function getEntityTypeIcon(entityType: ContactInfo['entity_type']): string;
```

### Usage
```typescript
import { passiveScan, activeScan, getClassificationColor } from '@/api/scan';

// Passive scan (no energy cost)
const passive = await passiveScan(shipId);

// Active scan (more detailed)
const active = await activeScan(shipId, targetId);

// Get UI color for contact
const color = getClassificationColor(contact.classification);
```

---

## 17. NPC API

**Source**: `api/npc.ts:1-107`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/sectors/{sector}/npcs` | Get NPCs in sector | 64-65 |

### Response Transformation
The API transforms backend NPC format to frontend `NPCEntity` format:

```typescript
// api/npc.ts:69-81
// Backend format -> Frontend format
const npcs: NPCEntity[] = response.data.npcs.map((npc) => ({
  entity_id: npc.npc_id,
  entity_type: 'npc',
  name: `${npc.npc_type}-${npc.npc_id.substring(0, 8)}`,
  npc_type: npc.npc_type as NPCType,
  faction: npc.faction,
  position: npc.position as [number, number, number],
  velocity: [0, 0, 0],
  hull: 100,
  hull_max: 100,
  shield: 50,
  shield_max: 50,
}));
```

### Usage
```typescript
import { npcApi } from '@/api/npc';

// Get NPCs in sector
const { npcs } = await npcApi.getNPCsInSector('0.0.0');

// Filter by type
const pirates = npcs.filter(n => n.npc_type === 'pirate');
```

---

## 18. Chat API

**Source**: `api/chat.ts:1-73`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/chat/rooms?player_id=xxx` | Get available rooms | 20-21 |
| POST | `/chat/rooms` | Create room | 27-28 |
| GET | `/chat/rooms/{roomId}` | Get room details | 34-35 |
| POST | `/chat/rooms/{roomId}/join` | Join room | 41-42 |
| POST | `/chat/rooms/{roomId}/leave` | Leave room | 48-49 |
| POST | `/chat/messages` | Send message | 55-56 |
| POST | `/chat/private` | Create private DM | 62-63 |
| GET | `/chat/rooms/{roomId}/messages?limit=N` | Get message history | 70-71 |

### Types
**Source**: `types/chat.ts:1-61`

```typescript
type ChatRoomType = 'sector' | 'faction' | 'alliance' | 'global' | 'dm' | 'group';

interface ChatRoom {
  room_id: string;
  room_type: ChatRoomType;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  member_count: number;
  is_joined: boolean;
}

interface ChatMessage {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  is_system_message: boolean;
}

interface SendMessageRequest {
  room_id: string;
  content: string;
}
```

### Usage
```typescript
import { chatApi } from '@/api/chat';

// Get rooms
const { rooms } = await chatApi.getRooms(playerId);

// Send message
await chatApi.sendMessage({ room_id: roomId, content: 'Hello!' });

// Create DM
const dm = await chatApi.createPrivateRoom({ target_player_id: otherPlayerId });
```

---

## 19. Sector Entities API

**Source**: `api/sectorEntities.ts:1-92`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/sectors/{sector}/ships` | Get ships in sector | 61-64 |
| GET | `/stations?sector=xxx` | Get stations in sector | 70-74 |
| GET | `/sectors/{sector}/all-entities` | Get all entities | 80-84 |

### Response Types
```typescript
// api/sectorEntities.ts:7-52
interface SectorShip {
  id: string;
  name: string;
  owner_id: string;
  ship_type: string;
  location_sector: string;
  position: { x: number; y: number; z: number };
  is_npc: boolean;
  faction_id?: string;
}

interface ShipsInSectorResponse {
  sector: string;
  ships: SectorShip[];
  count: number;
}

interface AllEntitiesResponse {
  sector: string;
  stations: Station[];
  station_count: number;
  ships: SectorShip[];
  ship_count: number;
}
```

### Usage
```typescript
import { sectorEntitiesApi } from '@/api/sectorEntities';

// Get all ships
const ships = await sectorEntitiesApi.getShips('0.0.0', viewerProfileId);

// Get stations
const stations = await sectorEntitiesApi.getStations('0.0.0');

// Get everything
const all = await sectorEntitiesApi.getAllEntities('0.0.0');
```

---

## 20. Respawn API

**Source**: `api/respawn.ts:1-53`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| GET | `/respawn/location?player_id=xxx` | Get respawn location | 33-34 |
| POST | `/respawn/execute` | Execute respawn | 39-40 |
| GET | `/stations/nearest?sector=xxx` | Get nearest stations | 46-50 |

### Types
```typescript
// api/respawn.ts:3-27
interface RespawnLocation {
  sector: string;
  station_id: string | null;
  station_name: string | null;
  respawn_type: 'faction_station' | 'home_sector';
  distance_from_death: number;
}

interface RespawnResult {
  ship_id: string;
  respawn_sector: string;
  station_id: string | null;
  hull_percent: number;
  shield_percent: number;
  fuel_percent: number;
}

interface NearestStation {
  station_id: string;
  station_name: string;
  sector: string;
  distance: number;
  faction_id: string;
  faction_name: string;
}
```

### Usage
```typescript
import { respawnApi } from '@/api/respawn';

// Get respawn location
const location = await respawnApi.getRespawnLocation(playerId);

// Execute respawn
const result = await respawnApi.executeRespawn(playerId);

// Find nearby stations
const stations = await respawnApi.getNearestStations('5.10.0', factionId, 5);
```

---

## 21. Sublight Movement API

**Source**: `api/sublight.ts:1-101`

### Endpoints

| Method | Endpoint | Description | Source Line |
|--------|----------|-------------|-------------|
| POST | `/actions/move` | Update position | 49-51 |
| GET | `/ships/{shipId}/position` | Get server position | 57-68 |

### Types
```typescript
// api/sublight.ts:10-43
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface PositionUpdateRequest {
  ship_id: string;
  position: Vector3;
  velocity: Vector3;
  rotation: Quaternion;
  timestamp: number;  // Client timestamp
}

interface PositionUpdateResponse {
  success: boolean;
  server_position: Vector3;
  server_velocity: Vector3;
  server_rotation: Quaternion;
  server_timestamp: number;
  correction_applied: boolean;
}

type MoveErrorCode =
  | 'SHIP_DOCKED' | 'SHIP_IN_HYPERSPACE' | 'SHIP_IN_COMBAT'
  | 'OUT_OF_BOUNDS' | 'SPEED_EXCEEDED' | 'SHIP_NOT_FOUND' | 'VALIDATION_ERROR';
```

### Usage
```typescript
import { sublightApi } from '@/api/sublight';

// Update position
const response = await sublightApi.updatePosition({
  ship_id: shipId,
  position: { x: 100, y: 50, z: 0 },
  velocity: { x: 10, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  timestamp: Date.now()
});

// Check for server correction
if (response.correction_applied) {
  // Reconcile with server position
  localPosition = response.server_position;
}

// Get authoritative position
const serverPos = await sublightApi.getPosition(shipId);
```

---

## 22. SSE Real-Time Events

### SSE Manager
**Source**: `lib/sseManager.ts:1-490`

#### Architecture
- Singleton pattern
- Single persistent connection to `/v1/stream/gameplay`
- Channel-based multiplexing
- Automatic reconnection with exponential backoff
- iOS app lifecycle handling (background/foreground)

#### Connection Flow
```
connect(playerId) -> EventSource opens -> 'connected' event -> subscriberId received -> Ready
```

#### Channel Patterns
```
player.<player-id>    # Personal events (auto-subscribed)
sector.<sector-id>    # Sector activity
market.<market-id>    # Market updates
combat.<instance-id>  # Combat events
chat.<channel-name>   # Chat messages
game.*                # Broadcast to all (no subscription needed)
```

#### Event Types Registered
**Source**: `lib/sseManager.ts:159-176`
```typescript
const eventTypes = [
  'game.movement.jump', 'game.movement.dock', 'game.movement.undock',
  'game.travel.started', 'game.travel.completed', 'game.travel.cancelled', 'game.travel.interrupted',
  'game.combat.start', 'game.combat.action', 'game.combat.outcome', 'game.combat.loot',
  'game.economy.trade', 'game.economy.order_placed', 'game.economy.order_cancelled',
  'game.mining.extract',
  'game.missions.assigned', 'game.missions.objective', 'game.missions.completed',
  'game.services.fuel_purchase', 'game.services.repair',
  'game.social.reputation',
  'game.chat.message',
  'game.sector.delta',
];
```

#### Usage
```typescript
import { sseManager } from '@/lib/sseManager';

// Connect (typically done by AuthContext)
await sseManager.connect(playerId);

// Add listener
const cleanup = sseManager.addEventListener('game.combat.start', (data) => {
  console.log('Combat started:', data);
});

// Subscribe to channels
await sseManager.subscribeToSector('0.0.0');
await sseManager.subscribeToCombat(combatId);
await sseManager.subscribeToMarket(marketId);

// Unsubscribe
await sseManager.unsubscribeFromChannel('sector.0.0.0');

// Cleanup listener
cleanup();

// Disconnect (on logout)
sseManager.disconnect();
```

### Event Consumer Hook
**Source**: `hooks/useSSEEvents.ts:1-570`

#### Overview
Central hook that dispatches SSE events to Zustand stores.

#### Event Handlers
| Event | Store Updated | Source Line |
|-------|---------------|-------------|
| `game.combat.start` | combatStore | 119-135 |
| `game.combat.tick` | combatStore, respawnStore | 139-189 |
| `game.combat.loot` | lootStore | 194-211 |
| `game.combat.end` | combatStore, respawnStore | 215-243 |
| `game.movement.jump` | positionStore, locationStore | 249-266 |
| `game.movement.dock` | locationStore | 270-284 |
| `game.movement.undock` | locationStore | 288-296 |
| `game.missions.assigned` | missionStore | 302-312 |
| `game.missions.objective` | missionStore | 316-329 |
| `game.missions.completed` | missionStore, notificationStore | 333-357 |
| `game.economy.trade` | React Query invalidation | 362-374 |
| `game.mining.extract` | React Query invalidation | 390-400 |
| `game.sector.delta` | procgenStore | 406-431 |
| `game.social.reputation` | React Query, notificationStore | 437-458 |
| `game.travel.*` | positionStore, locationStore | 462-511 |
| `game.services.*` | shipSystemsStore | 516-543 |

#### Usage
```typescript
// Typically used via SSEEventProvider, not directly
import { useSSEEvents } from '@/hooks/useSSEEvents';

useSSEEvents(playerId, {
  onCombatStart: (data) => console.log('Combat!', data),
  onMissionCompleted: (data) => console.log('Mission done!', data),
  onAnyEvent: (type, data) => console.log(type, data),
});
```

### SSE Context
**Source**: `contexts/SSEEventContext.tsx:1-170`

#### Provides
```typescript
interface SSEEventContextValue {
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastError: string | null;
  subscribeToSector: (sectorId: string) => Promise<void>;
  unsubscribeFromSector: (sectorId: string) => Promise<void>;
  subscribeToCombat: (combatId: string) => Promise<void>;
  subscribeToMarket: (marketId: string) => Promise<void>;
  subscribeToChat: (channelName: string) => Promise<void>;
}
```

#### Usage
```typescript
import { useSSEContext, useSSEConnectionStatus } from '@/contexts/SSEEventContext';

// In a component
const { isConnected, subscribeToSector } = useSSEContext();

// Subscribe when entering sector
useEffect(() => {
  subscribeToSector(currentSector);
}, [currentSector]);

// Just check connection
const status = useSSEConnectionStatus();
```

---

## 23. State Management

### Zustand Stores Overview
**Source**: `stores/*.ts`

| Store | Purpose | Key State |
|-------|---------|-----------|
| `cockpitStore` | UI shell | activeRail, panelState, alerts |
| `flightStore` | Flight controls | profile, throttle, attitude |
| `positionStore` | Position tracking | currentSectorId, position, velocity |
| `locationStore` | Location context | sector, station, docked state |
| `combatStore` | Combat state | instance, participants, tick, damage |
| `combatReadinessStore` | Readiness | threatLevel, weaponStatus |
| `missionStore` | Missions | available, active, completed |
| `travelStore` | Travel | activeTravel, remainingTime |
| `travelStateStore` | Travel details | transitions, interruptions |
| `shipSystemsStore` | Ship status | hull, shield, fuel |
| `targetStore` | Targeting | selectedTarget, info |
| `npcStore` | NPCs | entities in sector |
| `procgenStore` | Procedural gen | loadedSectors, metadata |
| `notificationStore` | Notifications | toasts, alerts |
| `lootStore` | Loot | recent drops |
| `respawnStore` | Respawn | location, countdown |
| `commandStore` | Command bar | actions, ticker |
| `tradingStore` | Trading | orders, balance |
| `settingsStore` | Settings | preferences |

### Store Pattern
All stores use Zustand with `subscribeWithSelector` middleware:

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ExampleState {
  value: number;
  setValue: (v: number) => void;
}

export const useExampleStore = create<ExampleState>()(
  subscribeWithSelector((set) => ({
    value: 0,
    setValue: (v) => set({ value: v }),
  }))
);

// Usage with selector (prevents unnecessary re-renders)
const value = useExampleStore((state) => state.value);

// Or get state outside React
const currentValue = useExampleStore.getState().value;
```

### Stores Access Pattern in Hooks
**Source**: `hooks/useSSEEvents.ts:17-27`
```typescript
// Get stores without subscribing (for callbacks)
const getStores = () => ({
  combat: useCombatStore.getState(),
  loot: useLootStore.getState(),
  // ...
});

// Inside event handler
const stores = getStores();
stores.combat.setCombatInstance(data);
```

---

## 24. Type Definitions

### Core API Types
**Source**: `types/api.ts`

### Domain Types
| File | Types |
|------|-------|
| `types/movement.ts` | Station, Jump*, Dock*, MovementError* |
| `types/travel.ts` | TravelStatus, TravelRequest/Response, TravelEvent* |
| `types/combat.ts` | NPCEntity, CombatParticipant, CombatInstance, LootDrop |
| `types/missions.ts` | Mission, MissionTemplate, Objective, MissionEvent* |
| `types/economy.ts` | Order*, Orderbook, Trade, TradingEvent* |
| `types/mining.ts` | ResourceNode, ExtractionRequest/Result, MiningEvent* |
| `types/factions.ts` | Faction*, SectorInfluence, GalaxyInfluenceMap |
| `types/station-services.ts` | Refuel*, Repair*, StationServiceEvent* |
| `types/chat.ts` | ChatRoom, ChatMessage, ChatEvent* |
| `types/flight.ts` | FlightState, FlightHandlingProfile, ThrottleState |
| `types/notifications.ts` | NotificationType, Notification |

### Type Import Pattern
```typescript
// Import from type files
import type { Ship, UserProfile, Vector3 } from '@/types/api';
import type { Mission, MissionTemplate } from '@/types/missions';
import type { CombatInstance, NPCEntity } from '@/types/combat';

// Import from API files (includes request types)
import type { CreateShipRequest } from '@/api/ships';
import type { ScanRequest, ScanResponse } from '@/api/scan';
```

---

## Appendix A: Quick Reference

### Common Patterns

#### Make API Call
```typescript
import { apiClient } from '@/api/client';

const data = await apiClient.get<ResponseType>('/endpoint');
const result = await apiClient.post<ResponseType>('/endpoint', body);
```

#### Use Domain API
```typescript
import { missionsApi } from '@/api/missions';

const missions = await missionsApi.getAvailable();
```

#### Access Store State
```typescript
import { useMissionStore } from '@/stores/missionStore';

// In component (reactive)
const active = useMissionStore((s) => s.activeMissions);

// Outside component (snapshot)
const active = useMissionStore.getState().activeMissions;
```

#### Listen to SSE Events
```typescript
import { sseManager } from '@/lib/sseManager';

const cleanup = sseManager.addEventListener('game.event.type', (data) => {
  // Handle event
});

// Later
cleanup();
```

#### Invalidate React Query
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['missions'] });
```

### Error Handling Pattern
```typescript
try {
  await api.someAction(params);
} catch (error: any) {
  const message = api.handleError?.(error.code) || error.message;
  // Display to user
}
```

### Decimal String Handling
Many financial fields use strings for precision:
```typescript
const credits = parseFloat(user.credits);
const price = parseFloat(order.price);
```

---

*Document generated from codebase analysis. All source references point to actual file locations.*
