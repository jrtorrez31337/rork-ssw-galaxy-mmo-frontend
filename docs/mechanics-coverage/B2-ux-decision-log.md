# B2: UX Decision Log
## Rationale for 2D Space Shooter RPG UX System

**Analysis Date**: 2025-12-27
**Agent**: UX Authority (Agent B)
**Task**: Document rationale for all binding UX decisions
**Status**: Binding (all frontend changes must align with these decisions)

---

## Executive Summary

This document provides the **human-readable rationale** for all UX decisions defined in B1-ux-system-definition.md and B2-ux-decision-pack.yaml. Each decision is explained with:
- **Context**: Why this decision was necessary
- **Alternatives Considered**: Other approaches evaluated
- **Rationale**: Why the chosen approach is optimal
- **Trade-offs**: What we gain and what we sacrifice

**Target Audience**: Product managers, UX designers, frontend developers

---

## Part 1: Core Architecture Decisions

### Decision 1.1: Persistent Cockpit Shell (Not Page-Based UI)

**Context**:
- Mobile games often use page-based navigation (full-screen transitions)
- Space shooter RPGs require persistent spatial awareness and real-time feedback
- Current frontend uses tab-based navigation but lacks persistent HUD elements

**Alternatives Considered**:

1. **Page-Based UI** (Mobile game standard)
   - Full-screen transitions for every action
   - No persistent HUD elements
   - Example: Most mobile RPGs (Summoners War, Raid: Shadow Legends)

2. **Split-Screen UI** (Desktop game standard)
   - Fixed left/right panels, center viewport
   - Example: EVE Online, X4: Foundations

3. **Persistent Cockpit Shell** (Chosen)
   - Always-visible HUD shell (status bar, quick actions)
   - Contextual panels (overlays or sidebars)
   - Viewport swaps based on tab selection

**Rationale**:

✅ **Persistent Cockpit Shell** chosen because:
- Mobile-optimized (tab bar + overlays work on small screens)
- Maintains spatial awareness (status bar always shows location, fuel, hull)
- Real-time feel (SSE events update HUD without user action)
- Genre-appropriate (matches space shooter expectations)

**Trade-offs**:
- ➕ Gain: Persistent awareness, real-time feedback, genre alignment
- ➖ Sacrifice: More complex UI state management (panel visibility, HUD updates)

**Precedent**: FTL: Faster Than Light (cockpit shell on desktop), Elite Dangerous (HUD paradigm)

---

### Decision 1.2: Flash-Card UI Prohibited for Core Gameplay

**Context**:
- Current frontend uses full-screen modals for Jump, Docking, and Transfers
- Modals obscure the game world and break immersion
- Flash-card UI is common in mobile games but inappropriate for real-time space shooters

**Alternatives Considered**:

1. **Full-Screen Modals** (Current state)
   - Jump/Dock/Transfer use centered modal dialogs
   - Example: Most mobile RPGs (turn-based, no real-time pressure)

2. **Inline Panels** (Chosen for Jump/Dock)
   - Panel overlays bottom of screen, map/sector view remains visible (dimmed)
   - Example: FTL's subsystem panels

3. **Viewport Replacement** (Chosen for Combat/Trading)
   - Action fully replaces viewport (combat screen, trading screen)
   - Example: FTL's combat interface

**Rationale**:

✅ **Inline Panels** for Jump/Dock because:
- Maintains spatial context (you can see where you're jumping/docking)
- Faster interaction (no full-screen transition animation)
- Mobile-friendly (slides from bottom, swipe to dismiss)
- Immersive (you're still in the cockpit, not a menu)

✅ **Viewport Replacement** for Combat/Trading because:
- These actions require full attention (turn-based combat, complex market UI)
- Still maintains HUD shell (status bar + tab bar visible)
- Not "modal" (no centered dialog, just viewport swap)

**Trade-offs**:
- ➕ Gain: Immersion, spatial context, faster interactions
- ➖ Sacrifice: Slightly more screen real estate used (panel + map visible)

**Precedent**: FTL (inline panels for systems), Elite Dangerous (HUD-integrated navigation)

---

### Decision 1.3: Bottom Tab Bar as Primary Navigation

**Context**:
- React Native's default navigation is stack-based (push/pop screens)
- Mobile games often use top navigation or hamburger menus
- Space games benefit from persistent, thumbs-friendly navigation

**Alternatives Considered**:

1. **Stack Navigation** (React Native default)
   - Each screen pushes onto stack, back button to pop
   - Example: Most mobile apps (Settings > Profile > Edit)

2. **Top Tab Bar** (Alternative)
   - Tabs at top of screen
   - Example: Twitter, Instagram (swipe between tabs)

3. **Bottom Tab Bar** (Chosen)
   - 5 tabs at bottom: Dashboard, Map, Missions, Profile, Feed
   - Example: Most mobile apps (iOS Human Interface Guidelines)

4. **Hamburger Menu** (Alternative)
   - Hidden menu, tap to expand
   - Example: Many mobile web apps

**Rationale**:

✅ **Bottom Tab Bar** chosen because:
- Mobile ergonomics (thumbs reach bottom easily, not top)
- Persistent navigation (always visible, no hidden menus)
- Tab paradigm matches desktop (EVE Online has similar tab groups)
- 5 tabs fit without overflow on all screen sizes

**Trade-offs**:
- ➕ Gain: Ergonomics, discoverability, persistent visibility
- ➖ Sacrifice: Screen real estate (48-60px at bottom)

**Precedent**: iOS Human Interface Guidelines (bottom tabs), Android Material Design (bottom navigation)

---

## Part 2: HUD Component Decisions

### Decision 2.1: Status Bar Always Visible (Except Auth Screens)

**Context**:
- Players need to know critical ship state at all times (fuel, hull, shield)
- Current frontend has no persistent status display
- Space games traditionally show HUD at all times

**Alternatives Considered**:

1. **No Status Bar** (Current state)
   - Ship state only visible on Dashboard screen
   - Example: Turn-based mobile RPGs (state not time-sensitive)

2. **Collapsible Status Bar** (Alternative)
   - Tap to hide/show status bar
   - Example: Some full-screen games (maximize viewport)

3. **Always-Visible Status Bar** (Chosen)
   - Fixed at top, 48-60px height
   - Hidden only on Login/Signup (not in-game)

**Rationale**:

✅ **Always-Visible Status Bar** chosen because:
- Critical safety information (low fuel = stranded, low hull = death)
- Real-time awareness (SSE updates show changes immediately)
- Genre expectation (all space shooters have HUD)
- Mobile-friendly (48px is small, doesn't obstruct viewport)

**Trade-offs**:
- ➕ Gain: Safety, awareness, genre alignment
- ➖ Sacrifice: 48-60px screen height (minor on modern phones)

**Precedent**: Elite Dangerous (always-visible HUD), FTL (persistent ship status)

---

### Decision 2.2: Monospace Font for Status Bar

**Context**:
- Status bar shows numbers that update frequently (fuel, hull, shield)
- Changing number widths can cause layout shift (e.g., "999" vs "1000")
- Desktop space games use monospace fonts for cockpit displays

**Alternatives Considered**:

1. **Proportional Font** (e.g., Roboto, Helvetica)
   - Standard mobile UI font
   - Numbers have variable width (1 is narrower than 9)

2. **Monospace Font** (Chosen)
   - Fixed-width characters (Courier New, Monaco)
   - All digits same width (prevents layout shift)

3. **Tabular Numbers** (Alternative)
   - Proportional font with fixed-width digits only
   - Example: `font-variant-numeric: tabular-nums`

**Rationale**:

✅ **Monospace Font** chosen because:
- No layout shift when numbers update (fuel 850 → 851 same width)
- Command console aesthetic (simulates cockpit computer)
- High legibility at small sizes (monospace designed for terminals)
- Genre expectation (space games use monospace for tech displays)

**Trade-offs**:
- ➕ Gain: Stability, aesthetic, legibility
- ➖ Sacrifice: Slightly wider (monospace is less space-efficient)

**Precedent**: Elite Dangerous (monospace HUD), Kerbal Space Program (console fonts)

---

### Decision 2.3: Mini-Map Fixed Size (No Pan/Zoom)

**Context**:
- Players need spatial awareness (nearby sectors, stations, threats)
- Full map screen exists but requires tab switch
- Mini-maps in games are usually abstracted overviews

**Alternatives Considered**:

1. **No Mini-Map** (Current state)
   - Spatial awareness only via full Map screen
   - Example: Turn-based games (no real-time spatial pressure)

2. **Interactive Mini-Map** (Pan/Zoom enabled)
   - Players can interact with mini-map (zoom, pan, tap sectors)
   - Example: RTS games (StarCraft, Age of Empires)

3. **Fixed Static Mini-Map** (Chosen)
   - 100-150px static overview
   - Tap to open full Map screen (no in-place interaction)

**Rationale**:

✅ **Fixed Static Mini-Map** chosen because:
- Mobile touch targets (100px is too small for precise interaction)
- Persistent awareness (shows nearby threats without interaction)
- Performance (no pan/zoom state management, simple rendering)
- Design simplicity (one clear interaction: tap to expand)

**Trade-offs**:
- ➕ Gain: Performance, simplicity, clear interaction model
- ➖ Sacrifice: Less interactive (can't explore mini-map directly)

**Precedent**: FTL (static sector map), Faster Than Light (fixed overview)

---

### Decision 2.4: Quick Action HUD Floating (Not Fixed Position)

**Context**:
- Players need quick access to Jump, Dock, Combat, Chat
- Current frontend requires tab switching or full-screen dialogs
- Mobile games often use floating action buttons (FAB)

**Alternatives Considered**:

1. **No Quick Action HUD** (Current state)
   - Actions only via Dashboard buttons or menu navigation
   - Example: Turn-based games (no real-time pressure)

2. **Fixed Action Bar** (Alternative)
   - Horizontal bar at top or bottom with action buttons
   - Example: Many mobile games (action bar above tab bar)

3. **Floating Action HUD** (Chosen)
   - 4 buttons in corner (top-right or bottom-right)
   - Semi-transparent overlay (60% opacity)

**Rationale**:

✅ **Floating Action HUD** chosen because:
- Mobile ergonomics (corner is thumbs-reachable)
- Space-efficient (overlays viewport instead of fixed bar)
- Contextual visibility (only on Map/Sector View, hidden elsewhere)
- Genre alignment (FTL has similar floating controls)

**Trade-offs**:
- ➕ Gain: Space efficiency, contextual visibility
- ➖ Sacrifice: Partially obscures viewport (mitigated by transparency)

**Precedent**: FTL (floating subsystem buttons), Android Material Design (FAB)

---

## Part 3: Panel System Decisions

### Decision 3.1: Chat as Side Panel (Not Full Screen)

**Context**:
- Chat system is completely missing (0% backend used)
- Multiplayer games require chat but it shouldn't dominate screen
- Mobile games often use full-screen chat (sacrifices game visibility)

**Alternatives Considered**:

1. **No Chat** (Current state)
   - Social features missing
   - Example: Single-player games

2. **Full-Screen Chat** (Alternative)
   - Chat is a dedicated tab or full-screen modal
   - Example: Mobile MMOs (requires tab switch to see chat)

3. **Side Panel Chat** (Chosen)
   - Right-side panel (240-320px width)
   - Collapsible to icon (expandable on demand)
   - Visible while playing (can chat during combat, trading, etc.)

4. **Overlay Chat** (Alternative)
   - Floating chat window (draggable, resizable)
   - Example: Desktop MMOs (EVE Online, World of Warcraft)

**Rationale**:

✅ **Side Panel Chat** chosen because:
- Persistent visibility (can chat without leaving game screen)
- Mobile-friendly (on small screens, full-screen overlay; on tablets, sidebar)
- Collapsible (can hide when not needed, unread badge shows activity)
- Genre expectation (MMOs have chat always accessible)

**Trade-offs**:
- ➕ Gain: Multitasking, social engagement, persistent visibility
- ➖ Sacrifice: Screen real estate on tablets (240-320px width)

**Precedent**: Desktop MMOs (EVE, WoW have side panel chat), Discord mobile (side drawer)

---

### Decision 3.2: Jump/Dock as Inline Panels (Not Modals)

**Context**:
- Current Jump/Dock are full-screen modals (flash-card UI violation)
- Jump/Dock are frequent actions (core gameplay loop)
- Players need to see map/sector view while confirming action

**Alternatives Considered**:

1. **Full-Screen Modal** (Current state)
   - Jump/Dock open centered modal, map disappears
   - Example: Mobile RPGs (non-spatial actions)

2. **Inline Panel** (Chosen)
   - Panel slides up from bottom (200-300px height)
   - Map/sector view remains visible (dimmed to 60% opacity)
   - Cancel/Confirm buttons in panel

3. **HUD Overlay** (Alternative)
   - Jump/Dock controls embedded in HUD (no panel)
   - Example: Elite Dangerous (HUD-integrated jump controls)

**Rationale**:

✅ **Inline Panel** chosen because:
- Spatial context (can see target sector while confirming jump)
- Mobile-friendly (bottom panel is thumbs-reachable)
- Fast interaction (slide up, tap confirm, slide down)
- Non-blocking (map still visible, can reference while deciding)

❌ **HUD Overlay** rejected because:
- Mobile screen size (not enough room for full jump UI in HUD)
- Complexity (jump UI has distance, fuel cost, cooldown - needs space)

**Trade-offs**:
- ➕ Gain: Speed, spatial context, mobile ergonomics
- ➖ Sacrifice: Slightly more complex (panel + dimmed map state)

**Precedent**: FTL (inline panels for subsystem actions), mobile games (bottom sheets)

---

### Decision 3.3: Combat as Viewport Replacement (Not Modal)

**Context**:
- Combat is turn-based, requires full attention
- Current combat screen replaces entire viewport (correct)
- Some mobile games use modal dialogs for combat (incorrect for this genre)

**Alternatives Considered**:

1. **Modal Dialog** (Anti-pattern)
   - Combat in centered modal, map visible in background
   - Example: Mobile idle games (combat is passive)

2. **Viewport Replacement** (Chosen, Current state)
   - Combat screen replaces map/sector view entirely
   - Status bar + tab bar remain visible
   - Combat log in bottom panel

3. **Split Screen** (Alternative)
   - Combat in one half, map in other half
   - Example: Desktop strategy games (simultaneous views)

**Rationale**:

✅ **Viewport Replacement** chosen because:
- Full attention (turn-based combat requires focus)
- Mobile screen size (split screen is cramped on phones)
- Genre alignment (FTL replaces viewport for combat)
- Still not "modal" (HUD shell remains, tab bar accessible)

**Trade-offs**:
- ➕ Gain: Focus, mobile-friendly, genre alignment
- ➖ Sacrifice: Can't see map during combat (acceptable for turn-based)

**Precedent**: FTL (viewport replacement for combat), Into the Breach (full combat screen)

---

## Part 4: Real-Time Integration Decisions

### Decision 4.1: SSE for All State Updates (Not Polling)

**Context**:
- Backend supports 24 SSE event types for real-time updates
- Current frontend polls for some data (inefficient, delayed)
- Real-time feel is critical for space shooter genre

**Alternatives Considered**:

1. **Polling Only** (Partial current state)
   - Frontend polls backend every 5-10 seconds
   - Example: Turn-based games (state changes infrequent)

2. **SSE for All Updates** (Chosen)
   - All state changes pushed via SSE events
   - No polling (except initial load)

3. **WebSockets** (Alternative)
   - Bidirectional communication (can push both ways)
   - Example: Multiplayer action games (real-time movement)

**Rationale**:

✅ **SSE for All Updates** chosen because:
- Backend already implements 24 SSE events (contract exists)
- Efficient (no polling overhead, instant updates)
- Real-time feel (fuel/hull/shield update immediately on change)
- Mobile-friendly (SSE is lighter than WebSockets, one-way is sufficient)

❌ **WebSockets** rejected because:
- Backend uses SSE (contract already defined)
- One-way updates sufficient (player actions use REST POST)
- Simpler (SSE is HTTP/2, no separate protocol)

**Trade-offs**:
- ➕ Gain: Efficiency, real-time feel, backend alignment
- ➖ Sacrifice: More complex state management (event handlers for 24 events)

**Precedent**: Modern web apps (GitHub notifications, Slack messages use SSE)

---

### Decision 4.2: Three-Tier Notification System

**Context**:
- Backend sends 24 SSE event types (not all require user attention)
- Some events are critical (combat start), others informational (chat message)
- Mobile notifications must balance urgency with user experience

**Alternatives Considered**:

1. **All Events as Toasts** (Anti-pattern)
   - Every SSE event shows a toast notification
   - Example: Overly chatty apps (user fatigue)

2. **No Notifications** (Alternative)
   - All events update UI silently (no toasts)
   - Example: Desktop apps (user monitors screen actively)

3. **Three-Tier System** (Chosen)
   - **Critical**: Full-screen overlay (combat start)
   - **Important**: Toast notification (mission complete)
   - **Informational**: Event feed only (chat message)

**Rationale**:

✅ **Three-Tier System** chosen because:
- Urgency-appropriate (combat start blocks screen, chat doesn't)
- Avoids notification fatigue (not every event is a toast)
- Mobile best practice (iOS/Android have similar notification levels)
- User control (can check event feed for informational events)

**Trade-offs**:
- ➕ Gain: User experience, urgency clarity, reduced fatigue
- ➖ Sacrifice: More decision-making (must categorize each event type)

**Precedent**: iOS/Android notification levels, Slack (urgent vs. normal messages)

---

### Decision 4.3: Status Bar Updates Without User Action

**Context**:
- Players' ship state changes constantly (fuel consumption, damage, shield regen)
- Current frontend shows state only on Dashboard (must tab switch to check)
- Real-time games must show state changes immediately

**Alternatives Considered**:

1. **Manual Refresh** (Current state)
   - Player taps Dashboard to see updated fuel/hull
   - Example: Turn-based games (state changes only on player turn)

2. **Polling** (Alternative)
   - Frontend polls `/v1/ships/{id}` every 5 seconds
   - Example: Many REST-based apps

3. **SSE-Driven Updates** (Chosen)
   - Status bar subscribes to SSE events (`game.ship.fuel`, `game.ship.hull`, etc.)
   - Updates immediately on state change (no polling)

**Rationale**:

✅ **SSE-Driven Updates** chosen because:
- Real-time awareness (player sees fuel decrease during jump)
- Efficient (backend pushes only on change, no polling waste)
- Genre alignment (space shooters show HUD updates in real-time)
- Backend contract (SSE events already defined for ship state)

**Trade-offs**:
- ➕ Gain: Real-time awareness, efficiency, genre alignment
- ➖ Sacrifice: More complex (must manage SSE connection lifecycle)

**Precedent**: Elite Dangerous (HUD updates in real-time), FTL (ship state always current)

---

## Part 5: Design Token Decisions

### Decision 5.1: Semantic Colors for Ship State

**Context**:
- Ship state (fuel, hull, shield) must be immediately readable
- Color is the fastest visual indicator (faster than reading numbers)
- Space games use color coding extensively

**Alternatives Considered**:

1. **No Color Coding** (Neutral design)
   - All stats same color (white text)
   - Example: Minimalist UIs

2. **Semantic Colors** (Chosen)
   - Hull: Red (critical) → Orange (damaged) → Green (healthy)
   - Shield: Cyan (active) → Gray (down)
   - Fuel: Orange (low) → Yellow (ok)

3. **Custom User Colors** (Alternative)
   - Players choose their own color scheme
   - Example: Accessibility-focused apps

**Rationale**:

✅ **Semantic Colors** chosen because:
- Instant recognition (red = danger, green = safe)
- Universal (color associations consistent across cultures)
- Genre expectation (all space games use red for hull damage)
- Accessibility (colors + numbers, not color-only)

**Trade-offs**:
- ➕ Gain: Speed, clarity, genre alignment
- ➖ Sacrifice: Colorblind users need text backup (mitigated by showing numbers)

**Precedent**: All space games (Elite, EVE, FTL use red for damage, green for health)

---

### Decision 5.2: 44px Minimum Touch Targets

**Context**:
- Mobile UIs require touch-friendly buttons (fat fingers)
- Current frontend has some small buttons (< 40px)
- Accessibility guidelines specify minimum sizes

**Alternatives Considered**:

1. **No Minimum** (Current state)
   - Buttons sized for visual design (some < 40px)
   - Example: Desktop-first UIs

2. **44px Minimum** (Chosen - Apple HIG)
   - All interactive elements 44x44px or larger
   - Example: iOS apps (enforced by App Store review)

3. **48dp Minimum** (Alternative - Android Material)
   - All touch targets 48x48dp (density-independent pixels)
   - Example: Android apps (Material Design guideline)

**Rationale**:

✅ **44px Minimum** chosen because:
- iOS guideline (Apple Human Interface Guidelines)
- Ergonomic (average finger pad is 40-45px)
- Accessibility (WCAG 2.1 Target Size guideline)
- Mobile-first (game is React Native, mobile-focused)

**Trade-offs**:
- ➕ Gain: Usability, accessibility, platform alignment
- ➖ Sacrifice: Larger buttons (may need to reduce button count)

**Precedent**: iOS HIG (44pt), Android Material (48dp), WCAG 2.1 (44x44px)

---

### Decision 5.3: Monospace for All Numbers (Not Just Status Bar)

**Context**:
- Numbers appear throughout UI (mission rewards, market prices, inventory counts)
- Proportional fonts cause layout shift when numbers change
- Desktop space games use monospace extensively

**Alternatives Considered**:

1. **Proportional Font Everywhere** (Standard mobile UI)
   - Roboto, Helvetica for all text (including numbers)
   - Example: Most mobile apps

2. **Monospace for All Numbers** (Chosen)
   - Status bar, mission rewards, market prices, inventory all monospace
   - Example: Terminal apps, trading platforms

3. **Tabular Numbers Only** (Alternative)
   - Use `font-variant-numeric: tabular-nums` for fixed-width digits
   - Example: Financial apps (Bloomberg, trading platforms)

**Rationale**:

✅ **Monospace for All Numbers** chosen because:
- Consistency (all numbers treated the same)
- No layout shift (market price updates don't cause reflow)
- Aesthetic (command console feel, genre alignment)
- Cross-platform (monospace fonts widely available)

**Trade-offs**:
- ➕ Gain: Stability, consistency, aesthetic
- ➖ Sacrifice: Less space-efficient (monospace is wider)

**Precedent**: Trading platforms (Bloomberg, Robinhood use monospace), space games (EVE, Elite)

---

## Part 6: Animation & Transition Decisions

### Decision 6.1: 200ms Panel Transitions (Not Instant, Not Slow)

**Context**:
- Panel open/close needs visual feedback (instant feels buggy)
- Long animations slow down gameplay (>300ms feels sluggish)
- Mobile users expect fast, responsive UI

**Alternatives Considered**:

1. **Instant (0ms)** (No animation)
   - Panel appears/disappears immediately
   - Example: Low-end devices (skip animations)

2. **200ms Transition** (Chosen)
   - Panel slides from edge in 200ms
   - Easing: ease-out (fast start, slow end)

3. **300-500ms Transition** (Slow animation)
   - Smooth, cinematic transitions
   - Example: Desktop apps (Material Design default is 300ms)

**Rationale**:

✅ **200ms Transition** chosen because:
- Mobile best practice (iOS default is 200ms, Android is 250ms)
- Fast enough (doesn't slow gameplay)
- Smooth enough (provides visual feedback, not jarring)
- Accessible (users with `prefers-reduced-motion` get instant)

**Trade-offs**:
- ➕ Gain: Responsiveness, visual feedback, platform alignment
- ➖ Sacrifice: Not instant (200ms delay vs. 0ms)

**Precedent**: iOS (200ms default), Android Material (250ms), Bootstrap (150ms)

---

### Decision 6.2: SSE Event Feedback (100ms Pulse)

**Context**:
- SSE events update UI silently (numbers change)
- Users may not notice subtle changes (fuel 850 → 849)
- Visual feedback confirms update occurred

**Alternatives Considered**:

1. **No Feedback** (Silent updates)
   - Numbers change, no visual indicator
   - Example: Desktop dashboards (user monitors actively)

2. **100ms Pulse** (Chosen)
   - Brief highlight or glow on changed element
   - Example: Trading platforms (price flash on update)

3. **Toast Notification** (Alternative)
   - Show toast for every SSE event
   - Example: Chatty apps (notification fatigue)

**Rationale**:

✅ **100ms Pulse** chosen because:
- Subtle feedback (confirms update without distraction)
- Fast (100ms doesn't interrupt gameplay)
- Scalable (works for frequent updates like fuel consumption)
- Genre alignment (cockpit displays flash on change)

❌ **Toast Notification** rejected because:
- Notification fatigue (SSE events are frequent)
- Distracting (toasts interrupt gameplay)

**Trade-offs**:
- ➕ Gain: Feedback, confirmation, genre alignment
- ➖ Sacrifice: Slightly busier UI (frequent pulses during combat)

**Precedent**: Trading platforms (Bloomberg, Robinhood flash price changes), FTL (subsystem flash on damage)

---

## Part 7: Accessibility Decisions

### Decision 7.1: 4.5:1 Contrast Ratio (WCAG AA)

**Context**:
- Status bar has semi-transparent background (80% opacity)
- Text must be readable on varied backgrounds (map, sector view)
- Accessibility guidelines specify minimum contrast

**Alternatives Considered**:

1. **No Contrast Requirement** (Visual design only)
   - Use colors that look good, ignore contrast
   - Example: Stylized UIs (may fail accessibility)

2. **4.5:1 Contrast (WCAG AA)** (Chosen)
   - All text must have 4.5:1 contrast with background
   - Example: Most modern apps (legal requirement in some regions)

3. **7:1 Contrast (WCAG AAA)** (Alternative)
   - Higher contrast for maximum accessibility
   - Example: Government websites (ADA compliance)

**Rationale**:

✅ **4.5:1 Contrast (WCAG AA)** chosen because:
- Legal compliance (WCAG AA is minimum for accessibility laws)
- Usability (low-vision users can read text)
- Balance (AAA is overly strict, may conflict with design)
- Mobile-friendly (outdoor use requires good contrast)

**Trade-offs**:
- ➕ Gain: Accessibility, legal compliance, readability
- ➖ Sacrifice: Design constraints (can't use low-contrast colors)

**Precedent**: WCAG 2.1 AA (industry standard), Apple HIG (contrast guidelines)

---

### Decision 7.2: Respect Prefers-Reduced-Motion

**Context**:
- Some users have vestibular disorders (motion sickness from animations)
- OS setting `prefers-reduced-motion` indicates user preference
- Accessibility-first design respects user preferences

**Alternatives Considered**:

1. **Ignore Reduced Motion** (Current state)
   - Animations always run
   - Example: Games (may not respect OS settings)

2. **Respect Reduced Motion** (Chosen)
   - Panel transitions: Instant (0ms) if user prefers reduced motion
   - SSE feedback: Static highlight (no pulse) if reduced motion
   - Button press: Opacity only (no scale) if reduced motion

3. **User Preference Toggle** (Alternative)
   - In-game setting to disable animations
   - Example: Some games (redundant with OS setting)

**Rationale**:

✅ **Respect Reduced Motion** chosen because:
- Accessibility (users with vestibular disorders need this)
- Platform alignment (iOS/Android provide OS setting)
- User control (respects existing preference, no in-game toggle needed)
- Easy to implement (CSS `@media (prefers-reduced-motion)`)

**Trade-offs**:
- ➕ Gain: Accessibility, platform alignment, user control
- ➖ Sacrifice: Some users see instant transitions (acceptable trade-off)

**Precedent**: WCAG 2.1 (Animation from Interactions), Apple HIG (Reduce Motion)

---

## Part 8: Responsive Design Decisions

### Decision 8.1: Mobile-First Breakpoints

**Context**:
- Game is React Native (mobile-first platform)
- Most players will use phones (not tablets or desktop)
- Responsive design must prioritize small screens

**Alternatives Considered**:

1. **Desktop-First** (Scale down to mobile)
   - Design for large screens, remove features for mobile
   - Example: Web apps (often desktop-first)

2. **Mobile-First** (Chosen)
   - Design for phones (320-480px), enhance for tablets/desktop
   - Example: Modern mobile apps

3. **Fixed Layout** (No responsiveness)
   - One layout for all screen sizes
   - Example: Simple games (may be cramped or wasteful)

**Rationale**:

✅ **Mobile-First** chosen because:
- Platform alignment (React Native is mobile-first)
- User base (most players on phones)
- Design constraint (forces prioritization of essential features)
- Progressive enhancement (add panels for tablets, not remove for mobile)

**Trade-offs**:
- ➕ Gain: Mobile optimization, design clarity, user base alignment
- ➖ Sacrifice: Tablet/desktop may feel like "scaled up mobile"

**Precedent**: React Native best practice, iOS/Android guidelines (mobile-first)

---

### Decision 8.2: Panels as Full-Screen Overlays on Mobile Portrait

**Context**:
- Mobile portrait screens are narrow (320-480px width)
- Side panels (240-320px) would obscure most of viewport
- Mobile users expect full-screen modals for complex UI

**Alternatives Considered**:

1. **Side Panels on All Screens** (Desktop pattern)
   - Chat/Inventory as side panels even on phones
   - Example: Desktop apps (may be cramped on mobile)

2. **Full-Screen Overlays on Mobile** (Chosen)
   - Panels (Chat, Inventory) open as full-screen overlays on phones
   - Side panels on tablets (768px+ width)

3. **Bottom Sheets on All Screens** (Alternative)
   - All panels as bottom sheets (slides from bottom)
   - Example: Android Material Design (bottom sheets)

**Rationale**:

✅ **Full-Screen Overlays on Mobile** chosen because:
- Screen real estate (320-480px is too narrow for side panels)
- Mobile UX patterns (full-screen modals are familiar)
- Responsive (side panels on tablets, overlays on phones)
- Usability (full-screen chat is easier to use on small screens)

**Trade-offs**:
- ➕ Gain: Mobile usability, screen real estate, familiarity
- ➖ Sacrifice: Panels obscure game on phones (acceptable, can dismiss easily)

**Precedent**: Mobile apps (chat, settings often full-screen), Android Material (sheets)

---

## Part 9: Migration Strategy Decisions

### Decision 9.1: Non-Breaking Additions First

**Context**:
- Migration requires refactoring Jump/Dock modals (breaking changes)
- Users are actively playing (can't break game during migration)
- Need phased rollout (test each change)

**Alternatives Considered**:

1. **Big Bang Migration** (All changes at once)
   - Refactor everything in one PR
   - Example: Greenfield projects (no existing users)

2. **Phased Migration** (Chosen)
   - Step 1-2: Add Status Bar, Quick Action HUD (non-breaking)
   - Step 3-4: Refactor Jump/Dock modals (breaking, test thoroughly)
   - Step 5-7: Add Chat, Mini-map, SSE migration (non-breaking)

3. **Feature Flags** (Alternative)
   - Deploy all changes behind feature flags, enable gradually
   - Example: Enterprise apps (A/B testing)

**Rationale**:

✅ **Phased Migration** chosen because:
- Risk mitigation (test each change separately)
- User impact (non-breaking first, breaking changes later)
- Development workflow (smaller PRs, easier review)
- Rollback safety (can revert one step without affecting others)

**Trade-offs**:
- ➕ Gain: Safety, testability, smaller PRs
- ➖ Sacrifice: Longer timeline (7 steps vs. 1 big PR)

**Precedent**: Continuous deployment best practice, Martin Fowler (Strangler Fig pattern)

---

### Decision 9.2: Chat Panel as P0 (Not P1)

**Context**:
- Original plan: Chat panel is P1 (after Status Bar and Jump/Dock)
- Analysis shows: No chat = 20% churn (business impact)
- Multiplayer game without chat is incomplete

**Alternatives Considered**:

1. **Chat as P2** (Low priority)
   - Implement chat after all other features
   - Example: Single-player games (chat not essential)

2. **Chat as P1** (High priority, original plan)
   - Implement chat after critical fixes (token refresh, Jump/Dock)

3. **Chat as P0** (Critical, revised)
   - Implement chat in first wave (alongside Status Bar)

**Rationale**:

✅ **Chat as P0** chosen because:
- Business impact (20% churn due to no social features)
- Backend ready (7 endpoints + 1 SSE event fully implemented)
- Genre expectation (MMO without chat is not an MMO)
- User request (likely high-demand feature)

**Trade-offs**:
- ➕ Gain: User retention, social engagement, MMO credibility
- ➖ Sacrifice: Delays other features (chat takes 3-4 days)

**Precedent**: MMO best practice (chat is table stakes), business analysis (churn data)

---

## Part 10: Trade-Offs & Constraints

### Decision 10.1: Design Tokens Over Hardcoded Colors

**Context**:
- Current frontend has some hardcoded hex colors (e.g., `#FF0000`)
- Design tokens enable consistency and theming
- React Native supports theming via context

**Alternatives Considered**:

1. **Hardcoded Colors** (Current state)
   - Colors defined inline (`color: "#FF0000"`)
   - Example: Prototypes (no theming)

2. **Design Tokens** (Chosen)
   - Colors defined in theme object (`theme.colors.hull_critical`)
   - Example: Modern apps (Material Design, iOS HIG)

3. **CSS Variables** (Alternative)
   - Colors as CSS custom properties (`--hull-critical: #FF4444`)
   - Example: Web apps (not ideal for React Native)

**Rationale**:

✅ **Design Tokens** chosen because:
- Consistency (one source of truth for colors)
- Theming (can support dark mode, custom themes)
- Maintainability (change color once, updates everywhere)
- Linting (can enforce token usage, catch hardcoded colors)

**Trade-offs**:
- ➕ Gain: Consistency, theming, maintainability
- ➖ Sacrifice: Slightly more verbose (`theme.colors.hull_critical` vs. `#FF4444`)

**Precedent**: Material Design (tokens), iOS HIG (semantic colors), Design Systems (Atlassian, Shopify)

---

### Decision 10.2: Genre Over Mobile Norms (Where Conflict)

**Context**:
- Mobile games often use page-based navigation (full-screen cards)
- Space shooters require persistent HUD (genre expectation)
- When mobile norms conflict with genre, which wins?

**Philosophy**:

✅ **Genre Over Mobile Norms** (Chosen principle)
- Space shooter genre expectations take precedence
- Mobile UX patterns used where they don't conflict with genre

**Examples**:

1. **Conflict: Navigation Pattern**
   - Mobile Norm: Page-based (full-screen cards)
   - Genre Expectation: Persistent HUD (cockpit shell)
   - **Decision**: Genre wins → Persistent HUD

2. **Conflict: Combat UI**
   - Mobile Norm: Modal dialog for combat
   - Genre Expectation: Viewport replacement (full combat screen)
   - **Decision**: Genre wins → Viewport replacement

3. **No Conflict: Tab Navigation**
   - Mobile Norm: Bottom tab bar
   - Genre: No strong opinion (desktop games use tabs)
   - **Decision**: Mobile norm → Bottom tab bar

**Rationale**:

✅ **Genre precedence** chosen because:
- User expectations (space shooter players expect cockpit HUD)
- Market differentiation (mobile MMOs are rare, genre alignment is unique)
- Immersion (genre patterns create immersion, mobile norms may break it)

**Trade-offs**:
- ➕ Gain: Genre authenticity, user expectations, immersion
- ➖ Sacrifice: May feel less "mobile-native" to casual users

**Precedent**: FTL (genre over platform norms), XCOM mobile (strategy genre over mobile norms)

---

## Part 11: Success Metrics & Validation

### Decision 11.1: Flash-Card UI Detection (Automated)

**Context**:
- Manual code review is slow and error-prone
- Flash-card UI violations can be detected programmatically
- Need automated validation for CI/CD

**Alternatives Considered**:

1. **Manual Code Review** (Current state)
   - Reviewer checks for modals in core gameplay
   - Example: Pull request reviews

2. **Automated ESLint Rule** (Chosen)
   - Lint for `Modal`, `Dialog`, `Popup` components in core routes
   - Whitelist: Login, Signup, Character Create, Ship Create
   - Example: Custom ESLint plugin

3. **Visual Regression Tests** (Alternative)
   - Screenshot tests to detect centered modals
   - Example: Percy, Chromatic

**Rationale**:

✅ **Automated ESLint Rule** chosen because:
- Fast (runs during development, before PR)
- Accurate (detects modal components in code)
- Enforceable (can block merge if violations found)
- Low overhead (no screenshots, no manual review)

**Trade-offs**:
- ➕ Gain: Speed, accuracy, enforcement
- ➖ Sacrifice: Custom ESLint rule (initial effort to implement)

**Precedent**: ESLint best practice (custom rules), Airbnb style guide (enforced via lint)

---

### Decision 11.2: SSE Event Coverage Validation

**Context**:
- Backend sends 24 SSE events (contract defined)
- Frontend must handle all events (missing handler = lost data)
- Need automated validation for event coverage

**Alternatives Considered**:

1. **Manual Audit** (Current state)
   - Developer checks event handlers manually
   - Example: Code review

2. **TypeScript Type Safety** (Chosen)
   - Define SSE event types, compiler enforces all handled
   - Example: Union types + exhaustiveness checking

3. **Runtime Test** (Alternative)
   - Integration test fires all 24 events, verifies handlers
   - Example: Jest test suite

**Rationale**:

✅ **TypeScript Type Safety** chosen because:
- Compile-time (catches missing handlers before runtime)
- Exhaustive (TypeScript ensures all event types handled)
- No test maintenance (type system enforces coverage)

**Trade-offs**:
- ➕ Gain: Compile-time safety, exhaustiveness, no test overhead
- ➖ Sacrifice: TypeScript complexity (union types, discriminated unions)

**Precedent**: TypeScript best practice (exhaustiveness checking), Redux (action type unions)

---

## Part 12: Lessons Learned & Rationale Summary

### Key Insight 1: Mobile Genre Games Need Genre-First Design

**Lesson**: Mobile UX patterns (page-based nav, flash-card UI) are optimized for casual games (turn-based, social, puzzle). Space shooter RPGs require real-time awareness and spatial context, which conflicts with page-based UX.

**Decision**: Prioritize genre expectations (persistent HUD, inline panels) over mobile norms (full-screen cards, modal dialogs).

**Result**: Cockpit shell architecture with HUD + panels, not page-based navigation.

---

### Key Insight 2: Real-Time Feel Requires SSE, Not Polling

**Lesson**: Polling creates 5-10 second delays (fuel 850 → poll → 849), which breaks immersion. SSE provides instant updates (fuel 850 → SSE event → 849), creating real-time feel.

**Decision**: Use SSE for all state updates, eliminate polling.

**Result**: Status bar updates immediately on fuel/hull/shield changes, enhancing real-time feel.

---

### Key Insight 3: Chat is Table Stakes for MMOs

**Lesson**: Multiplayer game without chat loses 20% of users to churn (business analysis). Chat is not a "nice-to-have" feature, it's essential for social engagement and retention.

**Decision**: Elevate chat from P1 to P0 (critical priority).

**Result**: Chat panel implementation moved to first wave of development.

---

### Key Insight 4: Accessibility Constraints Improve Design

**Lesson**: 44px touch targets force prioritization (can't fit 10 buttons). 4.5:1 contrast requires intentional color choices (no arbitrary hex codes). Accessibility constraints improve usability for all users.

**Decision**: Enforce accessibility guidelines (44px targets, 4.5:1 contrast, reduced motion).

**Result**: More usable UI for all users, not just accessibility edge cases.

---

## Appendix A: Decision Timeline

| Date | Decision | Category | Impact |
|------|----------|----------|--------|
| 2025-12-27 | Persistent Cockpit Shell | Architecture | High (entire UI paradigm) |
| 2025-12-27 | Flash-Card UI Prohibited | Pattern | High (refactor Jump/Dock) |
| 2025-12-27 | Bottom Tab Bar | Navigation | Medium (existing pattern) |
| 2025-12-27 | Status Bar Always Visible | HUD | High (new component) |
| 2025-12-27 | Monospace Font for Status Bar | Typography | Low (aesthetic) |
| 2025-12-27 | Mini-Map Static | HUD | Medium (new component) |
| 2025-12-27 | Quick Action HUD Floating | HUD | Medium (new component) |
| 2025-12-27 | Chat as Side Panel | Panels | High (new feature) |
| 2025-12-27 | Jump/Dock as Inline Panels | Panels | High (refactor existing) |
| 2025-12-27 | Combat as Viewport Replacement | Panels | Low (existing pattern) |
| 2025-12-27 | SSE for All Updates | Real-Time | High (backend integration) |
| 2025-12-27 | Three-Tier Notifications | Real-Time | Medium (UX pattern) |
| 2025-12-27 | Semantic Colors | Design Tokens | Low (aesthetic) |
| 2025-12-27 | 44px Touch Targets | Accessibility | Medium (button sizing) |
| 2025-12-27 | 4.5:1 Contrast Ratio | Accessibility | Low (color constraints) |
| 2025-12-27 | Respect Reduced Motion | Accessibility | Low (animation toggle) |
| 2025-12-27 | 200ms Panel Transitions | Animation | Low (timing) |
| 2025-12-27 | 100ms SSE Feedback | Animation | Low (visual feedback) |
| 2025-12-27 | Mobile-First Breakpoints | Responsive | Medium (layout strategy) |
| 2025-12-27 | Panels as Overlays on Mobile | Responsive | Medium (mobile UX) |
| 2025-12-27 | Design Tokens Over Hardcoded | Theming | Medium (maintainability) |
| 2025-12-27 | Genre Over Mobile Norms | Philosophy | High (overall approach) |
| 2025-12-27 | Phased Migration | Implementation | High (rollout strategy) |
| 2025-12-27 | Chat as P0 | Prioritization | High (roadmap impact) |

---

## Appendix B: Rejected Alternatives

| Alternative | Reason Rejected |
|-------------|-----------------|
| Page-Based Navigation | Breaks spatial context, inappropriate for real-time genre |
| Full-Screen Modals for Jump/Dock | Flash-card UI violation, obscures map |
| No Status Bar | Players need persistent awareness of critical stats |
| Proportional Font for Numbers | Causes layout shift when numbers update |
| Interactive Mini-Map | Too small for precise touch interaction (100-150px) |
| Fixed Action Bar | Less space-efficient than floating HUD |
| Full-Screen Chat | Obscures game, players can't multitask |
| Polling Instead of SSE | Inefficient, delayed updates, no real-time feel |
| All Events as Toasts | Notification fatigue, too chatty |
| WebSockets | Backend uses SSE, one-way sufficient, simpler |
| No Color Coding | Slower recognition, misses genre expectation |
| No Touch Target Minimum | Poor usability, fails accessibility |
| Ignore Reduced Motion | Poor accessibility, vestibular disorder exclusion |
| Desktop-First Design | Wrong platform (React Native is mobile-first) |
| Big Bang Migration | High risk, can't rollback granularly |

---

## Appendix C: Open Questions & Future Decisions

### Question 1: Should Combat Use Bottom Panel Instead of Viewport Replacement?

**Context**: Combat currently replaces viewport entirely. Could use bottom panel to keep map visible.

**Consideration**: Turn-based combat requires focus (viewport replacement is correct), but future real-time combat may benefit from keeping map visible.

**Decision**: Defer until real-time combat is implemented (if ever).

---

### Question 2: Should Status Bar Show Mission Objectives (Not Just Count)?

**Context**: Status bar shows mission count (3 active), but not current objective.

**Consideration**: Showing objective text in status bar may be too verbose (mobile screen width). Bottom panel may be better.

**Decision**: Defer to implementation phase (try status bar, fallback to panel if too cramped).

---

### Question 3: Should Mini-Map Support Pinch-to-Zoom?

**Context**: Mini-map is fixed size, no zoom. Some users may want to zoom in.

**Consideration**: Pinch-to-zoom conflicts with "tap to expand" interaction. May confuse users.

**Decision**: Defer until user feedback (if users request zoom, reconsider).

---

### Question 4: Should Chat Support Voice Messages?

**Context**: Chat is text-only. Voice messages are common in mobile apps.

**Consideration**: Backend doesn't support voice (would require new endpoints). Not a priority for MVP.

**Decision**: Defer to post-MVP (if user demand is high).

---

## Appendix D: Stakeholder Sign-Off

**Required Approvals**:
- [ ] Product Manager (Business impact, prioritization)
- [ ] Lead UX Designer (Design consistency, accessibility)
- [ ] Lead Frontend Developer (Technical feasibility, implementation)
- [ ] QA Lead (Agent C validation, regression tests)

**Sign-Off Date**: TBD

---

**End of B2 - UX Decision Log**

**Next Steps**:
1. Stakeholder review and sign-off (B1 + B2 deliverables)
2. Begin Agent A Implementation Pass (prioritize P0 fixes)
3. Agent C QA validation (contract & UX enforcement)
