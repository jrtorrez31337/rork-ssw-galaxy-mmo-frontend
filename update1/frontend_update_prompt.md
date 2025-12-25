# SSW Galaxy MMO - Frontend Update: Inventory & Cargo System

## Overview

This document outlines the frontend implementation needed to support the newly completed **Inventory & Cargo System** backend. The backend has implemented a comprehensive inventory management system with resource storage, transfers, and cargo capacity tracking.

**Backend Status**: ✅ Complete (Feature 1 implemented)
**Frontend Task**: Implement UI/UX for inventory management and cargo operations

---

## Backend Changes Completed

### New Database Schema
- **Table**: `inventory_items` - Stores resources owned by ships, stations, and planets
- **Ships Table**: Added `current_cargo_used` field to track cargo capacity usage

### New API Endpoints

#### 1. GET /v1/inventory/:owner_id
Retrieves inventory for a ship, station, or planet.

**Query Parameters**:
- `owner_type` (required): `ship`, `station`, or `planet`
- `resource_type` (optional): filter by specific resource

**Response**:
```json
{
  "data": {
    "owner_id": "uuid",
    "owner_type": "ship",
    "capacity": 300,
    "used": 145,
    "items": [
      {
        "id": "uuid",
        "resource_type": "iron_ore",
        "quantity": 50,
        "quality": 1.2,
        "unit_volume": 1,
        "total_volume": 50
      }
    ]
  }
}
```

#### 2. POST /v1/inventory/transfer
Transfers resources between entities.

**Request**:
```json
{
  "source_id": "ship-uuid",
  "source_type": "ship",
  "target_id": "station-uuid",
  "target_type": "station",
  "resource_type": "iron_ore",
  "quantity": 20,
  "quality": 1.2
}
```

**Response**:
```json
{
  "data": {
    "transfer_id": "uuid",
    "source_remaining": 30,
    "target_new_total": 20,
    "timestamp": "2025-12-24T12:00:00Z"
  }
}
```

**Error Codes**:
- `INSUFFICIENT_QUANTITY` (400)
- `CARGO_FULL` (400)
- `NOT_IN_RANGE` (400)
- `INVALID_RESOURCE` (400)

---

## Resource Types & Visual Theme

### Tier 1 - Common Resources
- **iron_ore** - Basic hull repairs
  - Color: `#B87333` (copper brown)
  - Icon: 🪨
  - Rarity: Common

- **ice_water** - Life support, fuel processing
  - Color: `#87CEEB` (sky blue)
  - Icon: 💧
  - Rarity: Common

- **silicates** - Electronics, sensors
  - Color: `#D3D3D3` (light gray)
  - Icon: 🔷
  - Rarity: Common

- **hydrogen** - Fuel (1 unit = 10 LY jump range)
  - Color: `#FFA500` (orange)
  - Icon: ⚡
  - Rarity: Common

- **carbon** - Shields, advanced materials
  - Color: `#2F4F4F` (dark slate gray)
  - Icon: ◆
  - Rarity: Common

### Tier 2 - Uncommon Resources
- **titanium_ore** - Advanced hull plating
  - Color: `#C0C0C0` (silver)
  - Icon: 🔩
  - Rarity: Uncommon

- **platinum** - High-efficiency power systems
  - Color: `#E5E4E2` (platinum)
  - Icon: 💎
  - Rarity: Uncommon

- **rare_earth** - Sensor arrays, jump drives
  - Color: `#9370DB` (medium purple)
  - Icon: 🌐
  - Rarity: Uncommon

- **xenon_gas** - Shield boosters
  - Color: `#00CED1` (dark turquoise)
  - Icon: 💨
  - Rarity: Uncommon

### Tier 3 - Rare Resources
- **antimatter** - Weapons, experimental tech
  - Color: `#FF1493` (deep pink)
  - Icon: ⚛️
  - Rarity: Rare

- **exotic_crystals** - Legendary equipment
  - Color: `#9400D3` (dark violet)
  - Icon: 💠
  - Rarity: Rare

