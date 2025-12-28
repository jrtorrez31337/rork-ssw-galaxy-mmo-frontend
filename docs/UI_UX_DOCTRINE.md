# UI/UX DOCTRINE: LCARS AUTHORITY

**Classification:** Interface Law
**Version:** 1.0
**Status:** Canonical

---

## 1. UI/UX PHILOSOPHY & DOCTRINE

### Core Principles

**1. The Interface Is the Ship**

The UI is not a menu system overlaid on a game. The UI *is* the ship. When players interact with buttons, panels, and readouts, they are operating bridge consoles—not navigating software. Every tap is a command issued. Every readout is a live system feed.

**2. Information Hierarchy Is Safety**

In spacecraft operations, wrong information kills. The interface must present data in strict priority order: threats first, status second, options third. The eye must never hunt for critical data.

**3. Calm Authority Under Pressure**

LCARS was designed for professionals who remain calm in crisis. The interface must never panic. During combat or emergency, the UI becomes *more* organized, not less. Chaos in the game world; order on the bridge.

**4. Persistent Context, Not Persistent Menus**

The player must always know: Where am I? What is my ship's status? What requires attention? These questions are answered by glancing, not navigating.

**5. Touch Is Command**

Every interaction is an order given to the ship's computer. Interactions must feel deliberate and consequential. No accidental commands. No ambiguous states.

**6. Density Without Clutter**

LCARS displays enormous data density while maintaining readability. This is achieved through strict zonation, typographic hierarchy, and color-as-data. Empty space is not wasted—it is buffer between systems.

**7. The Bridge Never Closes**

There is no "main menu" that takes the player off the bridge. Settings, comms, logs—all accessed from bridge stations. The cockpit shell is permanent.

**8. Color Is Functional, Not Decorative**

Every color has meaning. Deviation from color doctrine creates confusion. Aesthetic preferences do not override functional requirements.

---

### LCARS Adaptations for Modern MMO Use

| Classic LCARS | Our Adaptation | Rationale |
|---------------|----------------|-----------|
| 4:3 aspect ratio layouts | Fluid responsive zones | Mobile and web require variable aspect ratios |
| Mouse/PADD interaction | Touch-first with pointer support | Mobile is primary platform |
| Single-user terminal | Multi-stream live data (SSE) | MMO requires real-time feeds from server |
| Static labels | Dynamic contextual labels | Deep systems require labels that reflect current state |
| Fixed button sizes | Minimum 44pt touch targets | Mobile ergonomics require larger interactive zones |
| Horizontal pill buttons | Vertical stacked commands in rails | Portrait mobile orientation demands vertical flow |

---

### LCARS Rules We Are Breaking (And Why)

**Rounded Rectangle Orthodoxy**

Classic LCARS uses exclusively rounded rectangles with specific corner radii. We permit sharp corners on nested elements to create visual hierarchy depth. The outermost frame maintains rounded doctrine.

**Horizontal Dominance**

LCARS favors horizontal layouts designed for landscape bridge displays. We invert this for portrait mobile: vertical rails become primary, horizontal bars secondary. Landscape web views restore horizontal primacy.

**Monochrome Sectors**

Classic LCARS often uses single-color zones. We permit gradient-within-zone for depth perception on small screens, maintaining single hue families.

**Static Grid**

LCARS uses fixed grid positions. We permit animated transitions when context changes—but animations must be functional (showing relationship between states), never decorative.

---

## 2. PERSISTENT COCKPIT LAYOUT SPECIFICATION

### The Bridge Shell

The bridge shell is the permanent frame that contains all game interaction. It is never dismissed, replaced, or hidden. All content exists within this shell.

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR (Status Rail)                                   │
├────────┬────────────────────────────────────────────────────┤
│        │                                                    │
│  LEFT  │                                                    │
│  RAIL  │              PRIMARY VIEWPORT                      │
│        │                                                    │
│        │                                                    │
├────────┼────────────────────────────────────────────────────┤
│        │           CONTEXTUAL PANEL ZONE                    │
├────────┴────────────────────────────────────────────────────┤
│  COMMAND BAR (Action Rail)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### Named Layout Zones

#### HEADER BAR (Status Rail)
**Purpose:** Ship vital signs and universal alerts
**Persistence:** ALWAYS VISIBLE
**Height:** 48-56pt fixed

Contains:
- Ship name/class identifier (left)
- Hull integrity percentage
- Shield status (when applicable)
- Power/fuel indicator
- Current location (sector:coordinates)
- Alert status indicator (right)

**Behavior:** Information only. No interactive elements except alert acknowledgment. During red alert, entire bar pulses with reduced opacity red overlay.

---

