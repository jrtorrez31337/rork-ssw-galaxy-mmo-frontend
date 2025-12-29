# A3: Bug Remediation Plan
## Contract Violations & PR-Ready Fixes

**Analysis Date**: 2025-12-27
**Agent**: Integration Agent (Agent A)
**Task**: Document contract violations and provide actionable fix instructions

---

## Executive Summary

This document catalogs all discovered **contract violations** where the frontend incorrectly uses backend APIs, handles responses improperly, or violates backend contracts.

**Bug Categories**:
- **P0 (Critical)**: 3 bugs - Token handling, SSE connection management
- **P1 (High)**: 5 bugs - Error handling, schema mismatches
- **P2 (Medium)**: 7 bugs - Missing validations, UX improvements

**Total Bugs Identified**: 15
**Average Fix Time**: 1-2 hours per bug
**Total Effort**: 2-3 days for all fixes

---

## Bug List

### P0: Critical (Fix Immediately)

#### Bug #1: Missing Token Refresh - Users Logged Out After 15 Minutes

**Priority**: P0 (Critical)
**Impact**: Users forcibly logged out mid-session
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/contexts/AuthContext.tsx
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/auth.ts

**Current Behavior**:
- Access tokens expire after 15 minutes (JWT exp claim)
- Frontend makes no attempt to refresh tokens
- Users get 401 errors and are forced to re-login

**Expected Behavior** (per 02-AUTH-ACCOUNTS.apib):
- Frontend should call POST /v1/auth/refresh before token expires
- Backend returns NEW access token AND NEW refresh token
- Frontend must store BOTH new tokens (token rotation)
- Old refresh token is immediately revoked

**Contract Details**:
```typescript
// POST /v1/auth/refresh
Request: {
  refresh_token: string  // Current refresh token
}

Response: {
  access_token: string,      // NEW access token (15min lifetime)
  refresh_token: string,     // NEW refresh token (30 day lifetime)
  token_type: "Bearer",
  expires_in: 900            // Seconds until expiration
}
```

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/auth.ts
   - Add `refreshToken()` function:
   ```typescript
   export async function refreshToken(refreshToken: string) {
     const response = await fetch(`${config.API_URL}/v1/auth/refresh`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ refresh_token: refreshToken })
     });

     if (!response.ok) {
       throw new Error('Token refresh failed');
     }

     return response.json(); // Returns {access_token, refresh_token, expires_in}
   }
   ```

2. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/contexts/AuthContext.tsx
   - Add token refresh logic in useEffect:
   ```typescript
   useEffect(() => {
     const token = storage.getAccessToken();
     if (!token) return;

     // Decode JWT to get expiration
     const payload = JSON.parse(atob(token.split('.')[1]));
     const expiresAt = payload.exp * 1000; // Convert to milliseconds
     const now = Date.now();
     const timeUntilExpiry = expiresAt - now;

     // Refresh 1 minute before expiry
     const refreshTime = timeUntilExpiry - 60000;

     if (refreshTime > 0) {
       const timer = setTimeout(async () => {
         try {
           const refreshToken = storage.getRefreshToken();
           const newTokens = await api.auth.refreshToken(refreshToken);

           // CRITICAL: Store BOTH new tokens (token rotation)
           storage.setAccessToken(newTokens.access_token);
           storage.setRefreshToken(newTokens.refresh_token);
         } catch (error) {
           // Refresh failed, force logout
           logout();
         }
       }, refreshTime);

       return () => clearTimeout(timer);
     }
   }, [/* dependency on token */]);
   ```

3. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/utils/storage.ts
   - Add `getRefreshToken()` and `setRefreshToken()` functions
   - Store refresh token in separate key (e.g., 'refresh_token')

**Testing**:
- Login and wait 14 minutes
- Verify auto-refresh happens
- Verify both tokens updated in storage
- Verify old refresh token revoked (try using it again, should fail)

**Estimated Fix Time**: 2-3 hours

---

#### Bug #2: Multiple SSE Connections - Resource Leak

