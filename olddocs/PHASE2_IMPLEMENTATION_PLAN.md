# Phase 2: Implementation Plan
**Space MMO Frontend - 3-Sprint Refactor Roadmap**

Generated: 2025-12-27

---

## OVERVIEW

**Total Duration**: 3 sprints (15-21 days)
**Approach**: Incremental refactor (old + new coexist temporarily)
**Risk**: Low (additive changes, feature-flaggable)
**Success Criteria**: See Phase 0 report metrics

---

## SPRINT A: SHELL FOUNDATION (5-7 days)

**Goal**: Build the game shell infrastructure (HUD + tabs + primitives) WITHOUT breaking existing screens

### A1. Theme System (Day 1)

#### Files to CREATE:
```
ui/
├── theme/
│   ├── tokens.ts          ← Design tokens (from Phase 1)
│   ├── index.ts           ← Theme provider/exports
│   └── hooks.ts           ← useTheme() hook
└── index.ts               ← Barrel export
```

**Tasks**:
- [x] Copy tokens from Phase 1 spec to `ui/theme/tokens.ts`
- [ ] Create `useTheme()` hook for easy access
- [ ] Add theme context provider (optional for now, can use direct imports)
- [ ] Update `constants/colors.ts` to re-export from tokens (backward compatibility)

**Testing**: Import tokens in a test screen, verify colors/spacing work

---

### A2. Primitive Components (Days 2-3)

#### Files to CREATE:
```
ui/
└── components/
    ├── Button.tsx         ← Primary/secondary/ghost/danger variants
    ├── Card.tsx           ← Surface container with variants
    ├── Text.tsx           ← Typography component
    ├── Badge.tsx          ← Notification badges
    ├── Divider.tsx        ← Horizontal/vertical dividers
    ├── Spinner.tsx        ← Loading spinner
    ├── EmptyState.tsx     ← Empty content placeholder
    └── index.ts           ← Barrel export
```

**Implementation Priority**:

1. **Button** (Priority 1)
   ```typescript
   interface ButtonProps {
     variant: 'primary' | 'secondary' | 'ghost' | 'danger';
     size: 'sm' | 'md' | 'lg';
     icon?: React.ComponentType;
     iconPosition?: 'left' | 'right';
     disabled?: boolean;
     loading?: boolean;
     fullWidth?: boolean;
     onPress: () => void;
     children: React.ReactNode;
   }
   ```
   - Use tokens for all styling
   - Implement haptic feedback
   - Loading state shows spinner, disables onPress
   - Accessibility labels required

2. **Card** (Priority 1)
   ```typescript
   interface CardProps {
     variant: 'default' | 'elevated' | 'outlined';
     padding?: keyof typeof tokens.spacing;
     onPress?: () => void;
     children: React.ReactNode;
   }
   ```
   - If onPress provided, add press animation
   - Use tokens.surface for colors
   - Apply tokens.elevation for elevated variant

3. **Text** (Priority 1)
   ```typescript
   interface TextProps {
     variant: 'display' | 'title' | 'heading' | 'body' | 'caption' | 'mono';
     weight?: 'normal' | 'medium' | 'semibold' | 'bold';
     color?: string; // From tokens
     align?: 'left' | 'center' | 'right';
     numberOfLines?: number;
     children: React.ReactNode;
   }
   ```
   - Map variants to fontSize + lineHeight from tokens
   - Mono variant uses Courier font

4. **EmptyState** (Priority 2)
   ```typescript
   interface EmptyStateProps {
     icon: React.ComponentType;
     title: string;
     description: string;
     action?: { label: string; onPress: () => void };
   }
   ```
   - Used for "no data" states everywhere
   - Consistent layout: icon → title → description → CTA button

5. **Badge/Spinner/Divider** (Priority 3)
   - Simple utility components
   - Implement after core primitives

**Testing**: Create a Storybook-like test screen showing all variants

---

### A3. HUD Components (Days 3-4)

#### Files to CREATE:
```
ui/
└── components/
    └── HUD/
        ├── TopBar.tsx           ← Persistent top HUD
        ├── ShipIndicator.tsx    ← Ship name + status
        ├── LocationIndicator.tsx ← Current sector
        ├── CreditsDisplay.tsx   ← Credits with animation (move from /components/credits)
        ├── QuickActionsMenu.tsx ← Dropdown menu (emergency actions)
        └── index.ts
```