#### LEFT RAIL (Systems Rail)
**Purpose:** Primary system access and mode switching
**Persistence:** ALWAYS VISIBLE
**Width:** 64-80pt fixed

Contains (top to bottom):
- NAV (Navigation/Movement)
- OPS (Operations: mining, trading, missions)
- TAC (Tactical: combat, targeting, weapons)
- ENG (Engineering: ship systems, repairs)
- COM (Communications: chat, hails, faction)

**Behavior:** Single-tap selects system and populates Contextual Panel. Active system indicated by full-brightness color; inactive systems at 60% opacity. During combat, TAC pulses. During travel, NAV pulses.

---

#### PRIMARY VIEWPORT
**Purpose:** Main spatial/contextual display
**Persistence:** ALWAYS VISIBLE (contents change)
**Size:** Fills available space

Contains (context-dependent):
- Sector 2D view (default when in space)
- Station interior schematic (when docked)
- System map (when in NAV + zoomed out)
- Target detail (when in TAC + target locked)

**Behavior:** This is the "window into space." It always shows where you are and what's around you. Tap interactions within viewport are context-sensitive (tap ship = target, tap station = approach, tap empty = deselect).

---

#### CONTEXTUAL PANEL ZONE
**Purpose:** Detail panels for selected system
**Persistence:** CONDITIONAL (appears when system selected)
**Height:** 40-60% of viewport height, slides up from bottom

Contains (system-dependent):
- NAV: Destination selector, route planner, fuel calculator
- OPS: Mission list, mining controls, market interface
- TAC: Weapons loadout, target status, engagement options
- ENG: System status, repair queue, module management
- COM: Chat channels, faction standings, message history

**Behavior:** Bottom sheet pattern. Swipe down to minimize to "peek" state (shows header only). Swipe up to expand. System rail selection changes content. During combat, auto-minimizes to peek to preserve viewport space.

---

#### COMMAND BAR (Action Rail)
**Purpose:** Context-sensitive primary actions
**Persistence:** ALWAYS VISIBLE
**Height:** 56-64pt fixed

Contains:
- Primary action button (context-sensitive, right side)
- Secondary actions (up to 2, left of primary)
- Quick-info ticker (left side, scrolling updates)

**Behavior:** Primary action is always the most likely next command:
- In space: "ENGAGE" (travel to selected), "DOCK" (if at station), "FIRE" (if in combat)
- Docked: "UNDOCK", "TRADE", "REPAIR"
- In transit: "DROP OUT" (emergency stop)

Button label changes. Button color indicates action category (blue=navigation, orange=combat, gold=economic).

---

### What Never Disappears

| Element | Rationale |
|---------|-----------|
| Header Bar | Life support. You must always know if you're dying. |
| Left Rail | Orientation. You must always know how to switch modes. |
| Primary Viewport | Situational awareness. You must always see space. |
| Command Bar | Agency. You must always be able to act. |

---

### What Is Contextual

| Element | Appears When |
|---------|--------------|
| Contextual Panel | System selected from rail |
| Targeting Overlay | TAC mode active + target selected |
| Trade Interface | OPS mode + docked + market selected |
| Alert Modal | Red/Yellow alert triggered |
| Comms Popup | Incoming hail or priority message |

---

### Alert Escalation Behavior

**GREEN (Normal Operations)**
- Full color palette active
- All systems accessible
- Standard panel behaviors

**YELLOW (Caution)**
- Header bar shows yellow alert indicator
- Non-essential panels auto-minimize
- TAC rail icon pulses
- Viewport gains subtle yellow vignette

**RED (Combat/Emergency)**
- Header bar pulses red at 0.5Hz
- Contextual panel force-minimizes to peek
- TAC mode auto-activates
- Viewport gains red vignette
- Non-combat rail options dim to 40% opacity
- Command bar shows combat actions only
- Audio: klaxon (user-configurable)

**Alert Cascade Rule:** Higher alerts always override lower. Player cannot manually dismiss red alert while threat persists.

---

## 3. INTERACTION MODEL

### Navigation Philosophy: Lateral, Not Deep

Players navigate *across* systems, not *down* into menus. The Left Rail provides lateral movement between peer systems. Within each system, information unfolds in the Contextual Panel through progressive disclosure—not through navigation to new screens.

```
WRONG: Home → Ships → My Ship → Systems → Weapons → Equip
RIGHT: [TAC selected] → Weapons panel visible → Tap slot → Options appear inline
```

Maximum interaction depth: **3 taps** from any state to any function.

---

### Information Layering

**Layer 1: Glance (0 taps)**
Header bar + Viewport. Immediate survival information. Can be absorbed while in combat.

**Layer 2: Focus (1 tap)**
Contextual Panel header. System selected, summary visible. What are my options?

**Layer 3: Detail (2 taps)**
Contextual Panel expanded. Full data tables, selectable lists, configuration options.

