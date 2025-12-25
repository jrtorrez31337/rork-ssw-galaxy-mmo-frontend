# Reputation System Integration

## Overview

The reputation system has been successfully integrated into the frontend, allowing players to view and track their standing with various factions in the game.

## What Was Implemented

### 1. TypeScript Types (`types/api.ts`)
- `ReputationTier` - 7-tier system from Reviled to Exalted
- `ReputationEffect` - Effects granted by reputation levels
- `ReputationChangeReason` - Reasons for reputation changes
- `FactionReputation` - Single faction reputation data
- `PlayerReputations` - All faction reputations for a player
- `ReputationHistoryEvent` - Individual reputation change event
- `ReputationHistory` - Collection of reputation events
- `ReputationTierDefinition` - Tier configuration
- `ReputationTierChangeEvent` - Real-time tier change event

### 2. API Client (`api/reputation.ts`)
- `getAllReputations(playerId)` - Fetch all faction reputations
- `getFactionReputation(playerId, factionId)` - Fetch specific faction reputation
- `getReputationHistory(playerId, params?)` - Fetch reputation change history
- `getTiers()` - Fetch reputation tier definitions

### 3. React Native Components

#### `components/reputation/ReputationCard.tsx`
Displays individual faction reputation with:
- Faction name and icon
- Current tier with color-coded badge
- Progress bar showing score (-1000 to +1000)
- Active effects
- Last updated timestamp
- Optional tap handler for viewing history

#### `components/reputation/ReputationList.tsx`
Displays all faction reputations:
- Sorted by score (highest first)
- Loading and empty states
- Tap to view history

#### `components/reputation/ReputationHistory.tsx`
Displays reputation change history:
- Timeline view of events
- Positive/negative change indicators
- Reason for each change
- Standing progression (before → after)
- Timestamps

#### `components/reputation/utils.ts`
Helper functions:
- `getTierColor(tier)` - Returns color for reputation tier
- `getFactionName(factionId)` - Maps faction IDs to display names
- `formatReputationReason(reason)` - Formats change reasons

### 4. Dashboard Integration (`app/dashboard.tsx`)
- Added Faction Reputation section
- Integrated React Query for data fetching
- Modal for viewing reputation history
- Real-time update support (placeholder)

### 5. Real-time Events Hook (`hooks/useReputationEvents.ts`)
- `useReputationEvents(playerId, callbacks)` - SSE subscription hook
- `useReputationPolling(playerId, interval)` - Polling fallback
- Automatic query invalidation on tier changes
- Custom callback support for notifications

## Usage

### Viewing Reputation in Dashboard

The reputation section is automatically displayed in the dashboard for authenticated users:

```typescript
// The dashboard already includes:
// 1. Query to fetch reputations
// 2. ReputationList component to display them
// 3. Modal to show history when tapping a faction
```

### Using Reputation API Directly

```typescript
import { reputationApi } from '@/api/reputation';

// Get all reputations
const reputations = await reputationApi.getAllReputations(playerId);

// Get specific faction reputation
const reputation = await reputationApi.getFactionReputation(
  playerId,
  'terran_federation'
);

// Get reputation history
const history = await reputationApi.getReputationHistory(playerId, {
  faction_id: 'terran_federation',
  limit: 20,
});

// Get tier definitions
const tiers = await reputationApi.getTiers();
```

### Using React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { reputationApi } from '@/api/reputation';

function MyComponent({ playerId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reputations', playerId],
    queryFn: () => reputationApi.getAllReputations(playerId),
    enabled: !!playerId,
  });

  // Use data.reputations array
}
```

## Reputation Tiers

| Tier | Score Range | Color | Description |
|------|-------------|-------|-------------|
| **Reviled** | -1000 to -500 | Dark Red (#8B0000) | Kill on sight, no access |
| **Hostile** | -499 to -100 | Red (#DC143C) | Severely disliked, attack on sight |
| **Unfriendly** | -99 to -1 | Tomato (#FF6347) | Disliked, higher prices |
| **Neutral** | 0 to 99 | Gray (#808080) | Standard standing |
| **Friendly** | 100 to 499 | Steel Blue (#4682B4) | Liked, discounts |
| **Honored** | 500 to 899 | Royal Blue (#4169E1) | Highly regarded, special missions |
| **Exalted** | 900 to 1000 | Gold (#FFD700) | Maximum standing, best prices |

## Known Factions

The system includes display names for common factions:
- `terran_federation` → Terran Federation
- `void_consortium` → Void Consortium
- `stellar_alliance` → Stellar Alliance
- `crimson_fleet` → Crimson Fleet
- `free_traders` → Free Traders Guild
- `scientific_directorate` → Scientific Directorate
- `mining_collective` → Mining Collective
- `independent_systems` → Independent Systems

Unknown faction IDs are automatically formatted (e.g., `my_faction` → "My Faction").

## Next Steps

### 1. SSE Implementation

The real-time events system is structured but not yet implemented. To enable SSE:

**Option A: Install react-native-sse**
```bash
npm install react-native-sse
```

Then uncomment the SSE code in `hooks/useReputationEvents.ts`.

**Option B: Use polling fallback**
```typescript
import { useReputationPolling } from '@/hooks/useReputationEvents';