**TopBar Implementation**:
```typescript
interface TopBarProps {
  ship: Ship | null;
  location: string;
  dockedAt?: string;
  credits: number;
}

// Layout (horizontal):
// [Ship] [Location] [Spacer] [Credits] [QuickMenu]

// Height: tokens.layout.topBar.height + SafeAreaInsets.top
// Background: tokens.colors.surface.overlay with blur (if supported)
// Position: Fixed at top (position: 'absolute', top: 0, left: 0, right: 0)
// Z-index: tokens.zIndex.fixed
```

**Components**:
1. **ShipIndicator**:
   - Icon (ship type) + name + status dot
   - Tap → Opens ship selector bottom sheet (stub for now)

2. **LocationIndicator**:
   - MapPin icon + sector name
   - If docked: show station badge
   - Tap → Navigate to Map tab

3. **CreditsDisplay**:
   - Move existing `components/credits/CreditsDisplay.tsx` to UI library
   - Enhance with tokens
   - Tap → Show credits detail/history (future)

4. **QuickActionsMenu**:
   - MoreVertical icon button
   - Dropdown with: Emergency Warp, Dock/Undock, Quick Repair, Settings
   - Use Modal or custom Popover component

**Testing**: Mount TopBar in a test screen with mock data

---

### A4. Tab Navigation (Days 4-5)

#### Files to CREATE:
```
app/
└── (tabs)/              ← New Expo Router group
    ├── _layout.tsx      ← Tab navigator
    ├── map.tsx          ← Map tab (placeholder)
    ├── ops.tsx          ← Ops tab (placeholder)
    ├── fleet.tsx        ← Fleet tab (placeholder)
    ├── feed.tsx         ← Feed tab (placeholder)
    └── me.tsx           ← Profile tab (placeholder)
```

**Migration Strategy**:
- Keep existing screens in `/app` untouched
- Create new `(tabs)` group with tab layout
- Tabs initially show placeholder content
- Later sprints will move content into tabs

**Tab Layout**:
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We'll use TopBar instead
        tabBarStyle: {
          height: tokens.layout.tabBar.height,
          backgroundColor: tokens.colors.surface.base,
          borderTopColor: tokens.colors.border.default,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: tokens.colors.primary.main,
        tabBarInactiveTintColor: tokens.colors.text.secondary,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      {/* ... 4 more tabs */}
    </Tabs>
  );
}
```

**Placeholder Tabs**:
```typescript
// app/(tabs)/map.tsx
export default function MapTab() {
  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.background.primary }}>
      <TopBar ship={mockShip} location="Alpha-7" credits={12450} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="title">Map Tab</Text>
        <Text variant="body" color={tokens.colors.text.secondary}>
          Coming in Sprint B
        </Text>
      </View>
    </View>
  );
}
```

**Testing**:
- Navigate between tabs
- Verify TopBar persists across tabs
- Verify tab bar SafeArea handling

---

### A5. Panel System (Days 5-6)

#### Files to CREATE:
```
ui/
└── components/
    └── Panel/
        ├── BottomSheet.tsx      ← Swipeable panel
        ├── Handle.tsx           ← Drag handle
        ├── Backdrop.tsx         ← Dim overlay
        └── index.ts
```

**BottomSheet Implementation**:
- Use `react-native-gesture-handler` for swipe gestures
- Use `react-native-reanimated` for animations
- Three height variants: half (50%), threequarter (75%), full (90%)
- Smooth spring animation on open/close
- Swipe down to dismiss
- Backdrop tap to dismiss

```typescript
interface BottomSheetProps {
  visible: boolean;
  height: 'half' | 'threequarter' | 'full' | number;
  onClose: () => void;
  showHandle?: boolean;
  backdrop?: boolean;
  children: React.ReactNode;
}

