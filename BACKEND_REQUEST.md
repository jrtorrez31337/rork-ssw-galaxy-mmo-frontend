# Backend Feature Request: Galaxy Influence Map

## Overview

Sprint 3 frontend implementation includes a `GalaxyMap` component for visualizing faction territories across the galaxy. The frontend is complete but requires backend endpoints that are currently not implemented.

## Missing Endpoints

### 1. `GET /v1/galaxy/influence-map`

**Purpose:** Returns a galaxy-wide view of faction control for all explored/known sectors.

**Current Status:** Returns `404 page not found`

**Expected Response Structure:**
```json
{
  "data": {
    "sectors": [
      {
        "sector": "0.0.0",
        "controlling_faction": "terran_federation",
        "influences": [
          {
            "faction_id": "terran_federation",
            "faction_name": "Terran Federation",
            "influence": 85,
            "is_controlling": true
          },
          {
            "faction_id": "void_consortium",
            "faction_name": "Void Consortium",
            "influence": 15,
            "is_controlling": false
          }
        ]
      }
    ],
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Implementation Notes:**
- Should aggregate data from the faction territory system
- Can be computed from `faction_territories` table (if exists) or derived from sector metadata
- Consider caching since this is expensive to compute
- May want pagination or bounding box filter for large galaxies

**Query Parameters (suggested):**
- `min_x`, `max_x`, `min_y`, `max_y` - bounding box filter
- `faction_id` - filter to specific faction's territory
- `include_contested` - include sectors with multiple high influences

---

### 2. `GET /v1/sectors/{sector_id}/influence`

**Purpose:** Returns detailed faction influence breakdown for a specific sector.

**Current Status:** Returns `404 page not found`

**Expected Response Structure:**
```json
{
  "data": {
    "sector": "0.0.0",
    "influences": [
      {
        "faction_id": "terran_federation",
        "faction_name": "Terran Federation",
        "influence": 85,
        "is_controlling": true
      }
    ],
    "controlling_faction": "terran_federation",
    "is_contested": false,
    "last_changed_at": "2025-01-01T00:00:00Z"
  }
}
```

**Implementation Notes:**
- Similar to what's already in sector metadata but more detailed
- The `/sectors/{id}/metadata` endpoint already returns `faction_id`, `faction_name`, `faction_tag`
- This could be merged into metadata or kept separate for detailed influence data

---

## Existing Related Endpoints (Working)

These endpoints work and inform the expected patterns:

### `GET /v1/factions`
Returns list of all factions with basic info.

### `GET /v1/factions/{faction_id}/territory`
Returns territory data for a faction. Currently returns empty `sectors: []` (needs data seeding).

```json
{
  "data": {
    "faction_id": "terran_federation",
    "controlled_count": 0,
    "contested_count": 0,
    "influenced_count": 0,
    "total_influence": 0,
    "sectors": []
  }
}
```

### `GET /v1/sectors/{sector_id}/metadata`
Returns sector metadata including faction control. **This works!**

```json
{
  "data": {
    "sector_id": "0.0.0",
    "name": "Sol",
    "faction_id": "terran_federation",
    "faction_name": "Terran Federation",
    "faction_tag": "TF",
    "control_type": "controlled",
    "threat_level": 1,
    "sector_type": "capital"
  }
}
```

---

## Database Schema (Inferred)

Based on existing patterns, the backend likely needs:

### Option A: Use Existing Sector Metadata
The `/sectors/{id}/metadata` endpoint already has faction info. The galaxy map could:
1. Query all sectors with metadata
2. Aggregate by faction
3. Return the influence map

### Option B: Dedicated Faction Territory Table
```sql
CREATE TABLE faction_territories (
  id UUID PRIMARY KEY,
  faction_id TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  influence INT NOT NULL DEFAULT 0,  -- 0-100
  is_controlling BOOLEAN NOT NULL DEFAULT false,
  established_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(faction_id, sector_id)
);

CREATE INDEX idx_territories_sector ON faction_territories(sector_id);
CREATE INDEX idx_territories_faction ON faction_territories(faction_id);
```

---

## Implementation Suggestion

### Minimal Implementation (Quick)

Add to worldsim or social service:

```go
// GET /v1/galaxy/influence-map
func (h *Handler) GetGalaxyInfluenceMap(w http.ResponseWriter, r *http.Request) {
    // Query all sectors that have faction metadata
    rows, err := h.db.Query(`
        SELECT sector_id, faction_id, faction_name, faction_tag
        FROM sector_metadata
        WHERE faction_id IS NOT NULL
        ORDER BY sector_id
    `)

    // Transform to response format
    sectors := []SectorInfluence{}
    for rows.Next() {
        // Build influence entries
        sectors = append(sectors, SectorInfluence{
            Sector: sectorId,
            ControllingFaction: factionId,
            Influences: []FactionInfluence{{
                FactionId: factionId,
                FactionName: factionName,
                Influence: 100,  // Full control if in metadata
                IsControlling: true,
            }},
        })
    }

    json.NewEncoder(w).Encode(Response{
        Data: GalaxyInfluenceMap{
            Sectors: sectors,
            UpdatedAt: time.Now(),
        },
    })
}
```

### Full Implementation (Better)

1. Create `faction_territories` table with influence percentages
2. Seed initial territory data based on faction home systems
3. Implement influence calculation based on:
   - Player activity in sector
   - NPC faction presence
   - Station ownership
   - Combat outcomes
4. Add SSE events for territory changes: `game.faction.territory_changed`

---

## Frontend Integration

The frontend `GalaxyMap` component (`components/galaxy/GalaxyMap.tsx`) is ready:

```typescript
// Already implemented in factionsApi
getGalaxyInfluenceMap: async (): Promise<GalaxyInfluenceMap> => {
  const response = await apiClient.get<{ data: GalaxyInfluenceMap }>(
    '/v1/galaxy/influence-map'
  );
  return response.data;
}
```

The component:
- Fetches influence map on mount
- Renders 2D grid of sectors colored by faction
- Shows zoom controls and faction legend
- Displays sector details on tap
- Marks current player location

---

## Priority

**High** - This is a key visualization feature for faction gameplay. Without it:
- Players can't see faction territories at a glance
- No strategic overview of galaxy control
- Faction conflict mechanics have no visual feedback

**Workaround:** The frontend gracefully handles the 404 and shows "No galaxy data available" message.

---

## Related Frontend Files

- `components/galaxy/GalaxyMap.tsx` - Main component
- `app/galaxy-map.tsx` - Full-screen route
- `app/factions.tsx` - Has button to open galaxy map
- `api/factions.ts` - API client with `getGalaxyInfluenceMap()`
- `types/factions.ts` - TypeScript types for `GalaxyInfluenceMap`, `SectorInfluence`
