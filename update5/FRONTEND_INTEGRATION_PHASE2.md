# Frontend Integration Guide: Phase 2 - Mining System

## Overview

Phase 2 adds resource gathering through mining. Players can extract resources from procedurally-generated asteroid fields and planetary deposits. Resources have quality variance (0.50-2.00) based on Gaussian distribution, and nodes deplete over time with optional respawning.

---

## API Endpoints

### 1. GET /v1/mining/nodes

**Purpose**: List resource nodes in a sector

**Query Parameters**:
- `sector` (required): Sector coordinates in "x.y.z" format
- `resource_type` (optional): Filter by resource type (e.g., "iron_ore")

**Request Example**:
```typescript
const response = await fetch(
  'http://localhost:8081/v1/mining/nodes?sector=5.2.-3&resource_type=iron_ore',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

**Response**:
```json
{
  "data": {
    "sector": "5.2.-3",
    "nodes": [
      {
        "id": "uuid",
        "sector": "5.2.-3",
        "position": {"x": 1000.0, "y": 500.0, "z": -200.0},
        "resource_type": "iron_ore",
        "richness": 0.75,
        "quantity_remaining": 5000,
        "quality_mean": "1.00",
        "respawns": true
      }
    ]
  }
}
```

### 2. POST /v1/mining/extract

**Purpose**: Extract resources from a node

**Request Body**:
```json
{
  "ship_id": "uuid",
  "resource_node_id": "uuid",
  "quantity": 100
}
```

**Validation Rules**:
- Ship must be within 1000 units of node
- Ship must have cargo space
- Ship not in combat
- Ship not docked

**Response**:
```json
{
  "data": {
    "extraction_id": "uuid",
    "quantity_extracted": 100,
    "quality": "1.15",
    "node_quantity_remaining": 4900,
    "ship_cargo_used": 150,
    "ship_cargo_capacity": 1000,
    "extraction_time_seconds": 30
  }
}
```

**Error Codes**:
- `MINING_SHIP_NOT_FOUND` (404)
- `MINING_NODE_NOT_FOUND` (404)
- `MINING_OUT_OF_RANGE` (400)
- `MINING_CARGO_FULL` (400)
- `MINING_NODE_DEPLETED` (400)
- `MINING_IN_COMBAT` (400)
- `MINING_DOCKED` (400)

---

## SSE Events

### resource_extracted

Published when a player successfully extracts resources.

```json
{
  "type": "resource_extracted",
  "payload": {
    "ship_id": "uuid",
    "player_id": "uuid",
    "resource_type": "iron_ore",
    "quantity": 100,
    "quality": "1.15",
    "node_quantity_remaining": 4900,
    "sector": "5.2.-3"
  }
}
```

**Channels**: `player.<player_id>`, `game.mining`

### inventory_update

Published when mining adds resources to inventory.

```json
{
  "type": "inventory_update",
  "payload": {
    "player_id": "uuid",
    "ship_id": "uuid",
    "reason": "mining"
  }
}
```

---

## Frontend Implementation

### TypeScript Types

```typescript
interface ResourceNode {
  id: string;
  sector: string;
  position: { x: number; y: number; z: number };
  resource_type: string;
  richness: number;
  quantity_remaining: number;
  quality_mean: string;
  respawns: boolean;
}

interface ExtractionRequest {
  ship_id: string;
  resource_node_id: string;
  quantity: number;
}

interface ExtractionResult {
  extraction_id: string;
  quantity_extracted: number;
  quality: string;
  node_quantity_remaining: number;
  ship_cargo_used: number;
  ship_cargo_capacity: number;
  extraction_time_seconds: number;
}
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';

