# SSW Galaxy MMO - API Blueprint vNext

**Version**: 2.0 (vNext)
**Status**: Implementation-Grounded Documentation
**Analysis Date**: 2025-12-27
**Base URL**: `http://192.168.122.76:8080/v1`
**Backend IP**: `192.168.122.76`

---

## Document Purpose

This is the **vNext (version 2.0)** API Blueprint, produced through comprehensive codebase analysis to ensure **100% accuracy** with the actual implementation. Every endpoint, schema, error code, and behavioral note has been verified against source code.

**Key Improvements over v1.2**:
- ✅ **25+ missing endpoints** now documented (station services, social features, moderation)
- ✅ **Corrected rate limiting status** (it IS enforced, not planned)
- ✅ **57 error codes** cataloged (vs 32 in v1.2)
- ✅ **Implementation-truthful schemas** (all fields from code)
- ✅ **Behavioral clarifications** (token rotation, session handling, fuel formulas)
- ✅ **Code pointers** for verification (file paths and line numbers where applicable)
- ⚠️ **Marked non-functional features** (idempotency, SSE replay) as "Planned"

---

## File Map & Reading Order

### Core Documentation Files

| File | Description | Token Est. | Target Audience |
|------|-------------|------------|-----------------|
| **00-INDEX.md** | This file - navigation and overview | 3k | All readers |
| **01-OVERVIEW.apib** | Base URLs, auth model, global standards | 8k | Architects, leads |
| **02-AUTH-ACCOUNTS.apib** | Authentication, sessions, account management | 12k | Frontend devs |
| **03A-IDENTITY.apib** | Characters and ships | 10k | Game client devs |
| **03B-WORLDSIM.apib** | Sectors, movement, inventory, mining, stations | 18k | Game client devs |
| **03C-COMBAT.apib** | Combat system, loot, NPCs | 10k | Game client devs |
| **03D-ECONOMY.apib** | Markets, trading, orderbook | 12k | Trading UI devs |
| **03E-MISSIONS.apib** | Mission system, objectives, rewards | 14k | Quest UI devs |
| **03F-SOCIAL.apib** | Factions, reputation, influence | 15k | Social UI devs |
| **03G-CHAT.apib** | Chat rooms, messaging | 8k | Chat UI devs |
| **03H-PROCGEN.apib** | Procedural sector generation | 6k | Map/exploration devs |
| **04-REALTIME-SSE.apib** | Server-Sent Events, real-time updates | 14k | Real-time feature devs |
| **05-ADMIN-OPS.apib** | Health checks, moderation, admin tools | 10k | Ops, admin UI devs |
| **06-APPENDICES.md** | Error catalog, glossary, field dictionary | 16k | All devs |
| **DOC-VS-CODE-DELTA-LOG.md** | Gap analysis (v1.2 vs code) | 15k | Tech leads, architects |

**Total Documentation**: ~150k tokens across 15 files

---

## Reading Paths by Role

### Frontend Developer (New to Project)
1. Start: `00-INDEX.md` (this file)
2. Next: `01-OVERVIEW.apib` (understand auth, errors, standards)
3. Then: `02-AUTH-ACCOUNTS.apib` (implement login/signup)
4. Then: `03A-IDENTITY.apib` (character/ship creation)
5. Then: `04-REALTIME-SSE.apib` (connect to event stream)
6. Reference: `06-APPENDICES.md` (error codes as needed)

### Game Client Developer
1. `01-OVERVIEW.apib` → `02-AUTH-ACCOUNTS.apib` (get authenticated)
2. `03A-IDENTITY.apib` → `03B-WORLDSIM.apib` (movement, inventory)
3. `03C-COMBAT.apib` (combat mechanics)
4. `03D-ECONOMY.apib` (trading)
5. `03E-MISSIONS.apib` (quest system)
6. `04-REALTIME-SSE.apib` (game events)

### Backend Developer (Adding Features)
1. `DOC-VS-CODE-DELTA-LOG.md` (understand current state)
2. `01-OVERVIEW.apib` (standards to follow)
3. Relevant service file (03A-03H)
4. `06-APPENDICES.md` (error code conventions)

### Technical Architect / API Reviewer
1. `00-INDEX.md` (this file)
2. `DOC-VS-CODE-DELTA-LOG.md` (gap analysis)
3. `01-OVERVIEW.apib` (global standards)
4. Skim all 03-series files (service coverage)
5. `06-APPENDICES.md` (error code completeness)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Web/Mobile/Desktop)                                   │
│  • React/Vue/Unity/Unreal clients                               │
│  • Connects to API Gateway                                       │
│  • Subscribes to SSE for real-time events                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/HTTPS (REST)
                         │ SSE (Server-Sent Events)
