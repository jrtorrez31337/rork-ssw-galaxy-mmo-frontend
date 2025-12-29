# A3: UI Surface Map
## Design-Neutral Inventory of All UI Surfaces

**Analysis Date**: 2025-12-27
**Agent**: Integration Agent (Agent A)
**Task**: Catalog all UI surfaces, navigation structure, and design violations

---

## Executive Summary

This document provides a comprehensive inventory of all UI surfaces in the frontend, categorized by type (screens, components, panels, modals), with navigation flow and design pattern analysis.

**Total UI Surfaces**: 44
- **Screens (Routes)**: 16
- **Major Components**: 18
- **Modals/Overlays**: 10

**Design Violations**:
- **Flash-card UI**: 6 instances (should be inline/HUD-integrated)
- **Missing HUD Elements**: 5 critical elements
- **Unreachable Screens**: 0 (all screens accessible)

---

## Part 1: Screen Inventory

### Section A: Tab Navigation (Primary Routes)

**Navigation Type**: Bottom tab bar (5 tabs)
**Implementation**: React Navigation tabs

#### Screen 1: Dashboard (/app/(tabs)/index.tsx)

**Type**: Panel UI (dashboard)
**Reachability**: Direct (home screen)

**Purpose**: Player overview, quick stats, active mission summary

**UI Elements**:
- Character info card (name, attributes)
- Ship info card (type, stats, location)
- Active mission summary (1-3 missions)
- Quick action buttons (Jump, Dock, Trading)

**Backend Integration**:
- GET /v1/characters/{id} - Character data
- GET /v1/ships/{id} - Ship data
- GET /v1/missions/active - Active missions

**Missing Elements**:
- No faction reputation display
- No credits balance
- No fuel gauge
- No hull/shield status

**Flash-card Violation**: No
**Design Pattern**: Dashboard (acceptable)

**Navigation From**: App startup
**Navigation To**: All tabs, Sector view, Trading screen

---

#### Screen 2: Map (/app/(tabs)/map.tsx)

**Type**: Panel UI (galaxy map)
**Reachability**: Direct (map tab)

**Purpose**: Galaxy navigation, sector exploration, jump planning

**UI Elements**:
- 3D galaxy map (coordinate grid)
- Current sector highlight
- Nearby sectors display
- Jump target selector
- Jump dialog trigger

**Backend Integration**:
- GET /v1/sectors/{sector_id} - Sector details
- POST /v1/actions/jump - Hyperspace jump

**Missing Elements**:
- No sector type indicators (nebula, asteroid belt, etc.)
- No faction influence overlay
- No waypoint system
- No station markers
- No mini-map/radar

**Flash-card Violation**: Yes (Jump dialog is modal)
**Design Pattern**: Map view (acceptable, but jump dialog should be HUD-integrated)

**Navigation From**: Dashboard, any tab
**Navigation To**: Sector view, Jump dialog

---

#### Screen 3: Missions (/app/(tabs)/missions.tsx)

**Type**: Panel UI (mission browser)
**Reachability**: Direct (missions tab)

**Purpose**: Mission browsing, acceptance, tracking, completion

**UI Elements**:
- Mission list (available, active, completed tabs)
- Mission cards (description, rewards, objectives)
- Accept/abandon buttons
- Objective progress bars
- Completion summary

**Backend Integration**:
- GET /v1/missions/available - Mission templates
- GET /v1/missions/active - Active missions
- POST /v1/missions/{id}/accept - Accept mission
- POST /v1/missions/{id}/abandon - Abandon mission

**Missing Elements**:
- No mission detail modal (objectives shown inline, OK)
- No expiration warnings
- No faction filtering

**Flash-card Violation**: Partial (Mission cards could be inline expanded)
**Design Pattern**: List view with cards (acceptable)

**Navigation From**: Dashboard, any tab
**Navigation To**: Mission detail (inline), Sector view

---

#### Screen 4: Profile (/app/(tabs)/me.tsx)

**Type**: Panel UI (player profile)
**Reachability**: Direct (profile tab)

**Purpose**: Player info, character management, reputation, settings

**UI Elements**:
- Player profile header (name, account info)
- Character summary (attributes, home sector)
- Reputation list (all factions)
- Settings section (logout, password change - missing)

**Backend Integration**:
- GET /v1/auth/me - Player account
- GET /v1/characters/by-profile/{id} - Characters
- GET /v1/players/{id}/reputation - Reputation data

**Missing Elements**:
- No faction names/icons (backend has 10 factions)
- No reputation history timeline
- No logout button
- No password change UI
- No session management

**Flash-card Violation**: No
**Design Pattern**: Profile view (acceptable)

