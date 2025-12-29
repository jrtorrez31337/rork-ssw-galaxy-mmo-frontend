# Deliverable G: Regression Checklist
## Agent C (QA Agent) - QA Regression Gate Checklist

**Version**: 1.0
**Created**: 2025-12-27
**Agent**: QA Agent (Agent C)
**Purpose**: Standardized checklist for future QA gates to prevent regressions

---

## How to Use This Checklist

1. **Before Each Release**: Run through all items in Section 1 (Critical Path)
2. **Before Each Sprint**: Run through Section 2 (Feature Regression)
3. **After Major Changes**: Run through Section 3 (Integration Tests)
4. **Quarterly Review**: Run through Section 4 (Full Regression Suite)

**Pass Criteria**: All Critical Path items must pass. Feature items should have 90%+ pass rate.

---

## Section 1: Critical Path Verification (Every Release)

### 1.1 Authentication Flow

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 1.1.1 | User can sign up with valid email/password | Account created, redirected to character create | ☐ | |
| 1.1.2 | User can log in with existing credentials | Auth tokens stored, redirected to dashboard | ☐ | |
| 1.1.3 | Invalid login shows error message | "Invalid credentials" error displayed | ☐ | |
| 1.1.4 | Session persists across app restart | User remains logged in | ☐ | |
| 1.1.5 | Token auto-refresh works (wait 14+ minutes) | No logout, new tokens stored | ☐ | |
| 1.1.6 | Logout clears all tokens and state | Redirected to login, tokens cleared | ☐ | |
| 1.1.7 | 401 response triggers logout | User redirected to login | ☐ | |

**Pass Threshold**: 7/7 (100%)

---

### 1.2 Character & Ship Creation

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 1.2.1 | Character creation with valid attributes (sum=20) | Character created successfully | ☐ | |
| 1.2.2 | Character creation validates attribute range (1-10) | Error for values <1 or >10 | ☐ | |
| 1.2.3 | Character creation validates point total | Error if sum ≠ 20 | ☐ | |
| 1.2.4 | Ship creation with valid stats (sum=30) | Ship created successfully | ☐ | |
| 1.2.5 | Ship type bonuses applied correctly | Scout/Fighter/Trader/Explorer bonuses visible | ☐ | |
| 1.2.6 | Ship creation validates stat range (1-15) | Error for values <1 or >15 | ☐ | |

**Pass Threshold**: 6/6 (100%)

---

### 1.3 Core Navigation

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 1.3.1 | Tab bar visible on all main screens | 5 tabs always visible | ☐ | |
| 1.3.2 | Dashboard loads character and ship info | Character card and ship card displayed | ☐ | |
| 1.3.3 | Map tab shows galaxy map | Sector grid visible | ☐ | |
| 1.3.4 | Missions tab loads mission list | Available/Active/Completed tabs work | ☐ | |
| 1.3.5 | Profile tab shows player info | Character, reputation visible | ☐ | |
| 1.3.6 | Feed tab shows event list | Events displayed | ☐ | |
| 1.3.7 | Navigation between tabs preserves state | Returning to tab shows same content | ☐ | |

**Pass Threshold**: 7/7 (100%)

---

### 1.4 SSE Connection

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 1.4.1 | SSE connects on login | "Connected to SSE stream" in logs | ☐ | |
| 1.4.2 | Only ONE SSE connection active | Single connection in Network tab | ☐ | |
| 1.4.3 | SSE reconnects on disconnect | Reconnection within 5 attempts | ☐ | |
| 1.4.4 | SSE disconnects on logout | Connection closed | ☐ | |
| 1.4.5 | SSE events received from all channels | Combat, economy, mission events fire | ☐ | |

**Pass Threshold**: 5/5 (100%)

---

## Section 2: Feature Regression Tests (Every Sprint)

### 2.1 Combat System

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.1.1 | Can initiate combat with NPC | Combat instance created | ☐ | |
| 2.1.2 | Combat tick events received | Damage/action events display | ☐ | |
| 2.1.3 | Health bars update during combat | Hull/shield values change | ☐ | |
| 2.1.4 | Combat outcome displayed | Victory/defeat message shown | ☐ | |
| 2.1.5 | Loot notification appears | Credits/resources displayed | ☐ | |
| 2.1.6 | Loot added to inventory | Cargo updated after combat | ☐ | |
| 2.1.7 | Flee button works (if implemented) | Combat ends, ship escapes | ☐ | |

