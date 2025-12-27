# Phase 0: Repo UX Intake Report
**Space MMO Frontend - Experience Refactor Assessment**

Generated: 2025-12-27

---

## 1. TOOLCHAIN & ARCHITECTURE

### Package Manager & Runtime
- **Package Manager**: npm (package-lock.json present)
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Expo SDK**: ~54.0.30

### Navigation
- **Library**: `expo-router` v6.0.21 (file-based routing)
- **Pattern**: Stack-only navigation (no tabs!)
- **Routes**: 14 screens total
  - Auth: `index`, `login`, `signup`
  - Onboarding: `character-create`, `ship-customize`
  - Core: `dashboard`, `ship-inventory`, `trading`, `mining`, `missions`, `sector`
- **Critical Issue**: All screens use `<Stack.Screen>` - creates flash-card navigation pattern

### State Management
- **Global State**: Zustand v5.0.2
  - `missionStore.ts` (280 lines) - Comprehensive mission management
  - `tradingStore.ts` - Market/commodity selection
  - `combatStore.ts` - Combat state
  - `lootStore.ts` - Loot drops
  - `npcStore.ts` - NPC tracking
- **Context**: `AuthContext` for authentication (uses @nkzw/create-context-hook)
- **Server State**: @tanstack/react-query v5.90.12
- **Assessment**: Good state architecture, missing centralized app-level store for HUD data

### Real-time Integration
- **SSE Implementation**: Custom hooks using `react-native-sse`
- **Active Hooks**: 7 domain-specific SSE hooks
  - `useMissionEvents.ts`
  - `useMiningEvents.ts`
  - `useTradingEvents.ts`
  - `useCombatEvents.ts`
  - `useReputationEvents.ts`
  - `useMovementEvents.ts`
  - `useStationServices.ts`
- **Pattern**: EventSource → Store updates → React Query invalidation
- **Assessment**: Excellent foundation for real-time world feel! Currently underutilized in UI.

### Styling Approach
- **Theme System**: Minimal
  - Single `constants/colors.ts` (17 color tokens)
  - No spacing/typography scale
  - No component system
- **Component Styling**: 100% inline `StyleSheet.create()` per screen/component
- **Typography**: Hard-coded fontSize values (11-24px range)
- **Spacing**: Hard-coded values (4-60px range)
- **Assessment**: Zero design system. High duplication. Brittle for iteration.

### Component Library
- **Icons**: `lucide-react-native` v0.562.0 (good choice!)
- **Primitives**: None (no Button/Card/etc. library)
- **Custom Components**: 50+ domain-specific components
  - Well-organized by domain: `/components/mining`, `/components/missions`, etc.
  - High quality but inconsistent styling patterns
- **Assessment**: Strong domain components, missing foundational primitives

---

## 2. SCREEN INVENTORY

| Screen | Purpose | Lines | Current Issues |
|--------|---------|-------|----------------|
| `index.tsx` | Auth routing splash | 36 | Loading screen only |
| `login.tsx` | Authentication | 206 | Full-screen form card |
| `signup.tsx` | Registration | 242 | Full-screen form card |
| `character-create.tsx` | Character creation | 435 | Multi-step wizard, acceptable for onboarding |
| `ship-customize.tsx` | Ship builder | 550 | Multi-step wizard, acceptable for onboarding |
| **`dashboard.tsx`** | Main hub | **718** | **MEGA-SCREEN: Characters, Ships, Missions, Reputation in vertical scroll. No persistent nav.** |
| `ship-inventory.tsx` | Cargo management | 353 | Full-screen list, modal for transfers |
| `trading.tsx` | Market trading | 310 | Full-screen with 4 sub-components stacked |
| `mining.tsx` | Resource extraction | 495 | Full-screen with controls + node list |
| `missions.tsx` | Mission board | 426 | Full-screen list, modal for details |
| `sector.tsx` | 2D sector map | 253 | Canvas view with entities (good!) |
| `+not-found.tsx` | 404 | 112 | Error screen |
| `+native-intent.tsx` | Deep linking | 112 | Utility |

**Total Screen Code**: 4,136 lines

### Screen Categories

