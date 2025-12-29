# A3: Capability Gap Matrix
## Backend Capabilities vs Frontend Implementation Status

**Analysis Date**: 2025-12-27
**Agent**: Integration Agent (Agent A)
**Task**: Side-by-side comparison of backend capabilities and frontend implementation

---

## Executive Summary

This matrix compares all backend capabilities (93 REST endpoints, 24 SSE events) against frontend implementation status, classifying each as **Complete**, **Partial**, or **Unused**.

**Key Metrics**:
- **Backend REST Endpoints**: 93 total
- **Frontend Usage**: 44 endpoints (47%)
- **Unused Endpoints**: 49 endpoints (53%)
- **SSE Events**: 24 total
- **Events Handled**: 21 events (88%)
- **Events Unhandled**: 3 events (12%)

**Priority Summary**:
- **P0 (Critical)**: 2 gaps - Social/Chat, Token Refresh
- **P1 (High)**: 6 gaps - Factions UI, Reputation History, Order Cancellation
- **P2 (Medium)**: 15 gaps - Combat Flee, Character Management, etc.

---

## Capability Gap Matrix by Mechanic Category

### 1. Identity / Auth / SSO

**Overall Status**: Complete (Score 4/4)
**Backend Endpoints**: 6 | **Used**: 3 | **Unused**: 3 | **Usage**: 50%

| Backend Capability | Endpoint | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------|-----------------|-------------------|----------|-------|
| User Signup | POST /v1/auth/signup | Complete | Complete | - | Fully functional |
| User Login | POST /v1/auth/login | Complete | Complete | - | Fully functional |
| Get Current User | GET /v1/auth/me | Complete | Complete | - | Used for session validation |
| Token Refresh | POST /v1/auth/refresh | Unused | Unused | P0 | Critical: Tokens expire in 15min, no auto-refresh |
| User Logout | POST /v1/auth/logout | Unused | Unused | P2 | No logout button in UI |
| Change Password | POST /v1/auth/password | Unused | Unused | P2 | No password change UI |
| Session Management | GET /v1/auth/sessions | Unused | Unused | P2 | No session list UI |

**Top Priority Gap**: Token refresh (P0) - Users get logged out mid-session after 15 minutes.

---

### 2. Player Profile / Character / Progression

**Overall Status**: Functional (Score 3/4)
**Backend Endpoints**: 4 | **Used**: 3 | **Unused**: 1 | **Usage**: 75%

| Backend Capability | Endpoint | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------|-----------------|-------------------|----------|-------|
| Create Character | POST /v1/characters | Complete | Complete | - | Point-buy system (20 points) |
| Get Character by ID | GET /v1/characters/{id} | Complete | Complete | - | Used for character details |
| List Characters | GET /v1/characters/by-profile/{id} | Complete | Complete | - | Character selection |
| Update Character Name | PATCH /v1/characters/{id} | Unused | Unused | P2 | API exists, no rename UI |

**Top Priority Gap**: Character name update UI (P2) - Low priority, works without it.

---

### 3. Ship / Loadout / Equipment

**Overall Status**: Functional (Score 3/4)
**Backend Endpoints**: 6 | **Used**: 5 | **Unused**: 1 | **Usage**: 83%
**SSE Events**: 2 | **Used**: 2 | **Unused**: 0 | **Usage**: 100%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Create Ship | POST /v1/ships | Complete | Complete | - | Point-buy system (30 points) |
| Get Ship by ID | GET /v1/ships/{id} | Complete | Complete | - | Ship details display |
| List Ships by Owner | GET /v1/ships/by-owner/{id} | Complete | Complete | - | Ship selection |
| Update Ship Name | PATCH /v1/ships/{id} | Unused | Unused | P2 | API exists, no rename UI |
| Refuel Ship | POST /v1/stations/refuel | Complete | Complete | - | Refuel UI + SSE events |
| Repair Ship | POST /v1/stations/repair | Complete | Complete | - | Repair UI + SSE events |
| Fuel Purchase Event | game.services.fuel_purchase | Complete | Complete | - | Real-time fuel updates |
| Repair Event | game.services.repair | Complete | Complete | - | Real-time hull/shield updates |

**Top Priority Gap**: Ship name update UI (P2) - Low priority, cosmetic feature.

---