**Navigation From**: Dashboard, any tab
**Navigation To**: Character create, Settings (missing)

---

#### Screen 5: Feed (/app/(tabs)/feed.tsx)

**Type**: Panel UI (event feed)
**Reachability**: Direct (feed tab)

**Purpose**: Real-time game events, notification history

**UI Elements**:
- Event list (chronological)
- Event icons (combat, economy, missions)
- Event descriptions
- Timestamp display (missing)

**Backend Integration**:
- SSE /v1/stream/gameplay - All game events

**Missing Elements**:
- No event persistence (disappears on refresh)
- No event filtering by type
- No timestamps
- No notification badges
- No event grouping

**Flash-card Violation**: No
**Design Pattern**: Feed view (acceptable, but needs polish)

**Navigation From**: Dashboard, any tab
**Navigation To**: Event source screens (combat, trading, missions)

---

### Section B: Modal Screens (Full-screen overlays)

#### Screen 6: Login (/app/login.tsx)

**Type**: Flash-card UI (modal screen)
**Reachability**: App startup (if not logged in)

**Purpose**: User authentication

**UI Elements**:
- Email input
- Password input
- Login button
- Signup link
- Error messages

**Backend Integration**:
- POST /v1/auth/login - User login

**Flash-card Violation**: No (login is acceptable as full-screen)
**Design Pattern**: Auth screen (standard)

**Navigation From**: App startup, Logout
**Navigation To**: Dashboard (on success), Signup

---

#### Screen 7: Signup (/app/signup.tsx)

**Type**: Flash-card UI (modal screen)
**Reachability**: From login screen

**Purpose**: Account creation

**UI Elements**:
- Email input
- Password input (with strength indicator)
- Display name input
- Signup button
- Login link
- Error messages

**Backend Integration**:
- POST /v1/auth/signup - Account creation

**Flash-card Violation**: No (signup is acceptable as full-screen)
**Design Pattern**: Auth screen (standard)

**Navigation From**: Login screen
**Navigation To**: Character create (on success)

---

#### Screen 8: Character Create (/app/character-create.tsx)

**Type**: Flash-card UI (modal screen)
**Reachability**: After signup, from Dashboard (if no character)

**Purpose**: Character creation with point-buy

**UI Elements**:
- Name input
- Attribute sliders (5 stats, 20 points total)
- Point allocation display
- Home sector selector
- Create button
- Validation messages

**Backend Integration**:
- POST /v1/characters - Character creation

**Flash-card Violation**: No (character creation is one-time, acceptable)
**Design Pattern**: Creation wizard (acceptable)

**Navigation From**: Signup, Dashboard
**Navigation To**: Ship create

---

#### Screen 9: Ship Customize (/app/ship-customize.tsx)

**Type**: Flash-card UI (modal screen)
**Reachability**: After character create, from Dashboard (if no ship)

**Purpose**: Ship creation with stat allocation

**UI Elements**:
- Ship type selector (scout, fighter, trader, explorer)
- Ship name input
- Stat sliders (5 stats, 30 points total)
- Ship type bonuses display
- Create button
- Validation messages

**Backend Integration**:
- POST /v1/ships - Ship creation

**Flash-card Violation**: No (ship creation is one-time, acceptable)
**Design Pattern**: Creation wizard (acceptable)

**Navigation From**: Character create, Dashboard
**Navigation To**: Dashboard (on completion)

---

#### Screen 10: Sector View (/app/sector.tsx)

**Type**: Panel UI (2D sector view)
**Reachability**: From Map, Dashboard

**Purpose**: Sector exploration, combat, NPC discovery

**UI Elements**:
- 2D sector canvas (ships, NPCs, resource nodes)
- Entity list (ships, stations, NPCs)
- Combat view (if in combat)
- Health bars, damage numbers
- Attack/flee buttons

**Backend Integration**:
- GET /v1/sectors/{id}/state - Sector entities
- POST /combat/initiate - Start combat
- SSE combat events

**Missing Elements**:
- No flee button (API exists)
- No combat log
- No mini-map
- No station discovery improvements

**Flash-card Violation**: No
**Design Pattern**: Game view (acceptable)

**Navigation From**: Map, Dashboard
**Navigation To**: Combat (inline), Docking dialog

---

#### Screen 11: Trading (/app/trading.tsx)

**Type**: Panel UI (market interface)
**Reachability**: From Dashboard, Sector view (if docked)

**Purpose**: Market trading, order placement, orderbook viewing

**UI Elements**:
- Resource selector
- Order form (buy/sell, price, quantity)
- Orderbook display (bids, asks, spread)
- Trade history chart
- Place order button