**Flash-Card Screens** (need refactor):
1. `dashboard.tsx` - Hub that should be shell
2. `ship-inventory.tsx` - Should be bottom sheet/panel
3. `trading.tsx` - Should be tabbed panel within station context
4. `mining.tsx` - Should be HUD overlay + panel
5. `missions.tsx` - Should be panel within station or HUD

**Acceptable** (minor updates):
- `sector.tsx` - Already game-like with 2D view
- `character-create.tsx` / `ship-customize.tsx` - Onboarding flows are fine as wizards

**Auth Screens** (low priority):
- Login/signup can stay simple

---

## 3. TOP 10 UX SMELLS (Flash-Card Problems)

### Critical (Breaking Immersion)

1. **NO TAB NAVIGATION**
   - **Issue**: Stack-only navigation forces full-screen push/pop pattern
   - **Impact**: Every action feels like "opening a new card"
   - **Fix**: Bottom tab bar with 5 core sections

2. **NO PERSISTENT HUD**
   - **Issue**: Credits, location, ship status disappear when navigating
   - **Impact**: Player loses spatial awareness, feels disconnected from ship
   - **Fix**: Top HUD bar showing ship status, location, credits always visible

3. **MEGA-DASHBOARD ANTIPATTERN**
   - **Issue**: `dashboard.tsx` (718 lines) tries to be everything
   - **Impact**: Vertical scroll hell, no context retention, "home page" smell
   - **Fix**: Split into tabbed sections (Map, Ops, Fleet, Social)

4. **MODAL HELL FOR DETAIL VIEWS**
   - **Issue**: Ship controls, mission details, reputation history all use full-screen modals
   - **Impact**: Breaks context, feels like pop-ups, not integrated UI
   - **Fix**: Bottom sheets, slide-in panels, contextual overlays

5. **NO ACTIVITY FEED**
   - **Issue**: SSE events trigger Alerts (!) instead of persistent feed
   - **Impact**: Real-time events feel like interruptions, history lost
   - **Fix**: Persistent event feed panel (recent activity log)

### Moderate (Usability)

6. **NAVIGATION REQUIRES BACKING OUT**
   - **Issue**: To go from Mining → Trading requires: Mining → Dashboard → Trading
   - **Impact**: Tedious, slow, breaks flow
   - **Fix**: Tab bar allows direct Mining → Trading (both in "Ops" or quick-access)

7. **NO QUICK ACTIONS**
   - **Issue**: Common actions buried in screen hierarchies
   - **Impact**: Frequent tasks take 3-4 taps
   - **Fix**: Quick action buttons in HUD (dock/undock, scan, emergency warp)

8. **INCONSISTENT EMPTY STATES**
   - **Issue**: Each screen handles "no data" differently
   - **Impact**: Inconsistent UX, some screens feel broken
   - **Fix**: Standardized EmptyState component with illustration + CTA

9. **LOADING STATES BLOCK ENTIRE SCREEN**
   - **Issue**: Loading indicators replace entire screen content
   - **Impact**: Disorienting, can't see context while loading
   - **Fix**: Skeleton loaders, partial loading, optimistic UI

10. **NO SPATIAL CONTEXT**
    - **Issue**: Ship location shown as text only ("Sector: Alpha-7")
    - **Impact**: No sense of world, feels like database viewer
    - **Fix**: Minimap widget in HUD showing current sector + neighbors

---

## 4. TOP 10 CODE SMELLS (Blocking UI Iteration)

### Architecture

1. **NO DESIGN TOKENS**
   - **Issue**: Hard-coded spacing (4, 8, 12, 16, 24, 32, 60), font sizes (11-24), radii everywhere
   - **Location**: Every component file
   - **Impact**: Impossible to rebrand, inconsistent spacing
   - **Fix**: `/ui/theme/tokens.ts` with spacing/typography/radius scales

2. **STYLESHEET DUPLICATION**
   - **Issue**: Same patterns re-defined 50+ times
   ```typescript
   // This pattern appears in 15+ files:
   card: {
     backgroundColor: Colors.surface,
     borderRadius: 12,
     padding: 16,
     borderWidth: 1,
     borderColor: Colors.border,
   }
   ```
   - **Impact**: 1000+ lines of duplicate code, maintenance nightmare
   - **Fix**: `<Card>` primitive component

