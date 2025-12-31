# SSW Galaxy MMO Frontend - Feature Analysis

This document provides a descriptive analysis of the frontend codebase, organized by feature sets.

## Feature Sets Overview

| # | Feature Set | Description | Details |
|---|-------------|-------------|---------|
| 1 | [Authentication & Identity](./01-authentication.md) | User registration, login, session management | JWT tokens, auto-refresh, account lifecycle |
| 2 | [Character & Profile](./02-character-profile.md) | Character creation and management | Attributes, factions, home sectors |
| 3 | [Ship Management](./03-ship-management.md) | Ship creation, customization, systems | 3D visualization, stats, repairs |
| 4 | [Navigation & Flight](./04-navigation-flight.md) | Movement and travel systems | Hyperspace, sublight, docking, flight controls |
| 5 | [Combat](./05-combat.md) | Battle mechanics and UI | Real-time combat, targeting, loot |
| 6 | [Trading & Economy](./06-trading-economy.md) | Market and commerce systems | Orders, orderbook, commodities |
| 7 | [Mining](./07-mining.md) | Resource extraction | Nodes, extraction, cargo |
| 8 | [Missions](./08-missions.md) | Quest and objective system | Available, active, completed missions |
| 9 | [Chat & Social](./09-chat-social.md) | Communication systems | Rooms, DMs, real-time messaging |
| 10 | [Factions & Reputation](./10-factions-reputation.md) | Political and standing systems | Faction relations, territory, tiers |
| 11 | [Scanning & Targeting](./11-scanning-targeting.md) | Detection and sensor systems | Passive/active scans, radar, contacts |
| 12 | [Station Services](./12-station-services.md) | Docked station functionality | Refuel, repair, pricing |
| 13 | [Sector & World Simulation](./13-sector-world.md) | Procedural world and entities | Generation, NPCs, real-time updates |
| 14 | [HUD & Interface](./14-hud-interface.md) | User interface systems | LCARS shell, panels, alerts |
| 15 | [Inventory & Cargo](./15-inventory-cargo.md) | Item and resource management | Containers, transfers, capacity |
| 16 | [Respawn System](./16-respawn.md) | Death and recovery mechanics | Respawn locations, stat reset |

---

## Architectural Patterns

### State Management
- **Zustand stores** - Game state (flight, position, combat, missions, etc.)
- **React Query** - Server data caching and synchronization
- **Context API** - Authentication and SSE event distribution

### Real-Time Communication
- **Server-Sent Events (SSE)** - Live updates from server
- Automatic reconnection with exponential backoff
- Channel-based subscriptions (sectors, combats, markets, chat)

### UI Architecture
- Tab-based navigation for main screens
- Persistent cockpit shell with state-managed panels
- LCARS-inspired design language
- Error boundaries for crash prevention

### API Architecture
- Centralized API client with token refresh
- Feature-specific API modules
- Type-safe request/response handling
- Comprehensive error handling

---

## Directory Structure

```
api/           - API client modules per feature
app/           - Screen routes and layouts
components/    - UI components organized by feature
contexts/      - React contexts (Auth, SSE)
hooks/         - Custom hooks for feature logic
stores/        - Zustand state stores
types/         - TypeScript type definitions
ui/            - Design system tokens and primitives
```

---

## Technology Stack

- **Framework**: Expo / React Native
- **Language**: TypeScript
- **State**: Zustand, React Query
- **3D Graphics**: React Three Fiber, Three.js
- **Styling**: React Native StyleSheet
- **Real-time**: Server-Sent Events (SSE)