// Implementation notes:
// - Use Animated.Value for translateY
// - PanGestureHandler for swipe
// - Spring to height position on open
// - Spring to screenHeight on close
// - Backdrop has 0.8 opacity overlay
```

**Testing**:
- Open bottom sheet in test screen
- Verify swipe-to-dismiss works
- Verify backdrop tap works
- Test all three heights

---

### A6. Feed Components (Day 6-7)

#### Files to CREATE:
```
ui/
└── components/
    └── Feed/
        ├── EventFeed.tsx        ← Main feed list (virtualized)
        ├── EventItem.tsx        ← Single event row
        ├── EventIcon.tsx        ← Icon by event type
        └── index.ts

stores/
└── feedStore.ts                 ← Event feed state
```

**EventFeed Implementation**:
```typescript
interface FeedEvent {
  id: string;
  type: 'mission' | 'combat' | 'trading' | 'reputation' | 'loot' | 'social';
  timestamp: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

// FlatList with:
// - keyExtractor: event.id
// - renderItem: EventItem
// - inverted (newest first)
// - Pull to refresh
// - Auto-scroll to top on new event
```

**FeedStore**:
```typescript
interface FeedState {
  events: FeedEvent[];
  filter: 'all' | EventType;
  addEvent: (event: FeedEvent) => void;
  setFilter: (filter: string) => void;
  clearEvents: () => void;
}

// Max 100 events in memory (FIFO eviction)
// Persist to AsyncStorage for history
```

**SSE Integration**:
- Update all `use*Events.ts` hooks to call `feedStore.addEvent()`
- Replace Alert() calls with feed entries

**Testing**:
- Add mock events to feed
- Verify virtualization works
- Verify filtering works
- Verify events appear real-time (simulate SSE)

---

### Sprint A Deliverables

**New Files Created**: ~25
**Existing Files Modified**: ~7 (SSE hooks to add feed entries)
**Screens Ready**: 5 placeholder tab screens with TopBar + TabBar
**Primitives Ready**: Button, Card, Text, EmptyState, Badge, Spinner, Divider
**Infra Ready**: Theme system, BottomSheet, EventFeed

**Demo-able**:
- Navigate between 5 tabs
- See persistent TopBar showing ship/location/credits
- Open bottom sheet from a button
- See event feed with mock events

**Next**: Sprint B will move dashboard content into tabs

---

## SPRINT B: CORE SCREEN REFACTORS (7-10 days)

**Goal**: Transform 3 core screens from "flash cards" to "game shell" patterns

### B1. Refactor Dashboard → Map + Fleet Tabs (Days 1-3)

#### Current Problem:
`dashboard.tsx` is a 718-line mega-screen with:
- Character list
- Ship list with actions
- Active missions
- Reputation standings

#### Solution: Split into Tabs

**Map Tab** (app/(tabs)/map.tsx):
- 2D Sector View (existing `sector.tsx` embedded)
- Minimap widget (future)
- Nearby entities list (NPCs, stations, asteroids)
- Quick warp button

**Fleet Tab** (app/(tabs)/fleet.tsx):
- Ship carousel (horizontal swipe)
- Current ship stats (hull, shield, cargo, fuel)
- Quick actions: Inventory, Loadout, Switch Ship
- Ship list (all owned ships)

**Me Tab** (app/(tabs)/me.tsx):
- Player profile card
- Credits balance (large)
- Character section (list of characters)
- Reputation section (faction standings)
- Links to history screens

**Tasks**:
1. Create `TabShipCarousel.tsx` component
   - Horizontal FlatList with ships
   - Snap to interval
   - Shows 1 ship at a time (card with stats)

2. Create `ShipStatsPanel.tsx` component
   - Hull/Shield/Cargo/Fuel meters
   - Uses ResourceMeter primitive (create this)

3. Create `ResourceMeter.tsx` primitive
   - Progress bar with label + current/max values
   - Color based on percentage (green → yellow → red)

4. Move character list to Me tab
   - Use existing character card styling
   - Add "Create Character" button at top

5. Move reputation to Me tab
   - Reuse existing `ReputationList.tsx` component
   - Add section header

6. Update `app/_layout.tsx`:
   - Keep existing Stack for backward compatibility
   - Add redirect from `/dashboard` to `/(tabs)/map`
   ```typescript
   <Stack.Screen
     name="dashboard"
     options={{ redirect: '/(tabs)/map' }}
   />
   ```

**Testing**:
- Access all dashboard features from new tabs
- Verify ship selection works
- Verify character switching works
- Verify reputation display works

---

### B2. Refactor ship-inventory → BottomSheet (Day 3-4)

#### Current Problem:
Full-screen stack navigation to view inventory

#### Solution: Bottom Sheet from Fleet Tab

**Implementation**:
1. Keep `ship-inventory.tsx` as fallback (deep link support)
2. Add "Inventory" button to Fleet tab ship card
3. Clicking opens BottomSheet (threequarter height) with inventory content
4. Reuse existing `ResourceItem.tsx` and `CargoCapacityBar.tsx` components
5. Transfer action opens nested BottomSheet (modal stack)

**Files**:
- Modify `app/(tabs)/fleet.tsx` to add inventory bottom sheet
- Extract inventory list component to `components/inventory/InventoryList.tsx`
- Reuse in both bottom sheet and full screen

**Testing**:
- Open inventory from Fleet tab
- Verify transfer modal works
- Verify deep link `/ship-inventory?shipId=X` still works

---

### B3. Refactor Missions → Ops Tab + Panels (Days 4-6)

#### Current Problem:
Full-screen `missions.tsx` with modal for details

#### Solution: Panel-based UI in Ops Tab

**Implementation**:

**When Docked**:
- Ops tab shows "Station Services" menu
- Button: "Mission Control"
- Tap → Opens BottomSheet (full height) with mission board
  - Two sections: Available (top), Active (bottom)
  - Tap available mission → Opens detail BottomSheet (nested)
  - Tap active mission → Opens progress tracker BottomSheet

**When In Space**:
- Ops tab shows "Quick Actions" grid
- Active missions widget at top (compact)
  - Shows 1-2 current objectives
  - Tap → Opens full tracker BottomSheet

**Files**:
1. Create `components/missions/MissionBoard.tsx`
   - Two-section list (Available / Active)
   - Virtualized with SectionList

2. Create `components/missions/MissionProgressTracker.tsx`
   - Active mission objectives with progress bars
   - Timer countdown
   - Abandon button

3. Update `app/(tabs)/ops.tsx`:
   - Conditional rendering based on ship.docked_at
   - Station services when docked
   - Quick actions when in space

4. Keep `app/missions.tsx` for backward compatibility (redirect to ops)

**Testing**:
- Accept mission from Mission Control
- View progress in Ops tab
- Complete objective and verify SSE updates work
- Abandon mission

---

### B4. Refactor Mining → HUD Overlay (Days 6-7)

#### Current Problem:
Full-screen mining interface, loses context

#### Solution: Overlay controls + Node selection panel

**Implementation**:

**When in asteroid field (undocked + has mining equipment)**:
- Ops tab shows "Mining Mode"
- Resource nodes list (existing `ResourceNodeList.tsx`)
- Tap node → Opens BottomSheet:
  - Node details (resource type, quality, quantity remaining)
  - Extraction controls (existing `MiningControls.tsx`)
  - Start button
- When mining in progress:
  - BottomSheet shows `MiningProgressBar.tsx`
  - Can dismiss sheet, progress continues
  - TopBar shows small mining indicator (icon + %)

**Files**:
1. Update `app/(tabs)/ops.tsx`:
   - Add mining mode state
   - Show resource node list
   - Handle node selection

2. Create `ui/components/HUD/MiningIndicator.tsx`:
   - Small widget showing current extraction progress
   - Tap → Opens full progress BottomSheet

3. Modify `hooks/useMiningEvents.ts`:
   - Update TopBar mining indicator on progress events

4. Keep `app/mining.tsx` for backward compat

**Testing**:
- Select mining node
- Start extraction
- Dismiss bottom sheet while mining
- Verify progress continues
- Verify TopBar indicator updates
- Verify SSE events update progress

---

### B5. Refactor Trading → In-Station Context (Days 7-8)

#### Current Problem:
Full-screen trading, disconnected from station context

#### Solution: Integrated into Ops tab when docked

**Implementation**:

**When docked at station**:
- Ops tab shows "Station Services" menu:
  - Refuel
  - Repair
  - **Trading** ← Highlighted if profitable trades available
  - Mission Control
- Tap Trading → Opens BottomSheet (full height) with trading interface
  - Reuse existing `MarketSelector.tsx`, `OrderbookView.tsx`, `OrderForm.tsx`
  - Layout: 3 sections vertically
    1. Market selector (top)
    2. Orderbook (middle, scrollable)
    3. Order form (bottom)

**Files**:
1. Create `components/economy/TradingPanel.tsx`
   - Wraps existing trading components
   - Optimized for BottomSheet layout

2. Update `app/(tabs)/ops.tsx`:
   - Add trading bottom sheet
   - Show station services when docked

3. Keep `app/trading.tsx` for backward compat

**Testing**:
- Dock at station
- Open trading panel
- Place buy/sell order
- Verify SSE trade execution works
- Verify credits update in TopBar

---

### B6. Sector View Integration (Days 8-9)

#### Current: Separate screen
#### Target: Primary content of Map tab

**Implementation**:
1. Move `app/sector.tsx` content to `app/(tabs)/map.tsx`
2. Embed 2D sector canvas as main content
3. Keep existing:
   - `components/combat/CombatHUD.tsx`
   - `components/npc/NPCShipList.tsx`
   - NPC interaction bottom sheets
4. Add minimap widget to TopBar (future enhancement)

**Testing**:
- View sector entities
- Engage NPC (opens combat bottom sheet)
- Loot drop (shows loot panel)

---

### B7. Update Navigation & Routing (Day 9-10)

#### Clean up `app/_layout.tsx`:
```typescript
<Stack screenOptions={{ headerShown: false }}>
  {/* Auth screens (keep as Stack) */}
  <Stack.Screen name="index" />
  <Stack.Screen name="login" />
  <Stack.Screen name="signup" />

