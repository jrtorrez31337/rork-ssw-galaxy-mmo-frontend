# Factions & Reputation

## Overview

The faction system represents the political landscape of the galaxy. Players belong to factions and build reputation with them, unlocking missions, markets, and territory access.

## Factions API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/factions` | List all factions |
| GET | `/v1/factions/{id}` | Get faction details |
| GET | `/v1/factions/{id}/members` | Get faction members |
| GET | `/v1/factions/{id}/relations` | Get diplomatic relations |
| GET | `/v1/factions/{id}/territory` | Get controlled territory |
| GET | `/v1/sectors/{id}/influence` | Get sector influence |
| GET | `/v1/galaxy/influence-map` | Get galaxy-wide map |

## Reputation API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reputation` | Get all reputations |
| GET | `/reputation/{factionId}` | Get specific reputation |
| GET | `/reputation/history` | Get reputation history |
| GET | `/reputation/tiers` | Get tier definitions |

## Data Types

### Faction
```typescript
interface Faction {
  id: string;
  name: string;
  description: string;
  color: string;
  logo_url: string;
  home_sector: string;
}
```

### FactionDetails
```typescript
interface FactionDetails extends Faction {
  lore: string;
  leader_name: string;
  member_count: number;
  controlled_sectors: number;
  founded_date: string;
}
```

### FactionRelations
```typescript
interface FactionRelations {
  faction_id: string;
  relations: Relation[];
}

interface Relation {
  target_faction_id: string;
  status: 'allied' | 'friendly' | 'neutral' | 'hostile' | 'war';
  modifier: number; // Affects reputation gains
}
```

### SectorInfluence
```typescript
interface SectorInfluence {
  sector_id: string;
  influences: FactionInfluence[];
  controlling_faction: string | null;
}

interface FactionInfluence {
  faction_id: string;
  influence_points: number;
  percentage: number;
}
```

### Reputation
```typescript
interface Reputation {
  faction_id: string;
  points: number;
  tier: ReputationTier;
  next_tier: ReputationTier | null;
  progress_to_next: number;
}

type ReputationTier =
  | 'hostile'
  | 'unfriendly'
  | 'neutral'
  | 'friendly'
  | 'honored'
  | 'revered'
  | 'exalted';
```

## Source Files

| File | Purpose |
|------|---------|
| `api/factions.ts` | Factions API client |
| `api/reputation.ts` | Reputation API client |
| `hooks/useReputationEvents.ts` | SSE event handlers |

## Reputation Tiers

| Tier | Points | Effects |
|------|--------|---------|
| Hostile | -3000+ | Attacked on sight |
| Unfriendly | -1000 to -2999 | Denied services |
| Neutral | -999 to 999 | Standard access |
| Friendly | 1000 to 2999 | Discounts |
| Honored | 3000 to 5999 | Special missions |
| Revered | 6000 to 9999 | Elite access |
| Exalted | 10000+ | Full trust |

## Real-Time Events

Reputation events received via SSE:

| Event | Description |
|-------|-------------|
| `reputation_change` | Points gained/lost |
| `tier_change` | Moved to new tier |

## Components

### ReputationList
- All faction standings
- Progress bars to next tier
- Tier badges

### ReputationHistory
- Recent reputation changes
- Source of change (mission, combat, etc.)
- Timestamp

### FactionCard
- Faction summary
- Current standing
- Controlled sectors

### FactionDetailsPanel
- Full faction info
- Diplomatic relations
- Territory map

### FactionsList
- Browse all factions
- Sort by standing

## Integration Points

- **Missions**: Reputation unlocks missions
- **Trading**: Reputation affects prices
- **Territory**: Reputation grants access
- **Combat**: Hostile factions attack
- **NPCs**: NPC behavior based on standing
