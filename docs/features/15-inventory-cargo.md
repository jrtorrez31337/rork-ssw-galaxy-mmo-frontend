# Inventory & Cargo

## Overview

The inventory system manages resources stored in ships, stations, and planets. Players can transfer resources between containers and are limited by cargo capacity.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/inventory/{ownerId}` | Get inventory |
| POST | `/inventory/transfer` | Transfer resources |

## Data Types

### Inventory
```typescript
interface Inventory {
  owner_id: string;
  owner_type: OwnerType;
  capacity: number;
  used: number;
  items: InventoryItem[];
}

type OwnerType = 'ship' | 'station' | 'planet';
```

### InventoryItem
```typescript
interface InventoryItem {
  id: string;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
  unit_volume: number;
  total_volume: number;
}
```

### TransferRequest
```typescript
interface TransferRequest {
  source_id: string;
  source_type: OwnerType;
  target_id: string;
  target_type: OwnerType;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
}
```

### TransferResponse
```typescript
interface TransferResponse {
  transfer_id: string;
  source_remaining: number;
  target_new_total: number;
  timestamp: string;
}
```

## Resource Types

| Type | Rarity |
|------|--------|
| iron_ore | Common |
| ice_water | Common |
| silicates | Common |
| hydrogen | Common |
| carbon | Uncommon |
| titanium_ore | Uncommon |
| platinum | Rare |
| rare_earth | Rare |
| xenon_gas | Rare |
| antimatter | Legendary |
| exotic_crystals | Legendary |
| ancient_artifacts | Legendary |

## Source Files

| File | Purpose |
|------|---------|
| `api/inventory.ts` | API client methods |
| `components/InventoryList.tsx` | Inventory display |
| `components/StationInventoryPanel.tsx` | Station inventory |

## Inventory Flow

### View Inventory
1. Query inventory by owner ID
2. Display items with quantities
3. Show capacity usage

### Transfer Resources
1. Select source and target
2. Choose resource type
3. Enter quantity
4. Validate capacity
5. Execute transfer

## Capacity System

- Each container has max capacity
- Items have volume per unit
- Total volume cannot exceed capacity
- Transfers fail if target is full

## Quality System

- Resources have quality rating (0-100)
- Higher quality = more valuable
- Quality affects selling price
- Stacking respects quality

## Components

### InventoryList
- List of items
- Quantity and quality
- Volume usage bar

### StationInventoryPanel
- Station cargo
- Buy/sell from station

## Integration Points

- **Trading**: Sell resources at markets
- **Mining**: Add extracted resources
- **Ship Systems**: Cargo capacity from ship stats
- **Missions**: Delivery mission cargo
- **Station Services**: Transfer at stations
