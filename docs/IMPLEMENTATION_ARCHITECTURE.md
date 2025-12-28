# IMPLEMENTATION ARCHITECTURE: SYSTEM INTEGRATION

**Classification:** Engineering Specification
**Version:** 1.0
**Status:** Canonical
**Prerequisites:** UI/UX Doctrine v1.0, Space Mechanics Doctrine v1.0

---

## Preamble: What We Are Building

We are transforming a tab-based mobile MMO into a **persistent cockpit experience**. The player never leaves the bridge. All game systems surface through panels within a permanent shell.

**Current State:**
- Tab navigation switching full screens
- TopBar + ScrollView pattern per screen
- Modern space aesthetic (cyan/purple)
- Functional but not immersive

**Target State:**
- Persistent cockpit shell with Left Rail navigation
- Contextual panels replacing screen transitions
- LCARS-inspired functional aesthetic
- "You are commanding a starship" immersion

**Constraint:** Incremental refactor. No big-bang rewrite. The game must remain playable throughout.

---

## 1. UI ARCHITECTURE DIAGRAM

### 1.1 Component Tree (Target State)

```
<App>
├── <GestureHandlerRootView>
│   └── <SafeAreaProvider>
│       └── <QueryClientProvider>
│           └── <AuthProvider>
│               └── <NotificationProvider>
│                   └── <CockpitShell>              ← NEW: Persistent wrapper
│                       ├── <HeaderBar />           ← NEW: Always visible
│                       ├── <LeftRail />            ← NEW: System navigation
│                       ├── <PrimaryViewport>       ← NEW: Main content area
│                       │   └── {activeView}        ← Sector/Station/Map/etc
│                       ├── <ContextualPanel />     ← NEW: Bottom sheet system
│                       ├── <CommandBar />          ← NEW: Action rail
│                       └── <AlertOverlay />        ← NEW: Red/Yellow alert
│
└── <ModalPortal>                                   ← Escape hatch for true modals
    ├── <CriticalAlert />
    └── <CombatResults />
```

### 1.2 Layout Zones (Mobile Portrait)

```
┌────────────────────────────────────────────────────────┐
│                    HEADER BAR (56px)                   │
│  [Ship] [Hull ███] [Shield ███] [Fuel ███] [Location] │
├──────┬─────────────────────────────────────────────────┤
│      │                                                 │
│  L   │                                                 │
│  E   │           PRIMARY VIEWPORT                      │
│  F   │              (flex: 1)                          │
│  T   │                                                 │
│      │         SectorView2D / StationView              │
│  R   │              / SystemMap                        │
│  A   │                                                 │
│  I   ├─────────────────────────────────────────────────┤
│  L   │                                                 │
│      │         CONTEXTUAL PANEL (0-60%)                │
│ 72px │              BottomSheet                        │
│      │                                                 │
├──────┴─────────────────────────────────────────────────┤
│                   COMMAND BAR (64px)                   │
│  [ticker...]            [Secondary] [Secondary] [PRIMARY]│
└────────────────────────────────────────────────────────┘
```

### 1.3 Layout Zones (Tablet/Web Landscape)