- **ancient_artifacts** - Faction reputation, research
  - Color: `#FFD700` (gold)
  - Icon: 🏺
  - Rarity: Legendary

---

## Frontend Implementation Tasks

### 1. API Client Layer

**File**: `src/api/inventory.ts`

Create new API module with TypeScript interfaces and API calls.

```typescript
import { apiClient } from './client';

export type OwnerType = 'ship' | 'station' | 'planet';
export type ResourceType =
  | 'iron_ore' | 'ice_water' | 'silicates' | 'hydrogen' | 'carbon'
  | 'titanium_ore' | 'platinum' | 'rare_earth' | 'xenon_gas'
  | 'antimatter' | 'exotic_crystals' | 'ancient_artifacts';

export type ResourceRarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';

export interface InventoryItem {
  id: string;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
  unit_volume: number;
  total_volume: number;
}

export interface Inventory {
  owner_id: string;
  owner_type: OwnerType;
  capacity: number;
  used: number;
  items: InventoryItem[];
}

export interface TransferRequest {
  source_id: string;
  source_type: OwnerType;
  target_id: string;
  target_type: OwnerType;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
}

export interface TransferResponse {
  transfer_id: string;
  source_remaining: number;
  target_new_total: number;
  timestamp: string;
}

export const inventoryApi = {
  getInventory: async (ownerId: string, ownerType: OwnerType, resourceType?: ResourceType) => {
    const params = new URLSearchParams({ owner_type: ownerType });
    if (resourceType) params.append('resource_type', resourceType);

    const response = await apiClient.get<{ data: Inventory }>(
      `/inventory/${ownerId}?${params}`
    );
    return response.data.data;
  },

  transfer: async (request: TransferRequest) => {
    const response = await apiClient.post<{ data: TransferResponse }>(
      '/inventory/transfer',
      request
    );
    return response.data.data;
  },
};
```

---

### 2. Resource Metadata

**File**: `src/constants/resources.ts`

Define resource metadata for UI display.

```typescript
import { ResourceType, ResourceRarity } from '../api/inventory';

export interface ResourceMetadata {
  name: string;
  description: string;
  color: string;
  icon: string;
  rarity: ResourceRarity;
  tier: 1 | 2 | 3;
}

export const RESOURCE_METADATA: Record<ResourceType, ResourceMetadata> = {
  // Tier 1
  iron_ore: {
    name: 'Iron Ore',
    description: 'Basic hull repairs',
    color: '#B87333',
    icon: '🪨',
    rarity: 'Common',
    tier: 1,
  },
  ice_water: {
    name: 'Ice Water',
    description: 'Life support, fuel processing',
    color: '#87CEEB',
    icon: '💧',
    rarity: 'Common',
    tier: 1,
  },
  silicates: {
    name: 'Silicates',
    description: 'Electronics, sensors',
    color: '#D3D3D3',
    icon: '🔷',
    rarity: 'Common',
    tier: 1,
  },
  hydrogen: {
    name: 'Hydrogen',
    description: 'Fuel (1 unit = 10 LY jump range)',
    color: '#FFA500',
    icon: '⚡',
    rarity: 'Common',
    tier: 1,
  },
  carbon: {
    name: 'Carbon',
    description: 'Shields, advanced materials',
    color: '#2F4F4F',
    icon: '◆',
    rarity: 'Common',
    tier: 1,
  },

  // Tier 2
  titanium_ore: {
    name: 'Titanium Ore',
    description: 'Advanced hull plating',
    color: '#C0C0C0',
    icon: '🔩',
    rarity: 'Uncommon',
    tier: 2,
  },
  platinum: {
    name: 'Platinum',
    description: 'High-efficiency power systems',
    color: '#E5E4E2',
    icon: '💎',
    rarity: 'Uncommon',
    tier: 2,
  },
  rare_earth: {
    name: 'Rare Earth Elements',
    description: 'Sensor arrays, jump drives',
    color: '#9370DB',
    icon: '🌐',
    rarity: 'Uncommon',
    tier: 2,
  },
  xenon_gas: {
    name: 'Xenon Gas',
    description: 'Shield boosters',
    color: '#00CED1',
    icon: '💨',
    rarity: 'Uncommon',
    tier: 2,
  },

  // Tier 3
  antimatter: {
    name: 'Antimatter',
    description: 'Weapons, experimental tech',
    color: '#FF1493',
    icon: '⚛️',
    rarity: 'Rare',
    tier: 3,
  },
  exotic_crystals: {
    name: 'Exotic Crystals',
    description: 'Legendary equipment',
    color: '#9400D3',
    icon: '💠',
    rarity: 'Rare',
    tier: 3,
  },
  ancient_artifacts: {
    name: 'Ancient Artifacts',
    description: 'Faction reputation, research',
    color: '#FFD700',
    icon: '🏺',
    rarity: 'Legendary',
    tier: 3,
  },
};

export const RARITY_COLORS: Record<ResourceRarity, string> = {
  Common: '#9CA3AF',      // gray
  Uncommon: '#3B82F6',    // blue
  Rare: '#A855F7',        // purple
  Legendary: '#F59E0B',   // amber
};
```

