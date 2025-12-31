# Missions

## Overview

The mission system provides structured objectives for players, offering rewards like credits, reputation, and items. Missions are filtered by player level and faction standing.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/missions/available` | Get available mission templates |
| GET | `/missions/active` | Get active missions |
| GET | `/missions/{id}` | Get mission details |
| POST | `/missions/{id}/accept` | Accept a mission |
| POST | `/missions/{id}/abandon` | Abandon a mission |
| GET | `/missions/completed` | Get completed history |

## Data Types

### MissionTemplate
```typescript
interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  mission_type: MissionType;
  difficulty: 'easy' | 'medium' | 'hard' | 'elite';
  min_level: number;
  faction_id: string;
  min_reputation: number;
  rewards: MissionRewards;
  objectives: ObjectiveTemplate[];
  time_limit_minutes: number | null;
  cooldown_minutes: number;
}
```

### Mission (Instance)
```typescript
interface Mission {
  id: string;
  template_id: string;
  player_id: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  objectives: Objective[];
  started_at: string;
  expires_at: string | null;
  completed_at: string | null;
}
```

### Objective
```typescript
interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  target_id: string | null;
  target_count: number;
  current_count: number;
  is_complete: boolean;
}
```

### MissionRewards
```typescript
interface MissionRewards {
  credits: number;
  reputation: number;
  items: RewardItem[];
}
```

## Mission Types

| Type | Description |
|------|-------------|
| delivery | Transport cargo to destination |
| combat | Destroy enemy targets |
| mining | Extract resources |
| exploration | Visit specified locations |
| escort | Protect NPC ship |
| bounty | Hunt specific targets |

## Source Files

| File | Purpose |
|------|---------|
| `api/missions.ts` | API client methods |
| `stores/missionStore.ts` | Mission state |
| `hooks/useMissionEvents.ts` | SSE event handlers |
| `app/missions.tsx` | Missions screen |

## Mission Flow

1. **Browse Available**
   - View missions filtered by level/reputation
   - See difficulty, rewards, requirements

2. **Accept**
   - Mission instance created
   - Objectives tracked
   - Timer starts (if time-limited)

3. **Progress**
   - Complete objectives
   - SSE events update progress
   - Notifications on milestones

4. **Complete/Fail**
   - All objectives done = complete
   - Time expired or abandoned = fail
   - Rewards distributed on completion

## Real-Time Events

Mission events received via SSE:

| Event | Description |
|-------|-------------|
| `mission_complete` | Mission finished, rewards given |
| `objective_complete` | Single objective done |
| `mission_expire_warning` | Time running low |

## Components

### MissionList
- Available/active/completed tabs
- Filter by type
- Sort by difficulty/rewards

### MissionCard
- Mission summary
- Difficulty indicator
- Reward preview

### MissionDetailModal
- Full description
- Objective list with progress
- Accept/abandon buttons

### ActiveMissionTracker
- Quick view of current missions
- Objective progress bars

### MissionNotification
- Completion notifications
- Reward summaries

## Integration Points

- **Factions**: Missions affect reputation
- **Credits**: Mission rewards
- **Inventory**: Item rewards
- **Combat**: Combat objectives
- **Mining**: Mining objectives
- **Navigation**: Delivery objectives