3. **INLINE STYLES IN RENDER LOGIC**
   - **Issue**: Conditional styles inline: `style={[styles.button, !docked && styles.disabled]}`
   - **Location**: `dashboard.tsx`, `mining.tsx`, `ship-inventory.tsx`
   - **Impact**: Hard to read, performance risk (recreates objects), violates separation
   - **Fix**: Extract to StyleSheet or use styled system

### Performance

4. **NON-VIRTUALIZED LISTS**
   - **Issue**: Using `<View>` with `.map()` instead of `<FlatList>`
   - **Location**: `dashboard.tsx` (characters, ships, reputation lists)
   - **Impact**: Poor performance with many items, full re-render on update
   - **Fix**: Convert to `<FlatList>` with `keyExtractor` and `renderItem`

5. **MISSING MEMOIZATION**
   - **Issue**: No `React.memo()`, `useMemo()`, or `useCallback()` in large components
   - **Location**: `dashboard.tsx`, `mining.tsx`, `missions.tsx`
   - **Impact**: Entire screen re-renders on any state change
   - **Fix**: Memoize expensive components and callbacks

6. **QUERY INVALIDATION SPAM**
   - **Issue**: SSE handlers invalidate entire query keys: `invalidateQueries({ queryKey: ['mining-nodes'] })`
   - **Location**: All `use*Events.ts` hooks
   - **Impact**: Unnecessary refetches, network spam
   - **Fix**: Granular invalidation, optimistic updates, or direct cache updates

### State Management

7. **STATE IN SCREENS INSTEAD OF STORES**
   - **Issue**: UI state like `selectedShip`, `selectedNode` lives in component state
   - **Location**: `mining.tsx`, `trading.tsx`, `ship-inventory.tsx`
   - **Impact**: Lost on navigation, can't deep-link, can't restore state
   - **Fix**: Move selection state to stores or URL params

8. **INCONSISTENT LOADING PATTERNS**
   - **Issue**: Some screens use `isLoading`, some use `loadingShips`, some have no loading state
   - **Impact**: Inconsistent UX, race conditions, flash of empty content
   - **Fix**: Standardized loading wrapper component

### Navigation

9. **NAVIGATION PARAMS NOT TYPED**
   - **Issue**: Using `as string | undefined` and manual casting
   ```typescript
   const shipId = params.shipId as string | undefined;
   ```
   - **Location**: All screens using params
   - **Impact**: Type safety lost, runtime errors possible
   - **Fix**: Define typed navigation routes (expo-router supports this)

10. **STACKS NOT REGISTERED IN LAYOUT**
    - **Issue**: `sector.tsx` and `mining.tsx` not in `_layout.tsx` Stack.Screen list
    - **Location**: `app/_layout.tsx`
    - **Impact**: Inconsistent navigation behavior, potential crashes
    - **Fix**: Register all routes explicitly

---

## 5. DOMAIN ARCHITECTURE (Existing Assets)

### API Layer
Well-structured domain APIs:
- `api/auth.ts` - Authentication
- `api/characters.ts` - Character management
- `api/ships.ts` - Ship CRUD
- `api/inventory.ts` - Cargo/inventory
- `api/mining.ts` - Resource extraction
- `api/missions.ts` - Mission system
- `api/economy.ts` - Trading/markets
- `api/combat.ts` - Combat actions
- `api/npc.ts` - NPC ships
- `api/reputation.ts` - Faction standing
- `api/movement.ts` - Ship movement
- `api/station-services.ts` - Docking/refuel/repair
- `api/client.ts` - Base HTTP client with auth

**Assessment**: Excellent separation, complete coverage of game systems.

### Domain Objects (from types)
Core entities identified:
- Player: `profile_id`, `display_name`, `credits`
- Character: `id`, `name`, `attributes` (piloting, engineering, science, tactics, leadership)
- Ship: `id`, `name`, `ship_type`, `location_sector`, `docked_at`, `hull_points`, `shield_points`, `cargo_capacity`
- Inventory: `items[]`, `used`, `capacity`
- Mission: `id`, `objectives[]`, `status`, `rewards`, `expires_at`
- Reputation: `faction_id`, `tier`, `points`
- Resources: Minerals with quantity/quality
- Market: `commodity`, `orderbook`, `trades`
- Combat: Turn-based system with participants

**Assessment**: Rich game domain, sufficient for deep gameplay UX.

