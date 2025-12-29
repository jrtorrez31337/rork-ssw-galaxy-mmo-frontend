# B1: UX System Definition
## 2D Space Shooter RPG Command Console Architecture

**Analysis Date**: 2025-12-27
**Agent**: UX Authority Agent (Agent B)
**Task**: Define canonical UX system for 2D space shooter RPG
**Status**: Binding (all frontend changes must conform to this spec)

---

## Executive Summary

This document establishes the **binding UX architecture** for the SSW Galaxy MMO frontend. All UI implementations must conform to these patterns to maintain the North Star vision of a **2D space shooter RPG command console**.

**Core Principle**: The game must read as a **persistent cockpit shell** with high information density, real-time feedback, and HUD-integrated controls. Flash-card UI (centered modal dialogs) is prohibited for core gameplay loops.

**Target Experience**: EVE Online's information density + FTL's cockpit intimacy + Elite Dangerous's HUD design language

---

## Part 1: Architecture Overview

### 1.1 Shell Architecture (Cockpit Paradigm)

The UI is organized into a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: HUD SHELL                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Status Bar (persistent, always visible)                   │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                             │  │
│  │              LAYER 2: VIEWPORT/WORKSPACE                    │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │                                                       │   │  │
│  │  │  Primary View Area                                   │   │  │
│  │  │  - Map/Sector View (visual)                          │   │  │
│  │  │  - Mission List (data)                               │   │  │
│  │  │  - Trading Interface (tools)                         │   │  │
│  │  │                                                       │   │  │
│  │  │                                                       │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                             │  │
│  │  LAYER 3: PANELS (side/bottom panels, collapsible)         │  │
│  │  ┌─────────────┐                         ┌─────────────┐   │  │
│  │  │  Panel L    │                         │  Panel R    │   │  │
│  │  │  (optional) │                         │  (optional) │   │  │
│  │  └─────────────┘                         └─────────────┘   │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  Tab Navigation (5 tabs, persistent)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Layer Responsibilities**:
- **Layer 1 (HUD Shell)**: Always visible, minimal height, critical stats
- **Layer 2 (Viewport)**: Primary content area, swaps based on tab selection
- **Layer 3 (Panels)**: Contextual panels, collapsible, overlay-capable

---

### 1.2 Navigation Model

**Primary Navigation**: Bottom tab bar (5 tabs, always visible)
- Dashboard
- Map
- Missions
- Profile
- Feed

**Secondary Navigation**: In-context actions (no route changes)
- HUD buttons (Jump, Dock, Combat actions)
- Panel toggles (Chat, Inventory, Market)
- Overlays (Combat log, Mission details, Ship status)

**Prohibited Navigation**:
- ❌ Full-screen modals for core gameplay (Jump, Dock, Combat, Trading)
- ❌ Navigation stacks deeper than 2 levels
- ❌ Context-switching that hides HUD

---

## Part 2: HUD Shell Components

### 2.1 Status Bar (Mandatory HUD Element)

**Position**: Top of screen, fixed, 48-60px height
**Persistence**: Always visible (all screens except Login/Signup)

**Required Elements** (left-to-right):