**Backend Integration**:
- POST /v1/markets/{id}/orders - Place order
- GET /v1/markets/{id}/orderbook - Market depth
- GET /v1/markets/{id}/trades - Trade history
- SSE economy events

**Missing Elements**:
- No cancel order button (API exists)
- No player's active orders list
- No market statistics
- No trade route finder

**Flash-card Violation**: No
**Design Pattern**: Trading interface (acceptable)

**Navigation From**: Dashboard, Sector view
**Navigation To**: Ship inventory

---

#### Screen 12: Ship Inventory (/app/ship-inventory.tsx)

**Type**: Panel UI (inventory list)
**Reachability**: From Dashboard, Sector view

**Purpose**: Cargo management, resource viewing, transfers

**UI Elements**:
- Cargo list (resources with quality)
- Capacity display (used/total)
- Resource details (type, quantity, quality, volume)
- Transfer button

**Backend Integration**:
- GET /v1/inventory/{owner_id} - Ship cargo
- POST /v1/inventory/transfer - Resource transfer

**Missing Elements**:
- No station storage UI
- No bulk transfer
- No sorting/filtering
- No capacity warnings

**Flash-card Violation**: Partial (Transfer modal)
**Design Pattern**: Inventory list (acceptable, but transfer should be drag-and-drop)

**Navigation From**: Dashboard, Trading, Sector view
**Navigation To**: Transfer modal

---

### Section C: Missing Screens (Backend Ready, No UI)

#### Screen 13: Faction List (Not Implemented)

**Type**: Panel UI (faction browser) - MISSING
**Reachability**: Should be from Profile tab

**Purpose**: Browse all 10 factions, view details, relations, territory

**Expected UI Elements**:
- Faction list (10 factions)
- Faction cards (name, emblem, description)
- Faction details (relations, territory, members)
- Player reputation with each faction

**Backend Integration Ready**:
- GET /v1/factions - List all factions
- GET /v1/factions/{id} - Faction details
- GET /v1/factions/{id}/relations - Faction diplomacy
- GET /v1/factions/{id}/territory - Controlled sectors

**Impact**: Rich faction system invisible to players

**Recommended Implementation**: 3 days
**Priority**: P1 (High)

---

#### Screen 14: Reputation History (Not Implemented)

**Type**: Panel UI (timeline) - MISSING
**Reachability**: Should be from Profile tab

**Purpose**: View reputation change history, track faction standing over time

**Expected UI Elements**:
- Timeline of reputation events
- Faction-filtered view
- Change amounts (+/-) with reasons
- Tier transition markers

**Backend Integration Ready**:
- GET /v1/players/{id}/reputation/history - Event log

**Impact**: Players don't know why reputation changed

**Recommended Implementation**: 1 day
**Priority**: P1 (High)

---

#### Screen 15: Chat Interface (Not Implemented)

**Type**: HUD-integrated panel - MISSING
**Reachability**: Should be persistent HUD element

**Purpose**: Player communication, room-based chat

**Expected UI Elements**:
- Chat tabs (sector, faction, DM, custom)
- Message list (scrolling)
- Input field
- Room list
- Member list

**Backend Integration Ready**:
- GET /v1/chat/rooms - List rooms
- POST /v1/chat/messages - Send message
- POST /v1/chat/rooms/{id}/join - Join room
- SSE game.chat.message - Real-time messages

**Impact**: No social features in multiplayer game

**Recommended Implementation**: 4 days
**Priority**: P0 (Critical)

---

#### Screen 16: Admin Dashboard (Not Implemented)

**Type**: Panel UI (admin tools) - MISSING
**Reachability**: Should be admin-only route

**Purpose**: Player moderation, audit logs, health checks

**Expected UI Elements**:
- Player search
- Moderation actions (kick, mute, ban, teleport)
- Audit log viewer
- Health check dashboard