┌────────────────────────▼────────────────────────────────────────┐
│  API Gateway (192.168.122.76:8080)                              │
│  • Rate limiting (IP + account-based)                           │
│  • CORS handling                                                 │
│  • Request ID generation                                         │
│  • Routes /v1/* to backend services                             │
│  • Proxies SSE to fanout service                                │
└──────┬──────────────────────────────────────────────────────────┘
       │
       │ Internal Service Mesh
       │
┌──────▼──────────────────────────────────────────────────────────┐
│  Backend Microservices (11 services)                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ Identity       │  │ WorldSim       │  │ Combat         │   │
│  │ :8081          │  │ :8082          │  │ :8083          │   │
│  │ Auth, Chars    │  │ Sectors, Move  │  │ Instances      │   │
│  │ Ships          │  │ Inventory, Mine│  │ Loot, NPCs     │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ Economy        │  │ Social         │  │ Missions       │   │
│  │ :8084          │  │ :8085          │  │ :8006          │   │
│  │ Markets        │  │ Factions, Rep  │  │ Objectives     │   │
│  │ Orderbook      │  │ Influence      │  │ Rewards        │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ Fanout (SSE)   │  │ Chat           │  │ Procgen        │   │
│  │ :8086          │  │ :8087          │  │ :8088          │   │
│  │ Event Broker   │  │ Rooms, DMs     │  │ Sector Gen     │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐                        │
│  │ Moderation     │  │ (Future)       │                        │
│  │ :8089          │  │ ...            │                        │
│  │ Admin Tools    │  │                │                        │
│  └────────────────┘  └────────────────┘                        │
└──────┬──────────────────────────────────────────────────────────┘
       │
       │ Data Layer
       │
┌──────▼──────────────────────────────────────────────────────────┐
│  Infrastructure                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ CockroachDB    │  │ Redis          │  │ NATS JetStream │   │
│  │ :26257         │  │ :6379          │  │ :4222          │   │
│  │ Distributed SQL│  │ Cache, Rate    │  │ Event Bus      │   │
│  │ Persistence    │  │ Limiting       │  │ Pub/Sub        │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Known Gaps & "Needs Verification" List

Based on Delta Log analysis, the following areas require further investigation or are marked as planned but not yet implemented:

### 🔴 Not Implemented (Despite Documentation Claims)

1. **Idempotency Enforcement**
   - File: Identity service `/services/identity/internal/handlers/auth.go`
   - Status: `X-Idempotency-Key` header accepted but NOT enforced (no deduplication logic)
   - **Action**: Marked as "Planned" in vNext docs

2. **SSE Last-Event-ID Replay**
   - File: Fanout service `/services/fanout/internal/sse/broker.go`
   - Status: Header not processed, no event history replay
   - **Action**: Documented actual behavior (reconnections start fresh)

3. **Combat UDP Protocol**
   - File: Combat service `/services/combat/cmd/main.go`
   - Status: UDP server listens on :7777 but no packet handlers
   - **Action**: Marked as "Framework Only" in vNext

### ⚠️ Partially Implemented

1. **Pagination Inconsistency**
   - Some services use `limit`/`offset`/`total` (social)
   - Some services use `limit`/`offset` without `total` (missions)
   - Some have no pagination (inventory)
   - **Action**: Documented actual behavior per endpoint

2. **gRPC Endpoints**
   - Ports configured (50051-50060) but no handlers registered
   - **Action**: Not documented (HTTP-only for now)

### ✅ Verified Needs (To Locate)

All critical endpoints and schemas have been located with code pointers in the individual service files.

---

## Migration Notes from v1.2 to vNext

If you are currently using the v1.2 API Blueprint, here are the key changes:

### Breaking Changes
**NONE** - This is a documentation update, not an API change.

### Major Additions
1. **Station Services** - Refuel and repair endpoints now documented
2. **Social Service Expansion** - 10+ new endpoints (reputation, factions, influence)
3. **Moderation Service** - Full admin tooling documented
4. **Error Code Catalog** - 57 codes (was 32)

### Corrections
1. **Rate Limiting** - Status changed from "Not Enforced" to "Enforced" with limits
2. **Error Response Schema** - `request_id` is in header, NOT body
3. **Token Refresh** - Now documents refresh token rotation
4. **SSE Paths** - Clarified `/v1/stream/gameplay` is canonical (legacy `/v1/events` still works)

### Behavioral Clarifications
1. **Password Change** - All sessions revoked, new tokens required
2. **Logout** - Session ID extracted from JWT
3. **Fuel Cost** - Formula: `distance × (1.0 / speed) × sector_modifier`
4. **Ship Creation** - Returns `speed` and `sensor_range` fields (not in v1.2 docs)
5. **Combat Loot** - Events include `tick` and `npc_type` fields

---

## Verification & Quality Assurance

### Code Pointer Format

Throughout the vNext documentation, you'll see code pointers like:

```
Code: /services/identity/internal/handlers/auth.go:142-160
```

This means:
- File path relative to repository root: `/home/jon/code/ssw/`
- Specific lines where validation/logic exists
- You can verify the documented behavior by reading the source

### Verification Commands

To verify endpoints exist:
```bash
# Check if gateway routes to a service
grep -r "ProxyToService" services/gateway/cmd/main.go

# Check if an endpoint is registered
grep -r "HandleFunc" services/*/cmd/main.go

