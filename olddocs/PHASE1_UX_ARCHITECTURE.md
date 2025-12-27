# Phase 1: UX Architecture
**Space MMO Frontend - Target Experience Design**

Generated: 2025-12-27

---

## 1. INFORMATION ARCHITECTURE

### 5 Core Tabs (Bottom Navigation)

```
┌────────┬────────┬────────┬────────┬────────┐
│  Map   │  Ops   │ Fleet  │  Feed  │   Me   │
└────────┴────────┴────────┴────────┴────────┘
```

#### Tab 1: **MAP** (Navigation & Spatial Awareness)
**Icon**: `MapPin` or `Compass`
**Intent**: Spatial context, galaxy overview, sector navigation

**Primary Content**:
- Large 2D sector map (current sector + neighbors)
- Minimap widget (always accessible from HUD)
- Nearby entities (stations, NPCs, asteroids, players)
- Quick warp/jump actions

**Secondary Panels** (bottom sheet):
- Sector details (resources, danger level, faction control)
- Route planner (multi-jump routing)
- Scan results (detailed entity info)

**Why First Tab**: Players need spatial orientation immediately. "Where am I?" is the first question.

---

#### Tab 2: **OPS** (Operations & Active Gameplay)
**Icon**: `Target` or `Activity`
**Intent**: Current actions, active loops (mining, combat, trading)

**Primary Content**:
- Context-aware based on ship state:
  - **Docked**: Station services menu (refuel, repair, trade, missions)
  - **In Space**: Quick actions grid (mine, scan, engage)
  - **In Combat**: Combat HUD (see interaction patterns)
  - **Mining**: Mining controls + progress
- Active cooldowns and timers

**Secondary Panels**:
- Trading interface (when docked)
- Mining node selection (when in asteroid field)
- Mission objectives tracker (persistent overlay)
- Combat log (recent actions)

**Why Second Tab**: This is "what am I doing right now?" - the action center.

---

#### Tab 3: **FLEET** (Ship & Inventory Management)
**Icon**: `Ship` or `Package`
**Intent**: Assets, loadouts, cargo, ship status

**Primary Content**:
- Ship selector (horizontal carousel of owned ships)
- Current ship detailed stats:
  - Hull: 450/500 (progress bar)
  - Shield: 320/400 (progress bar)
  - Cargo: 67/100 (interactive bar → opens inventory)
  - Fuel: 85% (bar)
- Quick actions: Manage Loadout, View Inventory

**Secondary Panels**:
- Full inventory list (bottom sheet)
  - Tabs: Cargo, Equipment, Loot
  - Quick actions: Transfer, Sell, Equip
- Ship customization (stats, modules, cosmetics)
- Ship list (all owned ships with location)

**Why Third Tab**: Once you know where you are and what you're doing, you need to know your capabilities.

---

#### Tab 4: **FEED** (Activity Log & Notifications)
**Icon**: `ScrollText` or `Bell`
**Intent**: Recent events, mission updates, social activity, market alerts

**Primary Content**:
- Reverse-chronological event feed (virtualized list)
- Event types:
  - Mission progress: "Objective completed: Deliver 50 ore"
  - Trade execution: "Sold 30 Iron at 45 CR/unit"
  - Combat: "Destroyed NPC Pirate (Light Fighter)"
  - Reputation: "Faction standing increased: Federation (Friendly → Honored)"
  - Loot: "Received: Rare Module Blueprint"
  - Social: "Player X entered sector"
- Real-time updates via SSE

**Filters** (chip buttons):
- All | Missions | Combat | Economy | Social

**Secondary Panels**:
- Event detail (tap event → bottom sheet with full context)
- Notification settings

**Why Fourth Tab**: This is the "living world" tab. Keeps history, shows what happened while you were away, demonstrates persistence.

---

#### Tab 5: **ME** (Profile, Character, Social, Settings)
**Icon**: `User` or `Settings`
**Intent**: Player identity, progression, social, meta-game

**Primary Content**:
- Player profile card:
  - Display name
  - Credits balance (large, prominent)
  - Active character (if multi-character)