**Priority**: P0 (Critical)
**Impact**: Battery drain, network overhead, potential connection limits
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useCombatEvents.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useMovementEvents.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useMissionEvents.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useTradingEvents.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useReputationEvents.ts

**Current Behavior**:
- Each hook opens its own EventSource connection to /v1/stream/gameplay
- 5+ simultaneous SSE connections per client
- Connections not properly cleaned up
- Each connection subscribes to different channels

**Expected Behavior** (per 04-REALTIME-SSE.apib):
- Single EventSource connection per client
- All events multiplexed through one connection
- Channel subscriptions managed via POST /v1/stream/gameplay/subscribe
- Connection cleaned up on unmount

**Contract Details**:
```typescript
// Single SSE connection
GET /v1/stream/gameplay
Headers: {
  'X-Player-ID': string,
  'X-Session-ID': string
}
Query: ?channels=comma,separated,list

// Dynamic channel subscription
POST /v1/stream/gameplay/subscribe
Body: {
  subscriber_id: string,
  channels: string[]
}
```

**Fix Instructions**:

1. **Create File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/lib/sseManager.ts
   ```typescript
   class SSEManager {
     private eventSource: EventSource | null = null;
     private listeners: Map<string, Set<(data: any) => void>> = new Map();

     connect(playerId: string, sessionId: string, channels: string[]) {
       if (this.eventSource) return; // Already connected

       const url = `${config.FANOUT_URL}/v1/stream/gameplay?channels=${channels.join(',')}`;
       this.eventSource = new EventSource(url);

       this.eventSource.addEventListener('message', (event) => {
         const data = JSON.parse(event.data);
         const eventType = data.event || data.type;

         // Dispatch to all listeners for this event type
         const listeners = this.listeners.get(eventType);
         if (listeners) {
           listeners.forEach(listener => listener(data));
         }
       });

       // Handle connection events
       this.eventSource.addEventListener('connected', (event) => {
         console.log('SSE connected:', event.data);
       });

       this.eventSource.addEventListener('heartbeat', (event) => {
         // Handle heartbeat (30s interval)
       });
     }

     addEventListener(eventType: string, listener: (data: any) => void) {
       if (!this.listeners.has(eventType)) {
         this.listeners.set(eventType, new Set());
       }
       this.listeners.get(eventType)!.add(listener);

       return () => {
         // Cleanup function
         const listeners = this.listeners.get(eventType);
         if (listeners) {
           listeners.delete(listener);
           if (listeners.size === 0) {
             this.listeners.delete(eventType);
           }
         }
       };
     }

     disconnect() {
       if (this.eventSource) {
         this.eventSource.close();
         this.eventSource = null;
       }
       this.listeners.clear();
     }
   }

   export const sseManager = new SSEManager();
   ```

2. **Update All Event Hooks** (useCombatEvents.ts, etc.):
   ```typescript
   export function useCombatEvents() {
     useEffect(() => {
       const cleanup = sseManager.addEventListener('game.combat.start', (data) => {
         // Handle combat start event
       });

       return cleanup; // Auto-unsubscribe on unmount
     }, []);
   }
   ```

3. **Initialize in AuthContext**:
   ```typescript
   // After successful login
   sseManager.connect(playerId, sessionId, [
     'player.*',
     'game.*',
     'combat.*',
     'economy.*'
   ]);

   // On logout
   sseManager.disconnect();
   ```

**Testing**:
- Login and verify only 1 SSE connection in DevTools Network tab
- Verify all events still received
- Logout and verify connection closed
- Navigate between screens, verify connection persists

**Estimated Fix Time**: 3-4 hours

---

#### Bug #3: Hardcoded Fanout IP - Will Break in Production

**Priority**: P0 (Critical)
**Impact**: SSE connections will fail in production environment
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useCombatEvents.ts (and all other event hooks)
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/lib/config.ts

**Current Behavior**:
- Direct IP address hardcoded: `http://192.168.1.100:8084`
- Bypasses API Gateway
- Won't work in deployed environment