  {/* Onboarding (keep as Stack) */}
  <Stack.Screen name="character-create" />
  <Stack.Screen name="ship-customize" />

  {/* Main app (redirect to tabs) */}
  <Stack.Screen
    name="dashboard"
    redirect="/(tabs)/map"
  />

  {/* Legacy screens (keep for deep links, but redirect to tabs) */}
  <Stack.Screen name="ship-inventory" redirect="/(tabs)/fleet" />
  <Stack.Screen name="trading" redirect="/(tabs)/ops" />
  <Stack.Screen name="mining" redirect="/(tabs)/ops" />
  <Stack.Screen name="missions" redirect="/(tabs)/ops" />
  <Stack.Screen name="sector" redirect="/(tabs)/map" />

  {/* Tab group */}
  <Stack.Screen name="(tabs)" />
</Stack>
```

**Deep Link Handling**:
- Keep legacy routes working
- Redirect to tab + open relevant bottom sheet
- Example: `/ship-inventory?shipId=123` → Fleet tab + open inventory sheet for ship 123

---

### Sprint B Deliverables

**Screens Refactored**: 5 (dashboard, ship-inventory, mining, trading, missions, sector)
**Tab Screens Populated**: 5 (all tabs now have real content)
**BottomSheets Created**: 6 (inventory, mission board, mission detail, mining node, mining progress, trading)
**Components Migrated**: 15+ (all domain components now used in new shell)

**Demo-able**:
- Full gameplay loop in tab shell
- No more full-screen stack navigation for core actions
- Persistent HUD across all tabs
- Activity feed showing real-time events
- All existing features working in new UX paradigm

**Metrics Improvement**:
- Taps to trade: 8 → 3 (Ops tab → Trading → Place order)
- Taps to mine: 10 → 4 (Ops tab → Select node → Extract)
- Context switches: 5s → <1s (tab navigation)

---

## SPRINT C: POLISH & PERFORMANCE (5-8 days)

**Goal**: Fix code smells, optimize performance, add polish, ensure accessibility

### C1. Virtualization (Days 1-2)

#### Problem: Non-virtualized lists
#### Solution: Convert to FlatList/SectionList

**Files to Update**:
1. `app/(tabs)/fleet.tsx`:
   - Ship list → FlatList

2. `app/(tabs)/me.tsx`:
   - Character list → FlatList
   - Reputation list (already virtualized in `ReputationList.tsx`)

3. `components/missions/MissionBoard.tsx`:
   - Available + Active missions → SectionList

4. `components/Feed/EventFeed.tsx`:
   - Already using FlatList (verify performance)

5. `components/economy/TradeHistory.tsx`:
   - Trade list → FlatList

**Implementation**:
```typescript
// Before (bad):
{ships.map(ship => <ShipCard key={ship.id} ship={ship} />)}

// After (good):
<FlatList
  data={ships}
  keyExtractor={ship => ship.id}
  renderItem={({ item }) => <ShipCard ship={item} />}
  initialNumToRender={5}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

**Testing**:
- Add 50+ ships to account
- Verify smooth scrolling
- Measure performance with React DevTools Profiler

---

### C2. Memoization (Days 2-3)

#### Problem: Unnecessary re-renders
#### Solution: React.memo, useMemo, useCallback

**Files to Update**:

1. **Heavy Components** (wrap in React.memo):
   - `ui/components/HUD/TopBar.tsx`
   - `components/missions/MissionCard.tsx`
   - `components/Feed/EventItem.tsx`
   - All list item components

2. **Expensive Calculations** (wrap in useMemo):
   - Ship stat calculations
   - Filtered lists
   - Sorted arrays

3. **Event Handlers** (wrap in useCallback):
   - onPress handlers in lists
   - Modal open/close handlers

**Implementation Example**:
```typescript
// Component memoization
export const MissionCard = React.memo(({ mission, onPress }) => {
  // Component code
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if mission ID changed
  return prevProps.mission.id === nextProps.mission.id;
});

// Calculation memoization
const filteredMissions = useMemo(() => {
  return missions.filter(m => m.status === 'active');
}, [missions]);

// Callback memoization
const handlePress = useCallback(() => {
  onMissionPress(mission.id);
}, [mission.id, onMissionPress]);
```

**Testing**:
- Use React DevTools Profiler
- Verify components only re-render when their data changes
- Test tab switching (should not re-render inactive tabs)

---

### C3. Loading States (Days 3-4)

#### Problem: Inconsistent loading UX
#### Solution: Standardized skeleton loaders

**Files to CREATE**:
```
ui/
└── components/
    └── Skeleton/
        ├── SkeletonCard.tsx     ← Card skeleton
        ├── SkeletonList.tsx     ← List skeleton
        ├── SkeletonText.tsx     ← Text skeleton
        └── index.ts
```

**Implementation**:
```typescript
// Shimmer animation using Reanimated
const shimmer = useSharedValue(0);

useEffect(() => {
  shimmer.value = withRepeat(
    withTiming(1, { duration: 1500 }),
    -1,
    false
  );
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-100, 100]) }],
}));
```

**Files to UPDATE**:
1. All tab screens: Show skeleton while loading
2. BottomSheets: Show skeleton for detail views
3. Replace `<ActivityIndicator>` with context-appropriate skeletons

**Example**:
```typescript
// Before:
{isLoading ? <ActivityIndicator /> : <ShipList ships={ships} />}

// After:
{isLoading ? <SkeletonList count={3} itemHeight={120} /> : <ShipList ships={ships} />}
```

---

### C4. Empty States (Day 4-5)

#### Problem: Inconsistent empty states
#### Solution: Use EmptyState component everywhere

**Files to UPDATE**:
1. `app/(tabs)/fleet.tsx`:
   - No ships: EmptyState with "Customize your first ship" CTA

2. `app/(tabs)/me.tsx`:
   - No characters: EmptyState with "Create character" CTA

3. `components/missions/MissionBoard.tsx`:
   - No missions: EmptyState with "Check back later" message

4. `components/Feed/EventFeed.tsx`:
   - No events: EmptyState with "Your activity will appear here"

5. `components/inventory/InventoryList.tsx`:
   - No cargo: EmptyState with "Your cargo hold is empty"

**Implementation**:
```typescript
{items.length === 0 ? (
  <EmptyState
    icon={Package}
    title="No cargo"
    description="Your cargo hold is empty. Mine resources or buy goods to get started."
    action={ship.docked_at ? {
      label: "Visit Market",
      onPress: () => navigateToTrading()
    } : undefined}
  />
) : (
  <FlatList data={items} ... />
)}
```

---

### C5. Accessibility (Days 5-6)

#### Add accessibility labels to all interactive elements

**Files to UPDATE**: All components with TouchableOpacity/Pressable

**Checklist**:
- [ ] All buttons have `accessibilityLabel`
- [ ] All buttons have `accessibilityRole="button"`
- [ ] Disabled buttons have `accessibilityState={{ disabled: true }}`
- [ ] List items have descriptive labels
- [ ] Icons have labels (or are marked decorative)
- [ ] Form inputs have labels
- [ ] Modals announce when opened (accessibilityViewIsModal)

**Implementation**:
```typescript
<Button
  accessibilityLabel="Extract 10 units of Iron Ore"
  accessibilityHint="Starts a mining operation that will take 30 seconds"
  onPress={handleExtract}
>
  Extract
</Button>

<FlatList
  data={missions}
  renderItem={({ item }) => (
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Mission: ${item.name}. Reward: ${item.reward} credits. ${item.objectives.length} objectives. ${item.status}.`}
      onPress={() => handleMissionPress(item)}
    >
      <MissionCard mission={item} />
    </TouchableOpacity>
  )}