**Layer 4: Action (3 taps maximum)**
Execute command. Confirm if destructive/expensive. Never more than 3 taps.

---

### Interaction Patterns

**The Tap**
Single tap selects. Selection populates detail panels. Selection is non-destructive and always reversible.

**The Hold**
Long-press (300ms) reveals tooltip/detail popup. Release dismisses. No state change occurs. This is the "what is this?" gesture.

**The Swipe**
Vertical swipe on Contextual Panel controls expand/collapse. Horizontal swipe on lists reveals inline actions (delete, favorite, etc.). Swipe is never required—always has tap alternative for accessibility.

**The Drag**
Reserved for spatial interactions in viewport only (panning sector view, drawing routes). Never used in panels or menus.

**The Double-Tap**
Execute default action on selected item. Tap ship + double-tap = approach. Tap weapon + double-tap = fire. This is the "do the obvious thing" gesture.

---

### Interruption Handling

Interruptions are events that demand attention regardless of current activity.

**Priority 1 — Threat (Combat Initiation)**
- Full interrupt
- Red alert cascade
- Auto-switch to TAC
- Modal blocked until threat addressed or escaped

**Priority 2 — Navigation Event (Arrival, Collision Warning)**
- Toast notification in viewport
- Header bar updates
- No mode switch
- Player acknowledges or ignores

**Priority 3 — Communication (Incoming Hail, Chat)**
- Badge on COM rail icon
- Optional audio ping
- No visual interrupt
- Player retrieves at leisure

**Priority 4 — Information (Mission update, Market change)**
- Ticker update in Command Bar
- Log entry created
- No notification
- Discoverable through OPS

**Interrupt Rule:** Never stack modals. If Priority 1 event occurs during Priority 2 notification, Priority 1 replaces it. Queue is: display highest priority, log all others.

---

### Confirmation Protocol

Actions are categorized by consequence:

**No Confirmation**
- Selecting targets
- Opening panels
- Viewing information
- Non-destructive navigation

**Soft Confirmation (Double-tap or hold-release)**
- Initiating travel (costs fuel)
- Undocking
- Starting mining operation

**Hard Confirmation (Explicit confirm button)**
- Selling items
- Purchasing items
- Accepting missions
- Jettisoning cargo
- Self-destruct

**Confirmation UI:** Inline expansion, not modal. Action button transforms to show confirm/cancel. One-tap cancel always available.

---

## 4. UX ANTI-PATTERNS (EXPLICIT)

### What Must Never Exist In This UI

**Full-Screen Modals for Routine Actions**
Modals sever bridge context. Only life-threatening alerts warrant full-screen takeover. Trading, inventory, missions—all happen in panels, never modals.

**Back Buttons**
If a back button is needed, the navigation structure has failed. Lateral movement via rail, vertical collapse via swipe. "Back" implies depth; we have breadth.

**Hidden Hamburger Menus**
The three-line menu icon hides navigation. In a spacecraft, hidden controls kill. All primary navigation is always visible in the Left Rail.

**Scrolling Navigation**
If system access requires scrolling through a nav list, the list is too long. Five systems maximum. Subsystems unfold within, not alongside.

**Pagination**
Page 1 of 47 is information architecture failure. Filter, search, or summarize. Players should not manually traverse pages in combat situations.

**Nested Dropdowns**
Dropdown → Dropdown → Dropdown creates targeting difficulty on mobile and cognitive load everywhere. Maximum one dropdown level, prefer inline expansion.

**Toast Stacking**
Multiple notifications stacking vertically creates visual noise and obscures viewport. One active notification maximum. Queue the rest.

**Pixel-Hunt Interactions**
Anything smaller than 44x44pt is untappable on mobile. Anything without visible affordance is undiscoverable. No hidden buttons, no mystery interactions.

**Loading Screens That Remove Context**
"Loading..." screens that blank the bridge break presence. Viewport shows loading state in-world (static, sensor sweep animation). Shell remains.

**Logout as Primary Action**
Logout should require deliberate navigation to settings. It is never in the rail. Accidental logout during combat is unacceptable.

---

### Common MMO UX Mistakes to Avoid

**The Minimap Crutch**
Do not create a minimap that becomes the only way to understand space. The Primary Viewport IS the spatial interface. Minimaps, if they exist, are supplementary and toggle-able—never mandatory.

**The Hotbar Sprawl**
Do not add action buttons until the screen is full of tiny icons. The Command Bar has three slots maximum. Complexity lives in panels, not button proliferation.

**The Inventory Tetris Game**
Do not make inventory management into a spatial puzzle. Lists with filters. Quick stack. Quick sell. Inventory is logistics, not gameplay.

