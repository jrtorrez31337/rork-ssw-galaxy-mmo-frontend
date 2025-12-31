# Character & Profile

## Overview

The character system manages player identities within the game world. Each profile (account) can have characters with unique names, faction affiliations, home sectors, and attribute allocations.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/characters` | Create new character |
| GET | `/characters/{id}` | Get character by ID |
| GET | `/characters/by-profile/{profileId}` | Get all characters for profile |
| PATCH | `/characters/{id}` | Update character name |

## Data Types

### CreateCharacterRequest
```typescript
interface CreateCharacterRequest {
  profile_id: string;
  name: string;
  faction_id: string;
  home_sector: string;
  attributes: CharacterAttributes;
}
```

### CharacterAttributes
```typescript
interface CharacterAttributes {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  perception: number;
  endurance: number;
}
```

### Character
```typescript
interface Character {
  id: string;
  profile_id: string;
  name: string;
  faction_id: string;
  home_sector: string;
  attributes: CharacterAttributes;
  created_at: string;
  updated_at: string;
}
```

## Source Files

| File | Purpose |
|------|---------|
| `api/characters.ts` | API client methods |
| `app/character-create.tsx` | Character creation screen |
| `components/panels/CharacterEditPanel.tsx` | Character editing UI |
| `types/api.ts` | Type definitions |

## Character Creation Flow

1. User completes signup
2. Redirected to character creation wizard
3. Steps:
   - Enter character name
   - Select faction affiliation
   - Choose home sector
   - Allocate attribute points (6 attributes)
4. Character created via API
5. User enters main game

## Attribute System

Characters have 6 attributes that can be allocated during creation:

| Attribute | Effect |
|-----------|--------|
| Strength | Physical power, cargo capacity |
| Agility | Speed, evasion, maneuverability |
| Intelligence | Tech skills, scanning range |
| Charisma | Trading prices, faction gains |
| Perception | Detection range, accuracy |
| Endurance | Hull strength, stamina |

## Components

### CharacterEditPanel
- Displays current character info
- Allows name changes
- Shows current stats and attributes

## Integration Points

- **Faction System**: Characters belong to a faction
- **Sector System**: Characters have a home sector
- **Ship System**: Characters own ships
- **Reputation System**: Character-based faction standings