/>
```

**Testing**:
- Enable VoiceOver (iOS) or TalkBack (Android)
- Navigate app with screen reader
- Verify all elements are announced correctly
- Verify all actions are accessible

---

### C6. SafeArea Handling (Day 6)

#### Problem: Inconsistent SafeArea handling, manual padding

**Files to UPDATE**: All screens

**Solution**:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

// Before:
<View style={{ paddingTop: 60 }}>

// After:
<SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
```

**TopBar Update**:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TopBar({ ... }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      height: tokens.layout.topBar.height + insets.top,
      paddingTop: insets.top,
      ...
    }}>
      {/* Content */}
    </View>
  );
}
```

**TabBar**: Already handled by Expo Router Tabs

---

### C7. Animation Polish (Day 7)

#### Add micro-interactions

**Enhancements**:
1. **Button Press**:
   - Scale down to 0.98
   - Opacity to 0.9
   - Duration: 100ms

2. **Card Tap**:
   - Scale down to 0.98
   - Duration: 100ms

3. **BottomSheet**:
   - Backdrop fade in (0 → 0.8)
   - Sheet slide up with spring
   - Handle swipe with rubber-banding

4. **Credits Update**:
   - Flash green/red background
   - Fade out over 500ms

5. **Tab Switch**:
   - Fade + translateY animation
   - Duration: 200ms

**Implementation** (using Reanimated):
```typescript
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);