**Pass Threshold**: 6/7 (86%)

---

### 2.2 Navigation & Movement

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.2.1 | Can select jump target on map | Jump dialog opens | ☐ | |
| 2.2.2 | Jump consumes fuel correctly | Fuel decreases by distance cost | ☐ | |
| 2.2.3 | Jump updates ship location | New sector coordinates displayed | ☐ | |
| 2.2.4 | Jump cooldown enforced (10s) | Cannot jump during cooldown | ☐ | |
| 2.2.5 | Insufficient fuel prevents jump | Error message displayed | ☐ | |
| 2.2.6 | Can dock at station in range | Docking successful | ☐ | |
| 2.2.7 | Can undock from station | Ship undocked | ☐ | |
| 2.2.8 | Station services accessible when docked | Refuel/repair options visible | ☐ | |

**Pass Threshold**: 7/8 (88%)

---

### 2.3 Economy & Trading

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.3.1 | Trading screen loads market data | Orderbook displayed | ☐ | |
| 2.3.2 | Can place buy order | Order submitted, credits deducted | ☐ | |
| 2.3.3 | Can place sell order | Order submitted, inventory updated | ☐ | |
| 2.3.4 | Trade execution event received | SSE event triggers UI update | ☐ | |
| 2.3.5 | Insufficient credits prevents buy | Error message displayed | ☐ | |
| 2.3.6 | Insufficient inventory prevents sell | Error message displayed | ☐ | |
| 2.3.7 | Order cancellation works (if implemented) | Order removed from book | ☐ | |

**Pass Threshold**: 6/7 (86%)

---

### 2.4 Mission System

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.4.1 | Available missions load | Mission list displayed | ☐ | |
| 2.4.2 | Can accept mission | Mission moves to Active | ☐ | |
| 2.4.3 | Active missions show objectives | Progress displayed | ☐ | |
| 2.4.4 | Mission objective events update UI | Progress bars update | ☐ | |
| 2.4.5 | Can abandon mission | Mission removed from Active | ☐ | |
| 2.4.6 | Mission completion triggers rewards | Credits/reputation added | ☐ | |
| 2.4.7 | Completed missions tracked | Mission in Completed tab | ☐ | |

**Pass Threshold**: 7/7 (100%)

---

### 2.5 Inventory & Mining

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.5.1 | Inventory loads cargo contents | Resource list displayed | ☐ | |
| 2.5.2 | Resource quality displayed | Quality value shown | ☐ | |
| 2.5.3 | Cargo capacity tracked | Used/total displayed | ☐ | |
| 2.5.4 | Can transfer resources (ship ↔ station) | Inventory updated both sides | ☐ | |
| 2.5.5 | Mining extraction works | Resources added to cargo | ☐ | |
| 2.5.6 | Mining events update UI | Real-time extraction display | ☐ | |
| 2.5.7 | Cargo full prevents mining | Error message displayed | ☐ | |

**Pass Threshold**: 6/7 (86%)

---

### 2.6 Station Services

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.6.1 | Refuel option visible when docked | Refuel button/dialog available | ☐ | |
| 2.6.2 | Can refuel ship | Fuel increased, credits deducted | ☐ | |
| 2.6.3 | Refuel event updates UI | Fuel gauge updates | ☐ | |
| 2.6.4 | Repair option visible when docked | Repair button/dialog available | ☐ | |
| 2.6.5 | Can repair hull/shields | HP restored, credits deducted | ☐ | |
| 2.6.6 | Repair event updates UI | Health bars update | ☐ | |
| 2.6.7 | Insufficient credits shows error | Error message for refuel/repair | ☐ | |

**Pass Threshold**: 6/7 (86%)

---

### 2.7 Real-Time Events

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.7.1 | Combat events display in UI | Combat tick, outcome visible | ☐ | |
| 2.7.2 | Movement events display in UI | Jump, dock, undock visible | ☐ | |
| 2.7.3 | Economy events display in UI | Trade execution visible | ☐ | |
| 2.7.4 | Mission events display in UI | Objective progress visible | ☐ | |
| 2.7.5 | Station service events display | Refuel/repair visible | ☐ | |
| 2.7.6 | Events appear in Feed tab | All events logged | ☐ | |
| 2.7.7 | Events don't duplicate | No repeated events | ☐ | |