**The Currency Ticker Parade**
Do not display seven different currency types at all times. Show relevant currency in context. Trading shows credits. Reputation shows faction standing. Not everything at once.

**The Notification Fatigue Engine**
Do not notify players of everything. Unread badge counts into the hundreds teach players to ignore notifications. Notify threats and opportunities. Log everything else.

**The Tooltip Dependency**
Do not hide critical information behind hover states. Mobile has no hover. All essential information is visible; tooltips provide nice-to-know enhancement only.

**The "Click Here to Continue" Trap**
Do not require confirmation clicks for non-interactive information. "Your ship has arrived. [OK]" is unnecessary. Your ship arrived. The viewport shows it. Move on.

**The Settings Labyrinth**
Do not create settings menus with dozens of options across multiple tabs. Curate settings ruthlessly. Good defaults eliminate most settings need.

---

## 5. UX DOCTRINE SUMMARY

### For Downstream Agents

This section is explicitly labeled for handoff to implementation agents.

---

#### Doctrine Imperatives

1. **The bridge shell (Header Bar, Left Rail, Primary Viewport, Command Bar) is immutable.** No design may remove, hide, or significantly alter these elements.

2. **Maximum interaction depth is 3 taps.** Any feature requiring more than 3 taps from neutral state must be redesigned.

3. **Color is semantic, not aesthetic.** Blue=navigation, orange=combat/threat, gold=economy/value, red=alert/danger, green=health/positive. These mappings are inviolable.

4. **Touch targets minimum 44x44pt.** No exceptions for mobile. Desktop may have smaller targets if pointer-only.

5. **Panels, not pages.** New features add panels to the Contextual Panel zone. They do not create new screens.

6. **Alerts escalate, not accumulate.** One notification at a time. Higher priority replaces lower. All logged for later review.

7. **The viewport is sacred.** Never fully obscure the Primary Viewport. Panels slide over partially, never completely. The player must always see space.

8. **Confirmation scales with consequence.** No-confirm for reads, soft-confirm for minor costs, hard-confirm for significant transactions.

9. **No hidden navigation.** All primary systems visible in Left Rail at all times. No hamburger menus, no swipe-to-reveal navigation.

10. **State is glanceable.** A player waking from sleep should understand ship status within 2 seconds of looking at the screen.

---

#### Zone Specifications Quick Reference

| Zone | Persistence | Height/Width | Primary Function |
|------|-------------|--------------|------------------|
| Header Bar | Always | 48-56pt H | Vitals + Alerts |
| Left Rail | Always | 64-80pt W | System Selection |
| Primary Viewport | Always | Fluid | Spatial Awareness |
| Contextual Panel | On Selection | 40-60% H | System Details |
| Command Bar | Always | 56-64pt H | Primary Actions |

---

#### Color Doctrine Quick Reference

| Color | LCARS Name | Usage |
|-------|-----------|-------|
| #9999FF | Periwinkle | Navigation, travel, movement |
| #FF9900 | Tangerine | Combat, weapons, tactical alerts |
| #FFCC00 | Gold | Economy, trade, value, currency |
| #CC99CC | Lavender | Communications, social, faction |
| #99CCFF | Sky | Information, passive, neutral |
| #FF5555 | Alert Red | Danger, damage, critical |
| #55FF55 | Alert Green | Health, positive, success |
| #333344 | Background | Panel backgrounds, depth |
| #1A1A2E | Deep Space | Viewport background |

---

#### Implementation Checkpoints

Before any UI component is approved:

- [ ] Does it require more than 3 taps? **REJECT**
- [ ] Does it obscure the viewport completely? **REJECT**
- [ ] Does it use non-doctrine colors for semantic purposes? **REJECT**
- [ ] Does it create a new "screen" instead of a panel? **REJECT**
- [ ] Does it add navigation that isn't in the Left Rail? **REJECT**
- [ ] Does it show more than one notification simultaneously? **REJECT**
- [ ] Does it have touch targets under 44pt? **REJECT**
- [ ] Does it require hover to understand? **REJECT**

---

#### Glossary for Implementation

| Term | Definition |
|------|------------|
| Bridge Shell | The permanent UI frame containing all four persistent zones |
| Rail | Vertical strip of navigation buttons (Left Rail, Status Rail, Action Rail) |
| Panel | Slide-up container for system-specific content |
| Viewport | The spatial display showing game world |
| Peek State | Panel minimized to show only its header |
| Expanded State | Panel showing full content |
| Alert Cascade | Automatic UI changes during yellow/red alert |
| Lateral Navigation | Moving between peer systems via rail |
| Progressive Disclosure | Revealing detail through expansion, not navigation |

---

**END OF DOCTRINE**

*This document is authoritative. Deviations require explicit doctrine amendment.*