// In your component:
useReputationPolling(profileId, 30000); // Poll every 30 seconds
```

**Option C: Implement WebSocket alternative**

If the backend supports WebSockets, create a similar hook using WebSocket API.

### 2. Backend URL Configuration

The documentation references the Social Service on port 8005, but `constants/config.ts` currently points to port 8080:

```typescript
// Current:
const API_BASE_URL = 'http://192.168.122.76:8080/v1';

// If Social Service is separate:
// You may need to add a separate config for SSE endpoints
```

**Action Required:**
- Verify if reputation endpoints are on port 8080 or 8005
- Update config if needed
- Ensure backend CORS allows the frontend origin

### 3. Additional Features to Consider

**Faction Details Screen:**
Create a dedicated screen for detailed faction information:
- Full history
- Available missions
- Current effects
- Progress to next tier

**Notifications:**
Enhance the tier change notification:
- Show in-app toast notifications
- Add sound/haptic feedback
- Queue multiple notifications

**Filters and Search:**
Add ability to filter reputations:
- By tier (show only Friendly+)
- By faction type
- Search by faction name

**Analytics:**
Track reputation progression:
- Charts showing reputation over time
- Statistics (total gains/losses)
- Comparison between factions

## API Endpoint Reference

Based on the backend documentation:

```
GET  /v1/players/{player_id}/reputation
GET  /v1/players/{player_id}/reputation/{faction_id}
GET  /v1/players/{player_id}/reputation/history?faction_id={id}&limit={n}
GET  /v1/reputation/tiers
SSE  /v1/events?channels=social.reputation.tier_change
```

All endpoints require JWT authentication via `Authorization: Bearer {token}` header (handled automatically by `apiClient`).

## Testing

To test the reputation system:

1. **Start the backend** with reputation data seeded
2. **Login** to the app
3. **Navigate to dashboard** (automatic after login)
4. **Scroll down** to the Faction Reputation section
5. **Tap a faction** to view reputation history
6. **Make in-game actions** that affect reputation
7. **Verify real-time updates** (once SSE is implemented)

## Troubleshooting

**No reputation data showing:**
- Check that backend is running and accessible
- Verify API base URL in `constants/config.ts`
- Check network tab for API errors
- Ensure player has reputation records in database

**History not loading:**
- Verify faction_id is being passed correctly
- Check that history endpoint is accessible
- Review backend logs for errors

**SSE not connecting:**
- Ensure SSE library is installed
- Uncomment SSE code in useReputationEvents.ts
- Verify CORS configuration on backend
- Check that access token is being sent

**Type errors:**
- Run `npx tsc --noEmit` to check for type issues
- Ensure all imports are correct
- Verify API responses match type definitions

## Files Modified/Created

### Created:
- `api/reputation.ts` - Reputation API client
- `components/reputation/ReputationCard.tsx` - Individual faction card
- `components/reputation/ReputationList.tsx` - List of all reputations
- `components/reputation/ReputationHistory.tsx` - History timeline
- `components/reputation/utils.ts` - Helper functions
- `hooks/useReputationEvents.ts` - SSE/polling hook
- `REPUTATION_INTEGRATION.md` - This file

### Modified:
- `types/api.ts` - Added reputation types
- `app/dashboard.tsx` - Added reputation section

## Code Quality

- ✅ TypeScript compilation: **PASSED**
- ✅ All types properly defined
- ✅ Follows existing code patterns
- ✅ React Query integration
- ✅ Consistent styling with existing UI
- ✅ Proper error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design

## Summary

The reputation system is fully integrated and ready to use. The only remaining step is implementing the actual SSE connection (currently a placeholder) or using the polling fallback for real-time updates.

All components follow the existing architectural patterns and styling conventions of the codebase, ensuring consistency and maintainability.