const handlePressIn = () => {
  scale.value = withSpring(0.98);
};

const handlePressOut = () => {
  scale.value = withSpring(1);
};

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

<Animated.View style={animatedStyle}>
  <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
    {children}
  </Pressable>
</Animated.View>
```

---

### C8. Error Boundaries (Day 7-8)

#### Add error handling for robustness

**Files to CREATE**:
```
ui/
└── components/
    └── ErrorBoundary.tsx
```

**Implementation**:
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text variant="title">Something went wrong</Text>
          <Text variant="body">We're working on fixing this issue.</Text>
          <Button onPress={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
```

**Wrap each tab**:
```typescript
<ErrorBoundary>
  <MapTab />
</ErrorBoundary>
```

---

### C9. Performance Monitoring (Day 8)

#### Add performance tracking

**Files to CREATE**:
```
utils/
└── performance.ts
```

**Implementation**:
```typescript
export const measurePerformance = {
  mark: (name: string) => {
    performance.mark(name);
  },

  measure: (name: string, startMark: string, endMark: string) => {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    console.log(`[Perf] ${name}: ${measure.duration}ms`);
    return measure.duration;
  },

  clearMarks: () => {
    performance.clearMarks();
    performance.clearMeasures();
  },
};

// Usage:
measurePerformance.mark('tab-switch-start');
// ... tab switching code
measurePerformance.mark('tab-switch-end');
measurePerformance.measure('tab-switch', 'tab-switch-start', 'tab-switch-end');
```