**Expected Behavior** (per 04-REALTIME-SSE.apib):
- Use Gateway proxy for all SSE connections
- All requests through `/v1/stream/gameplay`
- Gateway routes to Fanout service internally

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/lib/config.ts
   - Remove FANOUT_URL constant
   - Use API_URL for all requests:
   ```typescript
   export const config = {
     API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
     // Remove FANOUT_URL - all traffic goes through Gateway
   };
   ```

2. **File**: All event hooks (useCombatEvents.ts, etc.)
   - Change:
   ```typescript
   // BEFORE
   const eventSource = new EventSource(`${config.FANOUT_URL}/v1/stream/gameplay`);

   // AFTER
   const eventSource = new EventSource(`${config.API_URL}/v1/stream/gameplay`);
   ```

**Testing**:
- Verify SSE events still work
- Check Network tab shows requests to Gateway URL
- Test in production environment

**Estimated Fix Time**: 30 minutes

---

### P1: High Priority (Fix This Sprint)

#### Bug #4: Missing Error Handling - 401 Responses Crash App

**Priority**: P1 (High)
**Impact**: App crashes on authentication errors
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/ships.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/combat.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/economy.ts
- (All API client files)

**Current Behavior**:
- Some API calls don't handle 401 Unauthorized
- App continues execution with undefined data
- UI shows loading state indefinitely

**Expected Behavior** (per 06-APPENDICES.md error codes):
- 401 responses should trigger logout
- User redirected to login screen
- Error message shown

**Fix Instructions**:

1. **Create File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/lib/apiClient.ts
   ```typescript
   export async function apiRequest<T>(
     url: string,
     options: RequestInit = {}
   ): Promise<T> {
     const token = storage.getAccessToken();

     const response = await fetch(url, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         'Authorization': token ? `Bearer ${token}` : '',
         ...options.headers
       }
     });

     // Handle 401 - force logout
     if (response.status === 401) {
       storage.clearTokens();
       window.location.href = '/login';
       throw new Error('Unauthorized - session expired');
     }

     // Handle other errors
     if (!response.ok) {
       const error = await response.json();
       throw new Error(error.error?.message || 'Request failed');
     }

     return response.json();
   }
   ```

2. **Update All API Clients** (ships.ts, combat.ts, etc.):
   ```typescript
   // BEFORE
   const response = await fetch(`${config.API_URL}/v1/ships/${id}`, {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   return response.json();

   // AFTER
   return apiRequest(`${config.API_URL}/v1/ships/${id}`, {
     method: 'GET'
   });
   ```

**Testing**:
- Force 401 by using expired token
- Verify redirect to login
- Verify error message shown

**Estimated Fix Time**: 2 hours

---

#### Bug #5: SSE Event Schema Mismatch - Combat Loot Not Parsed

**Priority**: P1 (High)
**Impact**: Loot notifications fail to display
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useCombatEvents.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/stores/lootStore.ts

**Current Behavior**:
- Frontend expects loot.credits, loot.resources, loot.equipment
- Backend sends loot: {credits, resources[], equipment[]} (correct)
- But frontend tries to access data.loot_credits (wrong field name)

**Expected Behavior** (per 04-REALTIME-SSE.apib):
```typescript
{
  event: "game.combat.loot",
  combat_id: string,
  tick: number,
  npc_id: string,
  npc_type: string,
  victor_id: string,
  loot: {
    credits: number,
    resources: [{resource_type, quantity, quality}],
    equipment: []
  },
  timestamp: number
}
```

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/hooks/useCombatEvents.ts
   - Line ~45-50 (estimated)
   ```typescript
   // BEFORE
   eventSource.addEventListener('game.combat.loot', (event) => {
     const data = JSON.parse(event.data);
     lootStore.addLoot({
       credits: data.loot_credits,  // WRONG FIELD
       resources: data.loot_resources,  // WRONG FIELD
       equipment: data.loot_equipment  // WRONG FIELD
     });
   });

   // AFTER
   eventSource.addEventListener('game.combat.loot', (event) => {
     const data = JSON.parse(event.data);
     lootStore.addLoot({
       credits: data.loot.credits,  // CORRECT
       resources: data.loot.resources,  // CORRECT
       equipment: data.loot.equipment  // CORRECT
     });
   });
   ```