- Character section:
  - Attributes (piloting, engineering, tactics, etc.)
  - Skills/progression (if implemented)
  - Character list (create/switch)
- Quick links:
  - Reputation standings
  - Mission history
  - Trade history
  - Settings

**Secondary Panels**:
- Full reputation list (all factions with history)
- Mission history (completed missions)
- Settings modal (sound, notifications, account)

**Why Fifth Tab**: Personal hub, low-frequency access, but important for identity and progression.

---

## 2. GAME SHELL WIREFRAME

### Layout Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ ╔═════════════════════════════════════════════════════╗ │
│ ║  TopBar (Persistent HUD)                            ║ │ ← 60px
│ ║  🚀 USS Explorer  📍 Alpha-7  💰 12,450 CR  [•••]  ║ │   Always Visible
│ ╚═════════════════════════════════════════════════════╝ │   SafeArea Top
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                  TAB CONTENT AREA                       │ ← Flex: 1
│             (Map / Ops / Fleet / Feed / Me)             │   Main Content
│                                                         │   Scrollable
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ┌───────┬───────┬───────┬───────┬───────┐             │
│ │  MAP  │  OPS  │ FLEET │ FEED  │  ME   │             │ ← 70px
│ │   🗺️  │   ⚡  │  🚀   │  📜   │  👤   │             │   Bottom Tabs
│ └───────┴───────┴───────┴───────┴───────┘             │   SafeArea Bottom
└─────────────────────────────────────────────────────────┘

OVERLAY LAYERS (Z-Index):
┌─────────────────────────────────────────────────────────┐
│                    BottomSheet                          │ ← Z: 100
│  ┌─────────────────────────────────────────────┐       │   Contextual Panel
│  │ [Handle]                                    │       │   Swipe to dismiss
│  │                                             │       │
│  │  Detail View                                │       │
│  │  (Mission details, inventory, scan, etc.)   │       │
│  │                                             │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Toast Notification                                     │ ← Z: 200
│  ┌────────────────────────────────┐                    │   Quick Feedback
│  │ ✓ Mission objective completed  │                    │   Auto-dismiss
│  └────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### TopBar (Persistent HUD) - Detailed Spec

**Height**: 60px (with SafeArea padding)
**Background**: Semi-transparent surface with backdrop blur
**Content** (horizontal layout):

```typescript
<TopBar>
  <ShipIndicator>
    <ShipIcon /> {/* Current ship type icon */}
    <ShipName>USS Explorer</ShipName>
    <StatusDot color={shipStatus} /> {/* green=ok, yellow=damaged, red=critical */}
  </ShipIndicator>

  <LocationIndicator>
    <MapPinIcon size={16} />
    <SectorName>Alpha-7</SectorName>
    {dockedAt && <StationBadge>{stationName}</StationBadge>}
  </LocationIndicator>

  <Spacer /> {/* Flex: 1 */}

  <CreditsDisplay>
    <CreditIcon size={16} />
    <AnimatedNumber value={credits} />
    <Text>CR</Text>
  </CreditsDisplay>

  <QuickActionsMenu>
    <IconButton icon={MoreVertical} onPress={openQuickMenu} />
    {/* Menu: Emergency Warp, Dock/Undock, Repair, Settings */}
  </QuickActionsMenu>
</TopBar>
```

**Interactions**:
- Tap ship indicator → Opens ship selector bottom sheet
- Tap location → Opens map tab with current sector focused
- Tap credits → Opens economy/wallet detail
- Tap quick actions → Dropdown menu with emergency actions

---

### Tab Bar (Bottom Navigation) - Detailed Spec

**Height**: 70px (with SafeArea padding)
**Background**: Surface with top border
**Behavior**:
- Active tab: Primary color icon + label
- Inactive tabs: TextSecondary color icon + label
- Smooth transition animation (100ms ease-out)

```typescript
<TabBar>
  <Tab active={currentTab === 'map'} onPress={() => navigate('map')}>
    <MapIcon color={active ? primary : textSecondary} />
    <TabLabel>Map</TabLabel>
    {hasMapAlert && <Badge />}
  </Tab>
  {/* ... repeat for 5 tabs */}
</TabBar>
```