```
┌──────────────────────────────────────────────────────────────────────┐
│                           HEADER BAR (56px)                          │
├──────┬───────────────────────────────────────────────┬───────────────┤
│      │                                               │               │
│  L   │                                               │   CONTEXT     │
│  E   │                                               │    PANEL      │
│  F   │            PRIMARY VIEWPORT                   │   (320px)     │
│  T   │               (flex: 1)                       │               │
│      │                                               │   Mission     │
│  R   │                                               │   Inventory   │
│  A   │                                               │   Trade       │
│  I   │                                               │   etc.        │
│  L   │                                               │               │
│      │                                               │               │
│ 80px │                                               │               │
├──────┴───────────────────────────────────────────────┴───────────────┤
│                          COMMAND BAR (64px)                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENT TAXONOMY

### 2.1 Shell Components (Always Rendered)

These components mount once and never unmount during a session.

| Component | Location | Responsibility | Existing Code |
|-----------|----------|----------------|---------------|
| `CockpitShell` | Root | Layout orchestration, alert state | **NEW** |
| `HeaderBar` | Top | Vitals display, alert indication | Evolve from `TopBar` |
| `LeftRail` | Left | System navigation (NAV/OPS/TAC/ENG/COM) | **NEW** |
| `CommandBar` | Bottom | Context actions, ticker | **NEW** |
| `AlertOverlay` | Overlay | Red/yellow alert visual cascade | **NEW** |

**File Locations:**
```
/components/shell/
├── CockpitShell.tsx
├── HeaderBar.tsx
├── LeftRail.tsx
├── CommandBar.tsx
└── AlertOverlay.tsx
```

---

### 2.2 Viewport Components (One Active at a Time)

The Primary Viewport displays one of these based on game state.

| Component | Shows When | Existing Code |
|-----------|------------|---------------|
| `SectorViewport` | In space, default | Evolve from `SectorView2D` |
| `StationViewport` | Docked at station | **NEW** (compose existing panels) |
| `SystemMapViewport` | NAV + zoomed out | **NEW** |
| `GalaxyMapViewport` | NAV + galaxy view | **NEW** |
| `HyperspaceViewport` | In hyperspace transit | **NEW** |

**File Locations:**
```
/components/viewport/
├── SectorViewport.tsx
├── StationViewport.tsx
├── SystemMapViewport.tsx
├── GalaxyMapViewport.tsx
└── HyperspaceViewport.tsx
```

**Viewport Selection Logic:**
```typescript
function getActiveViewport(state: GameState): ViewportType {
  if (state.isInHyperspace) return 'hyperspace';
  if (state.isDocked) return 'station';
  if (state.navMode === 'galaxy') return 'galaxy-map';
  if (state.navMode === 'system') return 'system-map';
  return 'sector'; // Default: local space
}
```

---

### 2.3 Panel Components (Contextual, Stackable)

Panels appear in the Contextual Panel zone based on rail selection.

| Panel | Rail | Purpose | Existing Code |
|-------|------|---------|---------------|
| `NavigationPanel` | NAV | Destination, route, fuel calc | Evolve from `JumpPanel` |
| `MissionsPanel` | OPS | Active/available missions | Evolve from `MissionList` |
| `MiningPanel` | OPS | Mining controls when at node | Evolve from `MiningControls` |
| `TradingPanel` | OPS | Market interface when docked | Evolve from `OrderForm` + `OrderbookView` |
| `TargetingPanel` | TAC | Target info, weapons, engagement | **NEW** (compose combat components) |
| `SystemsPanel` | ENG | Ship systems, damage, repair | **NEW** |
| `ModulesPanel` | ENG | Equipment loadout | Evolve from ship inventory |
| `CommsPanel` | COM | Chat, hails, faction comms | Evolve from `ChatPanel` |
| `FactionPanel` | COM | Faction standings, diplomacy | Evolve from `FactionDetailsPanel` |

**File Locations:**
```
/components/panels/
├── NavigationPanel.tsx
├── MissionsPanel.tsx
├── MiningPanel.tsx
├── TradingPanel.tsx
├── TargetingPanel.tsx
├── SystemsPanel.tsx
├── ModulesPanel.tsx
├── CommsPanel.tsx
└── FactionPanel.tsx
```

**Panel Behavior:**
- Only one panel visible at a time (tap rail to switch)
- Panels have three states: hidden, peek (header only), expanded
- Swipe down to minimize, swipe up to expand
- Combat auto-minimizes non-TAC panels

---

### 2.4 HUD Components (Overlay Elements)

Floating elements that overlay the viewport.

| Component | Purpose | Existing Code |
|-----------|---------|---------------|
| `TargetReticle` | Targeting overlay on viewport | **NEW** |
| `ThreatIndicators` | Directional threat arrows | **NEW** |
| `MissileWarning` | Incoming projectile alert | **NEW** |
| `JumpProgress` | Hyperspace calculation/spool overlay | Evolve from `TravelProgressBar` |
| `MiningProgress` | Active mining overlay | Evolve from `MiningProgressBar` |

**File Locations:**
```
/components/hud/
├── TargetReticle.tsx
├── ThreatIndicators.tsx
├── MissileWarning.tsx
├── JumpProgress.tsx
└── MiningProgress.tsx
```

---

### 2.5 Modal vs Drawer vs Sheet Decision Matrix

| Pattern | Use When | Example |
|---------|----------|---------|
| **Bottom Sheet** | Contextual detail, can be dismissed | Mission details, item info |
| **Side Drawer** | Never (violates doctrine) | — |
| **Full Modal** | Requires complete attention, rare | Combat results, critical alerts |
| **Inline Expansion** | Quick actions, confirmations | Sell confirm, undock confirm |
| **Toast** | Transient notification | "Mission accepted", "Docked" |

**Modal Escape Hatch:**
True modals (combat results, critical system failure) render via `ModalPortal` outside the cockpit shell. These are rare—most interaction stays in panels.

---

## 3. NAVIGATION MODEL

### 3.1 Rail-Based Navigation

Navigation uses the Left Rail, not routes.

```typescript
type RailSystem = 'NAV' | 'OPS' | 'TAC' | 'ENG' | 'COM';