**Testing**:
- Start combat with NPC
- Kill NPC
- Verify loot notification appears
- Verify credits/resources shown correctly

**Estimated Fix Time**: 15 minutes

---

#### Bug #6: Incorrect Attribute Validation - Allows Negative Stats

**Priority**: P1 (High)
**Impact**: Players can create invalid characters
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/character-create.tsx

**Current Behavior**:
- Frontend only validates total points = 20
- Doesn't validate individual stat ranges
- Backend requires each stat 1-10 (per 03A-IDENTITY.apib)

**Expected Behavior**:
- Each attribute must be 1-10
- Sum of all attributes must be exactly 20
- Backend will reject with ATTRIBUTE_OUT_OF_RANGE error

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/character-create.tsx
   - Line ~100-120 (estimated, in validation function)
   ```typescript
   // Add validation
   const validateAttributes = (attrs: CharacterAttributes) => {
     const stats = [attrs.piloting, attrs.engineering, attrs.science, attrs.tactics, attrs.leadership];

     // Check each stat is 1-10
     if (stats.some(stat => stat < 1 || stat > 10)) {
       return 'Each attribute must be between 1 and 10';
     }

     // Check sum is exactly 20
     const sum = stats.reduce((a, b) => a + b, 0);
     if (sum !== 20) {
       return `Total points must be 20 (currently ${sum})`;
     }

     return null; // Valid
   };
   ```

2. **Add UI Feedback**:
   ```tsx
   {/* Show error if validation fails */}
   {error && <Text style={styles.error}>{error}</Text>}

   {/* Disable submit if invalid */}
   <Button
     disabled={validateAttributes(attributes) !== null}
     onPress={handleCreate}
   >
     Create Character
   </Button>
   ```

**Testing**:
- Try setting stat to 0 (should show error)
- Try setting stat to 11 (should show error)
- Try sum != 20 (should show error)
- Verify valid character creation works

**Estimated Fix Time**: 30 minutes

---

#### Bug #7: Ship Stat Allocation Mismatch - Wrong Sum Validation

**Priority**: P1 (High)
**Impact**: Ship creation fails with cryptic error
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/ship-customize.tsx

**Current Behavior**:
- Frontend allows 25 total stat points
- Backend requires 30 total stat points (per 03A-IDENTITY.apib)
- Backend rejects with INSUFFICIENT_POINTS error

**Expected Behavior**:
- Frontend enforces 30 total stat points
- Each stat 1-15 (per backend validation)

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/ship-customize.tsx
   - Find TOTAL_POINTS constant
   ```typescript
   // BEFORE
   const TOTAL_POINTS = 25;

   // AFTER
   const TOTAL_POINTS = 30; // Per 03A-IDENTITY.apib
   ```

2. **Add Stat Range Validation**:
   ```typescript
   const validateStats = (stats: ShipStats) => {
     const values = [stats.hull_strength, stats.shield_capacity, stats.speed, stats.cargo_space, stats.sensors];

     // Check each stat is 1-15
     if (values.some(v => v < 1 || v > 15)) {
       return 'Each stat must be between 1 and 15';
     }

     // Check sum is exactly 30
     const sum = values.reduce((a, b) => a + b, 0);
     if (sum !== 30) {
       return `Total points must be 30 (currently ${sum})`;
     }

     return null;
   };
   ```

**Testing**:
- Allocate 30 points across 5 stats
- Verify ship creation succeeds
- Try 25 points (should show error)
- Try stat > 15 (should show error)

**Estimated Fix Time**: 20 minutes

---

#### Bug #8: Mining Quality Not Sent - Backend Rejects Request

**Priority**: P1 (High)
**Impact**: Mining extraction fails
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/mining.ts

**Current Behavior**:
- Frontend calls POST /v1/mining/extract with {ship_id, resource_node_id, quantity}
- Backend requires quality parameter (per 03B-WORLDSIM.apib)
- Backend uses quality from node if not provided, but better to send it