**Badge System**:
- Red dot badge for: New mission available, combat alert, critical ship damage
- Number badge for: Unread notifications in Feed tab

---

### BottomSheet (Contextual Panel) - Detailed Spec

**Variants**:
1. **Half-height** (50% screen): Quick details (inventory item, mission detail)
2. **Three-quarter** (75% screen): Forms (trading, mission accept)
3. **Full-height** (90% screen): Complex views (full inventory list)

**Behavior**:
- Swipe handle at top (12px wide, 4px tall, rounded)
- Swipe down to dismiss
- Tap backdrop (dimmed background) to dismiss
- Smooth spring animation (tension: 180, friction: 26)

**Usage Examples**:
```
Tap resource in cargo → BottomSheet:
  ┌───────────────────────────────────┐
  │ [━━]                              │
  │                                   │
  │ Iron Ore                          │
  │ Quantity: 50 units                │
  │ Quality: 2.3× base value          │
  │                                   │
  │ Actions:                          │
  │ [Sell at Market] [Transfer] [Drop]│
  └───────────────────────────────────┘

Tap mission card → BottomSheet:
  ┌───────────────────────────────────┐
  │ [━━]                              │
  │                                   │
  │ 📜 Deliver Medical Supplies       │
  │                                   │
  │ Objectives:                       │
  │ ✓ Pick up cargo (Alpha-7)         │
  │ ○ Deliver to Beta-3 (0/50)        │
  │                                   │
  │ Rewards: 1,200 CR | 50 Rep        │
  │ Expires: 2h 34m                   │
  │                                   │
  │ [Abandon Mission]                 │
  └───────────────────────────────────┘
```

---

## 3. INTERACTION PATTERNS

### Pattern 1: INSPECT (Tap → Detail)
**Trigger**: Tap on list item, card, or map entity
**Response**: Bottom sheet slides up with details + available actions
**Timing**: 250ms animation
**Haptic**: Light tap feedback

**Examples**:
- Tap ship in fleet → Ship detail bottom sheet
- Tap mission in list → Mission detail bottom sheet
- Tap resource node on map → Node scan results bottom sheet
- Tap NPC ship → NPC info + combat option

**Implementation**:
```typescript
const [selectedItem, setSelectedItem] = useState(null);
const [sheetVisible, setSheetVisible] = useState(false);

const handleItemPress = (item) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setSelectedItem(item);
  setSheetVisible(true);
};

<BottomSheet
  visible={sheetVisible}
  onClose={() => setSheetVisible(false)}
>
  <ItemDetail item={selectedItem} />
</BottomSheet>
```

---

### Pattern 2: ACT (Confirm → Optimistic Update)
**Trigger**: User initiates action (mine, trade, attack, accept mission)
**Response**:
1. Confirmation panel (if destructive/costly)
2. Optimistic UI update immediately
3. Toast notification on success/failure
4. SSE event updates authoritative state

**Timing**:
- Confirmation modal: Instant
- Optimistic update: Immediate (0ms)
- Toast: Show 2s after action
- SSE update: Varies (100ms-5s)

**Examples**:

**Mining Action**:
```
User taps "Extract 10 units"
  ↓
Optimistic: Mining progress bar appears, button disabled
  ↓
API request sent in background
  ↓
SSE event: extraction_started
  ↓
Progress bar updates in real-time (from SSE)
  ↓
SSE event: extraction_complete
  ↓
Toast: "✓ Mined 10 Iron Ore (2.1× quality)"
  ↓
Inventory updated (query invalidation)
```

**Trade Action**:
```
User enters "Sell 50 Iron at 45 CR"
  ↓
Confirmation: "Sell 50 Iron for 2,250 CR?"
  ↓
Optimistic: Credits +2,250, Inventory -50 Iron
  ↓
API request
  ↓
SSE event: trade_executed
  ↓
Toast: "✓ Sold 50 Iron at 45 CR"
  ↓
Feed entry: "Sold 50 Iron at 45 CR/unit"
```