interface NavigationState {
  activeRail: RailSystem;
  activePanel: string | null;  // Panel within that rail
  panelState: 'hidden' | 'peek' | 'expanded';
}
```

**Transitions:**
- Tap rail icon → Switch `activeRail`, show default panel for that system
- Tap active rail → Toggle panel between peek/expanded
- Swipe panel down → Minimize to peek
- Swipe panel up → Expand to full

**No URL Routes for Systems:**
The app maintains a single route (`/cockpit` or `/bridge`). All system navigation is state, not routing. This prevents URL bar changes and maintains immersion.

---

### 3.2 State Preservation

Each rail system preserves its state independently:

```typescript
interface RailState {
  NAV: {
    selectedDestination: string | null;
    routePlanned: boolean;
    mapZoom: 'local' | 'system' | 'galaxy';
  };
  OPS: {
    activeOperation: 'missions' | 'mining' | 'trading' | null;
    selectedMission: string | null;
  };
  TAC: {
    selectedTarget: string | null;
    weaponGroup: number;
  };
  ENG: {
    selectedSystem: string | null;
    viewMode: 'status' | 'modules';
  };
  COM: {
    activeChannel: string;
    unreadCount: number;
  };
}
```

Switching rails does not reset state. Return to OPS after combat and your mission is still selected.

---

### 3.3 Deep Linking Support

For external links (notifications, invites), we support query params:

```
/cockpit?rail=TAC&target=ship_123
/cockpit?rail=OPS&mission=mission_456
/cockpit?rail=NAV&destination=system_789
```

The cockpit shell parses these on mount and sets initial state.

---

### 3.4 Viewport Transitions

Viewport changes are animated but fast:

| Transition | Animation | Duration |
|------------|-----------|----------|
| Sector → Station (dock) | Fade + zoom in | 300ms |
| Station → Sector (undock) | Fade + zoom out | 300ms |
| Sector → Hyperspace | Stretch + blur | 500ms |
| Hyperspace → Sector | Reverse stretch | 500ms |
| Any → Combat | Red flash overlay | 200ms |

**Implementation:** Use `react-native-reanimated` for performant transitions. Viewport components are always mounted; visibility is animated.

---

## 4. STATE ARCHITECTURE

### 4.1 New Stores Required

```typescript
// stores/cockpitStore.ts
interface CockpitState {
  // Rail navigation
  activeRail: RailSystem;
  panelState: 'hidden' | 'peek' | 'expanded';

  // Alert status
  alertLevel: 'green' | 'yellow' | 'red';
  alertReason: string | null;

  // Viewport
  activeViewport: ViewportType;

  // Per-rail state
  railState: RailState;

  // Actions
  setActiveRail: (rail: RailSystem) => void;
  setPanelState: (state: PanelState) => void;
  triggerAlert: (level: AlertLevel, reason: string) => void;
  clearAlert: () => void;
}
```

```typescript
// stores/shipStatusStore.ts
interface ShipStatusState {
  // Vitals (always visible)
  hull: { current: number; max: number };
  shields: { current: number; max: number };
  fuel: { current: number; max: number };

