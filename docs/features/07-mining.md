# Mining

## Overview

The mining system allows players to extract resources from procedurally-generated nodes in space. Resource nodes include asteroid fields and planetary deposits.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mining/nodes` | Get resource nodes in sector |
| POST | `/mining/extract` | Extract resources from node |
| GET | `/mining/nodes/{id}` | Get specific node details |

## Data Types

### ResourceNodesResponse
```typescript
interface ResourceNodesResponse {
  nodes: ResourceNode[];
  sector: string;
}
```

### ResourceNode
```typescript
interface ResourceNode {
  id: string;
  sector: string;
  position: Vector3;
  resource_type: string;
  quantity_remaining: number;
  quality: number;  // 0-100
  node_type: 'asteroid' | 'planetary_deposit';
}
```

### ExtractionRequest
```typescript
interface ExtractionRequest {
  ship_id: string;
  node_id: string;
  quantity: number;
}
```

### ExtractionResult
```typescript
interface ExtractionResult {
  success: boolean;
  extracted_quantity: number;
  extracted_quality: number;
  remaining_quantity: number;
  cargo_used: number;
  cargo_remaining: number;
}
```

## Resource Types

Same commodities as trading system:

| Resource | Rarity | Typical Quality |
|----------|--------|-----------------|
| iron_ore | Common | 40-70 |
| ice_water | Common | 50-80 |
| silicates | Common | 45-75 |
| hydrogen | Common | 55-85 |
| carbon | Uncommon | 35-65 |
| titanium_ore | Uncommon | 30-60 |
| platinum | Rare | 20-50 |
| rare_earth | Rare | 15-45 |
| xenon_gas | Rare | 25-55 |
| antimatter | Very Rare | 10-40 |
| exotic_crystals | Very Rare | 5-35 |
| ancient_artifacts | Legendary | 1-20 |

## Source Files

| File | Purpose |
|------|---------|
| `api/mining.ts` | API client methods |
| `hooks/useMiningEvents.ts` | SSE event handlers |
| `app/mining.tsx` | Mining screen |

## Mining Flow

1. **Node Discovery**
   - Player enters sector
   - Scans reveal resource nodes
   - Nodes displayed on map

2. **Approach**
   - Player navigates to node
   - Must be within 1000 units

3. **Extraction**
   - Select quantity to extract
   - Cargo space validated
   - Progress bar during extraction

4. **Collection**
   - Resources added to cargo
   - Node quantity depleted
   - Node may be exhausted

## Validation Rules

| Rule | Limit |
|------|-------|
| Range | 1000 units from node |
| Cargo | Must have space |
| Quantity | Cannot exceed remaining |
| Status | Ship must be undocked |
| Combat | Cannot mine during combat |

## Components

### ResourceNodeList
- List of nearby nodes
- Resource type and quantity
- Distance indicator

### MiningControls
- Quantity selector
- Extract button
- Cargo capacity display

### MiningProgressBar
- Extraction progress
- Estimated time remaining

## Integration Points

- **Navigation**: Must fly to nodes
- **Scanning**: Nodes revealed by scans
- **Inventory**: Resources stored in cargo
- **Trading**: Mined resources can be sold
- **Ship Systems**: Mining may be affected by sensor damage
