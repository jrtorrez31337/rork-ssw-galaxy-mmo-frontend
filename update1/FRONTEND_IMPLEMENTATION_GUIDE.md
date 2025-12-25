# Frontend Implementation Guide - Inventory & Cargo System

## Quick Start

This guide provides a streamlined overview for implementing the Inventory & Cargo System frontend.

---

## What's Been Completed (Backend)

✅ **Database Schema**
- `inventory_items` table with owner_id, owner_type, resource_type, quantity, quality
- `ships` table updated with `current_cargo_used` field
- 12 resource types across 3 tiers (Common, Uncommon, Rare/Legendary)

✅ **API Endpoints**
- `GET /v1/inventory/:owner_id?owner_type={ship|station|planet}&resource_type={optional}`
- `POST /v1/inventory/transfer`

✅ **Business Logic**
- Cargo capacity validation
- Transfer proximity checks
- Quality tracking (0.50 - 2.00 multiplier)
- Error handling for all edge cases

✅ **Tests**
- Comprehensive unit tests for handlers, service, and repository
- Integration tests covering all transfer scenarios

---

## What Needs to Be Built (Frontend)

### File Structure
```
src/
├── api/
│   └── inventory.ts                    # NEW: API client for inventory endpoints
├── constants/
│   └── resources.ts                    # NEW: Resource metadata (colors, icons, tiers)
├── components/
│   └── inventory/
│       ├── ResourceItem.tsx            # NEW: Display single resource
│       ├── ResourceItem.css
│       ├── CargoCapacityBar.tsx        # NEW: Visual cargo bar
│       ├── CargoCapacityBar.css
│       ├── TransferModal.tsx           # NEW: Transfer dialog
│       └── TransferModal.css
├── pages/
│   ├── ShipInventoryPage.tsx           # NEW: Main inventory page
│   ├── ShipInventoryPage.css
│   └── DashboardPage.tsx               # MODIFY: Add inventory buttons
└── router.tsx                          # MODIFY: Add inventory route
```

### Implementation Steps

#### Step 1: API Layer (30 min)
Create `src/api/inventory.ts` with:
- TypeScript interfaces for Inventory, InventoryItem, TransferRequest
- `inventoryApi.getInventory()` and `inventoryApi.transfer()` functions
- Uses existing `apiClient` from `src/api/client.ts`

#### Step 2: Resource Metadata (15 min)
Create `src/constants/resources.ts` with:
- `RESOURCE_METADATA` object mapping resource types to colors/icons/descriptions
- `RARITY_COLORS` for visual theming

#### Step 3: UI Components (2 hours)
Build three reusable components:

1. **ResourceItem**: Displays a resource card with icon, quantity, quality bar
2. **CargoCapacityBar**: Progress bar showing used/capacity
3. **TransferModal**: Modal dialog for transferring resources

#### Step 4: Inventory Page (1.5 hours)
Create `ShipInventoryPage.tsx`:
- Fetches inventory using React Query
- Displays cargo bar and resource grid
- Handles resource selection and transfer modal
- Shows ship details sidebar

#### Step 5: Integration (30 min)
- Update `DashboardPage.tsx`: Add "View Inventory" button to ship cards
- Update `router.tsx`: Add route `/ship/:shipId/inventory`
- Update `src/api/ships.ts`: Add `current_cargo_used?: number` to Ship interface

---

## Resource Visual Reference

### Tier 1 - Common (Gray)
| Resource | Icon | Color | Use |
|----------|------|-------|-----|
| iron_ore | 🪨 | #B87333 | Hull repairs |
| ice_water | 💧 | #87CEEB | Life support |
| silicates | 🔷 | #D3D3D3 | Electronics |
| hydrogen | ⚡ | #FFA500 | Fuel |
| carbon | ◆ | #2F4F4F | Shields |

### Tier 2 - Uncommon (Blue)
| Resource | Icon | Color | Use |
|----------|------|-------|-----|
| titanium_ore | 🔩 | #C0C0C0 | Advanced hull |
| platinum | 💎 | #E5E4E2 | Power systems |
| rare_earth | 🌐 | #9370DB | Sensors |
| xenon_gas | 💨 | #00CED1 | Shield boosters |

### Tier 3 - Rare (Purple/Gold)
| Resource | Icon | Color | Use |
|----------|------|-------|-----|
| antimatter | ⚛️ | #FF1493 | Weapons |
| exotic_crystals | 💠 | #9400D3 | Legendary gear |
| ancient_artifacts | 🏺 | #FFD700 | Reputation |

