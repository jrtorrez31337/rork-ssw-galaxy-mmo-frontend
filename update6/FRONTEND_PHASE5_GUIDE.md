# Frontend Implementation Guide: Phase 5 (Combat Loot & NPCs)

**Version**: 1.0
**Date**: 2025-12-26
**Phase**: 5 - Combat Loot & NPC Ships
**Prerequisites**: Phases 1-4 completed (Authentication, Movement, Economy, Inventory)

---

## Table of Contents

1. [Overview](#overview)
2. [New SSE Events](#new-sse-events)
3. [NPC Ship Rendering](#npc-ship-rendering)
4. [Combat UI Updates](#combat-ui-updates)
5. [Loot Display](#loot-display)
6. [Mining UI](#mining-ui)
7. [State Management](#state-management)
8. [Component Architecture](#component-architecture)
9. [Testing Checklist](#testing-checklist)

---

## Overview

Phase 5 introduces:
- **NPC Ships**: AI-controlled entities (pirates, traders, patrols) visible in sectors
- **Combat Resolution**: Automatic damage calculation with real-time updates
- **Loot System**: Resource and credit drops from defeated NPCs
- **Mining System**: Resource extraction from nodes with quality variance

### Architecture Changes

```
┌─────────────────────────────────────────────────────────────┐
│                     SSE Event Stream                         │
├─────────────────────────────────────────────────────────────┤
│  combat_outcome → Update combat UI (health bars, damage)    │
│  loot_received  → Show loot notification, update inventory  │
│  combat_ended   → Clean up combat UI, show results          │
│  entity_update  → Update NPC positions (if implemented)     │
├─────────────────────────────────────────────────────────────┤
│                   Frontend Components                        │
├─────────────────────────────────────────────────────────────┤
│  NPCShipRenderer    → Render NPC ships in 3D scene          │
│  CombatHUD          → Health bars, damage numbers           │
│  LootNotification   → Toast/modal for loot drops            │
│  MiningInterface    → Node selection, extraction progress   │
│  InventoryPanel     → Display resources with quality        │
└─────────────────────────────────────────────────────────────┘
```

---

## New SSE Events

### 1. combat_outcome

Sent **each combat tick** with damage updates.

**Event Structure**:
```typescript
interface CombatOutcomeEvent {
  type: 'combat_outcome';
  payload: {
    combat_id: string;
    tick: number;
    events: CombatTickEvent[];
  };
}

interface CombatTickEvent {
  type: 'damage' | 'shield_break' | 'death';
  attacker?: string;
  target?: string;
  damage?: number;
  damage_type?: string;
  target_hull?: number;
}
```

**Frontend Handling**:
```typescript
// combatStore.ts
eventSource.addEventListener('combat_outcome', (event) => {
  const data: CombatOutcomeEvent = JSON.parse(event.data);

  // Update participant health
  data.payload.events.forEach(tickEvent => {
    if (tickEvent.type === 'damage') {
      updateParticipantHull(tickEvent.target, tickEvent.target_hull);

      // Show damage number animation
      showDamageNumber(tickEvent.target, tickEvent.damage);
    }
  });

  // Increment tick counter
  setCombatTick(data.payload.tick);
});
```

---

### 2. loot_received

Sent when player kills an NPC.

**Event Structure**:
```typescript
interface LootReceivedEvent {
  type: 'loot_received';
  payload: {
    combat_id: string;
    player_id: string;
    credits: number;
    resources: LootedResource[];
  };
}

interface LootedResource {
  resource_type: string;
  quantity: number;
  quality: string; // "0.85", "1.32"
}
```

**Frontend Handling**:
```typescript
// lootStore.ts
eventSource.addEventListener('loot_received', (event) => {
  const data: LootReceivedEvent = JSON.parse(event.data);

  // Update player credits
  updateCredits((prev) => prev + data.payload.credits);

  // Add resources to inventory display
  data.payload.resources.forEach(resource => {
    addInventoryItem({
      resourceType: resource.resource_type,
      quantity: resource.quantity,
      quality: parseFloat(resource.quality)
    });
  });

  // Show loot notification UI
  showLootNotification({
    credits: data.payload.credits,
    resources: data.payload.resources
  });
});
```

---

### 3. combat_ended

Sent when combat instance completes.

**Event Structure**:
```typescript
interface CombatEndedEvent {
  type: 'combat_ended';
  payload: {
    combat_id: string;
    tick: number;
    end_reason: 'victory' | 'defeat' | 'flee' | 'timeout';
  };
}
```

**Frontend Handling**:
```typescript
// combatStore.ts
eventSource.addEventListener('combat_ended', (event) => {
  const data: CombatEndedEvent = JSON.parse(event.data);

  // Clear combat state
  setCombatActive(false);
  setCombatInstance(null);

  // Show combat results modal
  showCombatResults({
    reason: data.payload.end_reason,
    totalTicks: data.payload.tick
  });

  // Re-enable ship controls
  enableShipControls();
});
```

---

## NPC Ship Rendering

### NPC Entity Structure

NPCs appear in the sector's entity list with `entity_type: "npc"`.

**Example Entity Data**:
```typescript
interface NPCEntity {
  entity_id: string;
  entity_type: 'npc';
  position: [number, number, number];
  velocity: [number, number, number];
  name: string; // "Raider Alpha-42", "Merchant Beta-17"
  faction?: string;
  // Additional metadata (fetched from backend or cached)
  npc_type: 'pirate' | 'trader' | 'patrol';
  hull: number;
  hull_max: number;
  shield: number;
  shield_max: number;
}
```

### Visual Differentiation

**Recommended Approach**:
- **Pirates**: Red/orange glow, aggressive icons
- **Traders**: Blue/cyan glow, cargo ship model
- **Patrols**: Green/yellow glow, military ship model

**Three.js Example** (React Three Fiber):
```tsx
// NPCShip.tsx
import { useRef, useMemo } from 'react';
import { Mesh } from 'three';

interface NPCShipProps {
  entity: NPCEntity;
  onSelect: () => void;
}

export function NPCShip({ entity, onSelect }: NPCShipProps) {
  const meshRef = useRef<Mesh>(null);

  // Color based on NPC type
  const color = useMemo(() => {
    switch (entity.npc_type) {
      case 'pirate': return '#ff4444';
      case 'trader': return '#44aaff';
      case 'patrol': return '#44ff44';
      default: return '#888888';
    }
  }, [entity.npc_type]);

  return (
    <group position={entity.position}>
      {/* Ship mesh */}
      <mesh ref={meshRef} onClick={onSelect}>
        <boxGeometry args={[2, 1, 3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Name label (always facing camera) */}
      <Billboard>
        <Text
          position={[0, 2, 0]}
          fontSize={0.3}
          color={color}
        >
          {entity.name}
        </Text>
      </Billboard>

      {/* Health bar */}
      <HealthBar
        current={entity.hull + entity.shield}
        max={entity.hull_max + entity.shield_max}
        position={[0, 1.5, 0]}
      />
    </group>
  );
}
```

### NPC Selection & Interaction

```tsx
// SectorView.tsx
function SectorView() {
  const [selectedNPC, setSelectedNPC] = useState<NPCEntity | null>(null);
  const { entities } = useSectorStore();

  const npcs = entities.filter(e => e.entity_type === 'npc');

  return (
    <>
      {npcs.map(npc => (
        <NPCShip
          key={npc.entity_id}
          entity={npc}
          onSelect={() => setSelectedNPC(npc)}
        />
      ))}

      {selectedNPC && (
        <NPCInfoPanel
          npc={selectedNPC}
          onInitiateCombat={() => initiateCombat(selectedNPC.entity_id)}
          onClose={() => setSelectedNPC(null)}
        />
      )}
    </>
  );
}
```

---

## Combat UI Updates

### Combat HUD Component

```tsx
// CombatHUD.tsx
import { useCombatStore } from '@/stores/combatStore';

export function CombatHUD() {
  const { combatInstance, currentTick } = useCombatStore();

  if (!combatInstance) return null;

  return (
    <div className="combat-hud">
      {/* Tick counter */}
      <div className="tick-counter">
        Combat Tick: {currentTick}
      </div>

      {/* Participants */}
      <div className="participants">
        {combatInstance.participants.map(p => (
          <ParticipantCard key={p.player_id} participant={p} />
        ))}
      </div>
    </div>
  );
}

function ParticipantCard({ participant }) {
  const isAlive = participant.hull > 0;

  return (
    <div className={`participant ${!isAlive ? 'dead' : ''}`}>
      <h4>{participant.player_id}</h4>

      {/* Hull bar */}
      <ProgressBar
        label="Hull"
        current={participant.hull}
        max={participant.hull_max}
        color="red"
      />

      {/* Shield bar */}
      <ProgressBar
        label="Shield"
        current={participant.shield}
        max={participant.shield_max}
        color="blue"
      />
    </div>
  );
}
```

### Damage Number Animation

```tsx
// DamageNumber.tsx
import { useEffect, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

interface DamageNumberProps {
  damage: number;
  position: [number, number]; // 2D screen position
  onComplete: () => void;
}

export function DamageNumber({ damage, position, onComplete }: DamageNumberProps) {
  const spring = useSpring({
    from: { opacity: 1, y: 0 },
    to: { opacity: 0, y: -50 },
    config: { duration: 1000 },
    onRest: onComplete
  });

  return (
    <animated.div
      style={{
        position: 'absolute',
        left: position[0],
        top: position[1],
        ...spring
      }}
      className="damage-number"
    >
      -{damage}
    </animated.div>
  );
}

// Usage in combatStore
function showDamageNumber(targetId: string, damage: number) {
  const screenPos = worldToScreen(getEntityPosition(targetId));

  addDamageNumber({
    id: uuid(),
    damage,
    position: screenPos,
    timestamp: Date.now()
  });

  // Auto-remove after animation
  setTimeout(() => removeDamageNumber(id), 1000);
}
```

---

## Loot Display

### Loot Notification Component

```tsx
// LootNotification.tsx
import { useLootStore } from '@/stores/lootStore';

export function LootNotification() {
  const { recentLoot, dismissLoot } = useLootStore();

  if (!recentLoot) return null;

  return (
    <div className="loot-notification">
      <h3>Loot Received!</h3>

      {/* Credits */}
      {recentLoot.credits > 0 && (
        <div className="loot-credits">
          +{recentLoot.credits} Credits
        </div>
      )}

      {/* Resources */}
      <div className="loot-resources">
        {recentLoot.resources.map((resource, i) => (
          <div key={i} className="loot-item">
            <ResourceIcon type={resource.resource_type} />
            <span className="quantity">x{resource.quantity}</span>
            <span className="quality" style={{ color: getQualityColor(resource.quality) }}>
              Q: {parseFloat(resource.quality).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <button onClick={dismissLoot}>OK</button>
    </div>
  );
}

// Helper: Color-code quality
function getQualityColor(quality: string): string {
  const q = parseFloat(quality);
  if (q >= 1.5) return '#FFD700'; // Gold (high quality)
  if (q >= 1.0) return '#FFFFFF'; // White (normal)
  return '#AAAAAA'; // Gray (low quality)
}
```

### Inventory Panel Updates

**Show Quality** for resources:
```tsx
// InventoryItem.tsx
interface InventoryItemProps {
  resourceType: string;
  quantity: number;
  quality: number;
}

export function InventoryItem({ resourceType, quantity, quality }: InventoryItemProps) {
  return (
    <div className="inventory-item">
      <ResourceIcon type={resourceType} />
      <div className="item-details">
        <span className="name">{resourceType}</span>
        <span className="quantity">x{quantity}</span>
        <span
          className="quality"
          style={{ color: getQualityColor(quality.toString()) }}
        >
          Quality: {quality.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
```

---

## Mining UI

### Resource Node Rendering

```tsx
// ResourceNode.tsx
interface ResourceNodeProps {
  node: {
    id: string;
    position: [number, number, number];
    resource_type: string;
    quantity_remaining: number;
    quantity_initial: number;
  };
  onSelect: () => void;
}

export function ResourceNode({ node, onSelect }: ResourceNodeProps) {
  const fillPercent = node.quantity_remaining / node.quantity_initial;

  // Color based on resource type
  const color = useMemo(() => {
    switch (node.resource_type) {
      case 'iron_ore': return '#996633';
      case 'ice_water': return '#66CCFF';
      case 'hydrogen': return '#FF66FF';
      default: return '#CCCCCC';
    }
  }, [node.resource_type]);

  return (
    <group position={node.position}>
      {/* Asteroid mesh */}
      <mesh onClick={onSelect}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>

      {/* Depletion indicator */}
      <Billboard>
        <ProgressRing
          percent={fillPercent}
          color={color}
          radius={2}
        />
      </Billboard>
    </group>
  );
}
```

### Mining Interface

```tsx
// MiningPanel.tsx
import { useState } from 'react';
import { useMiningStore } from '@/stores/miningStore';

export function MiningPanel({ node }) {
  const [quantity, setQuantity] = useState(100);
  const { extractResource, isExtracting } = useMiningStore();

  const handleExtract = async () => {
    await extractResource({
      ship_id: currentShipId,
      player_id: playerId,
      resource_node_id: node.id,
      quantity
    });
  };

  return (
    <div className="mining-panel">
      <h3>{node.resource_type}</h3>
      <p>Remaining: {node.quantity_remaining} / {node.quantity_initial}</p>

      <div className="extraction-controls">
        <label>
          Quantity:
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            max={Math.min(node.quantity_remaining, 1000)}
          />
        </label>

        <button onClick={handleExtract} disabled={isExtracting}>
          {isExtracting ? 'Extracting...' : 'Extract'}
        </button>
      </div>

      {isExtracting && (
        <ProgressBar
          current={extractionProgress}
          max={100}
          label="Extraction Progress"
        />
      )}
    </div>
  );
}
```

---

## State Management

### Combat Store (Zustand Example)

```typescript
// stores/combatStore.ts
import create from 'zustand';

interface CombatState {
  combatInstance: CombatInstance | null;
  currentTick: number;
  isInCombat: boolean;
  damageNumbers: DamageNumber[];

  // Actions
  setCombatInstance: (instance: CombatInstance | null) => void;
  updateParticipantHull: (targetId: string, newHull: number) => void;
  setCombatTick: (tick: number) => void;
  addDamageNumber: (damageNumber: DamageNumber) => void;
  endCombat: () => void;
}

export const useCombatStore = create<CombatState>((set) => ({
  combatInstance: null,
  currentTick: 0,
  isInCombat: false,
  damageNumbers: [],

  setCombatInstance: (instance) => set({
    combatInstance: instance,
    isInCombat: !!instance
  }),

  updateParticipantHull: (targetId, newHull) => set((state) => {
    if (!state.combatInstance) return state;

    return {
      combatInstance: {
        ...state.combatInstance,
        participants: state.combatInstance.participants.map(p =>
          p.player_id === targetId
            ? { ...p, hull: newHull, is_alive: newHull > 0 }
            : p
        )
      }
    };
  }),

  setCombatTick: (tick) => set({ currentTick: tick }),

  addDamageNumber: (damageNumber) => set((state) => ({
    damageNumbers: [...state.damageNumbers, damageNumber]
  })),

  endCombat: () => set({
    combatInstance: null,
    isInCombat: false,
    currentTick: 0,
    damageNumbers: []
  })
}));
```

### Loot Store

```typescript
// stores/lootStore.ts
import create from 'zustand';

interface LootState {
  recentLoot: LootReceivedPayload | null;
  lootHistory: LootReceivedPayload[];

  showLootNotification: (loot: LootReceivedPayload) => void;
  dismissLoot: () => void;
}

export const useLootStore = create<LootState>((set) => ({
  recentLoot: null,
  lootHistory: [],

  showLootNotification: (loot) => set((state) => ({
    recentLoot: loot,
    lootHistory: [loot, ...state.lootHistory]
  })),

  dismissLoot: () => set({ recentLoot: null })
}));
```

---

## Component Architecture

### Recommended File Structure

```
src/
├── components/
│   ├── Combat/
│   │   ├── CombatHUD.tsx
│   │   ├── ParticipantCard.tsx
│   │   ├── DamageNumber.tsx
│   │   └── CombatResults.tsx
│   ├── Loot/
│   │   ├── LootNotification.tsx
│   │   └── LootHistory.tsx
│   ├── Mining/
│   │   ├── ResourceNode.tsx
│   │   ├── MiningPanel.tsx
│   │   └── NodeScanner.tsx
│   ├── NPCs/
│   │   ├── NPCShip.tsx
│   │   ├── NPCInfoPanel.tsx
│   │   └── NPCList.tsx
│   └── UI/
│       ├── HealthBar.tsx
│       ├── ProgressBar.tsx
│       └── ProgressRing.tsx
├── stores/
│   ├── combatStore.ts
│   ├── lootStore.ts
│   ├── miningStore.ts
│   └── npcStore.ts
├── hooks/
│   ├── useCombatEvents.ts
│   ├── useLootEvents.ts
│   └── useMiningActions.ts
└── services/
    ├── combatAPI.ts
    ├── miningAPI.ts
    └── npcAPI.ts
```

### SSE Event Hooks

```typescript
// hooks/useCombatEvents.ts
import { useEffect } from 'react';
import { useCombatStore } from '@/stores/combatStore';
import { useLootStore } from '@/stores/lootStore';

export function useCombatEvents(eventSource: EventSource | null) {
  const { updateParticipantHull, setCombatTick, endCombat, addDamageNumber } = useCombatStore();
  const { showLootNotification } = useLootStore();

  useEffect(() => {
    if (!eventSource) return;

    // Combat outcome handler
    const handleCombatOutcome = (event: MessageEvent) => {
      const data: CombatOutcomeEvent = JSON.parse(event.data);

      data.payload.events.forEach(tickEvent => {
        if (tickEvent.type === 'damage') {
          updateParticipantHull(tickEvent.target, tickEvent.target_hull);
          addDamageNumber(tickEvent.target, tickEvent.damage);
        }
      });

      setCombatTick(data.payload.tick);
    };

    // Loot received handler
    const handleLootReceived = (event: MessageEvent) => {
      const data: LootReceivedEvent = JSON.parse(event.data);
      showLootNotification(data.payload);
    };

    // Combat ended handler
    const handleCombatEnded = (event: MessageEvent) => {
      const data: CombatEndedEvent = JSON.parse(event.data);
      endCombat();
    };

    eventSource.addEventListener('combat_outcome', handleCombatOutcome);
    eventSource.addEventListener('loot_received', handleLootReceived);
    eventSource.addEventListener('combat_ended', handleCombatEnded);

    return () => {
      eventSource.removeEventListener('combat_outcome', handleCombatOutcome);
      eventSource.removeEventListener('loot_received', handleLootReceived);
      eventSource.removeEventListener('combat_ended', handleCombatEnded);
    };
  }, [eventSource]);
}
```

---

## Testing Checklist

### NPC Ships
- [ ] NPCs render in 3D scene with correct positions
- [ ] Different NPC types have distinct visual appearances
- [ ] NPC name labels are readable and face camera
- [ ] Health bars update in real-time
- [ ] Clicking NPC shows info panel
- [ ] "Initiate Combat" button triggers combat API

### Combat Resolution
- [ ] Combat HUD appears when combat starts
- [ ] Participant health bars update each tick
- [ ] Damage numbers animate upward and fade out
- [ ] Shield depletes before hull
- [ ] Participant marked dead when hull reaches 0
- [ ] Combat HUD disappears when combat ends

### Loot System
- [ ] Loot notification appears when NPC dies
- [ ] Credits display correctly
- [ ] Resources list with quality values
- [ ] Quality color-coding works (gold > white > gray)
- [ ] Loot added to inventory panel
- [ ] Inventory shows quality values for resources
- [ ] "OK" button dismisses notification

### Mining System
- [ ] Resource nodes render in 3D scene
- [ ] Node colors match resource types
- [ ] Quantity indicator shows depletion
- [ ] Clicking node shows mining panel
- [ ] Quantity slider works correctly
- [ ] "Extract" button triggers mining API
- [ ] Extraction progress bar updates
- [ ] Success message shows extracted amount and quality
- [ ] Error handling for out-of-range, cargo full, etc.

### SSE Events
- [ ] combat_outcome events update UI each tick
- [ ] loot_received events trigger notifications
- [ ] combat_ended events clean up UI
- [ ] No memory leaks from event listeners
- [ ] Event handlers properly cleaned up on unmount

### Edge Cases
- [ ] Multiple damage numbers don't overlap
- [ ] Loot notification queue (if multiple kills)
- [ ] Combat ends gracefully if player disconnects
- [ ] Mining UI disabled if ship moves out of range
- [ ] Quality values clamped to [0.50, 2.00] in display

---

## Performance Considerations

### Optimization Tips

1. **Limit Damage Numbers**: Cap at 10 simultaneous animations
2. **Throttle Health Bar Updates**: Use `requestAnimationFrame`
3. **Virtualize NPC List**: Only render visible NPCs in UI panels
4. **Cache Resource Icons**: Preload and reuse SVG/image assets
5. **Debounce Mining Quantity Input**: Prevent excessive re-renders

### Example: Throttled Health Bar

```typescript
import { useRef, useEffect } from 'react';

function useThrottledValue<T>(value: T, delay: number = 100): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= delay) {
      setThrottled(value);
      lastUpdate.current = now;
    } else {
      const timeout = setTimeout(() => {
        setThrottled(value);
        lastUpdate.current = Date.now();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [value, delay]);

  return throttled;
}

// Usage
function HealthBar({ current, max }) {
  const throttledCurrent = useThrottledValue(current, 100);
  const percent = (throttledCurrent / max) * 100;

  return (
    <div className="health-bar">
      <div className="fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
```

---

## Quick Start

### 1. Install Dependencies (if needed)

```bash
npm install zustand @react-spring/web
```

### 2. Create Stores

Copy the `combatStore.ts`, `lootStore.ts`, and `miningStore.ts` examples above.

### 3. Add SSE Event Handlers

```typescript
// In your SSE hook
useCombatEvents(eventSource);
useLootEvents(eventSource);
```

### 4. Render Components

```tsx
// In your main game view
<SectorView>
  <NPCShips />
  <ResourceNodes />
</SectorView>

<CombatHUD />
<LootNotification />
<MiningPanel />
```

### 5. Test with Backend

1. Start backend services (`worldsim`, `combat`)
2. Spawn test NPCs via admin script (if available)
3. Navigate to sector with NPCs
4. Click NPC → Initiate Combat
5. Watch combat_outcome events stream
6. Verify loot notification on NPC death
7. Test mining on resource node

---

## API Reference Summary

### Combat Endpoints

- `POST /v1/combat/initiate` - Start combat with NPC/player
- `GET /v1/combat/:combat_id` - Get combat instance details

### Mining Endpoints

- `GET /v1/mining/nodes?sector=0,0,0` - Get minable nodes
- `POST /v1/mining/extract` - Extract resources from node

### SSE Events

- `combat_outcome` - Damage updates each tick
- `loot_received` - Loot drops from defeated NPCs
- `combat_ended` - Combat instance completed
- `resource_extracted` - Mining operation succeeded

---

## Support

**Issues**: https://github.com/jrtorrez31337/ssw/issues
**API Docs**: API-BLUEPRINT.md
**Backend Guide**: AI_AGENT_GUIDE.md

---

**End of Phase 5 Frontend Guide**