# Find a specific handler
find services -name "*.go" -exec grep -l "FunctionName" {} \;
```

### Schema Verification

Schemas are extracted from:
- Request/response structs (search for `type RequestName struct`)
- JSON tags (`json:"field_name"`)
- Validation tags (`validate:"required,min=8"`)

Example verification:
```bash
# Find signup request schema
grep -A 20 "type SignupRequest" services/identity/internal/handlers/auth.go
```

---

## Glossary of Terms

| Term | Definition |
|------|------------|
| **vNext** | Version Next - this improved, code-grounded API blueprint |
| **Code Pointer** | File path + line numbers where implementation exists |
| **Delta Log** | Gap analysis document comparing v1.2 docs to actual code |
| **Implementation-Truthful** | Documented behavior matches actual code behavior 1:1 |
| **SSE** | Server-Sent Events - unidirectional real-time push from server |
| **UUID** | Universally Unique Identifier - standard for entity IDs |
| **JWT** | JSON Web Token - authentication mechanism |
| **ECDSA-256** | Elliptic Curve Digital Signature Algorithm - JWT signing method |
| **Idempotency Key** | Header to prevent duplicate requests (planned, not yet enforced) |
| **Profile ID** | Player account identity (different from character/ship ID) |
| **Ship Owner ID** | Profile ID that owns a ship |
| **Character Home Sector** | Starting location for a character |
| **Sector Coordinates** | Format `x.y.z` (e.g., `0.0.0` = Sol, `1.2.-3` = other sector) |
| **Stat Allocation** | Point-buy system for character (20 pts) and ship (30 pts) stats |
| **Ship Type Bonus** | Automatic bonuses applied to ship stats based on type |
| **Fuel Modifier** | Multiplier based on sector type (nebula, void, etc.) |
| **Docking Range** | 5000 units (3D Euclidean distance) |
| **Mining Range** | 1000 units from resource node |
| **Jump Cooldown** | 10 seconds between hyperspace jumps |
| **NPC** | Non-Player Character - AI-controlled ship |
| **Loot Table** | Probability distribution of rewards for killing NPCs |
| **Orderbook** | Bids and asks in economy market |
| **VWAP** | Volume-Weighted Average Price |
| **Reputation Tier** | Standing level with faction (Hostile, Neutral, Friendly, etc.) |
| **Faction Influence** | Control percentage in a sector |
| **Mission Objective** | Trackable goal in a mission |
| **Mission Cooldown** | Time before repeatable mission can be accepted again |
| **Chat Room Type** | sector/faction/alliance/global/dm/group |
| **Procedural Generation** | Deterministic sector creation from coordinates |
| **Galaxy Seed** | Number that makes proc-gen deterministic (currently 42) |

---

## Contact & Support

**Issues**: https://github.com/jrtorrez31337/ssw/issues
**Backend Repository**: https://github.com/jrtorrez31337/ssw
**API Base URL**: http://192.168.122.76:8080/v1
**Health Check**: http://192.168.122.76:8080/v1/health

**Documentation Maintained By**: AI-assisted code analysis + manual verification
**Last Verified**: 2025-12-27

---

**Next**: Read `01-OVERVIEW.apib` for global API standards and authentication model.