  // Energy allocation
  powerDistribution: {
    weapons: number;  // 0-100
    shields: number;
    engines: number;
    systems: number;
  };

  // Systems status
  systems: {
    weapons: SystemStatus;
    shields: SystemStatus;
    engines: SystemStatus;
    sensors: SystemStatus;
    reactor: SystemStatus;
  };

  // Location
  currentSystem: string;
  currentSector: string;
  isDocked: boolean;
  dockedAt: string | null;

  // Actions
  updateVitals: (vitals: Partial<Vitals>) => void;
  setPowerDistribution: (dist: PowerDistribution) => void;
  setSystemDamage: (system: string, damage: number) => void;
}
```

### 4.2 Existing Stores (Keep As-Is)

| Store | Status | Notes |
|-------|--------|-------|
| `missionStore` | ✓ Keep | Add `panelVisible` state |
| `travelStore` | ✓ Keep | Integrate with viewport transitions |
| `combatStore` | ✓ Keep | Triggers alert cascade |
| `npcStore` | ✓ Keep | Feeds SectorViewport |
| `tradingStore` | ✓ Keep | Feeds TradingPanel |
| `notificationStore` | ✓ Keep | Toast system |

### 4.3 SSE Integration Points

Existing SSE hooks update stores. New mappings:

| SSE Event | Store Update | UI Effect |
|-----------|--------------|-----------|
| `combat:start` | `combatStore.setInCombat(true)` | Red alert, TAC auto-select |
| `combat:end` | `combatStore.setInCombat(false)` | Alert clear, results modal |
| `ship:damage` | `shipStatusStore.updateVitals()` | Hull bar flash |
| `ship:system_damage` | `shipStatusStore.setSystemDamage()` | ENG indicator |
| `travel:start` | `travelStore.startTravel()` | Viewport → hyperspace |
| `travel:complete` | `travelStore.completeTravel()` | Viewport → sector |
| `dock:complete` | `shipStatusStore.setDocked(true)` | Viewport → station |

---

## 5. THEME SYSTEM UPDATES

### 5.1 LCARS Color Palette

Update `/ui/theme/tokens.ts`:

```typescript
export const colors = {
  // LCARS Primary Palette
  lcars: {
    orange: '#FF9900',      // Primary interactive
    peach: '#FFCC99',       // Secondary interactive
    violet: '#CC99CC',      // Communications
    blue: '#9999FF',        // Navigation
    sky: '#99CCFF',         // Information
    red: '#CC6666',         // Alert/danger
    gold: '#FFCC00',        // Economy/value
    beige: '#FFCC99',       // Inactive
  },

  // Semantic (mapped to LCARS)
  semantic: {
    navigation: '#9999FF',  // Blue
    combat: '#FF9900',      // Orange
    economy: '#FFCC00',     // Gold
    communications: '#CC99CC', // Violet
    information: '#99CCFF', // Sky
    danger: '#CC6666',      // Red
    success: '#99CC99',     // Green
    warning: '#FFCC00',     // Gold
  },

  // Backgrounds
  background: {
    space: '#000000',       // True black for viewport
    panel: '#1a1a2e',       // Dark blue-gray panels
    surface: '#252540',     // Elevated surfaces
    bezel: '#0d0d1a',       // Frame borders
  },

  // Text
  text: {
    primary: '#FF9900',     // LCARS orange for headers
    secondary: '#FFCC99',   // Peach for body
    muted: '#666680',       // Dimmed
    inverse: '#000000',     // On light backgrounds
  },
};
```

### 5.2 Typography Updates

```typescript
export const typography = {
  // LCARS uses condensed, geometric fonts
  // On mobile, we approximate with system fonts

  fontFamily: {
    display: Platform.select({
      ios: 'Helvetica Neue',
      android: 'Roboto Condensed',
      web: "'Antonio', 'Helvetica Neue', sans-serif",
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: "'Roboto Mono', monospace",
    }),
  },

  // LCARS-style sizes (larger, bolder)
  sizes: {
    display: 32,    // Main headers
    title: 24,      // Section headers
    heading: 18,    // Panel headers
    body: 14,       // Content
    caption: 12,    // Labels
    micro: 10,      // Status indicators
  },

  // LCARS uses ALL CAPS for headers
  transform: {
    header: 'uppercase',
    body: 'none',
  },
};
```

### 5.3 Component Variants

Add LCARS variants to existing primitives:

```typescript
// Button variants
<Button variant="lcars-primary" />   // Orange pill
<Button variant="lcars-secondary" /> // Peach pill
<Button variant="lcars-nav" />       // Blue pill
<Button variant="lcars-danger" />    // Red pill