**Implementation**:
```typescript
const handleMineAction = async (nodeId: string, quantity: number) => {
  // Optimistic update
  setMiningInProgress(true);
  setProgressPercent(0);

  // API call (don't await - fire and forget)
  miningApi.extract({ ship_id, node_id: nodeId, quantity })
    .catch(err => {
      // Rollback on failure
      setMiningInProgress(false);
      toast.error('Mining failed: ' + err.message);
    });

  // SSE will drive actual progress updates
};
```

---

### Pattern 3: RESULT (Feedback → Log Entry)
**Trigger**: Action completes (from SSE event or API response)
**Response**:
1. Toast notification (2s duration)
2. Feed entry added to activity log
3. Relevant stat badges update (credits, XP, rep, etc.)
4. Haptic feedback (success: medium, failure: heavy)

**Toast Variants**:
```typescript
// Success (green accent)
<Toast type="success" icon={CheckCircle}>
  Mission completed! +1,200 CR
</Toast>

// Info (blue accent)
<Toast type="info" icon={Info}>
  Entered sector Beta-3
</Toast>

// Warning (amber accent)
<Toast type="warning" icon={AlertTriangle}>
  Hull integrity low (20%)
</Toast>

// Error (red accent)
<Toast type="error" icon={XCircle}>
  Trade failed: Insufficient cargo space
</Toast>
```

**Feed Entry Structure**:
```typescript
<FeedEntry
  icon={iconByEventType[event.type]}
  timestamp={event.timestamp}
  title={event.title}
  description={event.description}
  metadata={event.metadata}
  onPress={() => openEventDetail(event)}
/>

// Example entries:
[12:34] 🎯 Mission: Objective completed - Deliver 50 ore
[12:30] 💰 Trading: Sold 30 Iron at 45 CR/unit (+1,350 CR)
[12:28] ⚔️  Combat: Destroyed NPC Pirate (Light Fighter)
[12:25] 🛡️  Reputation: Federation standing increased (Friendly → Honored)
```

---

### Pattern 4: PROGRESS (Timers, Cooldowns, XP Bars)
**Components**:

**A. Timer Countdown** (missions, cooldowns)
```typescript
<Timer expiresAt={mission.expires_at} format="2h 34m" />
// Shows: 2h 34m → 2h 33m → ... → 5m → 4m 59s → ... → EXPIRED
// Color: text → warning (< 30m) → danger (< 5m)
```

**B. Progress Bar** (mining, travel, combat loading)
```typescript
<ProgressBar
  current={extractedSoFar}
  max={totalToExtract}
  label="Mining..."
  showPercent
  animated
/>
// Smooth animation using Reanimated
// Color gradient for different phases (0-50%: warning, 50-100%: success)
```

**C. Cooldown Overlay** (buttons disabled during cooldown)
```typescript
<Button
  disabled={isOnCooldown}
  cooldownEndsAt={cooldownEndsAt}
>
  Fire Weapons
</Button>
// Shows circular countdown overlay on button
// Re-enables automatically when cooldown expires
```

**D. Stat Chips with Change Indicator** (credits, XP, reputation)
```typescript
<StatChip
  icon={Coins}
  value={credits}
  change={recentChange}
  animated
/>
// Shows: 💰 12,450 CR (+350) ← green text for recent increase
// Change indicator fades out after 3s
```

**E. Real-time Resource Meters** (hull, shield, fuel)
```typescript
<ResourceMeter
  label="Hull"
  current={hullPoints}
  max={hullMax}
  color={hullPoints < hullMax * 0.3 ? 'danger' : 'success'}
  showValue
/>
// Updates in real-time from SSE ship_status events
// Color transitions smoothly (green → yellow → red)
```

---

## 4. VISUAL SYSTEM TOKENS (Code-Ready)

### File: `/ui/theme/tokens.ts`