**Expected Behavior**:
```typescript
POST /v1/mining/extract
Body: {
  ship_id: string,
  resource_node_id: string,
  quantity: number,
  quality: number  // Optional, uses node quality if omitted
}
```

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/mining.ts
   - Update extractResources function
   ```typescript
   // BEFORE
   export async function extractResources(shipId: string, nodeId: string, quantity: number) {
     return apiRequest(`${config.API_URL}/v1/mining/extract`, {
       method: 'POST',
       body: JSON.stringify({
         ship_id: shipId,
         resource_node_id: nodeId,
         quantity
       })
     });
   }

   // AFTER
   export async function extractResources(
     shipId: string,
     nodeId: string,
     quantity: number,
     quality?: number
   ) {
     return apiRequest(`${config.API_URL}/v1/mining/extract`, {
       method: 'POST',
       body: JSON.stringify({
         ship_id: shipId,
         resource_node_id: nodeId,
         quantity,
         ...(quality && { quality })  // Include if provided
       })
     });
   }
   ```

**Note**: This is actually safe to ignore (backend defaults to node quality), but better to be explicit.

**Testing**:
- Mine resources
- Verify extraction works
- Check backend logs for quality value

**Estimated Fix Time**: 10 minutes

---

### P2: Medium Priority (Fix Next Sprint)

#### Bug #9: Pagination Ignored - Crashes on Large Lists

**Priority**: P2 (Medium)
**Impact**: App crashes if player has many missions/characters/ships
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/missions.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/characters.ts
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/ships.ts

**Current Behavior**:
- GET /v1/missions/completed returns paginated results: {missions[], total, limit, offset}
- Frontend expects just missions[] array
- Frontend crashes if response has pagination wrapper

**Expected Behavior** (per 03E-MISSIONS.apib):
```typescript
GET /v1/missions/completed?limit=20&offset=0
Response: {
  missions: [],
  total: number,
  limit: number,
  offset: number
}
```

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/api/missions.ts
   ```typescript
   // BEFORE
   export async function getCompletedMissions(playerId: string) {
     return apiRequest<Mission[]>(`${config.API_URL}/v1/missions/completed?player_id=${playerId}`);
   }

   // AFTER
   export async function getCompletedMissions(playerId: string, limit = 20, offset = 0) {
     const response = await apiRequest<{
       missions: Mission[],
       total: number,
       limit: number,
       offset: number
     }>(`${config.API_URL}/v1/missions/completed?player_id=${playerId}&limit=${limit}&offset=${offset}`);

     return response; // Return full pagination object
   }
   ```

2. **Update UI Components** to handle pagination:
   ```typescript
   const { missions, total } = await api.missions.getCompletedMissions(playerId);
   ```

**Testing**:
- Complete 25+ missions
- Verify pagination works
- Verify "Load More" button appears

**Estimated Fix Time**: 1 hour

---

#### Bug #10: Missing Fuel Validation - Jump Fails Silently

**Priority**: P2 (Medium)
**Impact**: Jump attempts fail without feedback
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/JumpDialog.tsx

**Current Behavior**:
- Frontend allows jump attempt regardless of fuel
- Backend rejects with INSUFFICIENT_FUEL error
- Error shown but no pre-flight validation

**Expected Behavior**:
- Frontend calculates fuel cost before attempting jump
- Shows warning if insufficient fuel
- Disables jump button if can't afford

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/JumpDialog.tsx
   ```typescript
   // Add fuel calculation
   const calculateFuelCost = (fromSector: string, toSector: string): number => {
     // Parse coordinates (e.g., "0,0,0" -> {x:0, y:0, z:0})
     const from = fromSector.split(',').map(Number);
     const to = toSector.split(',').map(Number);

     // Calculate Euclidean distance
     const dx = to[0] - from[0];
     const dy = to[1] - from[1];
     const dz = to[2] - from[2];
     const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

     // Fuel cost = distance * 10 (per backend calculation)
     return distance * 10;
   };

   // In component
   const fuelCost = calculateFuelCost(currentSector, targetSector);
   const canJump = ship.fuel_current >= fuelCost;

   return (
     <>
       <Text>Fuel Cost: {fuelCost}</Text>
       <Text>Current Fuel: {ship.fuel_current}</Text>
       {!canJump && <Text style={styles.warning}>Insufficient fuel!</Text>}
       <Button disabled={!canJump} onPress={handleJump}>Jump</Button>
     </>
   );
   ```