### Component Organization
```
components/
├── combat/       - CombatHUD, ParticipantCard, CombatResults
├── credits/      - CreditsDisplay (animated)
├── economy/      - MarketSelector, OrderbookView, OrderForm, TradeHistory
├── inventory/    - ResourceItem, CargoCapacityBar, TransferModal
├── loot/         - LootNotification
├── mining/       - ResourceNodeList, MiningControls, MiningProgressBar, QualityIndicator
├── missions/     - MissionCard, MissionList, ActiveMissionTracker, MissionDetailModal
├── movement/     - ShipControlPanel
├── npc/          - NPCShipList, NPCShipCard
├── reputation/   - ReputationList, ReputationHistory
└── station-services/ - (to be implemented)
```

**Assessment**: High-quality domain components ready for composition into new shell.

---

## 6. VISUAL LANGUAGE AUDIT

### Existing Color Palette
```typescript
background: '#0a0e1a'      // Deep space blue-black
surface: '#141b2e'          // Panel background
surfaceLight: '#1a2238'     // Elevated surfaces
primary: '#00d4ff'          // Cyan (good for sci-fi!)
primaryDark: '#0099cc'      // Darker cyan
secondary: '#7c3aed'        // Purple
accent: '#f59e0b'           // Amber/orange
success: '#10b981'          // Green
warning: '#f59e0b'          // Amber (duplicate of accent!)
danger: '#ef4444'           // Red
text: '#e2e8f0'             // Light gray
textSecondary: '#94a3b8'    // Medium gray
textDim: '#64748b'          // Dim gray
border: '#1e293b'           // Dark border
borderLight: '#334155'      // Lighter border
```

**Assessment**:
- Good sci-fi palette (dark + cyan accent)
- Missing: info color, critical color, disabled state
- `warning` and `accent` are identical (bug)

### Typography Patterns Found
```
Title: 24px / 700
Section Header: 20px / 700
Card Title: 18px / 600
Body: 14px / 400
Body Secondary: 14px / 400 (secondary color)
Caption: 12px / 600
Micro: 11px / 400
```

**Missing**:
- Monospace font for numbers (credits, stats, coordinates)
- Display size (32-48px for hero content)
- Line heights not specified

### Spacing Scale Found
```
4px  - Tight gaps (badge internal padding)
6px  - Small gaps
8px  - Compact spacing
12px - Default gap
16px - Default padding
24px - Section padding
32px - Large padding
60px - Header top padding (SafeArea manual hack!)
```

**Issues**:
- No 2px, no 20px (gaps in scale)
- SafeArea handling manual/inconsistent
- No max-width constraints (tablet/web will look broken)

### Border Radius
```
6px  - Small chips (attribute badges)
8px  - Buttons
12px - Cards
16px - Modals
```

**Assessment**: Consistent, adequate. Could add 4px for very small elements.

---

## 7. KEY STRENGTHS (To Preserve)

1. **Excellent SSE Architecture**: Real-time event system is production-ready
2. **Clean API Layer**: Well-separated domain APIs with proper typing
3. **Quality Components**: Domain components are well-built and reusable
4. **Rich Game Systems**: Mining, trading, missions, combat, reputation all functional
5. **Type Safety**: Full TypeScript coverage, proper types in `/types` directory
6. **Zustand Stores**: Well-structured state management for complex domains
7. **React Query Integration**: Server state properly cached and invalidated
8. **Lucide Icons**: Comprehensive, consistent icon set

---

## 8. CRITICAL PATH COMPONENTS (Will Need First)

### Must Build (Sprint A - Shell Foundation)
1. **`/ui/theme/tokens.ts`** - Design tokens (colors, spacing, typography, etc.)
2. **`/ui/theme/index.ts`** - Theme provider/hooks
3. **`/ui/components/Button.tsx`** - Primary/secondary/ghost variants
4. **`/ui/components/Card.tsx`** - Surface container primitive
5. **`/ui/components/Text.tsx`** - Typography component with variants
6. **`/ui/components/HUD/TopBar.tsx`** - Persistent status HUD
7. **`/ui/components/Shell/TabBar.tsx`** - Bottom navigation tabs
8. **`/ui/components/Panel/BottomSheet.tsx`** - Contextual detail view
9. **`/ui/components/Feed/EventFeed.tsx`** - Activity log stream