---

### 3. UI Components

#### A. Resource Item Component

**File**: `src/components/inventory/ResourceItem.tsx`

Display a single resource with icon, quantity, and quality.

```typescript
import { InventoryItem } from '../../api/inventory';
import { RESOURCE_METADATA, RARITY_COLORS } from '../../constants/resources';
import './ResourceItem.css';

interface ResourceItemProps {
  item: InventoryItem;
  onClick?: () => void;
  selected?: boolean;
}

export function ResourceItem({ item, onClick, selected }: ResourceItemProps) {
  const metadata = RESOURCE_METADATA[item.resource_type];
  const qualityPercent = ((item.quality - 0.5) / 1.5) * 100; // 0.5-2.0 mapped to 0-100%

  return (
    <div
      className={`resource-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: metadata.color }}
    >
      <div className="resource-icon" style={{ color: metadata.color }}>
        {metadata.icon}
      </div>

      <div className="resource-info">
        <h4 className="resource-name">{metadata.name}</h4>
        <p className="resource-description">{metadata.description}</p>

        <div className="resource-stats">
          <span className="resource-quantity">Qty: {item.quantity}</span>
          <span
            className="resource-rarity"
            style={{ color: RARITY_COLORS[metadata.rarity] }}
          >
            {metadata.rarity}
          </span>
        </div>

        {item.quality !== 1.0 && (
          <div className="quality-bar">
            <div className="quality-label">Quality: {item.quality.toFixed(2)}x</div>
            <div className="quality-progress">
              <div
                className="quality-fill"
                style={{
                  width: `${qualityPercent}%`,
                  backgroundColor: metadata.color
                }}
              />
            </div>
          </div>
        )}

        <div className="resource-volume">
          Volume: {item.total_volume} units
        </div>
      </div>
    </div>
  );
}
```

**File**: `src/components/inventory/ResourceItem.css`

```css
.resource-item {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.resource-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.resource-item.selected {
  border-color: var(--primary-color);
  background: rgba(139, 92, 246, 0.15);
}

.resource-icon {
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 0 8px currentColor);
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.resource-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.resource-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.resource-quantity {
  color: white;
  font-weight: 500;
}

.resource-rarity {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.quality-bar {
  margin-top: 4px;
}

.quality-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

.quality-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px currentColor;
}

.resource-volume {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
```

#### B. Cargo Capacity Bar Component

**File**: `src/components/inventory/CargoCapacityBar.tsx`

Visual display of cargo capacity usage.

```typescript
import './CargoCapacityBar.css';

interface CargoCapacityBarProps {
  used: number;
  capacity: number;
}

export function CargoCapacityBar({ used, capacity }: CargoCapacityBarProps) {
  const percentage = (used / capacity) * 100;
  const isNearFull = percentage >= 80;
  const isFull = percentage >= 100;

  return (
    <div className="cargo-capacity">
      <div className="cargo-header">
        <span className="cargo-label">Cargo Hold</span>
        <span className={`cargo-stats ${isNearFull ? 'warning' : ''} ${isFull ? 'full' : ''}`}>
          {used} / {capacity} units ({percentage.toFixed(1)}%)
        </span>
      </div>

      <div className="cargo-bar">
        <div
          className={`cargo-fill ${isNearFull ? 'warning' : ''} ${isFull ? 'full' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

**File**: `src/components/inventory/CargoCapacityBar.css`

```css
.cargo-capacity {
  margin-bottom: 24px;
}

.cargo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cargo-label {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.cargo-stats {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.cargo-stats.warning {
  color: #FFA500;
}

.cargo-stats.full {
  color: #FF4444;
  font-weight: 700;
}

.cargo-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.cargo-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6, #A78BFA);
  transition: all 0.5s ease;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
}

.cargo-fill.warning {
  background: linear-gradient(90deg, #FFA500, #FFB733);
  box-shadow: 0 0 12px rgba(255, 165, 0, 0.6);
}

.cargo-fill.full {
  background: linear-gradient(90deg, #FF4444, #FF6666);
  box-shadow: 0 0 12px rgba(255, 68, 68, 0.6);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

#### C. Transfer Modal Component

**File**: `src/components/inventory/TransferModal.tsx`

Modal for transferring resources between entities.

```typescript
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, InventoryItem, OwnerType, TransferRequest } from '../../api/inventory';
import { RESOURCE_METADATA } from '../../constants/resources';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import './TransferModal.css';

interface TransferModalProps {
  sourceId: string;
  sourceType: OwnerType;
  item: InventoryItem;
  onClose: () => void;
}

export function TransferModal({ sourceId, sourceType, item, onClose }: TransferModalProps) {
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState<OwnerType>('station');
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();

  const metadata = RESOURCE_METADATA[item.resource_type];

  const transferMutation = useMutation({
    mutationFn: (request: TransferRequest) => inventoryApi.transfer(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    transferMutation.mutate({
      source_id: sourceId,
      source_type: sourceType,
      target_id: targetId,
      target_type: targetType,
      resource_type: item.resource_type,
      quantity,
      quality: item.quality,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transfer Resources</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="transfer-info">
          <div className="transfer-resource">
            <span className="transfer-icon" style={{ color: metadata.color }}>
              {metadata.icon}
            </span>
            <div>
              <h3>{metadata.name}</h3>
              <p>Available: {item.quantity} units (Quality: {item.quality}x)</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="transfer-form">
          <div className="form-group">
            <label>Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as OwnerType)}
              className="form-select"
            >
              <option value="ship">Ship</option>
              <option value="station">Station</option>
              <option value="planet">Planet</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target ID</label>
            <Input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter target UUID"
              required
            />
          </div>

          <div className="form-group">
            <label>Quantity (max: {item.quantity})</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 0, item.quantity))}
              min={1}
              max={item.quantity}
              required
            />
            <input
              type="range"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min={1}
              max={item.quantity}
              className="quantity-slider"
            />
          </div>

          {transferMutation.isError && (
            <div className="error-message">
              {(transferMutation.error as any)?.response?.data?.error?.message || 'Transfer failed'}
            </div>
          )}

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={transferMutation.isPending || !targetId}
            >
              {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**File**: `src/components/inventory/TransferModal.css`

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 24px;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #8B5CF6;
}

.transfer-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.transfer-resource {
  display: flex;
  gap: 16px;
  align-items: center;
}

.transfer-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 8px currentColor);
}

.transfer-resource h3 {
  margin: 0 0 4px 0;
  color: white;
  font-size: 18px;
}

.transfer-resource p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.transfer-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.form-select {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.form-select:hover {
  border-color: rgba(139, 92, 246, 0.5);
}

.form-select:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.quantity-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

.quantity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #8B5CF6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
}

.quantity-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #8B5CF6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
  border: none;
}

.error-message {
  background: rgba(255, 68, 68, 0.15);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #FF6666;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 4. Inventory Page

**File**: `src/pages/ShipInventoryPage.tsx`

Main page for viewing and managing ship inventory.

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../api/inventory';
import { shipApi } from '../api/ships';
import { ResourceItem } from '../components/inventory/ResourceItem';
import { CargoCapacityBar } from '../components/inventory/CargoCapacityBar';
import { TransferModal } from '../components/inventory/TransferModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { InventoryItem } from '../api/inventory';
import './ShipInventoryPage.css';

export function ShipInventoryPage() {
  const { shipId } = useParams<{ shipId: string }>();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const shipQuery = useQuery({
    queryKey: ['ship', shipId],
    queryFn: () => shipApi.getById(shipId!),
    enabled: !!shipId,
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventory', shipId],
    queryFn: () => inventoryApi.getInventory(shipId!, 'ship'),
    enabled: !!shipId,
  });

  const ship = shipQuery.data;
  const inventory = inventoryQuery.data;

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  const handleTransfer = () => {
    if (selectedItem) {
      setShowTransferModal(true);
    }
  };

  if (shipQuery.isLoading || inventoryQuery.isLoading) {
    return <div className="loading-container">Loading inventory...</div>;
  }

  if (!ship || !inventory) {
    return <div className="error-container">Ship or inventory not found</div>;
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>
        <div className="ship-title">
          <h1>{ship.name || 'Unnamed Ship'}</h1>
          <span className="ship-type-tag">{ship.ship_type}</span>
        </div>
      </div>

      <div className="inventory-content">
        <Card title="Cargo Hold">
          <CargoCapacityBar
            used={inventory.used}
            capacity={inventory.capacity}
          />

          {inventory.items.length === 0 ? (
            <div className="empty-cargo">
              <p>Your cargo hold is empty</p>
              <p className="empty-hint">Collect resources through mining or trading</p>
            </div>
          ) : (
            <div className="resource-grid">
              {inventory.items.map((item) => (
                <ResourceItem
                  key={item.id}
                  item={item}
                  onClick={() => handleItemClick(item)}
                  selected={selectedItem?.id === item.id}
                />
              ))}
            </div>
          )}

          {selectedItem && (
            <div className="inventory-actions">
              <Button onClick={handleTransfer}>
                Transfer Selected Resource
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedItem(null)}
              >
                Deselect
              </Button>
            </div>
          )}
        </Card>

        <Card title="Ship Details">
          <div className="ship-stats">
            <div className="stat-row">
              <span className="stat-label">Hull:</span>
              <span className="stat-value">{ship.hull_points} / {ship.hull_max}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Shield:</span>
              <span className="stat-value">{ship.shield_points} / {ship.shield_max}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Location:</span>
              <span className="stat-value">{ship.location_sector}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Cargo Capacity:</span>
              <span className="stat-value">{ship.cargo_capacity} units</span>
            </div>
          </div>
        </Card>
      </div>

      {showTransferModal && selectedItem && shipId && (
        <TransferModal
          sourceId={shipId}
          sourceType="ship"
          item={selectedItem}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}
```

**File**: `src/pages/ShipInventoryPage.css`

```css
.inventory-page {
  min-height: 100vh;
  padding: 32px;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.inventory-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.ship-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ship-title h1 {
  margin: 0;
  color: white;
  font-size: 36px;
}

.ship-type-tag {
  background: linear-gradient(135deg, #8B5CF6, #A78BFA);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.inventory-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.empty-cargo {
  text-align: center;
  padding: 48px 24px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-cargo p {
  margin: 8px 0;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.inventory-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ship-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.stat-value {
  color: white;
  font-weight: 600;
}

.loading-container,
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

@media (max-width: 1024px) {
  .inventory-content {
    grid-template-columns: 1fr;
  }
}
```

---

### 5. Update Dashboard Page

**File**: `src/pages/DashboardPage.tsx` (modifications)

Add "View Inventory" button to each ship card.

```typescript
// Add to imports
import { shipApi, Ship } from '../api/ships';

// Modify the ship card section:
{ships.map((ship) => (
  <div key={ship.id} className="item-card">
    <div className="ship-type-badge">{ship.ship_type}</div>
    <h3 className="item-name">{ship.name || 'Unnamed Ship'}</h3>
    <div className="item-stats">
      <div className="stat-badge">
        🛡️ Hull: {ship.hull_points}/{ship.hull_max}
      </div>
      <div className="stat-badge">
        ✨ Shield: {ship.shield_points}/{ship.shield_max}
      </div>
      <div className="stat-badge">
        📦 Cargo: {ship.cargo_capacity}
      </div>
    </div>
    <p className="item-detail">Location: {ship.location_sector}</p>

    {/* NEW: Add inventory button */}
    <Button
      size="small"
      onClick={() => navigate(`/ship/${ship.id}/inventory`)}
      style={{ marginTop: '12px' }}
    >
      View Inventory
    </Button>
  </div>
))}
```

---

### 6. Update Router

**File**: `src/router.tsx` (modifications)

Add new inventory route.

```typescript
import { ShipInventoryPage } from './pages/ShipInventoryPage';

// Add to routes:
{
  path: '/ship/:shipId/inventory',
  element: <ProtectedRoute><ShipInventoryPage /></ProtectedRoute>,
}
```

---

### 7. Update Ship Interface

**File**: `src/api/ships.ts` (modifications)

Add `current_cargo_used` field to Ship interface.

```typescript
export interface Ship {
  id: string;
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  hull_points: number;
  hull_max: number;
  shield_points: number;
  shield_max: number;
  cargo_capacity: number;
  current_cargo_used?: number;  // NEW FIELD
  location_sector: string;
  created_at: string;
  stat_allocation?: ShipStats;
}
```

---

## Testing Checklist

### Inventory Display
- [ ] Inventory page loads for valid ship ID
- [ ] Cargo capacity bar displays correctly
- [ ] Empty state shows when no items
- [ ] Resources display with correct icons and colors
- [ ] Quality bars render for non-1.0 quality items
- [ ] Rarity colors match tier system

### Resource Selection
- [ ] Clicking resource item selects it
- [ ] Selected state visual feedback works
- [ ] Only one item can be selected at a time
- [ ] Deselect button works

### Transfer Functionality
- [ ] Transfer modal opens when item selected
- [ ] Target type dropdown works
- [ ] Quantity slider and input sync correctly
- [ ] Max quantity enforced
- [ ] Error messages display for failed transfers
- [ ] Success closes modal and refreshes inventory
- [ ] Loading state shows during transfer

### Integration
- [ ] Dashboard "View Inventory" button navigates correctly
- [ ] Back button returns to dashboard
- [ ] React Query caching works
- [ ] Multiple ships maintain separate inventories

### Visual/UX
- [ ] Responsive on desktop
- [ ] Animations smooth
- [ ] Space theme consistent
- [ ] Resource colors visible and distinct
- [ ] Modal backdrop blur works
- [ ] Hover effects functional

---

## Additional Features (Future)

### Quick Actions
- Jettison (delete) resources
- Sort/filter by rarity or type
- Bulk transfer operations

### Enhanced Display
- 3D resource visualization
- Inventory history/log
- Resource tooltips with extended info

### Integration Points
- Mining system (adds resources)
- Trading system (buy/sell from inventory)
- Crafting system (consume resources)
- Combat loot (gain resources)

---

## Notes

- All API calls use the existing `apiClient` with JWT auth
- React Query handles caching and invalidation
- Color scheme matches existing space theme
- Component structure follows established patterns
- Error handling uses existing error display components
- TypeScript types ensure type safety across app

---

## Summary

This implementation adds complete inventory management to the SSW Galaxy MMO frontend:

1. **API Integration**: New `/inventory` endpoints
2. **Visual Components**: Resource items, cargo bar, transfer modal
3. **Full Page**: Ship inventory management
4. **Dashboard Integration**: Quick access to inventory
5. **Type Safety**: Complete TypeScript coverage
6. **UX Polish**: Animations, colors, responsive design

The system is ready for extension with mining, trading, and combat features once backend support is added.