**Testing**:
- Attempt jump with low fuel
- Verify warning shown
- Verify button disabled
- Refuel and verify button enabled

**Estimated Fix Time**: 1 hour

---

#### Bug #11: Order Placement Without Balance Check

**Priority**: P2 (Medium)
**Impact**: Order placement fails, confusing error message
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/trading.tsx

**Current Behavior**:
- Frontend allows placing buy orders without checking credits
- Backend rejects with INSUFFICIENT_CREDITS error

**Expected Behavior**:
- Frontend calculates total cost (price * quantity)
- Warns if insufficient credits
- Shows available balance

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/trading.tsx
   ```typescript
   // Add balance check
   const totalCost = price * quantity;
   const hasEnoughCredits = playerCredits >= totalCost;

   return (
     <View>
       <Text>Total Cost: {totalCost} credits</Text>
       <Text>Your Balance: {playerCredits} credits</Text>
       {!hasEnoughCredits && (
         <Text style={styles.error}>
           Insufficient credits (need {totalCost - playerCredits} more)
         </Text>
       )}
       <Button
         disabled={!hasEnoughCredits}
         onPress={handlePlaceOrder}
       >
         Place Order
       </Button>
     </View>
   );
   ```

**Testing**:
- Try placing buy order with insufficient credits
- Verify warning shown
- Verify button disabled

**Estimated Fix Time**: 30 minutes

---

#### Bug #12: Combat Initiation Without Range Check

**Priority**: P2 (Medium)
**Impact**: Combat initiation fails, no user feedback
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/sector.tsx

**Current Behavior**:
- Frontend allows combat initiation regardless of distance
- Backend requires target within sensor range
- Backend rejects with NOT_IN_RANGE error

**Expected Behavior**:
- Frontend calculates distance to NPC
- Shows warning if out of range
- Disables attack button if too far

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/sector.tsx
   ```typescript
   // Add range check
   const calculateDistance = (pos1: Vector3, pos2: Vector3): number => {
     const dx = pos2.x - pos1.x;
     const dy = pos2.y - pos1.y;
     const dz = pos2.z - pos1.z;
     return Math.sqrt(dx*dx + dy*dy + dz*dz);
   };

   const distanceToNPC = calculateDistance(ship.position, npc.position);
   const inRange = distanceToNPC <= ship.sensor_range;

   return (
     <>
       <Text>Distance: {distanceToNPC.toFixed(0)} units</Text>
       <Text>Sensor Range: {ship.sensor_range} units</Text>
       {!inRange && <Text style={styles.warning}>Out of range!</Text>}
       <Button disabled={!inRange} onPress={handleAttack}>Attack</Button>
     </>
   );
   ```

**Testing**:
- Try attacking NPC out of range
- Verify warning shown
- Verify button disabled
- Move closer, verify button enabled

**Estimated Fix Time**: 1 hour

---

#### Bug #13: Missing Jump Cooldown Check

**Priority**: P2 (Medium)
**Impact**: Jump attempts fail during cooldown
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/JumpDialog.tsx

**Current Behavior**:
- Frontend allows jump attempts immediately after previous jump
- Backend has 10-second cooldown (per 03B-WORLDSIM.apib)
- Backend rejects with JUMP_ON_COOLDOWN error