// Card variants
<Card variant="lcars-panel" />       // Rounded left, square right
<Card variant="lcars-display" />     // Full border frame
<Card variant="lcars-minimal" />     // Just content, no chrome
```

---

## 6. IMPLEMENTATION PHASES

### Phase 1: Shell Foundation (Minimal Disruption, Maximum Gain)

**Goal:** Establish persistent cockpit shell without breaking existing screens.

**Duration Estimate:** N/A (no time estimates per doctrine)

**Deliverables:**

1. **Create CockpitShell Component**
   - Wraps existing tab content
   - Renders HeaderBar (evolved TopBar)
   - Renders LeftRail (new, initially mirrors tab bar)
   - Renders CommandBar (new, initially empty)
   - Tab bar hidden, tabs render as viewport content

2. **Migrate TopBar → HeaderBar**
   - Add hull/shield/fuel bars
   - Add alert status indicator
   - Keep existing location/credits

3. **Create LeftRail**
   - Five icons: NAV, OPS, TAC, ENG, COM
   - Maps to existing tab content initially
   - Highlight active system

4. **Create cockpitStore**
   - Rail state management
   - Panel state management
   - Alert level management

5. **Update Theme Tokens**
   - Add LCARS color palette
   - Keep existing colors as fallback
   - No component style changes yet

**Success Criteria:**
- App renders with new shell
- Existing functionality unchanged
- Rail navigation works
- No performance regression

**Files Created/Modified:**
```
NEW:  /components/shell/CockpitShell.tsx
NEW:  /components/shell/LeftRail.tsx
NEW:  /components/shell/CommandBar.tsx
NEW:  /stores/cockpitStore.ts
MOD:  /components/hud/TopBar.tsx → HeaderBar.tsx
MOD:  /app/(tabs)/_layout.tsx
MOD:  /ui/theme/tokens.ts
```

---

### Phase 2: Panel System & Viewport

**Goal:** Replace tab screen-switching with panel-based contextual display.

**Deliverables:**

1. **Create ContextualPanel Container**
   - Bottom sheet that respects panel state
   - Animates between hidden/peek/expanded
   - Passes through to child panel components

2. **Migrate Screen Content to Panels**
   - `MissionsPanel` from ops tab missions section
   - `TradingPanel` from trading screen
   - `NavigationPanel` from jump/movement components
   - `CommsPanel` from chat components

3. **Create Viewport Components**
   - `SectorViewport` wrapping SectorView2D
   - `StationViewport` for docked state
   - Viewport switching based on game state

4. **Implement Alert Cascade**
   - Red alert visual treatment
   - Auto-TAC on combat
   - Panel auto-minimize

5. **Create shipStatusStore**
   - Vitals tracking
   - Power distribution
   - Systems damage state

**Success Criteria:**
- Panels replace full-screen navigation
- Viewport reflects game state
- Alert cascade functions
- 3-tap rule maintained

**Files Created/Modified:**
```
NEW:  /components/shell/ContextualPanel.tsx
NEW:  /components/shell/AlertOverlay.tsx
NEW:  /components/panels/NavigationPanel.tsx
NEW:  /components/panels/MissionsPanel.tsx
NEW:  /components/panels/TradingPanel.tsx
NEW:  /components/panels/CommsPanel.tsx
NEW:  /components/viewport/SectorViewport.tsx
NEW:  /components/viewport/StationViewport.tsx
NEW:  /stores/shipStatusStore.ts
MOD:  /components/shell/CockpitShell.tsx
MOD:  /hooks/useCombatEvents.ts (alert triggers)
```

---

### Phase 3: Tactical & Engineering Integration

**Goal:** Full combat and ship systems integration.

**Deliverables:**

1. **Create TargetingPanel**
   - Target selection from viewport
   - Weapon status display
   - Fire controls
   - Range/bearing display

2. **Create SystemsPanel**
   - All ship systems status
   - Damage indicators
   - Repair queue

3. **Create ModulesPanel**
   - Equipment loadout
   - Module swapping (when docked)

4. **Implement Power Distribution**
   - Visual power allocation UI
   - Real-time feedback
   - Presets (attack/defense/balanced)

5. **Create HUD Overlays**
   - TargetReticle on viewport
   - ThreatIndicators
   - MissileWarning

6. **Combat Information Contract**
   - All required data visible per doctrine
   - Refresh rates met (250ms combat)

**Success Criteria:**
- Combat fully playable in cockpit
- All tactical info visible
- Engineering accessible
- Performance maintained

---

### Phase 4: Polish & LCARS Aesthetic

**Goal:** Full visual transformation to LCARS aesthetic.

**Deliverables:**

1. **LCARS Component Styling**
   - Button pill shapes with proper radii
   - Panel bezels and frames
   - Characteristic rounded-left, square-right cards

2. **Typography Overhaul**
   - LCARS-style fonts (or close approximations)
   - ALL CAPS headers
   - Proper sizing hierarchy

3. **Animation Polish**
   - Viewport transitions
   - Panel slide animations
   - Alert pulse effects

4. **Audio Integration** (if applicable)
   - LCARS-style interaction sounds
   - Alert klaxons
   - Ambient bridge hum

5. **Responsive Refinement**
   - Tablet landscape layout
   - Web desktop layout
   - Consistent experience across devices

**Success Criteria:**
- Visually reads as LCARS-inspired
- Animations smooth (60fps)
- Responsive across form factors
- Accessibility maintained

---

### Phase 5: Extended Systems

**Goal:** Complete all rail systems and advanced features.

**Deliverables:**

1. **Galaxy/System Map Viewports**
   - Strategic navigation
   - Route planning
   - Fog of war visualization

2. **Full COM System**
   - Chat integration
   - Faction communications
   - Hailing system

3. **Advanced OPS**
   - Mining integration
   - Station services
   - Inventory management

4. **Sensor System**
   - Active/passive scan UI
   - Contact resolution
   - Scan results display

5. **Knowledge System**
   - Star charts
   - Discovery log
   - Intel trading

**Success Criteria:**
- All mechanics doctrine items implemented
- All UI doctrine rules followed
- Full game loop playable in cockpit

---

## 7. PERFORMANCE CONSIDERATIONS

### 7.1 Mobile Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Shell mount time | < 100ms | Time from auth to shell visible |
| Rail switch | < 50ms | Time to panel content visible |
| Viewport switch | < 300ms | Including animation |
| Combat refresh | ≤ 250ms | Per mechanics doctrine |
| Memory footprint | < 150MB | Total app memory |
| JS thread | < 16ms/frame | No jank during animation |

### 7.2 Optimization Strategies

**Component Mounting:**
- Viewport components pre-mounted, visibility controlled
- Panels lazy-loaded on first rail access
- Heavy components (maps) code-split

**State Updates:**
- Zustand selectors for granular subscriptions
- Combat updates batched at 250ms intervals
- Non-visible panels don't re-render

**Rendering:**
- `React.memo` on all panel components
- `useMemo` for derived data (route calculations)
- `useCallback` for all handlers

**Assets:**
- Icons as vector (lucide-react-native)
- Images lazy-loaded and cached
- Animations via native driver

### 7.3 Monitoring

Retain existing `PerformanceOverlay` in dev mode. Add metrics:
- Panel mount times
- State update frequencies
- Memory snapshots

---

## 8. MIGRATION STRATEGY

### 8.1 Parallel Running

During Phase 1-2, both navigation systems exist:
- CockpitShell wraps tab navigator
- Tabs still technically present but hidden
- Can fall back to tabs if issues arise

### 8.2 Feature Flags

```typescript
const featureFlags = {
  useCockpitShell: true,      // Master toggle
  useLCARSTheme: false,       // Visual only
  useNewPanelSystem: false,   // Phase 2
  useAlertCascade: false,     // Phase 2
  useTacticalHUD: false,      // Phase 3
};
```

### 8.3 Rollback Plan

Each phase is independently revertible:
- Phase 1: Remove CockpitShell wrapper, restore tab bar visibility
- Phase 2: Disable panel system, re-enable screen navigation
- Phase 3: Disable tactical overlays
- Phase 4: Swap theme tokens back

---

## 9. BUILD PLAN SUMMARY

### For Engineering Kickoff

#### What We're Building

A persistent cockpit shell that replaces tab-based navigation with an immersive bridge command interface. The player never leaves the bridge; all game systems surface through contextual panels within a permanent UI frame.

#### Architecture Decisions

1. **Single-route cockpit** — No URL-based navigation between systems
2. **Rail-based switching** — Left Rail replaces bottom tabs
3. **Panel-based detail** — Bottom sheets replace full screens
4. **State over routes** — All navigation is Zustand state
5. **Incremental migration** — Tabs hidden but functional during transition

#### New Code Structure

```
/components
├── shell/           # Cockpit frame (always rendered)
│   ├── CockpitShell.tsx
│   ├── HeaderBar.tsx
│   ├── LeftRail.tsx
│   ├── CommandBar.tsx
│   └── AlertOverlay.tsx
├── viewport/        # Main display area
│   ├── SectorViewport.tsx
│   ├── StationViewport.tsx
│   └── ...
├── panels/          # Contextual detail panels
│   ├── NavigationPanel.tsx
│   ├── MissionsPanel.tsx
│   └── ...
└── hud/             # Overlay elements
    ├── TargetReticle.tsx
    └── ...

