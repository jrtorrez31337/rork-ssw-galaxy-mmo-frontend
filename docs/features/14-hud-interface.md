# HUD & Interface

## Overview

The user interface follows an LCARS-inspired design language with a persistent cockpit shell, rail navigation, and context-sensitive panels. The HUD provides real-time information about ship status, navigation, and alerts.

## Architecture

### Cockpit Shell
The persistent container that wraps all game screens:

- **HeaderBar**: Top bar with ship status, location, credits
- **LeftRail**: Navigation rail with mode tabs
- **ContentArea**: Main screen content
- **RightPanels**: Context-sensitive panels
- **AlertOverlay**: Priority notifications

### Rail Navigation

| Rail | Mode | Purpose |
|------|------|---------|
| NAV | Navigation | Sector map, travel |
| OPS | Operations | Missions, mining, trading |
| TAC | Tactical | Combat, targeting |
| ENG | Engineering | Ship systems, power |
| COM | Communications | Chat, crew |
| FLT | Flight | Flight controls |

## Source Files

| File | Purpose |
|------|---------|
| `stores/cockpitStore.ts` | Shell state |
| `components/shell/CockpitShell.tsx` | Main container |
| `components/shell/HeaderBar.tsx` | Top bar |
| `components/shell/LeftRail.tsx` | Navigation rail |
| `components/shell/CommandBar.tsx` | Command palette |
| `components/shell/AlertOverlay.tsx` | Alerts |

## Cockpit Store

```typescript
interface CockpitState {
  activeRail: RailMode;
  panelStack: string[];
  alertQueue: Alert[];
  viewportMode: '2d' | '3d' | 'map';
  commandBarOpen: boolean;
}
```

## Panels

Right-side contextual panels:

| Panel | Content |
|-------|---------|
| NavigationPanel | Jump/travel controls |
| OperationsPanel | Missions, mining, trading |
| TacticalPanel | Combat targeting |
| EngineeringPanel | Ship systems, power |
| FleetPanel | Ship selection |
| CommsPanel | Communication |
| FlightPanel | Flight settings |
| ShipSelectionPanel | Switch ships |
| ContextualPanel | Context info |

## HUD Elements

### StatusBar
- Hull percentage
- Shield percentage
- Fuel percentage
- Credits display

### ConnectionStatus
- SSE connection indicator
- Online/offline state

### ViewModeSelector
- 2D view
- 3D view
- Map view

### QuickActionHUD
- Quick action buttons
- Context-sensitive

## AlertOverlay

Priority-based alert system:

| Priority | Style | Duration |
|----------|-------|----------|
| Critical | Red, persistent | Until dismissed |
| Warning | Yellow | 10 seconds |
| Info | Blue | 5 seconds |
| Success | Green | 3 seconds |

## Command Bar

Command palette for quick actions:

- Keyboard shortcut to open
- Search/filter commands
- Recent commands
- Category organization

## Design Tokens

The UI uses a consistent token system:

```typescript
const tokens = {
  colors: {
    lcars: {
      orange: '#ff9900',
      blue: '#9999ff',
      purple: '#cc99ff',
      // ...
    },
    background: { ... },
    text: { ... },
    semantic: { ... },
    alert: { ... },
  },
  typography: {
    fontFamily: {
      mono: 'monospace',
      // ...
    },
  },
};
```

## Integration Points

- **All Features**: UI wraps all gameplay
- **State Management**: Reflects current game state
- **Real-Time**: Updates from SSE events
- **Navigation**: Rail changes context