**Pass Threshold**: 6/7 (86%)

---

## Section 3: Integration Tests (After Major Changes)

### 3.1 Auth → SSE Integration

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.1.1 | Login establishes SSE connection | SSE connected after login | ☐ | |
| 3.1.2 | SSE uses correct auth token | Authorization header present | ☐ | |
| 3.1.3 | SSE subscribes to player channels | Channel subscription successful | ☐ | |
| 3.1.4 | Token refresh doesn't break SSE | Connection persists after refresh | ☐ | |
| 3.1.5 | Logout closes SSE connection | SSE disconnected after logout | ☐ | |

**Pass Threshold**: 5/5 (100%)

---

### 3.2 Combat → Inventory Integration

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.2.1 | Combat loot adds to inventory | Resources appear in cargo | ☐ | |
| 3.2.2 | Loot respects cargo capacity | Overflow handled gracefully | ☐ | |
| 3.2.3 | Credits from loot added to balance | Credits balance updated | ☐ | |
| 3.2.4 | Inventory UI updates after combat | Cargo list refreshed | ☐ | |

**Pass Threshold**: 4/4 (100%)

---

### 3.3 Trading → Inventory Integration

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.3.1 | Sell order removes from inventory | Resources deducted | ☐ | |
| 3.3.2 | Buy order adds to inventory | Resources added | ☐ | |
| 3.3.3 | Credits update on trade | Balance changes correctly | ☐ | |
| 3.3.4 | Inventory UI syncs with trading | Real-time updates | ☐ | |

**Pass Threshold**: 4/4 (100%)

---

### 3.4 Mission → Combat Integration

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.4.1 | Combat objective updates on kill | Progress increases | ☐ | |
| 3.4.2 | Mission completes after objective met | Completion triggered | ☐ | |
| 3.4.3 | Mission rewards credit balance | Credits added | ☐ | |
| 3.4.4 | Mission rewards reputation | Reputation updated | ☐ | |

**Pass Threshold**: 4/4 (100%)

---

### 3.5 Navigation → Combat Integration

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.5.1 | Jump to sector shows NPCs | NPC entities visible | ☐ | |
| 3.5.2 | Can initiate combat in new sector | Combat starts | ☐ | |
| 3.5.3 | Cannot jump while in combat | Jump prevented | ☐ | |
| 3.5.4 | Combat ends allows navigation | Jump enabled | ☐ | |

**Pass Threshold**: 4/4 (100%)

---

## Section 4: Full Regression Suite (Quarterly)

### 4.1 Data Persistence

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.1.1 | Character data persists across sessions | Same character on relogin | ☐ | |
| 4.1.2 | Ship data persists across sessions | Same ship on relogin | ☐ | |
| 4.1.3 | Mission progress persists | Active missions retained | ☐ | |
| 4.1.4 | Inventory persists | Cargo retained | ☐ | |
| 4.1.5 | Credits balance persists | Balance correct on relogin | ☐ | |
| 4.1.6 | Reputation persists | Faction standings retained | ☐ | |

**Pass Threshold**: 6/6 (100%)

---

### 4.2 Error Handling

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.2.1 | Network error shows message | "Connection error" displayed | ☐ | |
| 4.2.2 | API error shows message | Descriptive error shown | ☐ | |
| 4.2.3 | Invalid input shows validation | Form validation errors | ☐ | |
| 4.2.4 | App recovers from SSE disconnect | Reconnection successful | ☐ | |
| 4.2.5 | App handles 500 errors gracefully | Error message, no crash | ☐ | |
| 4.2.6 | App handles malformed data | Graceful degradation | ☐ | |

**Pass Threshold**: 5/6 (83%)

---

### 4.3 Performance

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.3.1 | App loads in <3 seconds | Initial load fast | ☐ | |
| 4.3.2 | Tab switching <500ms | Smooth navigation | ☐ | |
| 4.3.3 | List scrolling smooth | No jank in lists | ☐ | |
| 4.3.4 | SSE events process <100ms | Real-time updates | ☐ | |
| 4.3.5 | Memory usage stable | No leaks over time | ☐ | |
| 4.3.6 | Battery usage reasonable | No excessive drain | ☐ | |

**Pass Threshold**: 5/6 (83%)

---