```typescript
/**
 * Design Tokens - Space MMO Theme
 * "Command Console" aesthetic: Dark surfaces, neon accents, tactical readability
 */

export const tokens = {

  // COLORS
  colors: {
    // Backgrounds
    background: {
      primary: '#0a0e1a',      // Deep space (main app bg)
      secondary: '#141b2e',    // Panel background
      tertiary: '#1a2238',     // Elevated surfaces
    },

    // Surfaces
    surface: {
      base: '#141b2e',
      raised: '#1a2238',
      overlay: '#1e293b',
      card: '#1a2238',
      modal: '#141b2e',
    },

    // Interactive
    primary: {
      main: '#00d4ff',         // Cyan (main CTA, selected items)
      dark: '#0099cc',         // Darker cyan (hover/pressed)
      light: '#33e0ff',        // Lighter cyan (subtle accents)
      alpha: {
        10: 'rgba(0, 212, 255, 0.1)',
        20: 'rgba(0, 212, 255, 0.2)',
        30: 'rgba(0, 212, 255, 0.3)',
      }
    },

    secondary: {
      main: '#7c3aed',         // Purple (secondary actions)
      dark: '#6d28d9',
      light: '#8b5cf6',
    },

    // Semantic
    success: '#10b981',        // Green (success states)
    warning: '#f59e0b',        // Amber (warnings, caution)
    danger: '#ef4444',         // Red (errors, critical, destructive)
    info: '#3b82f6',           // Blue (info, neutral notifications)

    // Text
    text: {
      primary: '#e2e8f0',      // Main text (high contrast)
      secondary: '#94a3b8',    // Secondary text (medium contrast)
      tertiary: '#64748b',     // Tertiary text (low contrast)
      disabled: '#475569',     // Disabled text
      inverse: '#0a0e1a',      // Text on light backgrounds
    },

    // Borders
    border: {
      default: '#1e293b',      // Default borders
      light: '#334155',        // Lighter borders (elevated surfaces)
      focus: '#00d4ff',        // Focus/active borders
      error: '#ef4444',        // Error state borders
    },

    // Special
    backdrop: 'rgba(10, 14, 26, 0.8)',  // Modal backdrop
    overlay: 'rgba(20, 27, 46, 0.95)',  // Glass overlay (HUD)
  },

  // SPACING (8px base unit)
  spacing: {
    0: 0,
    1: 4,      // 0.5 × base
    2: 8,      // 1 × base
    3: 12,     // 1.5 × base
    4: 16,     // 2 × base
    5: 20,     // 2.5 × base
    6: 24,     // 3 × base
    8: 32,     // 4 × base
    10: 40,    // 5 × base
    12: 48,    // 6 × base
    16: 64,    // 8 × base
    20: 80,    // 10 × base
    24: 96,    // 12 × base
  },

  // TYPOGRAPHY
  typography: {
    fontFamily: {
      body: 'System',          // Default system font
      mono: 'Courier',         // For numbers, stats, coordinates
    },

    fontSize: {
      xs: 11,      // Micro text (timestamps, captions)
      sm: 12,      // Small text (labels, secondary info)
      base: 14,    // Body text (default)
      md: 16,      // Medium text (emphasized body)
      lg: 18,      // Large text (card titles)
      xl: 20,      // Section headers
      '2xl': 24,   // Page titles
      '3xl': 32,   // Hero text
      '4xl': 40,   // Display text
    },

    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // BORDER RADIUS
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // ELEVATION (shadows)
  elevation: {
    0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 16,
    },
  },

  // Z-INDEX
  zIndex: {
    base: 0,
    dropdown: 50,
    sticky: 100,
    fixed: 200,
    modalBackdrop: 300,
    modal: 400,
    popover: 500,
    toast: 600,
  },

  // ANIMATION
  animation: {
    duration: {
      fast: 100,
      normal: 200,
      slow: 300,
      verySlow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: { tension: 180, friction: 26 },
    },
  },

  // LAYOUT
  layout: {
    topBar: {
      height: 60,
      heightWithSafeArea: 60, // Will be calculated + SafeAreaInsets.top
    },
    tabBar: {
      height: 70,
      heightWithSafeArea: 70, // Will be calculated + SafeAreaInsets.bottom
    },
    maxContentWidth: 1200,   // Max width for tablet/web
    gutter: 24,               // Side padding for screens
  },

  // INTERACTION
  interaction: {
    minTouchTarget: 44,       // Minimum tap target size (iOS HIG)
    iconSize: {
      sm: 16,
      base: 20,
      md: 24,
      lg: 32,
    },
    haptics: {
      light: 'light',         // Tap, selection
      medium: 'medium',       // Success, confirm
      heavy: 'heavy',         // Error, destructive
    },
  },

} as const;

// Type-safe token access
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;
```