### 4. Combat / Encounters

**Overall Status**: Functional (Score 3/4)
**Backend Endpoints**: 4 | **Used**: 3 | **Unused**: 1 | **Usage**: 75%
**SSE Events**: 4 | **Used**: 4 | **Unused**: 0 | **Usage**: 100%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Initiate Combat | POST /combat/initiate | Complete | Complete | - | NPC combat starts |
| Get Combat State | GET /combat/{combat_id} | Complete | Complete | - | Combat state queries |
| Flee Combat | POST /combat/{combat_id}/leave | Unused | Unused | P1 | API exists, no flee button |
| Combat History | GET /combat/history | Unused | Unused | P2 | No combat log UI |
| Combat Start Event | game.combat.start | Complete | Complete | - | Combat instance created |
| Combat Action Event | game.combat.action | Complete | Complete | - | Damage, actions tracked |
| Combat Outcome Event | game.combat.outcome | Complete | Complete | - | Victory/defeat handling |
| Combat Loot Event | game.combat.loot | Complete | Complete | - | Loot notifications |

**Top Priority Gap**: Flee button (P1) - Players can't escape losing battles.

---

### 5. Map / Navigation / Exploration

**Overall Status**: Functional (Score 3/4)
**Backend Endpoints**: 6 | **Used**: 4 | **Unused**: 2 | **Usage**: 67%
**SSE Events**: 3 | **Used**: 3 | **Unused**: 0 | **Usage**: 100%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Hyperspace Jump | POST /v1/actions/jump | Complete | Complete | - | Sector jumping with fuel |
| Dock at Station | POST /v1/actions/dock | Complete | Complete | - | Docking system works |
| Undock from Station | POST /v1/actions/undock | Complete | Complete | - | Undocking system works |
| Get Sector State | GET /v1/sectors/{sector_id} | Complete | Complete | - | Sector entity queries |
| Generate Sector | POST /v1/generate/sector | Unused | Unused | P2 | Procgen not exposed to UI |
| Get Sector by Coords | GET /v1/sectors/{x}/{y}/{z} | Unused | Unused | P2 | Coordinate-based fetch |
| Jump Event | game.movement.jump | Complete | Complete | - | Real-time jump tracking |
| Dock Event | game.movement.dock | Complete | Complete | - | Real-time docking |
| Undock Event | game.movement.undock | Complete | Complete | - | Real-time undocking |

**Top Priority Gap**: Sector generation UI (P2) - Players can't explore procedural sectors.

---

### 6. Inventory / Items / Loot

**Overall Status**: Functional (Score 3/4)
**Backend Endpoints**: 5 | **Used**: 2 | **Unused**: 3 | **Usage**: 40%
**SSE Events**: 2 | **Used**: 1 | **Unused**: 1 | **Usage**: 50%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Get Inventory | GET /v1/inventory/{owner_id} | Complete | Complete | - | Ship cargo display |
| Transfer Resources | POST /v1/inventory/transfer | Complete | Complete | - | Ship-to-station transfers |
| List Mining Nodes | GET /v1/mining/nodes | Complete | Complete | - | Resource nodes in sector |
| Extract Resources | POST /v1/mining/extract | Complete | Complete | - | Mining extraction |
| Get Node Details | GET /v1/mining/nodes/{id} | Unused | Unused | P2 | Node state queries not used |
| Mining Event | game.mining.extract | Complete | Complete | - | Real-time mining updates |
| Loot Event | game.combat.loot | Complete | Complete | - | Combat loot drops |

**Top Priority Gap**: Mining node details (P2) - Minor, current system works.

---

### 7. Crafting / Upgrades / Research

**Overall Status**: Not Surfaced (Score 0/4)
**Backend Endpoints**: 0 | **Used**: 0 | **Unused**: 0 | **Usage**: N/A

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Crafting System | N/A | N/A | Backend Missing | - | Not implemented in backend |
| Ship Upgrades | N/A | N/A | Backend Missing | - | Not implemented in backend |
| Technology Research | N/A | N/A | Backend Missing | - | Not implemented in backend |