**Backend Integration Ready**:
- POST /v1/moderation/* - All moderation endpoints
- GET /v1/moderation/audit - Audit log
- GET /v1/health - Health checks

**Impact**: No admin tools

**Recommended Implementation**: 3 days
**Priority**: P2 (Low - admin only)

---

## Part 2: Component Inventory

### Section A: Navigation Components

#### Component 1: TabNavigator

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/app/(tabs)/_layout.tsx
**Type**: Navigation (tab bar)
**Purpose**: Primary navigation structure

**UI Elements**:
- 5 tabs (Dashboard, Map, Missions, Profile, Feed)
- Tab icons
- Tab labels
- Active tab indicator

**Flash-card Violation**: No
**Design Pattern**: Standard tab navigation (acceptable)

---

#### Component 2: BackButton

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/navigation/BackButton.tsx (estimated)
**Type**: Navigation (header button)
**Purpose**: Navigate back in stack

**Flash-card Violation**: No
**Design Pattern**: Standard navigation (acceptable)

---

### Section B: Display Components (Read-Only)

#### Component 3: CharacterCard

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/character/CharacterCard.tsx (estimated)
**Type**: Display component
**Purpose**: Show character stats and attributes

**UI Elements**:
- Character name
- Attributes (piloting, engineering, science, tactics, leadership)
- Home sector
- Created date

**Flash-card Violation**: No
**Design Pattern**: Info card (acceptable)

---

#### Component 4: ShipCard

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/ship/ShipCard.tsx (estimated)
**Type**: Display component
**Purpose**: Show ship stats and status

**UI Elements**:
- Ship name and type
- Hull/shield bars
- Fuel gauge
- Cargo capacity
- Location

**Flash-card Violation**: No
**Design Pattern**: Info card (acceptable)

---

#### Component 5: MissionCard

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/missions/MissionCard.tsx (estimated)
**Type**: Display component
**Purpose**: Show mission details and progress

**UI Elements**:
- Mission name and description
- Objectives with progress bars
- Rewards (credits, reputation)
- Accept/abandon buttons
- Expiration timer (missing)

**Flash-card Violation**: Partial (could expand inline instead of modal)
**Design Pattern**: List item card (acceptable)

---

#### Component 6: ReputationList

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/reputation/ReputationList.tsx (estimated)
**Type**: Display component
**Purpose**: Show player's reputation with all factions

**UI Elements**:
- Faction names (missing icons)
- Reputation values
- Tier labels
- Progress bars

**Missing Elements**:
- No faction names/icons (backend has data)
- No faction detail navigation
- No history timeline

**Flash-card Violation**: No
**Design Pattern**: List view (acceptable, but incomplete)

---

#### Component 7: OrderbookView

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/economy/OrderbookView.tsx (estimated)
**Type**: Display component
**Purpose**: Show market depth (bids and asks)

**UI Elements**:
- Bid list (price, quantity)
- Ask list (price, quantity)
- Spread calculation
- Best bid/ask highlight

**Flash-card Violation**: No
**Design Pattern**: Market depth view (standard)

---

#### Component 8: TradeHistory

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/economy/TradeHistory.tsx (estimated)
**Type**: Display component
**Purpose**: Show recent trades and price chart

**UI Elements**:
- Trade list (price, quantity, timestamp)
- Price chart (line graph)
- Volume display

**Flash-card Violation**: No
**Design Pattern**: Chart view (acceptable)

---

#### Component 9: InventoryList

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/inventory/InventoryList.tsx (estimated)
**Type**: Display component
**Purpose**: Show cargo contents

**UI Elements**:
- Resource list (type, quantity, quality)
- Capacity bar
- Total volume
- Empty state (missing)

**Flash-card Violation**: No
**Design Pattern**: List view (acceptable)

---

#### Component 10: EventFeedItem

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/feed/EventFeedItem.tsx (estimated)
**Type**: Display component
**Purpose**: Show single event in feed

**UI Elements**:
- Event icon
- Event description
- Timestamp (missing)
- Event type badge

**Flash-card Violation**: No
**Design Pattern**: Feed item (acceptable)

---

### Section C: Interactive Components (Actions)

#### Component 11: OrderForm

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/economy/OrderForm.tsx (estimated)
**Type**: Form component
**Purpose**: Place buy/sell orders

**UI Elements**:
- Order side selector (buy/sell)
- Price input
- Quantity input
- Total cost display
- Submit button

**Missing Elements**:
- No balance check (frontend validation)
- No order preview
- No confirmation dialog

**Flash-card Violation**: No
**Design Pattern**: Form (acceptable)

---

#### Component 12: AttributeAllocator

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/character/AttributeAllocator.tsx (estimated)
**Type**: Form component
**Purpose**: Allocate character attribute points

**UI Elements**:
- 5 stat sliders
- Points remaining display
- Reset button
- Validation feedback

**Flash-card Violation**: No
**Design Pattern**: Point-buy form (acceptable)

---

#### Component 13: ShipStatAllocator

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/ship/ShipStatAllocator.tsx (estimated)
**Type**: Form component
**Purpose**: Allocate ship stat points

**UI Elements**:
- 5 stat sliders
- Ship type bonuses display
- Points remaining display
- Validation feedback

**Flash-card Violation**: No
**Design Pattern**: Point-buy form (acceptable)

---

#### Component 14: ShipControlPanel

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/ShipControlPanel.tsx (estimated)
**Type**: HUD element
**Purpose**: Ship movement controls

**UI Elements**:
- Jump button
- Dock button
- Undock button
- Current location display

**Flash-card Violation**: No
**Design Pattern**: Control panel (acceptable)

---

#### Component 15: CombatControls

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/combat/CombatControls.tsx (estimated)
**Type**: HUD element
**Purpose**: Combat action controls

**UI Elements**:
- Attack button
- Ability selector (missing abilities)
- Item usage (missing items)
- Flee button (MISSING)

**Missing Elements**:
- No flee button (API exists)
- No ability system (backend framework exists)
- No item system

**Flash-card Violation**: No
**Design Pattern**: Combat UI (acceptable, but incomplete)

---

#### Component 16: RefuelDialog

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/station/RefuelDialog.tsx (estimated)
**Type**: HUD element (should be, currently modal)
**Purpose**: Refuel ship at station

**UI Elements**:
- Fuel amount selector
- Cost display
- Refuel button
- Current fuel display

**Flash-card Violation**: Partial (could be HUD-integrated)
**Design Pattern**: Service dialog (acceptable for stations)

---

#### Component 17: RepairDialog

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/station/RepairDialog.tsx (estimated)
**Type**: HUD element (should be, currently modal)
**Purpose**: Repair ship at station

**UI Elements**:
- Repair options (hull, shield, both)
- Cost display
- Repair button
- Current status display

**Flash-card Violation**: Partial (could be HUD-integrated)
**Design Pattern**: Service dialog (acceptable for stations)

---

#### Component 18: ResourceItem

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/inventory/ResourceItem.tsx (estimated)
**Type**: List item component
**Purpose**: Display single resource in inventory

**UI Elements**:
- Resource icon
- Resource name
- Quantity
- Quality badge
- Volume

**Flash-card Violation**: No
**Design Pattern**: List item (acceptable)

---

### Section D: Modal/Overlay Components

#### Component 19: JumpDialog

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/JumpDialog.tsx (estimated)
**Type**: Modal overlay
**Purpose**: Confirm hyperspace jump

**UI Elements**:
- Target sector display
- Distance calculation
- Fuel cost display
- Jump button
- Cancel button

**Missing Elements**:
- No cooldown timer
- No fuel validation (frontend check)

**Flash-card Violation**: YES - Core gameplay in modal
**Design Pattern**: Confirmation modal (should be HUD-integrated quick-jump)

**Recommended Fix**: Add HUD quick-jump widget, keep modal for coordinate input

---

#### Component 20: DockingDialog

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/movement/DockingDialog.tsx (estimated)
**Type**: Modal overlay
**Purpose**: Confirm docking at station

**UI Elements**:
- Station info
- Distance display
- Services available
- Dock button
- Cancel button

**Missing Elements**:
- No range check (frontend validation)

**Flash-card Violation**: YES - Core gameplay in modal
**Design Pattern**: Confirmation modal (should be HUD-integrated proximity-based)

**Recommended Fix**: Add HUD dock button when in range, keep modal for station details

---

#### Component 21: TransferModal

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/inventory/TransferModal.tsx (estimated)
**Type**: Modal overlay
**Purpose**: Transfer resources between inventories

**UI Elements**:
- Source inventory selector
- Target inventory selector
- Resource selector
- Quantity input
- Transfer button

**Missing Elements**:
- No range check (ship-to-ship)
- No bulk transfer
- No drag-and-drop

**Flash-card Violation**: YES - Core gameplay in modal
**Design Pattern**: Transfer modal (should be drag-and-drop)

**Recommended Fix**: Add drag-and-drop between inventories, keep modal as fallback

---

#### Component 22: MissionDetailModal (Not Implemented)

**Location**: MISSING
**Type**: Modal overlay
**Purpose**: Show detailed mission info

**Flash-card Violation**: Depends on implementation
**Design Pattern**: Detail modal (acceptable for one-time views)

---

#### Component 23: FactionDetailModal (Not Implemented)

**Location**: MISSING
**Type**: Modal overlay
**Purpose**: Show faction details, relations, territory

**Flash-card Violation**: No (info modal is acceptable)
**Design Pattern**: Detail modal (acceptable)

---

#### Component 24: ErrorModal

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/common/ErrorModal.tsx (estimated)
**Type**: Modal overlay
**Purpose**: Display error messages

**Flash-card Violation**: No (error modal is acceptable)
**Design Pattern**: Alert modal (standard)

---

#### Component 25: LoadingSpinner

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/common/LoadingSpinner.tsx (estimated)
**Type**: Overlay
**Purpose**: Loading state indicator

**Flash-card Violation**: No
**Design Pattern**: Loading state (standard)

---

#### Component 26: ConfirmDialog

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/common/ConfirmDialog.tsx (estimated)
**Type**: Modal overlay
**Purpose**: Confirm destructive actions

**Flash-card Violation**: No (confirmation is acceptable)
**Design Pattern**: Confirmation modal (standard)

---

#### Component 27: Toast/Notification

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/common/Toast.tsx (estimated)
**Type**: Overlay (non-blocking)
**Purpose**: Show brief notifications

**Flash-card Violation**: No
**Design Pattern**: Toast notification (standard)

---

#### Component 28: HealthBar

**Location**: /home/jon/code/rork-ssw-galaxy-mmo-frontend/components/common/HealthBar.tsx (estimated)
**Type**: Display component
**Purpose**: Show hull/shield status

**Flash-card Violation**: No
**Design Pattern**: Status bar (acceptable)

---

## Part 3: HUD Elements (Persistent UI)

### Existing HUD Elements

**Total**: 0 persistent HUD elements
**Design Issue**: No HUD integration - all UI in tabs or modals

### Missing HUD Elements

#### HUD Element 1: Quick Stats Panel (MISSING)

**Type**: HUD-integrated panel (persistent)
**Location**: Should be top-right corner

**Purpose**: Show critical ship stats at all times

**Expected Elements**:
- Hull bar (red)
- Shield bar (blue)
- Fuel gauge (yellow)
- Credits balance
- Cargo capacity
- Location

**Impact**: Players must navigate to tabs to see basic stats

**Recommended Implementation**: 1 day
**Priority**: P1 (High)

---

#### HUD Element 2: Mini-Map / Radar (MISSING)

**Type**: HUD-integrated map (persistent)
**Location**: Should be bottom-right corner

**Purpose**: Show nearby entities and navigation

**Expected Elements**:
- Current sector (center)
- Nearby ships (dots)
- Nearby stations (icons)
- NPCs (red dots)
- Resource nodes (green dots)

**Impact**: No spatial awareness

**Recommended Implementation**: 2 days
**Priority**: P1 (High)

---

#### HUD Element 3: Active Mission Tracker (MISSING)

**Type**: HUD-integrated panel (collapsible)
**Location**: Should be left side

**Purpose**: Show pinned mission objectives

**Expected Elements**:
- Mission name
- Objective list with progress
- Expiration timer
- Quick navigation to mission target

**Impact**: Must open missions tab to check progress

**Recommended Implementation**: 1 day
**Priority**: P2 (Medium)

---

#### HUD Element 4: Notification Toast (PARTIAL)

**Type**: HUD-integrated overlay (temporary)
**Location**: Should be top-center

**Purpose**: Show brief event notifications

**Expected Elements**:
- Event icon
- Event message
- Auto-dismiss timer

**Current Status**: Partial - some events show toasts, inconsistent

**Impact**: Players miss important events

**Recommended Implementation**: 1 day
**Priority**: P1 (High)

---

#### HUD Element 5: Quick Action Wheel (MISSING)

**Type**: HUD-integrated radial menu
**Location**: Should be context-sensitive (near clicked entity)

**Purpose**: Quick access to common actions

**Expected Elements**:
- Jump (when sector clicked)
- Dock (when station clicked)
- Attack (when NPC clicked)
- Transfer (when ship clicked)
- Mine (when node clicked)

**Impact**: All actions require modal dialogs

**Recommended Implementation**: 3 days
**Priority**: P2 (Medium)

---

#### HUD Element 6: Chat Panel (MISSING)

**Type**: HUD-integrated panel (collapsible)
**Location**: Should be bottom-left

**Purpose**: Persistent chat interface

**Expected Elements**:
- Chat tabs (sector, faction, DM)
- Message list
- Input field
- Unread badges

**Impact**: No chat system at all

**Recommended Implementation**: 4 days (includes backend integration)
**Priority**: P0 (Critical)

---

## Part 4: Navigation Flow Analysis

### Primary Navigation Paths

```
App Startup
├─→ Login (if not authenticated)
│   ├─→ Signup
│   │   └─→ Character Create
│   │       └─→ Ship Customize
│   │           └─→ Dashboard
│   └─→ Dashboard (if authenticated)
└─→ Dashboard (if authenticated)
    ├─→ Tab: Dashboard (home)
    ├─→ Tab: Map
    │   ├─→ Sector View
    │   │   ├─→ Combat (inline)
    │   │   └─→ Docking Dialog (modal)
    │   └─→ Jump Dialog (modal)
    ├─→ Tab: Missions
    │   └─→ Mission Detail (inline)
    ├─→ Tab: Profile
    │   └─→ Reputation List
    └─→ Tab: Feed
        └─→ Event Links (to source screens)
```

### Secondary Navigation Paths

```
Dashboard
├─→ Trading (from quick action)
│   ├─→ Order Form
│   └─→ Ship Inventory
│       └─→ Transfer Modal
├─→ Sector View (from quick action)
│   ├─→ Combat View (inline)
│   ├─→ Station Services
│   │   ├─→ Refuel Dialog
│   │   └─→ Repair Dialog
│   └─→ Mining (action button)
└─→ Character/Ship Info (from cards)
    └─→ Character/Ship Customize (missing edit UI)
```

### Unreachable Screens

**Total**: 0 screens are completely unreachable

**Note**: All screens are accessible, but some features are hidden:
- Faction details (no navigation from reputation list)
- Reputation history (no navigation from profile)
- Chat (no UI at all)
- Admin (no admin role detection)

---

## Part 5: Design Pattern Analysis

### Flash-Card UI Violations

**Design Rule**: "No flash-card UI for core gameplay mechanics"
**Rationale**: Core gameplay should be HUD-integrated, not modal-based

#### Violation 1: Jump Dialog

**Component**: JumpDialog.tsx
**Issue**: Hyperspace jump confirmation in modal
**Impact**: Interrupts gameplay flow
**Frequency**: Every sector jump (high usage)

**Recommended Fix**:
- Add HUD quick-jump widget (click sector → immediate jump with confirmation toast)
- Keep modal for coordinate-based jumps (exploration)
- Add jump queue (multiple jumps planned)

**Effort**: 2 days
**Priority**: P1 (High)

---

#### Violation 2: Docking Dialog

**Component**: DockingDialog.tsx
**Issue**: Docking confirmation in modal
**Impact**: Interrupts station access
**Frequency**: Every station visit (medium usage)

**Recommended Fix**:
- Add HUD proximity-based dock button (appears when in range)
- Click station → automatic docking if in range
- Keep modal for station info/services menu

**Effort**: 1 day
**Priority**: P1 (High)

---

#### Violation 3: Transfer Modal

**Component**: TransferModal.tsx
**Issue**: Resource transfer in modal, no drag-and-drop
**Impact**: Tedious cargo management
**Frequency**: Every trade/mining session (high usage)

**Recommended Fix**:
- Add drag-and-drop between inventory panels
- Add "Transfer All" button for bulk operations
- Keep modal as fallback for precise transfers

**Effort**: 3 days
**Priority**: P2 (Medium)

---

#### Violation 4: Mission Accept Dialog (Potential)

**Component**: MissionCard.tsx
**Issue**: Mission details could be modal (currently inline, OK)
**Impact**: None (current implementation is acceptable)
**Frequency**: Every mission acceptance (medium usage)

**Recommended Fix**: None (already inline expanded)

---

#### Violation 5: Refuel Dialog

**Component**: RefuelDialog.tsx
**Issue**: Refueling in modal, should be quick action
**Impact**: Minor interruption
**Frequency**: Every low-fuel station visit (medium usage)

**Recommended Fix**:
- Add HUD quick-refuel button (when docked, low fuel)
- Auto-refuel option in settings
- Keep modal for precise fuel purchases

**Effort**: 1 day
**Priority**: P2 (Medium)

---

#### Violation 6: Repair Dialog

**Component**: RepairDialog.tsx
**Issue**: Repairs in modal, should be quick action
**Impact**: Minor interruption
**Frequency**: Every damaged station visit (low-medium usage)

**Recommended Fix**:
- Add HUD quick-repair button (when docked, damaged)
- Auto-repair option in settings
- Keep modal for partial repairs

**Effort**: 1 day
**Priority**: P2 (Medium)

---

### Acceptable Modals (Not Violations)

**These modals are acceptable design patterns**:

1. **Login/Signup** - One-time auth screens (standard)
2. **Character/Ship Create** - One-time creation wizards (standard)
3. **Error Modal** - Error messages (standard)
4. **Confirm Dialog** - Destructive action confirmations (standard)
5. **Mission Detail** - Info modals (currently inline, even better)
6. **Faction Detail** - Info modals (not implemented)

---

## Part 6: Missing UI Elements

### Critical Missing Elements (P0-P1)

1. **Chat Interface** (P0) - No social features
2. **Quick Stats HUD Panel** (P1) - No persistent ship status
3. **Mini-Map/Radar** (P1) - No spatial awareness
4. **Faction List/Details** (P1) - Rich backend, no UI
5. **Reputation History** (P1) - No change tracking
6. **Notification Badges** (P1) - No unread counts

### Important Missing Elements (P2)

7. **Active Mission Tracker HUD** - Must open missions tab
8. **Order Cancellation UI** - Can't cancel bad orders
9. **Flee Button** - Can't escape combat
10. **Combat Log** - No event history
11. **Sector Generation UI** - Procgen not exposed
12. **Inventory Filtering** - No sorting/search
13. **Password Change Screen** - No account management
14. **Session Management** - No active sessions list
15. **Market Statistics** - No volume/trends

### Admin Missing Elements (P2, Admin-Only)

16. **Admin Dashboard** - No moderation tools
17. **Audit Log Viewer** - No action history
18. **Health Check Dashboard** - No service monitoring

---

## Part 7: Recommendations

### Immediate Actions (P0-P1, 2 weeks)

**Week 1: Critical HUD Elements**

1. **Add Chat Interface** (4 days)
   - Create chat panel component
   - Integrate 7 chat endpoints
   - Handle game.chat.message SSE event
   - Add to HUD (bottom-left, collapsible)

2. **Add Quick Stats HUD Panel** (1 day)
   - Hull/shield/fuel gauges
   - Credits balance
   - Cargo capacity
   - Location display
   - Top-right corner, persistent

3. **Add Mini-Map/Radar** (2 days)
   - 2D sector mini-map
   - Nearby entities (ships, stations, NPCs)
   - Bottom-right corner, persistent

**Week 2: High-Value Features**

4. **Add Faction UI** (3 days)
   - Faction list screen
   - Faction detail screen
   - Reputation history timeline
   - Navigation from Profile tab

5. **Add Notification Badges** (1 day)
   - Unread counts on tabs
   - Event badges on feed tab
   - Mission badges on missions tab

6. **Refactor Jump/Dock to HUD** (2 days)
   - Quick-jump HUD widget
   - Proximity-based dock button
   - Keep modals for details

### Strategic Investments (P2, 2-4 weeks)

7. **Add Quick Action Wheel** (3 days)
   - Context-sensitive radial menu
   - Quick access to common actions
   - Reduces modal usage

8. **Add Inventory Drag-and-Drop** (3 days)
   - Drag resources between inventories
   - Bulk transfer operations
   - Visual feedback

9. **Add Active Mission Tracker** (1 day)
   - HUD-integrated mission objectives
   - Pinned mission display
   - Progress updates

10. **Add Combat Improvements** (3 days)
    - Flee button
    - Scrolling combat log
    - Combat statistics

11. **Add Market Enhancements** (2 days)
    - Order cancellation UI
    - Market statistics
    - Trade route finder

### Deferred (P2, Low Priority)

12. **Admin Dashboard** - Admin-only tools
13. **Inventory Filtering** - QoL improvement
14. **Password Change** - Rare use case
15. **Session Management** - Advanced feature

---

## Summary Statistics

### UI Surface Count

| Category | Count | Examples |
|----------|-------|----------|
| **Screens (Routes)** | 16 | Login, Dashboard, Map, Missions, etc. |
| **Major Components** | 18 | CharacterCard, OrderForm, CombatControls, etc. |
| **Modals/Overlays** | 10 | JumpDialog, TransferModal, ErrorModal, etc. |
| **HUD Elements** | 0 (6 missing) | Quick Stats, Mini-Map, Chat, etc. (all missing) |
| **Total** | 44 | |

### Flash-Card Violations

| Violation | Severity | Frequency | Fix Effort |
|-----------|----------|-----------|------------|
| Jump Dialog | High | High usage | 2 days |
| Docking Dialog | High | Medium usage | 1 day |
| Transfer Modal | Medium | High usage | 3 days |
| Refuel Dialog | Low | Medium usage | 1 day |
| Repair Dialog | Low | Low usage | 1 day |

### Missing Critical UI

| Missing Element | Priority | Impact | Effort |
|----------------|----------|--------|--------|
| Chat Interface | P0 | Very High | 4 days |
| Quick Stats HUD | P1 | High | 1 day |
| Mini-Map | P1 | High | 2 days |
| Faction List/Details | P1 | High | 3 days |
| Notification Badges | P1 | Medium | 1 day |
| Flee Button | P1 | Medium | 1 day |

---

## Next Steps

1. **Create A3-mechanics-coverage-report.md** - Executive summary for leadership
2. **Implement Critical HUD Elements** - Chat, Quick Stats, Mini-Map
3. **Refactor Flash-Card Violations** - Jump/Dock to HUD-integrated

---

**End of A3 UI Surface Map**