---

### File: `/ui/theme/hooks.ts`

```typescript
import { tokens } from './tokens';

/**
 * Hook to access design tokens
 * Usage: const { colors, spacing } = useTheme();
 */
export const useTheme = () => {
  return tokens;
};

/**
 * Utility to get responsive spacing based on screen size
 */
export const useResponsiveSpacing = () => {
  const { width } = Dimensions.get('window');
  const isTablet = width >= 768;

  return {
    gutter: isTablet ? tokens.spacing[8] : tokens.spacing[6],
    contentPadding: isTablet ? tokens.spacing[10] : tokens.spacing[4],
  };
};
```

---

## 5. COMPONENT PRIMITIVE SPECS

### Button Component

```typescript
<Button
  variant="primary" | "secondary" | "ghost" | "danger"
  size="sm" | "md" | "lg"
  icon={IconComponent}
  iconPosition="left" | "right"
  disabled={boolean}
  loading={boolean}
  fullWidth={boolean}
  onPress={handler}
>
  Label Text
</Button>

// Variants:
// primary: Filled cyan background, white text
// secondary: Outlined cyan border, cyan text
// ghost: No border, cyan text, subtle bg on press
// danger: Filled red background, white text

// Sizes:
// sm: height 32, padding 8×12, fontSize 12
// md: height 40, padding 10×16, fontSize 14
// lg: height 48, padding 12×20, fontSize 16
```

---

### Card Component

```typescript
<Card
  variant="default" | "elevated" | "outlined"
  padding={SpacingToken}
  onPress={handler} // Makes card interactive
>
  {children}
</Card>

// Variants:
// default: Surface bg, border, no shadow
// elevated: Raised bg, elevation 2, no border
// outlined: Transparent bg, prominent border

// Interactive:
// - Pressable if onPress provided
// - Scale down 0.98 on press
// - Opacity 0.9 on press
```

---

### Text Component

```typescript
<Text
  variant="display" | "title" | "heading" | "body" | "caption" | "mono"
  weight="normal" | "medium" | "semibold" | "bold"
  color={ColorToken}
  align="left" | "center" | "right"
  numberOfLines={number}
>
  Text content
</Text>

// Variants set fontSize + lineHeight:
// display: 32px / tight
// title: 24px / tight
// heading: 20px / normal
// body: 14px / normal
// caption: 12px / normal
// mono: 14px / normal + Courier font
```

---

### Panel Component (BottomSheet)

```typescript
<Panel
  visible={boolean}
  height="half" | "threequarter" | "full" | number
  onClose={handler}
  showHandle={boolean}
  backdrop={boolean}
>
  {children}
</Panel>

// Heights:
// half: 50% screen
// threequarter: 75% screen
// full: 90% screen
// number: Custom height in px

// Behavior:
// - Animated slide-up entrance
// - Swipe-to-dismiss
// - Backdrop tap to dismiss
// - Safe area insets handled
```

---

## 6. TRANSITION & MOTION RULES

### Screen Transitions (Tab Changes)
```typescript
// Fade + slight Y-offset
{
  opacity: from 0 to 1,
  translateY: from 8 to 0,
  duration: 200ms,
  easing: easeOut
}
```

### Panel Slide (BottomSheet)
```typescript
// Spring animation
{
  translateY: from screenHeight to calculatedPosition,
  spring: { tension: 180, friction: 26 }
}
```

### Feedback Animations
```typescript
// Button Press
{ scale: 0.98, opacity: 0.9, duration: 100ms }

// Card Tap
{ scale: 0.98, duration: 100ms }

// Success Flash (stat update)
{
  backgroundColor: successColor alpha 0.3,
  fadeOut: 500ms
}

// Error Shake
{
  translateX: [-8, 8, -4, 4, 0],
  duration: 300ms
}
```