/stores
├── cockpitStore.ts  # Navigation and UI state
└── shipStatusStore.ts # Ship vitals and systems
```

#### What We Keep

- All API clients (`/api/*`)
- All type definitions (`/types/*`)
- All SSE hooks (`/hooks/*`)
- All existing stores (mission, travel, combat, npc, trading)
- Primitive UI components (`/ui/components/*`)
- Theme token system (extended, not replaced)

#### What We Migrate

- `TopBar` → `HeaderBar` (extended)
- `SectorView2D` → `SectorViewport` (wrapped)
- Tab screens → Panel components (content extracted)
- `BottomSheet` → `ContextualPanel` (behavior extended)

#### What We Create

- `CockpitShell` — Root layout manager
- `LeftRail` — System navigation
- `CommandBar` — Action rail
- `AlertOverlay` — Alert cascade visuals
- All viewport components
- All panel components
- `cockpitStore` — UI state
- `shipStatusStore` — Ship state

#### Phase Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Shell Foundation | CockpitShell + Rails working |
| 2 | Panel System | Contextual panels replace screens |
| 3 | Tactical/Engineering | Combat fully integrated |
| 4 | LCARS Polish | Visual transformation complete |
| 5 | Extended Systems | All mechanics implemented |

#### Success Metrics

- **3-tap rule**: No action more than 3 taps from any state
- **Viewport sacred**: Never fully obscured
- **Combat latency**: ≤ 250ms update cycle
- **Performance**: < 16ms JS thread per frame
- **Immersion**: Player feels "on the bridge"

#### Doctrine Compliance Checklist

Before any PR merge:
- [ ] Does not add new screens/routes
- [ ] Does not obscure viewport completely
- [ ] Does not exceed 3-tap depth
- [ ] Uses doctrine color semantics
- [ ] Touch targets ≥ 44pt
- [ ] Panel, not modal (unless critical)
- [ ] State preserved on rail switch

---

**END OF SPECIFICATION**

*This document authorizes implementation. Deviations require architecture review.*