**Expected Behavior**:
- Frontend tracks last jump timestamp
- Disables jump button during cooldown
- Shows countdown timer

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/JumpDialog.tsx
   ```typescript
   // Add cooldown tracking
   const [cooldownRemaining, setCooldownRemaining] = useState(0);

   useEffect(() => {
     if (ship.last_jump_at) {
       const lastJump = new Date(ship.last_jump_at).getTime();
       const now = Date.now();
       const elapsed = (now - lastJump) / 1000; // Seconds
       const remaining = Math.max(0, 10 - elapsed); // 10s cooldown

       setCooldownRemaining(remaining);

       if (remaining > 0) {
         const timer = setInterval(() => {
           setCooldownRemaining(prev => Math.max(0, prev - 1));
         }, 1000);

         return () => clearInterval(timer);
       }
     }
   }, [ship.last_jump_at]);

   const canJump = cooldownRemaining === 0;

   return (
     <>
       {cooldownRemaining > 0 && (
         <Text>Jump drive cooling down: {cooldownRemaining.toFixed(0)}s</Text>
       )}
       <Button disabled={!canJump} onPress={handleJump}>
         {canJump ? 'Jump' : `Cooldown: ${cooldownRemaining.toFixed(0)}s`}
       </Button>
     </>
   );
   ```

**Testing**:
- Jump to sector
- Immediately try jumping again
- Verify cooldown timer shown
- Wait 10 seconds, verify button enabled

**Estimated Fix Time**: 1 hour

---

#### Bug #14: Docking Without Range Check

**Priority**: P2 (Medium)
**Impact**: Docking attempts fail, no feedback
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/DockingDialog.tsx

**Current Behavior**:
- Frontend allows docking attempts regardless of distance
- Backend requires ship within 5000 units (per 03B-WORLDSIM.apib)
- Backend rejects with NOT_IN_RANGE error

**Expected Behavior**:
- Frontend calculates distance to station
- Shows warning if out of range
- Disables dock button if too far

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/DockingDialog.tsx
   ```typescript
   const DOCKING_RANGE = 5000; // Per backend spec

   const distanceToStation = calculateDistance(ship.position, station.position);
   const inRange = distanceToStation <= DOCKING_RANGE;

   return (
     <>
       <Text>Distance: {distanceToStation.toFixed(0)} units</Text>
       <Text>Docking Range: {DOCKING_RANGE} units</Text>
       {!inRange && <Text style={styles.warning}>Too far to dock!</Text>}
       <Button disabled={!inRange} onPress={handleDock}>Dock</Button>
     </>
   );
   ```

**Testing**:
- Try docking from far away
- Verify warning shown
- Move closer, verify button enabled

**Estimated Fix Time**: 30 minutes

---

#### Bug #15: Missing Transfer Range Check

**Priority**: P2 (Medium)
**Impact**: Resource transfers fail, no feedback
**Affected Files**:
- /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/inventory/TransferModal.tsx

**Current Behavior**:
- Frontend allows ship-to-ship transfers regardless of distance
- Backend requires ships within 1000 units (per 03B-WORLDSIM.apib)
- Backend rejects with NOT_IN_RANGE error

**Expected Behavior**:
- Frontend calculates distance between ships
- Shows warning if out of range
- Disables transfer button if too far

**Fix Instructions**:

1. **File**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/inventory/TransferModal.tsx
   ```typescript
   const TRANSFER_RANGE = 1000; // Per backend spec

   const distanceToTarget = calculateDistance(sourceShip.position, targetShip.position);
   const inRange = distanceToTarget <= TRANSFER_RANGE;

   return (
     <>
       {targetType === 'ship' && (
         <>
           <Text>Distance: {distanceToTarget.toFixed(0)} units</Text>
           {!inRange && <Text style={styles.warning}>Out of range!</Text>}
         </>
       )}
       <Button disabled={!inRange} onPress={handleTransfer}>Transfer</Button>
     </>
   );
   ```

**Testing**:
- Try transferring to distant ship
- Verify warning shown
- Move closer, verify transfer works

**Estimated Fix Time**: 30 minutes

---

## Summary Tables

### Bug Priority Distribution

| Priority | Count | Total Effort | Impact Level |
|----------|-------|--------------|--------------|
| P0 (Critical) | 3 | 6-8 hours | Very High |
| P1 (High) | 5 | 4-5 hours | High |
| P2 (Medium) | 7 | 6-7 hours | Medium |
| **Total** | **15** | **16-20 hours** | - |

### Bugs by Category

