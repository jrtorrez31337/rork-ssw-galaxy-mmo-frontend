# Combat

## Overview

The combat system handles real-time battles between players and NPCs. Combat is turn-based with server-authoritative logic, using SSE events for real-time updates.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/combat/initiate` | Start combat with target |
| GET | `/combat/{id}` | Get combat instance state |
| POST | `/combat/{id}/flee` | Attempt to flee combat |

## Data Types

### InitiateCombatRequest
```typescript
interface InitiateCombatRequest {
  player_id: string;
  ship_id: string;
  target_entity_id: string;
}
```

### CombatInstance
```typescript
interface CombatInstance {
  id: string;
  participants: CombatParticipant[];
  turn_count: number;
  status: 'active' | 'completed';
  winner_id?: string;
}
```

### CombatParticipant
```typescript
interface CombatParticipant {
  entity_id: string;
  entity_type: 'player' | 'npc';
  ship_id: string;
  hull: number;
  hull_max: number;
  shields: number;
  shields_max: number;
  is_player: boolean;
}
```

## Source Files

| File | Purpose |
|------|---------|
| `api/combat.ts` | API client methods |
| `stores/combatStore.ts` | Combat state management |
| `stores/targetStore.ts` | Target selection state |
| `stores/combatReadinessStore.ts` | Weapon/shield readiness |
| `hooks/useCombatEvents.ts` | SSE event handlers |
| `components/hud/CombatHUD.tsx` | Combat display UI |
| `components/combat/CombatResults.tsx` | Victory/defeat screen |
| `components/combat/ParticipantCard.tsx` | Combatant status |
| `components/hud/ThreatIndicator.tsx` | Threat level display |

## Combat Flow

1. **Initiation**
   - Player targets an entity
   - Combat initiated via API
   - Server creates combat instance
   - Both participants enter combat mode

2. **Combat Loop**
   - Server runs combat ticks
   - Damage calculated based on weapons/shields
   - SSE events broadcast state updates
   - UI updates in real-time

3. **Resolution**
   - Combat ends when one party is destroyed or flees
   - Winner receives loot
   - Loser's ship may be destroyed (triggers respawn)

## Real-Time Events

Combat events received via SSE:

| Event | Description |
|-------|-------------|
| `combat_start` | Combat instance created |
| `combat_tick` | Turn completed, damage applied |
| `combat_end` | Combat resolved, winner determined |
| `loot_received` | Loot distributed to winner |

## Combat Readiness Store

The `useCombatReadinessStore` tracks combat preparedness:

```typescript
interface CombatReadiness {
  weaponCharge: number;      // 0-100
  shieldStrength: number;    // 0-100
  evasionRating: number;     // 0-100
  isReady: boolean;
}
```

## Target Store

The `useTargetStore` manages targeting:

```typescript
interface TargetState {
  selectedTarget: Entity | null;
  lockedTarget: Entity | null;
  contacts: Contact[];
  threatLevel: 'none' | 'low' | 'medium' | 'high';
}
```

## Components

### CombatHUD
- Displays during active combat
- Shows participant health bars
- Turn counter
- Action buttons

### CombatResults
- Victory or defeat screen
- Loot summary
- Return to normal gameplay

### ParticipantCard
- Individual combatant display
- Hull/shield bars
- Ship type and name

### ThreatIndicator
- Visual threat level (color-coded)
- Based on nearby hostile entities

## Integration Points

- **Ship Systems**: Damage affects hull/shields
- **Navigation**: Cannot travel during combat
- **Stations**: Cannot dock during combat
- **Loot System**: Rewards on victory
- **Respawn System**: Triggered on destruction