---

## API Response Examples

### GET Inventory Response
```json
{
  "data": {
    "owner_id": "ship-uuid",
    "owner_type": "ship",
    "capacity": 300,
    "used": 145,
    "items": [
      {
        "id": "item-uuid",
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

### POST Transfer Request
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

### Error Response
```json
{
  "error": {
    "code": "CARGO_FULL",
    "message": "Target cargo is full"
  }
}
```

---

## Testing Checklist

### Component Tests
- [ ] ResourceItem renders with correct icon/color
- [ ] Quality bar displays correctly for non-1.0 quality
- [ ] CargoCapacityBar shows warning at 80%, error at 100%
- [ ] TransferModal validates quantity limits
- [ ] Transfer modal shows loading state

### Integration Tests
- [ ] Inventory page loads ship data
- [ ] Empty state displays when no items
- [ ] Resource selection works
- [ ] Transfer succeeds and refreshes inventory
- [ ] Error messages display for failed transfers
- [ ] Dashboard button navigates to inventory page

### UX Tests
- [ ] Responsive on desktop
- [ ] Smooth animations
- [ ] Colors accessible (contrast)
- [ ] Loading states clear
- [ ] Error messages helpful

---

## Design System Alignment

The implementation follows the existing SSW frontend patterns:

### Colors
- **Background**: Dark gradient (`#0f0c29` → `#302b63` → `#24243e`)
- **Primary**: Purple (`#8B5CF6`)
- **Cards**: Glass morphism (translucent with blur)
- **Text**: White with opacity variants

### Components
- Uses existing `Card`, `Button`, `Input` components
- Follows same CSS naming conventions
- Maintains space theme aesthetic

### State Management
- React Query for API caching
- Local state for UI (selection, modals)
- Zustand for auth (already implemented)

---

## Future Enhancements

After basic implementation, consider:

1. **Sorting/Filtering**: Filter by tier, sort by quantity/quality
2. **Bulk Operations**: Select multiple resources for transfer
3. **Jettison**: Delete resources to free cargo space
4. **Transfer History**: Log of recent transfers
5. **Resource Tooltips**: Extended info on hover
6. **3D Resource Icons**: WebGL visualization
7. **Auto-stacking**: Merge same resources with different quality

---

## Reference Documents

- **Full Spec**: `frontend_update_prompt.md` - Detailed implementation guide with all code
- **Backend Plan**: `update_prompt.md` - Original backend feature spec
- **Architecture**: `potential_plan.txt` - Overall system architecture plan
- **Frontend Codebase**: `/home/jon/code/ssw-fe-genspark/`
- **Backend Codebase**: `/home/jon/code/ssw/services/worldsim/internal/inventory/`

---

## API Gateway Configuration

The inventory endpoints are served through the WorldSim service:

**Base URL**: `http://localhost:8080/v1/`

**Routes**:
- `GET /inventory/:owner_id` → WorldSim inventory handler
- `POST /inventory/transfer` → WorldSim transfer handler

**Authentication**: Requires JWT token (handled by existing `apiClient`)

---

## Estimated Timeline

- **API Layer**: 30 minutes
- **Constants**: 15 minutes
- **Components**: 2 hours
- **Inventory Page**: 1.5 hours
- **Integration**: 30 minutes
- **Testing**: 1 hour
- **Polish/Fixes**: 1 hour

**Total**: ~6.5 hours for complete implementation

---

## Getting Started

1. **Read**: Review `frontend_update_prompt.md` for complete code samples
2. **Setup**: Ensure backend is running (`make start` from backend repo)
3. **Branch**: Create feature branch in frontend repo
4. **Implement**: Follow the step-by-step guide
5. **Test**: Use the testing checklist
6. **Review**: Compare against design system
7. **Commit**: Follow existing commit message style

---

## Questions & Support

- **Backend Issues**: Check `services/worldsim/internal/inventory/` for implementation
- **API Contracts**: See `frontend_update_prompt.md` for full API spec
- **Design System**: Reference existing pages in `src/pages/`
- **Component Patterns**: Check `src/components/ui/` for reusable components

---

**Status**: ✅ Backend Complete, Ready for Frontend Implementation

**Next Step**: Start with Step 1 (API Layer) in the implementation guide