**Add to critical paths**:
- Tab switching
- BottomSheet open
- List rendering
- API requests

---

### Sprint C Deliverables

**Optimizations**:
- [x] All lists virtualized
- [x] Heavy components memoized
- [x] Skeleton loaders everywhere
- [x] Empty states standardized
- [x] SafeArea handled correctly
- [x] Animations polished
- [x] Error boundaries added
- [x] Performance monitoring in place

**Accessibility**:
- [x] All interactive elements labeled
- [x] Screen reader tested
- [x] Keyboard navigation working (web)

**Performance Metrics**:
- List scroll FPS: 60 (target)
- Tab switch time: <100ms
- BottomSheet open time: <250ms
- Memory usage: Stable (no leaks)

**Code Quality**:
- [x] No console errors
- [x] No TypeScript errors
- [x] Linter passing
- [x] No duplicate code (DRY)

---

## POST-SPRINT: UX REGRESSION CHECKLIST

Create a checklist document for future PRs to prevent UX regressions.

### File to CREATE: `UX_REGRESSION_CHECKLIST.md`

```markdown
# UX Regression Checklist

Use this checklist when reviewing PRs that touch UI code.

## Navigation
- [ ] No new Stack screens added (should use tabs or bottom sheets)
- [ ] Deep links still work
- [ ] Tab navigation doesn't remount entire app

## Theming
- [ ] No hard-coded colors (must use tokens.colors.*)
- [ ] No hard-coded spacing (must use tokens.spacing.*)
- [ ] No hard-coded font sizes (must use Text component or tokens.typography.*)

## Performance
- [ ] Lists use FlatList/SectionList (not .map())
- [ ] Heavy components wrapped in React.memo
- [ ] Event handlers wrapped in useCallback
- [ ] No unnecessary re-renders (check React DevTools Profiler)

## Loading States
- [ ] Skeleton loaders shown while loading (not ActivityIndicator)
- [ ] No flash of empty content
- [ ] Optimistic updates for actions

## Empty States
- [ ] EmptyState component used for "no data" cases
- [ ] EmptyState has appropriate CTA

## Accessibility
- [ ] All buttons have accessibilityLabel
- [ ] All interactive elements have accessibilityRole
- [ ] Tested with VoiceOver/TalkBack

## SafeArea
- [ ] Uses SafeAreaView or useSafeAreaInsets (not manual padding)
- [ ] TopBar respects safe area
- [ ] BottomSheets respect safe area

## Responsive
- [ ] Tested on multiple screen sizes
- [ ] No overflow on small screens
- [ ] Max width constraints for large screens

## Testing
- [ ] Manually tested on iOS
- [ ] Manually tested on Android
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Linter passes
```