### Loading States
```typescript
// Skeleton Shimmer
{
  backgroundGradient: [bg, surfaceLight, bg],
  translateX: from -100% to 100%,
  duration: 1500ms,
  repeat: infinite,
  easing: easeInOut
}

// Spinner Rotation
{
  rotate: from 0deg to 360deg,
  duration: 800ms,
  repeat: infinite,
  easing: linear
}
```

---

## 7. ACCESSIBILITY REQUIREMENTS

### Minimum Standards

1. **Touch Targets**: 44×44px minimum (iOS HIG)
2. **Color Contrast**:
   - Text on background: 4.5:1 minimum (WCAG AA)
   - Icons/UI elements: 3:1 minimum
3. **Accessibility Labels**: All interactive elements must have labels
4. **Focus Indicators**: Visible focus state for keyboard navigation (web)
5. **Screen Reader**: VoiceOver/TalkBack support
6. **Reduced Motion**: Respect `prefers-reduced-motion` setting

### Implementation
```typescript
// Button example
<Button
  accessibilityLabel="Extract 10 units of Iron Ore"
  accessibilityRole="button"
  accessibilityState={{ disabled: isDisabled }}
  accessibilityHint="Starts mining operation"
>
  Extract
</Button>

// List item example
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel={`Mission: ${mission.name}. Status: ${mission.status}. Reward: ${mission.reward} credits.`}
  onPress={handlePress}
>
  <MissionCard mission={mission} />
</TouchableOpacity>
```

---

## 8. RESPONSIVE BREAKPOINTS

```typescript
export const breakpoints = {
  mobile: 0,      // 0-767px (phones)
  tablet: 768,    // 768-1023px (tablets)
  desktop: 1024,  // 1024+ (web/large tablets)
};

// Usage:
const { width } = Dimensions.get('window');
const isMobile = width < breakpoints.tablet;
const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
const isDesktop = width >= breakpoints.desktop;

// Layout adjustments:
// Mobile: Single column, full width cards, bottom sheets
// Tablet: Two column grid (fleet/inventory), side panels option
// Desktop: Three column grid, sidebar navigation option
```

---

## 9. GAME UX BRIEF (Context)

### Theme
"Space MMO Command Console" - You are the captain of a starship navigating a living galaxy.

### Core Resources
- **Credits**: Universal currency (shown as: 💰 12,450 CR)
- **Fuel**: Ship movement resource (shown as: ⛽ 85%)
- **Hull/Shield**: Ship health (shown as bars)
- **Cargo**: Inventory capacity (shown as: 67/100)
- **Reputation**: Faction standing (shown as tier: Neutral, Friendly, Honored, etc.)

### Core Loop
```
1. Scout      → Scan sector for opportunities (mining, NPCs, stations)
2. Act        → Choose action (mine, trade, engage, accept mission)
3. Loot       → Receive rewards (resources, credits, loot drops)
4. Upgrade    → Improve ship (repair, refuel, buy modules)
5. Progress   → Gain reputation, complete missions, unlock content
6. Social     → Interact with factions, other players, politics
```

### Visual Language
- **Dark surfaces**: Space background, minimalist panels
- **Neon accents**: Cyan primary (HUD, active states, CTAs)
- **Compact numbers**: Monospace font for stats (12,450 CR not 12450CR)
- **Readable lists**: High contrast text, generous line height
- **Tactical icons**: Lucide icon set (consistent, recognizable)

### Tone
- Utilitarian (function over form, every pixel serves a purpose)
- Tactical (information-dense without clutter)
- Fast (quick actions, minimal taps, responsive feedback)
- Persistent (world continues when you're away, history preserved in feed)

---

## COMPLETION CHECKLIST

Phase 1 is complete when:
- [x] 5 core tabs defined with clear intent
- [x] Game shell wireframe documented
- [x] 4 interaction patterns specified (Inspect, Act, Result, Progress)
- [x] Visual system tokens created in code-ready format
- [x] Component primitive specs defined
- [x] Motion/transition rules documented
- [x] Accessibility requirements specified
- [x] Responsive breakpoints defined
- [x] Game UX brief provided for context

**Status**: ✅ **PHASE 1 COMPLETE**

---

**Next Step**: Proceed to Phase 2 - Implementation Plan (3-sprint breakdown with file-level tasks)