```
┌────────────────────────────────────────────────────────────────┐
│ [Ship Icon] Ship Name | Sector 12,5,8 | ⚡ 850/1000 | 🛡 600/600 │
│                                        ↓ Fuel      ↓ Hull/Shield│
│                                                                  │
│                       💰 45,200 CR | 🎯 3 Missions | 🔔 2 Alerts │
│                       ↓ Credits    ↓ Active       ↓ Unread     │
└────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- Ship: `GET /v1/ships/{ship_id}` (poll every 10s, or SSE `game.ship.status`)
- Location: `GET /v1/sectors/{sector_id}` (SSE `game.ship.location`)
- Fuel/Hull/Shield: From ship data (real-time SSE updates)
- Credits: `GET /v1/characters/{id}` inventory
- Missions: `GET /v1/missions/active` (count)
- Alerts: SSE event feed (unread count)

**Visual Treatment**:
- Background: Semi-transparent dark (80% opacity)
- Typography: Monospace font (simulates command console)
- Icons: Outlined style, 16x16px
- Colors: Use semantic colors (fuel: yellow, hull: red, shield: cyan)

**Interaction**:
- Tapping any stat opens contextual panel (e.g., fuel → refuel panel)
- Status bar is **not a navigation element** (no route changes)

---

### 2.2 Quick Action HUD (Contextual Buttons)

**Position**: Floating overlay on Viewport (top-right or bottom-right)
**Persistence**: Visible on Map and Sector View screens only

**Required Buttons**:

```
┌───────────────┐
│  🚀 JUMP      │  → Opens HUD-integrated jump panel (not modal)
├───────────────┤
│  🏪 DOCK      │  → Opens docking confirmation (inline, not modal)
├───────────────┤
│  ⚔️  COMBAT   │  → Opens combat interface (replaces viewport)
├───────────────┤
│  💬 CHAT      │  → Toggles chat panel (side or bottom)
└───────────────┘
```

**Visual Treatment**:
- Semi-transparent background (60% opacity)
- 44x44px touch targets (minimum)
- Icon + text label (icon-only on small screens)
- Disabled state when action unavailable (e.g., Jump on cooldown)

**Behavior**:
- Buttons expand panels/overlays, **never navigate to new screen**
- Actions happen in-place (HUD paradigm, not page paradigm)

---

### 2.3 Mini-Map / Radar (New HUD Element - Missing)

**Position**: Top-right corner, 120x120px
**Persistence**: Visible on Map and Sector View screens

**Purpose**: Persistent spatial awareness without full map view

**Required Data**:
- Current sector (center dot)
- Nearby sectors (8 adjacent sectors, dimmed)
- Stations (yellow icons)
- NPCs (red dots for hostile, green for friendly)
- Players (blue dots, if PvP implemented)

**Data Source**:
- `GET /v1/sectors/{sector_id}` for current sector
- `GET /v1/sectors/{sector_id}/objects` for stations/NPCs (future endpoint)
- SSE `game.ship.location` for real-time updates

**Interaction**:
- Tap to open full Map screen
- No pan/zoom on mini-map (static overview only)

**Visual Treatment**:
- Dark background with grid overlay
- Simple geometric shapes (dots, squares)
- Minimal detail (abstracted representation)

---

## Part 3: Panel System

### 3.1 Panel Types

**Three panel archetypes**:

1. **Side Panel** (Left or Right, 240-320px width)
   - Examples: Chat, Inventory, Ship Status
   - Collapsible (tap to minimize to icon)
   - Overlays viewport on small screens, side-by-side on tablets

2. **Bottom Panel** (Full width, 200-300px height)
   - Examples: Combat log, Event feed, Mission tracker
   - Slides up from bottom
   - Dismissible with swipe-down gesture

3. **Inline Panel** (Embedded in viewport)
   - Examples: Jump target selector, Market orderbook
   - Replaces part of viewport (no overlay)
   - Dismissible with back button or cancel action

---

### 3.2 Chat Panel (Priority: P0 - Missing)

**Type**: Side panel (right side preferred)
**Default State**: Collapsed to icon (expandable)

**UI Structure**:

```
┌─────────────────────────────┐
│ CHAT                    [×] │ ← Header with close
├─────────────────────────────┤
│ [Sector] [Faction] [DM]     │ ← Tabs for room types
├─────────────────────────────┤
│                             │
│ [PlayerName] Message text   │ ← Message list
│ [PlayerName] Message text   │
│ [PlayerName] Message text   │
│                             │
├─────────────────────────────┤
│ [Type message...] [Send]    │ ← Input field
└─────────────────────────────┘
```

**Data Sources**:
- `GET /v1/chat/rooms` - List available rooms
- `POST /v1/chat/rooms/{room_id}/join` - Join room
- `POST /v1/chat/messages` - Send message
- SSE `game.chat.message` - Real-time message delivery

**Behavior**:
- Auto-join sector chat on sector change
- Unread message count in collapsed state
- Message history persists (local storage)

---

### 3.3 Inventory Panel (Priority: P1)

**Type**: Side panel (left side preferred)
**Trigger**: Status bar → Credits tap, or Tab bar → Profile → Inventory

**UI Structure**:

```
┌─────────────────────────────┐
│ INVENTORY               [×] │
├─────────────────────────────┤
│ Resources                   │ ← Category tabs
│ Equipment (future)          │
├─────────────────────────────┤
│ Iron Ore       x 120        │ ← Resource list
│ Water          x 45         │
│ Titanium       x 8          │
│                             │
│                             │
├─────────────────────────────┤
│ Total Value: 12,400 CR      │ ← Summary
└─────────────────────────────┘
```

**Data Sources**:
- `GET /v1/characters/{id}/inventory` - Inventory contents

**Behavior**:
- Tap resource → show details (market price, description)
- Drag-and-drop to transfer (when docked, for trading)

---

### 3.4 Jump Panel (Priority: P0 - Replaces Modal)

**Current Violation**: Jump is a full-screen modal (flash-card UI)
**Correct Pattern**: Inline panel on Map screen

**Type**: Inline panel (embedded in Map viewport)
**Trigger**: HUD button "JUMP" or map tap on sector

**UI Structure**:

```
Map Screen (when JUMP button pressed):
┌─────────────────────────────────────────────┐
│ Status Bar                                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  3D Map View (dimmed)                 │ │
│  │  - Target sector highlighted          │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────┐   │ ← Jump panel overlays bottom
│  │ JUMP TO SECTOR 12, 6, 8             │   │
│  ├─────────────────────────────────────┤   │
│  │ Distance: 12.4 units                │   │
│  │ Fuel Cost: 124 fuel (850/1000)      │   │
│  │ Cooldown: Ready                     │   │
│  ├─────────────────────────────────────┤   │
│  │ [Cancel]  [CONFIRM JUMP]            │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ Tab Navigation                              │
└─────────────────────────────────────────────┘
```

**Data Sources**:
- `POST /v1/actions/jump` - Execute jump
- `GET /v1/ships/{id}` - Validate fuel

**Behavior**:
- Panel slides up from bottom (not full-screen)
- Map remains visible (dimmed, shows target)
- Cancel button dismisses panel (returns to map)
- Confirm executes jump and dismisses panel

---

### 3.5 Docking Panel (Priority: P1 - Replaces Modal)

**Current Violation**: Docking is a full-screen modal
**Correct Pattern**: Inline confirmation on Sector View

**Type**: Inline panel (embedded in Sector View)
**Trigger**: HUD button "DOCK" (only enabled when station in range)

**UI Structure**:

```
Sector View (when DOCK button pressed):
┌─────────────────────────────────────────────┐
│ Status Bar                                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  2D Sector View (dimmed)              │ │
│  │  - Station icon highlighted           │ │
│  │  - Ship icon connected to station     │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────┐   │ ← Docking panel overlays bottom
│  │ DOCK AT STATION: Trade Hub Alpha    │   │
│  ├─────────────────────────────────────┤   │
│  │ Services Available:                 │   │
│  │  • Refuel (50 CR/unit)              │   │
│  │  • Repair (100 CR/HP)               │   │
│  │  • Market (18 resources available)  │   │
│  ├─────────────────────────────────────┤   │
│  │ [Cancel]  [DOCK]                    │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ Tab Navigation                              │
└─────────────────────────────────────────────┘
```

**Data Sources**:
- `POST /v1/actions/dock` - Execute docking
- `GET /v1/sectors/{id}/stations` - Station details (future endpoint)

**Behavior**:
- Panel shows station services preview
- Docking triggers SSE event `game.ship.docked`
- After docking, panel transforms to "Station Services" menu

---

### 3.6 Combat Interface (Priority: P1 - Replaces Viewport)

**Current Violation**: None (combat is implemented correctly)
**Pattern**: Combat replaces viewport entirely (acceptable)

**Type**: Viewport replacement (not a modal)
**Trigger**: SSE `game.combat.start` or manual initiate

**UI Structure**:

```
Combat Screen:
┌─────────────────────────────────────────────┐
│ Status Bar (combat-specific stats)         │
├─────────────────────────────────────────────┤
│  Enemy Ship                                 │
│  ┌────────────────────────────────────┐    │
│  │  [NPC Ship Sprite]                 │    │
│  │  Pirate Scout                      │    │
│  │  🛡 300/300  ❤️ 200/200            │    │
│  └────────────────────────────────────┘    │
│                                             │
│  Your Ship                                  │
│  ┌────────────────────────────────────┐    │
│  │  [Player Ship Sprite]              │    │
│  │  Nighthawk                         │    │
│  │  🛡 600/600  ❤️ 450/500            │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌──────────────────────────────────────┐  │ ← Action panel (bottom)
│  │ [⚔️ Attack] [🎯 Ability] [🏃 Flee]  │  │
│  └──────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ Combat Log (bottom panel, collapsible)     │
│  • You hit for 45 damage                   │
│  • Pirate Scout hit you for 22 damage     │
└─────────────────────────────────────────────┘
```

**Data Sources**:
- `POST /v1/combat/action` - Take action
- `POST /v1/combat/{id}/flee` - Flee combat
- SSE `game.combat.action` - Real-time combat updates

**Behavior**:
- Combat state persists (can switch tabs, combat continues)
- Combat log shows last 10 actions (scrollable)
- Tab navigation remains visible (can check missions, etc.)

---

## Part 4: Information Density Guidelines

### 4.1 Density Tiers

**Tier 1: Critical** (Always visible in HUD)
- Ship fuel, hull, shield
- Current location (sector coordinates)
- Credits balance
- Active mission count
- Alert count

**Tier 2: Contextual** (Visible in panels or on-demand)
- Inventory details
- Mission objectives
- Market prices
- Faction reputation
- Chat messages

**Tier 3: Reference** (Visible in dedicated screens)
- Full character stats
- Ship full stats
- Mission archive
- Reputation history

---

### 4.2 Density Modes (Optional Enhancement)

Support for **two density modes** (user preference):

**Compact Mode** (Default):
- Status bar: 48px height, icons only (no text labels)
- Panels: 240px width
- Font size: 12px

**Comfortable Mode** (Accessibility):
- Status bar: 60px height, icons + text labels
- Panels: 320px width
- Font size: 14px

---

## Part 5: Real-Time Feedback Integration

### 5.1 SSE Event → UI Update Mapping

All SSE events must trigger **immediate UI updates** without user action.

**Event-to-Component Mapping**:

| SSE Event | UI Component(s) | Update Type |
|-----------|-----------------|-------------|
| `game.ship.location` | Status Bar, Mini-map | Location text, map position |
| `game.ship.fuel` | Status Bar | Fuel gauge |
| `game.ship.hull` | Status Bar | Hull HP |
| `game.ship.shield` | Status Bar | Shield HP |
| `game.combat.start` | Viewport | Replace with Combat UI |
| `game.combat.action` | Combat Log | Append log entry |
| `game.combat.outcome` | Viewport, Status Bar | Restore map, update HP |
| `game.combat.loot` | Inventory Panel | Add items, show notification |
| `game.economy.order_filled` | Event Feed, Status Bar | Credits update, feed entry |
| `game.economy.market_shift` | Market Panel | Price update |
| `game.missions.accepted` | Status Bar, Mission List | Mission count +1, list update |
| `game.missions.completed` | Status Bar, Event Feed | Mission count -1, notification |
| `game.chat.message` | Chat Panel | Append message, unread badge |
| `game.station.docked` | Viewport | Show station services menu |
| `game.station.undocked` | Viewport | Restore sector view |

---

### 5.2 Notification System

**Three notification urgency levels**:

1. **Critical** (Blocks user action)
   - Example: "Combat initiated! Prepare for battle"
   - Treatment: Full-screen overlay with dismiss button

2. **Important** (Requires attention)
   - Example: "Mission objective completed"
   - Treatment: Toast notification (5s auto-dismiss, bottom)

3. **Informational** (Passive awareness)
   - Example: "Player joined sector chat"
   - Treatment: Event feed entry only (no toast)

**SSE Event → Notification Level**:
- `game.combat.start` → Critical
- `game.combat.outcome` → Important
- `game.missions.completed` → Important
- `game.economy.order_filled` → Informational
- `game.chat.message` → Informational (unless DM)

---

## Part 6: Interaction Metaphors

### 6.1 Core Metaphors

**Cockpit Console** (Primary metaphor):
- All actions are "control inputs" (buttons, toggles, sliders)
- No "page navigation" for gameplay actions
- Persistent UI shell (you're always in the cockpit)

**Panel Management** (Secondary metaphor):
- Panels are "console displays" (toggleable, configurable)
- User can open/close panels as needed
- No fixed panel layouts (except Status Bar)

**Real-Time Simulation** (Tertiary metaphor):
- Game world runs continuously (SSE events)
- UI reflects state changes immediately
- No "request-response" feel (no loading spinners for state updates)

---

### 6.2 Prohibited Patterns (Flash-Card UI)

**Definition**: Flash-card UI = centered modal dialog that obscures the game world for core gameplay actions

**Prohibited Use Cases**:
- ❌ Jump target selection (must be inline panel)
- ❌ Docking confirmation (must be inline panel)
- ❌ Combat actions (must be viewport replacement)
- ❌ Inventory transfer (must be drag-and-drop or side panel)
- ❌ Market trading (must be inline panel or viewport replacement)
- ❌ Mission acceptance (acceptable as inline card, not modal)

**Acceptable Use Cases**:
- ✅ Login/Signup (not in-game)
- ✅ Character creation (one-time setup)
- ✅ Ship creation (one-time setup)
- ✅ Settings menu (meta-game action)
- ✅ Critical errors (system failure)

---

## Part 7: Responsive Breakpoints

### 7.1 Screen Size Tiers

**Mobile Portrait** (320-480px width):
- Status bar: Compact mode only, 48px height
- Panels: Full-screen overlays (no side-by-side)
- Mini-map: Hidden (tap status bar for full map)
- Tab bar: 5 icon-only tabs

**Mobile Landscape** (481-768px width):
- Status bar: Compact or comfortable mode, 48-60px
- Panels: Bottom panels only (side panels overlay)
- Mini-map: Visible, 100x100px
- Tab bar: 5 icon + text tabs

**Tablet Portrait** (769-1024px width):
- Status bar: Comfortable mode, 60px
- Panels: Side panels visible (240px width)
- Mini-map: Visible, 120x120px
- Tab bar: 5 icon + text tabs

**Tablet Landscape / Desktop** (1025px+ width):
- Status bar: Comfortable mode, 60px
- Panels: Side panels + bottom panels simultaneously
- Mini-map: Visible, 150x150px
- Tab bar: 5 icon + text tabs

---

## Part 8: Design Tokens (Visual Language)

### 8.1 Color Palette

**Semantic Colors** (State-driven):
- `hull-critical`: #FF4444 (hull < 25%)
- `hull-damaged`: #FFAA00 (hull 25-75%)
- `hull-healthy`: #44FF44 (hull > 75%)
- `shield-active`: #00AAFF (shield > 0%)
- `shield-down`: #666666 (shield = 0%)
- `fuel-low`: #FFAA00 (fuel < 20%)
- `fuel-ok`: #FFFF00 (fuel >= 20%)

**UI Element Colors**:
- `hud-background`: rgba(0, 0, 0, 0.8) (semi-transparent black)
- `panel-background`: rgba(20, 20, 30, 0.95) (near-opaque dark blue)
- `button-primary`: #00AAFF (cyan, action buttons)
- `button-danger`: #FF4444 (red, destructive actions like Flee)
- `text-primary`: #FFFFFF (white, high contrast)
- `text-secondary`: #AAAAAA (light gray, labels)
- `text-accent`: #00FFAA (cyan-green, highlights)

**Faction Colors** (From backend spec):
- Terran Federation: #0066CC (blue)
- Martian Collective: #CC3300 (red)
- Belter Alliance: #996600 (brown)
- Jovian Republic: #CC6600 (orange)
- Corporate Syndicate: #666666 (gray)
- Pirate Clans: #990000 (dark red)
- Independent Traders: #009900 (green)
- Research Coalition: #9900CC (purple)
- Military Junta: #003300 (dark green)
- Frontier Settlers: #CCAA00 (yellow)

---

### 8.2 Typography

**Font Families**:
- `hud-font`: "Courier New", "Monaco", monospace (status bar, stats)
- `ui-font`: "Roboto", "Helvetica Neue", sans-serif (panels, buttons)
- `title-font`: "Orbitron", "Exo 2", sans-serif (headings, mission names)

**Font Sizes** (Compact mode):
- `hud-stat`: 12px (status bar values)
- `hud-label`: 10px (status bar labels)
- `panel-body`: 14px (panel text)
- `panel-heading`: 16px (panel titles)
- `button-text`: 14px (button labels)

---

### 8.3 Spacing System

**Base Unit**: 4px

**Spacing Scale**:
- `xs`: 4px (tight spacing, icon-to-text)
- `sm`: 8px (button padding)
- `md`: 16px (panel padding)
- `lg`: 24px (section spacing)
- `xl`: 32px (screen margins)

---

## Part 9: Animation & Transitions

### 9.1 Panel Transitions

**Panel Open/Close**:
- Duration: 200ms
- Easing: ease-out
- Effect: Slide from edge (left/right/bottom)

**Panel Collapse/Expand**:
- Duration: 150ms
- Easing: ease-in-out
- Effect: Width/height transition

---

### 9.2 State Transitions

**SSE Event Feedback**:
- Duration: 100ms
- Effect: Brief highlight (pulse or glow)
- Example: Status bar fuel updates → yellow pulse

**Button Press**:
- Duration: 50ms
- Effect: Scale down (95%) + opacity (80%)

**Critical Alerts**:
- Duration: 300ms
- Effect: Fade in + slide up from bottom

---

## Part 10: Accessibility

### 10.1 Touch Targets

**Minimum size**: 44x44px (Apple HIG, Android Material)

**Applies to**:
- All buttons (HUD, panels, tabs)
- Tab bar icons
- Status bar tap targets
- List items (missions, chat messages)

---

### 10.2 Text Legibility

**Minimum contrast ratio**: 4.5:1 (WCAG AA)

**Enforced for**:
- Status bar text on semi-transparent background
- Panel text on dark background
- Button text on colored background

**Exception**: Decorative elements (grid lines, dividers) may use 3:1 ratio

---

### 10.3 Reduced Motion

**User preference**: Respect `prefers-reduced-motion` OS setting

**Behavior**:
- Panel transitions: Instant (no slide animation)
- SSE feedback: No pulse/glow (static highlight only)
- Button press: No scale effect (opacity only)

---

## Part 11: Implementation Checklist

### Phase 1: Critical HUD Elements (Week 1)

- [ ] Implement Status Bar with all required stats
- [ ] Add Quick Action HUD (Jump, Dock, Combat, Chat)
- [ ] Refactor Jump dialog to inline panel (remove modal)
- [ ] Refactor Docking dialog to inline panel (remove modal)
- [ ] Add Mini-Map/Radar component

### Phase 2: Panel System (Week 2)

- [ ] Build Chat Panel (side panel, collapsible)
- [ ] Build Inventory Panel (side panel)
- [ ] Build Combat Log Panel (bottom panel)
- [ ] Implement panel collapse/expand animations

### Phase 3: Real-Time Integration (Week 3)

- [ ] Map all 20 SSE events to UI components
- [ ] Implement notification system (critical, important, informational)
- [ ] Add real-time status bar updates (no polling)
- [ ] Add event feed persistence (local storage)

### Phase 4: Polish & Accessibility (Week 4)

- [ ] Enforce 44x44px touch targets
- [ ] Validate 4.5:1 contrast ratios
- [ ] Add reduced motion support
- [ ] Add density mode toggle (compact/comfortable)

---

## Part 12: Enforcement & QA

### 12.1 Design Review Checklist

Before merging any UI PR, verify:

- [ ] No full-screen modals for core gameplay (Jump, Dock, Combat, Trading)
- [ ] Status bar is visible on all in-game screens
- [ ] All SSE events trigger UI updates (no user refresh)
- [ ] Touch targets are 44x44px minimum
- [ ] Colors match design tokens (no arbitrary hex codes)
- [ ] Animations are 200ms or less (no slow transitions)

### 12.2 Regression Tests (Agent C)

Agent C will enforce:

1. **Flash-card UI detection**: Scan for `Modal` or `Dialog` components in core gameplay routes
2. **SSE event coverage**: Verify all 20 events have handlers
3. **HUD visibility**: Ensure Status Bar rendered on all screens except Login/Signup
4. **Touch target size**: Automated Detox tests for 44x44px buttons
5. **Color token usage**: Lint for hardcoded hex colors (must use design tokens)

---

## Part 13: Migration Plan (Current → Target)

### 13.1 Current State Issues

From A3 analysis, the following violations exist:

1. **Jump Dialog**: Full-screen modal → Must be inline panel
2. **Docking Dialog**: Full-screen modal → Must be inline panel
3. **Transfer Modal**: Full-screen modal → Must be drag-and-drop or side panel
4. **No Status Bar**: Missing persistent HUD → Must add
5. **No Mini-Map**: Missing spatial awareness → Must add
6. **No Chat Panel**: Missing social system → Must add
7. **Polling for SSE data**: Some components poll instead of SSE → Must migrate to SSE

### 13.2 Migration Steps (Sequential)

**Step 1**: Add Status Bar (non-breaking)
- Add Status Bar to all tab screens
- Does not affect existing UI

**Step 2**: Add Quick Action HUD (non-breaking)
- Add HUD buttons to Map and Sector View
- Existing modals still work

**Step 3**: Refactor Jump (breaking change)
- Replace Jump modal with inline panel
- Update Map screen to embed panel
- Test: Jump functionality unchanged

**Step 4**: Refactor Docking (breaking change)
- Replace Docking modal with inline panel
- Update Sector View to embed panel
- Test: Docking functionality unchanged

**Step 5**: Add Chat Panel (new feature)
- Implement Chat side panel
- Wire SSE `game.chat.message`
- Test: Real-time chat works

**Step 6**: Add Mini-Map (new feature)
- Implement Mini-Map component
- Wire SSE `game.ship.location`
- Test: Map updates on jump/dock

**Step 7**: SSE Migration (non-breaking)
- Replace polling with SSE subscriptions
- Update Status Bar to use SSE for fuel/hull/shield
- Test: No regressions in data accuracy

---

## Part 14: UX Metrics & Success Criteria

### 14.1 Performance Targets

- **Panel open/close**: < 200ms (60fps)
- **SSE event to UI update**: < 100ms
- **Status bar update frequency**: Real-time (no delay)
- **Mini-map update frequency**: 1 update/sec maximum

### 14.2 User Experience Goals

- **Flash-card UI**: 0 instances for core gameplay (measured by code scan)
- **HUD visibility**: 100% of playtime (except auth screens)
- **SSE event coverage**: 100% (all 20 events handled)
- **Touch target compliance**: 100% (all buttons 44x44px+)

### 14.3 Business Metrics

- **Session duration**: +20% (persistent HUD reduces context-switching)
- **Chat engagement**: +300% (chat panel visibility)
- **Combat completion rate**: +15% (inline combat UI reduces abandonment)
- **Churn rate**: -15% (better UX retention)

---

## Appendix A: Reference Implementations

**Recommended Study**:
- EVE Online (web version): HUD density, panel management
- FTL: Faster Than Light: Cockpit paradigm, real-time state
- Elite Dangerous: HUD design language, color scheme
- Star Citizen: Mobiglass interface (avoid this - too modal-heavy)

**Anti-Patterns to Avoid**:
- Mobile card-based RPGs (Hearthstone, etc.): Flash-card UI
- Turn-based strategy (Civilization): Too menu-driven
- Social sims (The Sims): Too panel-heavy, no HUD

---

## Appendix B: Glossary

- **Flash-card UI**: Centered modal dialog that obscures game world
- **HUD (Heads-Up Display)**: Persistent overlay with critical stats
- **Cockpit Shell**: Persistent UI frame (status bar + panels + viewport)
- **Viewport**: Primary content area (map, combat, etc.)
- **Panel**: Collapsible/dismissible UI region (side or bottom)
- **Inline Panel**: Panel embedded in viewport (not overlay)
- **SSE (Server-Sent Events)**: Real-time push from backend
- **Touch Target**: Minimum 44x44px interactive region
- **Design Token**: Named color/spacing/font value (not hardcoded)

---

## Appendix C: Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-27 | 1.0 | Initial UX system definition (Agent B) |

---

**End of B1 - UX System Definition**

**Next Steps**:
1. Review and approve UX system (stakeholder sign-off)
2. Create B2 deliverables (UX Decision Pack + Log)
3. Begin implementation (Agent A Implementation Pass)
4. QA enforcement (Agent C validation)