### 4.4 Edge Cases

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.4.1 | Empty inventory displays properly | "No items" message | ☐ | |
| 4.4.2 | Empty mission list displays properly | "No missions" message | ☐ | |
| 4.4.3 | Zero credits allows viewing market | Market still visible | ☐ | |
| 4.4.4 | Full cargo prevents mining | Error message shown | ☐ | |
| 4.4.5 | Empty fuel prevents jump | Error message shown | ☐ | |
| 4.4.6 | Damaged ship shows warnings | Visual indicators | ☐ | |

**Pass Threshold**: 5/6 (83%)

---

## Contract Compliance Checklist

### Backend API Contract (A1)

| # | Contract Item | Verified? | Notes |
|---|---------------|-----------|-------|
| CC1 | All API calls use Bearer token | ☐ | |
| CC2 | All requests include Content-Type: application/json | ☐ | |
| CC3 | All request body field names match spec | ☐ | |
| CC4 | All response parsing matches spec schema | ☐ | |
| CC5 | Error codes handled per 06-APPENDICES.md | ☐ | |
| CC6 | Pagination parameters used correctly | ☐ | |

**Pass Threshold**: 6/6 (100%)

---

### SSE Contract (04-REALTIME-SSE.apib)

| # | Contract Item | Verified? | Notes |
|---|---------------|-----------|-------|
| SSE1 | Single connection per client | ☐ | |
| SSE2 | Connection through Gateway (not direct) | ☐ | |
| SSE3 | Reconnection with exponential backoff | ☐ | |
| SSE4 | Max 5 reconnection attempts | ☐ | |
| SSE5 | Channel subscription via POST /subscribe | ☐ | |
| SSE6 | Event parsing handles type/event field | ☐ | |

**Pass Threshold**: 6/6 (100%)

---

### UX Contract (B1)

| # | Contract Item | Verified? | Notes |
|---|---------------|-----------|-------|
| UX1 | Persistent cockpit shell (tab bar) | ☐ | |
| UX2 | No flash-card UI for core gameplay | ☐ | |
| UX3 | Inspect/act flows use panels/overlays | ☐ | |
| UX4 | Error states provide user feedback | ☐ | |
| UX5 | Loading states visible | ☐ | |
| UX6 | Navigation is consistent | ☐ | |

**Pass Threshold**: 5/6 (83%)

---

## Bug Regression Checklist

### Previously Fixed Bugs

After each release, verify previously fixed bugs haven't regressed:

| Bug ID | Description | Fixed In | Regression Check | Status |
|--------|-------------|----------|------------------|--------|
| Bug #2 | Multiple SSE connections | 2025-12-27 | Single connection in Network tab | ☐ |
| Bug #3 | Hardcoded Fanout IP | 2025-12-27 | Uses config.FANOUT_URL | ☐ |
| | | | | |
| | | | | |
| | | | | |

*Add rows as bugs are fixed*

---

## Sign-Off Section

### Release Checklist

| Item | Completed | Sign-Off |
|------|-----------|----------|
| All Critical Path tests pass (Section 1) | ☐ | |
| ≥90% Feature tests pass (Section 2) | ☐ | |
| All Integration tests pass (Section 3) | ☐ | |
| All Contract tests pass | ☐ | |
| All known bugs tracked in remediation plan | ☐ | |
| No P0 bugs open | ☐ | |
| P1 bugs have fix timeline | ☐ | |

### Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Tech Lead | | | |
| Product Owner | | | |

---

## Appendix: Quick Reference

### Pass Thresholds Summary

| Section | Threshold | Blocking? |
|---------|-----------|-----------|
| Critical Path (Section 1) | 100% | Yes |
| Feature Regression (Section 2) | 90% | Yes |
| Integration Tests (Section 3) | 100% | Yes |
| Full Regression (Section 4) | 85% | No |
| Contract Compliance | 100% | Yes |

### Priority Definitions

| Priority | Description | Response Time |
|----------|-------------|---------------|
| P0 | Critical - Blocks release | Fix immediately |
| P1 | High - Degrades experience | Fix before release |
| P2 | Medium - Inconvenience | Fix in next sprint |
| P3 | Low - Enhancement | Add to backlog |

### Test Environment Checklist

Before running tests, verify:

- [ ] Using latest build from main branch
- [ ] Backend services running and healthy
- [ ] SSE/Fanout service accessible
- [ ] Database seeded with test data
- [ ] Test user accounts available
- [ ] Network conditions normal

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Maintained By**: QA Agent (Agent C)

**End of Regression Checklist**