---

## MIGRATION TIMELINE

### Week 1: Sprint A
- **Days 1-2**: Theme + primitives
- **Days 3-4**: HUD + tabs
- **Days 5-6**: Panels + feed
- **Day 7**: Testing + fixes

### Week 2-3: Sprint B
- **Days 1-3**: Dashboard → Tabs
- **Days 4-6**: Missions + Mining
- **Days 7-8**: Trading + Sector
- **Days 9-10**: Navigation cleanup

### Week 3-4: Sprint C
- **Days 1-3**: Virtualization + memoization
- **Days 4-5**: Loading + empty states
- **Days 6-8**: A11y + polish

**Total**: 15-21 working days

---

## RISK MITIGATION

### Risk: Breaking existing deep links
**Mitigation**: Keep all legacy routes, add redirects, test deep linking thoroughly

### Risk: SSE events breaking with new UI
**Mitigation**: SSE hooks unchanged, just add feed entries; test real-time updates

### Risk: Performance regressions
**Mitigation**: Measure performance before/after each sprint; profile with React DevTools

### Risk: Accessibility regressions
**Mitigation**: Test with screen reader after each major change; use automated a11y linting

---

## SUCCESS CRITERIA

### Before (Current State)
- Navigation taps to common action: 8-12 taps
- Time to context switch: ~5 seconds
- Screens with persistent context: 0/11
- Duplicate style code: ~1000 lines
- Virtualized lists: 0%
- Accessibility coverage: ~20%

### After (Target State)
- Navigation taps to common action: 2-4 taps ✅
- Time to context switch: <1 second ✅
- Screens with persistent context: 100% ✅
- Duplicate style code: <100 lines ✅
- Virtualized lists: 100% ✅
- Accessibility coverage: >90% ✅

---

**Status**: Ready to execute Sprint A

**Next**: Begin implementation with Theme System (A1)