**Top Priority Gap**: None (backend doesn't support this mechanic).

---

### 8. Economy / Trading / Market

**Overall Status**: Game-feel Complete (Score 4/4)
**Backend Endpoints**: 8 | **Used**: 3 | **Unused**: 5 | **Usage**: 38%
**SSE Events**: 3 | **Used**: 3 | **Unused**: 0 | **Usage**: 100%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Create Market | POST /v1/markets | Unused | Unused | P2 | Admin-only, not needed |
| Place Order | POST /v1/markets/{id}/orders | Complete | Complete | - | Buy/sell orders work |
| Cancel Order | DELETE /v1/markets/{id}/orders/{order_id} | Unused | Unused | P1 | API exists, no cancel button |
| Get Orderbook | GET /v1/markets/{id}/orderbook | Complete | Complete | - | Market depth display |
| Get Trade History | GET /v1/markets/{id}/trades | Complete | Complete | - | Price charts |
| Get Market Stats | GET /v1/markets/{id}/stats | Unused | Unused | P2 | Volume, trends not shown |
| Find Trade Routes | POST /v1/economy/trade-routes | Unused | Unused | P2 | Route optimizer not exposed |
| Get Pricing Info | GET /v1/economy/pricing | Unused | Unused | P2 | Price forecasts not shown |
| Trade Event | game.economy.trade | Complete | Complete | - | Order fills tracked |
| Order Placed Event | game.economy.order_placed | Complete | Complete | - | New orders tracked |
| Order Cancelled Event | game.economy.order_cancelled | Complete | Complete | - | Cancellations tracked |

**Top Priority Gap**: Order cancellation UI (P1) - Players can't cancel bad orders.

---

### 9. Microtransactions / Cosmetics

**Overall Status**: Not Surfaced (Score 0/4)
**Backend Endpoints**: 0 | **Used**: 0 | **Unused**: 0 | **Usage**: N/A

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| Microtransactions | N/A | N/A | Backend Missing | - | Not planned in roadmap |
| Premium Currency | N/A | N/A | Backend Missing | - | Not planned in roadmap |
| Cosmetics | N/A | N/A | Backend Missing | - | Not planned in roadmap |

**Top Priority Gap**: None (not in roadmap).

---

### 10. Factions / Reputation

**Overall Status**: Partial UI (Score 2/4)
**Backend Endpoints**: 12 | **Used**: 2 | **Unused**: 10 | **Usage**: 17%
**SSE Events**: 1 | **Used**: 1 | **Unused**: 0 | **Usage**: 100%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| List All Factions | GET /v1/factions | Unused | Unused | P1 | 10 factions not shown |
| Get Faction Details | GET /v1/factions/{faction_id} | Unused | Unused | P1 | No faction detail screen |
| Get Faction Members | GET /v1/factions/{faction_id}/members | Unused | Unused | P2 | No member list UI |
| Get Faction Relations | GET /v1/factions/{faction_id}/relations | Unused | Unused | P1 | Relations not shown |
| Get Faction Territory | GET /v1/factions/{faction_id}/territory | Unused | Unused | P1 | Territory map missing |
| Get Sector Influence | GET /v1/sectors/{sector_id}/influence | Unused | Unused | P2 | Influence not shown |
| Get Influence Map | GET /v1/galaxy/influence-map | Unused | Unused | P2 | Galaxy map missing |
| Get Player Reputation | GET /v1/players/{id}/reputation | Complete | Complete | - | Rep list in profile |
| Get Single Faction Rep | GET /v1/players/{id}/reputation/{faction_id} | Unused | Unused | P2 | Detail queries not used |
| Get Reputation History | GET /v1/players/{id}/reputation/history | Unused | Unused | P1 | No history timeline |
| Apply Reputation Change | POST /v1/reputation/actions | Unused | Unused | P2 | Admin-only, not needed |
| Get Reputation Tiers | GET /v1/reputation/tiers | Complete | Complete | - | Tier definitions loaded |
| Reputation Event | game.social.reputation | Complete | Complete | - | Real-time rep changes |

**Top Priority Gap**: Faction list/detail screens (P1) - Rich backend, minimal frontend.

---

### 11. Missions / Quests

**Overall Status**: Game-feel Complete (Score 4/4)
**Backend Endpoints**: 6 | **Used**: 6 | **Unused**: 0 | **Usage**: 100%
**SSE Events**: 4 | **Used**: 4 | **Unused**: 0 | **Usage**: 100%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| List Available Missions | GET /v1/missions/available | Complete | Complete | - | Mission browser works |
| Accept Mission | POST /v1/missions/{id}/accept | Complete | Complete | - | Accept flow complete |
| Abandon Mission | POST /v1/missions/{id}/abandon | Complete | Complete | - | Abandon flow complete |
| Get Mission Details | GET /v1/missions/{id} | Complete | Complete | - | Mission detail queries |
| List Active Missions | GET /v1/missions/active | Complete | Complete | - | Active missions list |
| List Completed Missions | GET /v1/missions/completed | Complete | Complete | - | Completed missions list |
| Mission Assigned Event | game.missions.assigned | Complete | Complete | - | Real-time assignment |
| Mission Objective Event | game.missions.objective | Complete | Complete | - | Real-time progress |
| Mission Completed Event | game.missions.completed | Complete | Complete | - | Real-time completion |
| Mission Failed Event | game.missions.failed | Complete | Complete | - | Real-time failures |

**Top Priority Gap**: None - fully implemented.

---

### 12. Social / Chat

**Overall Status**: Plumbing Only (Score 1/4)
**Backend Endpoints**: 7 | **Used**: 0 | **Unused**: 7 | **Usage**: 0%
**SSE Events**: 1 | **Used**: 0 | **Unused**: 1 | **Usage**: 0%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| List Chat Rooms | GET /v1/chat/rooms | Unused | Unused | P0 | No chat UI at all |
| Create Chat Room | POST /v1/chat/rooms | Unused | Unused | P0 | No room creation |
| Join Chat Room | POST /v1/chat/rooms/{id}/join | Unused | Unused | P0 | No join flow |
| Leave Chat Room | POST /v1/chat/rooms/{id}/leave | Unused | Unused | P0 | No leave flow |
| Send Chat Message | POST /v1/chat/messages | Unused | Unused | P0 | No message sending |
| Get Chat Room Details | GET /v1/chat/rooms/{id} | Unused | Unused | P0 | No room details |
| Create Private Chat | POST /v1/chat/private | Unused | Unused | P0 | No DM system |
| Chat Message Event | game.chat.message | Unused | Unused | P0 | No message handling |

**Top Priority Gap**: Entire chat system (P0) - Essential multiplayer feature missing.

---

### 13. Notifications / Events

**Overall Status**: Functional (Score 3/4)
**Backend Endpoints**: 4 | **Used**: 2 | **Unused**: 2 | **Usage**: 50%
**SSE Events**: 24 | **Used**: 21 | **Unused**: 3 | **Usage**: 88%

| Backend Capability | Endpoint/Event | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------------|-----------------|-------------------|----------|-------|
| SSE Connection | GET /v1/stream/gameplay | Complete | Complete | - | All hooks use this |
| Subscribe Channels | POST /v1/stream/gameplay/subscribe | Complete | Complete | - | Channel management |
| Unsubscribe Channels | POST /v1/stream/gameplay/unsubscribe | Unused | Unused | P2 | No unsubscribe UI |
| Get Broker Stats | GET /v1/stream/gameplay/stats | Unused | Unused | P2 | Stats not shown |
| 20+ Game Events | (See SSE Events section) | Partial | Partial | P1 | Some events unhandled |

**Top Priority Gap**: Event persistence (P1) - Events disappear, no history.

---

### 14. Moderation / Admin

**Overall Status**: Not Surfaced (Score 0/4)
**Backend Endpoints**: 9 | **Used**: 0 | **Unused**: 9 | **Usage**: 0%

| Backend Capability | Endpoint | Frontend Status | Gap Classification | Priority | Notes |
|-------------------|----------|-----------------|-------------------|----------|-------|
| Kick Player | POST /v1/moderation/kick | Unused | Unused | P2 | Admin-only, not needed |
| Mute Player | POST /v1/moderation/mute | Unused | Unused | P2 | Admin-only, not needed |
| Temp Ban | POST /v1/moderation/ban/temp | Unused | Unused | P2 | Admin-only, not needed |
| Perm Ban | POST /v1/moderation/ban/perm | Unused | Unused | P2 | Admin-only, not needed |
| Teleport Ship | POST /v1/moderation/teleport | Unused | Unused | P2 | Admin-only, not needed |
| Get Audit Log | GET /v1/moderation/audit | Unused | Unused | P2 | Admin-only, not needed |
| Get Player History | GET /v1/moderation/players/{id}/history | Unused | Unused | P2 | Admin-only, not needed |
| Gateway Health | GET /v1/health | Unused | Unused | P2 | Internal monitoring |
| Service Health | GET /{service}/health | Unused | Unused | P2 | Internal monitoring |

**Top Priority Gap**: None - admin-only features, not player-facing.

---

## Summary Tables

### Gap Classification Summary

| Classification | Count | Percentage | Examples |
|----------------|-------|------------|----------|
| **Complete** | 44 | 47% | Auth, Missions, Economy, Combat |
| **Partial** | 5 | 5% | Factions (2/12 endpoints), Notifications (2/4) |
| **Unused** | 49 | 53% | Chat (7), Admin (9), Faction Details (10) |

### Priority Breakdown

| Priority | Count | Impact | Effort | Examples |
|----------|-------|--------|--------|----------|
| **P0 (Critical)** | 2 | Very High | Low | Token Refresh, Chat System |
| **P1 (High)** | 6 | High | Low-Medium | Factions UI, Order Cancellation, Flee Button |
| **P2 (Medium)** | 15 | Medium | Low | Character Rename, Combat History, Market Stats |

### Mechanic Completion Summary

| Mechanic | Score | Backend Endpoints | Frontend Usage | Gap Count |
|----------|-------|------------------|----------------|-----------|
| Identity/Auth | 4/4 | 6 | 3 (50%) | 3 gaps (P0: 1, P2: 2) |
| Player Profile | 3/4 | 4 | 3 (75%) | 1 gap (P2: 1) |
| Ship/Loadout | 3/4 | 6 | 5 (83%) | 1 gap (P2: 1) |
| Combat | 3/4 | 4 | 3 (75%) | 2 gaps (P1: 1, P2: 1) |
| Map/Navigation | 3/4 | 6 | 4 (67%) | 2 gaps (P2: 2) |
| Inventory/Loot | 3/4 | 5 | 2 (40%) | 3 gaps (P2: 3) |
| Economy/Trading | 4/4 | 8 | 3 (38%) | 5 gaps (P1: 1, P2: 4) |
| Factions/Reputation | 2/4 | 12 | 2 (17%) | 10 gaps (P1: 5, P2: 5) |
| Missions/Quests | 4/4 | 6 | 6 (100%) | 0 gaps |
| Social/Chat | 1/4 | 7 | 0 (0%) | 8 gaps (P0: 8) |
| Notifications/Events | 3/4 | 4 | 2 (50%) | 2 gaps (P2: 2) |
| Admin/Moderation | 0/4 | 9 | 0 (0%) | 9 gaps (P2: 9) |

---

## Recommended Action Plan

### Phase 1: Critical Fixes (P0)

**Target**: Fix breaking UX issues
**Duration**: 1 week

1. **Token Refresh** (1 day) - Implement auto-refresh to prevent mid-session logouts
2. **Chat System** (4 days) - Add chat UI for all 7 endpoints + SSE events

**Impact**: Fixes critical user experience issues.

### Phase 2: Quick Wins (P1)

**Target**: High-value, low-effort improvements
**Duration**: 2 weeks

1. **Factions UI** (3 days) - Add faction list, details, relations, territory
2. **Reputation History** (1 day) - Add reputation timeline UI
3. **Order Cancellation** (1 day) - Add cancel button to trading screen
4. **Combat Flee Button** (1 day) - Expose existing flee API

**Impact**: Unlocks 10+ backend endpoints, improves game depth.

### Phase 3: Polish (P2)

**Target**: Nice-to-have improvements
**Duration**: Ongoing

1. Character/Ship Rename UI
2. Combat History Log
3. Market Statistics
4. Sector Generation UI
5. Inventory Filtering

**Impact**: Improves UX, exposes more backend features.

---

## Next Steps

1. **Create A3-spec-drift-report.md** - Document unused features and unpowered UI
2. **Create A3-bug-remediation-plan.md** - Document contract violations and fixes
3. **Create A3-ui-surface-map.md** - Catalog all UI surfaces and navigation
4. **Create A3-mechanics-coverage-report.md** - Executive summary for leadership

---

**End of A3 Capability Gap Matrix**