### Shell Layout Structure
```
┌─────────────────────────────────┐
│ TopBar: Ship | Location | Credits│ ← Persistent HUD
├─────────────────────────────────┤
│                                 │
│         Tab Content Area        │
│      (Map/Ops/Fleet/Social)     │
│                                 │
│                                 │
├─────────────────────────────────┤
│  [Map] [Ops] [Fleet] [Feed] [Me]│ ← Bottom Tab Bar
└─────────────────────────────────┘
```

---

## 9. TECHNICAL DEBT SUMMARY

| Category | Severity | Impact | Effort to Fix |
|----------|----------|--------|---------------|
| No tab navigation | Critical | UX breaking | Medium (2-3 days) |
| No design system | Critical | Blocks iteration | Medium (2-3 days) |
| No persistent HUD | Critical | Immersion breaking | Small (1 day) |
| Mega-dashboard screen | High | Maintenance hell | Large (5-7 days) |
| Modal overuse | High | Context loss | Medium (3-4 days) |
| Non-virtualized lists | High | Performance | Small (1-2 days) |
| State in components | Medium | Lost on nav | Medium (2-3 days) |
| Missing memoization | Medium | Re-render spam | Small (1 day) |
| Hard-coded spacing | Medium | Inconsistency | Small (1 day) |
| No empty states | Low | Polish | Small (1 day) |

**Total Estimated Effort**: 18-28 days (3-5 sprints)

---

## 10. RECOMMENDED REFACTOR APPROACH

### Phase Breakdown

**Sprint A: Shell Foundation** (5-7 days)
- Build design token system
- Create primitive components (Button, Card, Text, etc.)
- Implement persistent HUD (TopBar)
- Replace Stack navigation with Tab navigation
- Build BottomSheet panel system
- Create EventFeed component

**Sprint B: Core Screen Refactors** (7-10 days)
- Split dashboard into 5 tabs (Map, Ops, Fleet, Social, Profile)
- Convert ship-inventory to BottomSheet
- Convert missions to panel-based UI
- Refactor mining with HUD overlay
- Update trading to in-station context

**Sprint C: Polish & Performance** (5-8 days)
- Virtualize all lists with FlatList
- Add memoization to heavy components
- Implement skeleton loaders
- Add empty states everywhere
- Polish animations and transitions
- Accessibility labels
- SafeArea handling cleanup

---

## 11. RISK ASSESSMENT

### High Risk
- **Breaking changes to navigation**: Will affect all deep links, existing user flows
  - **Mitigation**: Feature flag, gradual rollout, maintain old routes temporarily

### Medium Risk
- **Component API changes**: Existing screens use inline styles, refactor will touch many files
  - **Mitigation**: Incremental refactor, both patterns can coexist temporarily

### Low Risk
- **Design token adoption**: Additive, doesn't break existing code
- **New components**: Can build alongside existing ones

---

## 12. SUCCESS METRICS

### Before (Current State)
- Navigation taps to common action (e.g., dock → trade → undock): **8-12 taps**
- Time to context switch (Mining → Trading): **~5 seconds**
- Screens with persistent context: **0/11**
- Duplicate style code: **~1000 lines**
- Virtualized lists: **0%**

### After (Target State)
- Navigation taps to common action: **2-4 taps** (via tabs + quick actions)
- Time to context switch: **<1 second** (tab tap)
- Screens with persistent context: **100%** (HUD always visible)
- Duplicate style code: **<100 lines** (primitives reused)
- Virtualized lists: **100%**

---

## CONCLUSION

This codebase has **excellent architectural bones** (API layer, SSE, state management, component quality) but suffers from a **fundamental navigation/layout problem** that creates the "flash card" experience.

The core issue is **Stack-only navigation + mega-dashboard + modals** instead of **persistent shell + tabs + contextual panels**.

The refactor is **tractable** because:
1. Domain logic is already well-separated (can reuse all components)
2. State management is solid (can plug into new shell)
3. SSE infrastructure is ready (just needs UI surface)
4. No major API changes needed

**Recommendation**: Proceed with 3-sprint plan. Start with Shell Foundation (Sprint A) immediately—it has the highest impact-to-effort ratio and unblocks the rest of the work.

---

**Next Step**: Proceed to Phase 1 - UX Architecture (IA, wireframes, interaction patterns, visual tokens)