| Category | Bug Count | Examples |
|----------|-----------|----------|
| Auth/Session | 2 | Token refresh, 401 handling |
| SSE/Real-time | 3 | Multiple connections, schema mismatch, hardcoded IP |
| Validation | 5 | Stat ranges, fuel checks, range checks |
| Error Handling | 3 | 401 errors, pagination, silent failures |
| Contract Violations | 2 | Loot schema, mining quality |

### Bugs by File

| File | Bug Count | Bugs |
|------|-----------|------|
| contexts/AuthContext.tsx | 2 | Token refresh, 401 handling |
| hooks/*.ts (event hooks) | 3 | SSE connections, schema, hardcoded IP |
| app/character-create.tsx | 1 | Attribute validation |
| app/ship-customize.tsx | 1 | Stat allocation |
| components/movement/*.tsx | 3 | Range checks, cooldown |
| api/*.ts (all clients) | 5 | Error handling, pagination, quality |

---

## Testing Plan

### Unit Tests

For each bug fix, add unit tests:

```typescript
// Example: Bug #6 - Attribute Validation
describe('Character Creation Validation', () => {
  it('should reject negative attributes', () => {
    const attrs = { piloting: -1, engineering: 5, science: 5, tactics: 5, leadership: 6 };
    expect(validateAttributes(attrs)).toBeTruthy(); // Should return error
  });

  it('should reject attributes > 10', () => {
    const attrs = { piloting: 11, engineering: 3, science: 3, tactics: 2, leadership: 1 };
    expect(validateAttributes(attrs)).toBeTruthy();
  });

  it('should reject sum != 20', () => {
    const attrs = { piloting: 5, engineering: 5, science: 5, tactics: 5, leadership: 5 };
    expect(validateAttributes(attrs)).toBeTruthy(); // Sum is 25
  });

  it('should accept valid attributes', () => {
    const attrs = { piloting: 5, engineering: 4, science: 4, tactics: 4, leadership: 3 };
    expect(validateAttributes(attrs)).toBeNull(); // Valid
  });
});
```

### Integration Tests

Test full flows:
1. Login → Token refresh → API call (tests Bug #1)
2. Login → Subscribe SSE → Receive events (tests Bug #2)
3. Create character → Validate → Submit (tests Bug #6)
4. Jump sector → Cooldown → Jump again (tests Bug #13)

### Manual QA Checklist

- [ ] Login persists for >15 minutes (token refresh)
- [ ] Only 1 SSE connection in DevTools
- [ ] All API errors show user-friendly messages
- [ ] Combat loot displays correctly
- [ ] Character creation validates attributes
- [ ] Ship creation validates stats (30 points)
- [ ] Jump dialog shows fuel cost and cooldown
- [ ] Docking dialog shows range check
- [ ] Trading shows balance check
- [ ] All pagination works (missions, combat history)

---

## Implementation Order

### Sprint 1 (Week 1): Critical Fixes

**Days 1-2**: Bug #1 (Token Refresh) + Bug #4 (Error Handling)
**Days 3-4**: Bug #2 (SSE Manager) + Bug #3 (Hardcoded IP)
**Day 5**: Bug #5 (Loot Schema) + Testing

**Deliverables**: P0 bugs fixed, app stable

### Sprint 2 (Week 2): High Priority Fixes

**Day 1**: Bug #6 (Attribute Validation) + Bug #7 (Ship Stats)
**Day 2**: Bug #8 (Mining Quality) + Bug #9 (Pagination)
**Day 3-4**: Testing and polish
**Day 5**: Deploy to staging

**Deliverables**: P1 bugs fixed, validation improved

### Sprint 3 (Week 3): Medium Priority Fixes

**Day 1-2**: Range checks (Bugs #10, #12, #14, #15)
**Day 3**: Bug #11 (Order Balance) + Bug #13 (Jump Cooldown)
**Day 4-5**: Testing and documentation

**Deliverables**: All bugs fixed, comprehensive testing

---

## Next Steps

1. **Create A3-ui-surface-map.md** - Catalog all UI surfaces
2. **Create A3-mechanics-coverage-report.md** - Executive summary
3. **Begin Bug Fixes** - Start with P0 bugs (token refresh, SSE manager)

---

**End of A3 Bug Remediation Plan**