export function useMining() {
  const [nodes, setNodes] = useState<ResourceNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNodes = useCallback(async (sector: string, resourceType?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sector });
      if (resourceType) params.set('resource_type', resourceType);

      const response = await fetch(
        `${API_BASE}/v1/mining/nodes?${params}`,
        { headers: authHeaders() }
      );

      if (!response.ok) throw new Error('Failed to fetch nodes');
      const data = await response.json();
      setNodes(data.data.nodes);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const extractResources = useCallback(async (
    shipId: string,
    nodeId: string,
    quantity: number
  ): Promise<ExtractionResult> => {
    const response = await fetch(`${API_BASE}/v1/mining/extract`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ship_id: shipId,
        resource_node_id: nodeId,
        quantity
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const data = await response.json();
    return data.data;
  }, []);

  return { nodes, loading, fetchNodes, extractResources };
}
```

### SSE Handler

```typescript
// Add to SSE event handler
eventSource.addEventListener('resource_extracted', (event) => {
  const payload = JSON.parse(event.data).payload;

  // Update UI
  dispatch({
    type: 'RESOURCE_EXTRACTED',
    payload: {
      resourceType: payload.resource_type,
      quantity: payload.quantity,
      quality: parseFloat(payload.quality),
      nodeRemaining: payload.node_quantity_remaining
    }
  });

  // Show notification
  showNotification(
    `Extracted ${payload.quantity}x ${payload.resource_type} (Quality: ${payload.quality})`
  );
});
```

---

## UI/UX Recommendations

### Mining Interface

1. **Resource Scanner**:
   - Show nearby resource nodes on sector map
   - Display node information on hover (type, richness, quantity)
   - Color-code by resource type

2. **Mining Controls**:
   - Quantity slider (respecting cargo limits)
   - Estimated quality range display
   - Time to extract countdown
   - Cancel mining button

3. **Cargo Management**:
   - Real-time cargo capacity display
   - Grouped by resource type and quality
   - Sort/filter options

4. **Visual Feedback**:
   - Mining beam/animation during extraction
   - Progress bar (30 second duration)
   - Quality indicator (color-coded: poor/average/good/excellent)
   - Node depletion animation when exhausted

---

## Integration with Other Systems

### Trading Flow

1. Player mines 100 iron_ore (quality 1.15)
2. Resources appear in ship inventory
3. Player docks at station
4. Player creates sell order on economy market (Phase 3)

**No special integration needed** - mining simply adds to inventory, economy system handles the rest.

---

## Testing Checklist

- [ ] Can query resource nodes for current sector
- [ ] Nodes appear on map at correct positions
- [ ] Can initiate mining when in range
- [ ] Out-of-range mining shows error
- [ ] Cargo full prevents mining
- [ ] Quality variance visible (0.50-2.00 range)
- [ ] Node quantity decrements correctly
- [ ] Inventory updates after extraction
- [ ] SSE events received and processed
- [ ] Cannot mine while docked
- [ ] Cannot mine while in combat
- [ ] Node respawn works correctly (24h interval)

---

## Quality System

Resources have quality values from 0.50 to 2.00, rolled using Gaussian distribution:

- **Mean**: Determined by node (typically 1.0)
- **Standard Deviation**: Typically 0.2
- **Distribution**:
  - 68% of extractions: 0.80 - 1.20
  - 95% of extractions: 0.60 - 1.40
  - Extreme cases: 0.50 or 2.00 (clamped)

**Display Recommendations**:
- 0.50-0.79: Poor (red)
- 0.80-1.19: Average (yellow)
- 1.20-1.59: Good (green)
- 1.60-2.00: Excellent (blue/purple)

---

## Performance Considerations

1. **Node Loading**: Nodes are lazy-loaded per sector (generated on first access)
2. **Caching**: Nodes persist in database after generation
3. **Respawn Checks**: Run every 10 seconds on server (Medium tick)
4. **Event Frequency**: One SSE event per extraction

---

## Common Issues

**Issue**: No resource nodes found in sector
- **Cause**: Procgen service may not have generated resources
- **Solution**: Check sector type (asteroid/planetary sectors have resources)

**Issue**: Mining fails with OUT_OF_RANGE error
- **Cause**: Ship position > 1000 units from node
- **Solution**: Move ship closer before attempting extraction

**Issue**: Quality always 1.0
- **Cause**: Node quality_stddev = 0
- **Solution**: Check node quality_mean and quality_stddev values

---

**Integration Status**: ✅ Complete - Phase 2 mining system fully integrated with WorldSim service
