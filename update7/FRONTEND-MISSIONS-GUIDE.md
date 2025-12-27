# Frontend Implementation Guide: Mission System

**Version**: 1.0
**Date**: 2025-12-26
**For**: Frontend Development Team
**Backend API Version**: v1

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Steps](#implementation-steps)
5. [UI Components](#ui-components)
6. [State Management](#state-management)
7. [Real-Time Updates](#real-time-updates)
8. [Code Examples](#code-examples)
9. [Best Practices](#best-practices)
10. [Testing Recommendations](#testing-recommendations)

---

## Overview

The Mission System provides structured gameplay progression where players can:
- Browse available missions filtered by their level and faction reputation
- Accept missions (with cooldown tracking for repeatable missions)
- Track mission objectives in real-time as they play
- Receive automatic rewards upon completion
- View mission history

### Key Features

✅ **Automatic Progress Tracking**: Missions track progress through existing game events (combat, mining, movement, trade)
✅ **Real-Time Updates**: SSE events notify frontend of objective progress changes
✅ **Cooldown System**: Repeatable missions have cooldowns between completions
✅ **Time Limits**: Some missions expire after a set duration
✅ **Multi-Objective**: Missions can have multiple required and optional objectives
✅ **Rewards**: Automatic distribution of credits, items, and reputation

---

## Prerequisites

### Backend Requirements

Ensure the following services are running:
- **Gateway**: `http://192.168.122.76:8080`
- **Missions Service**: Port 8006 (proxied through gateway)
- **SSE Fanout Service**: Port 8086 (for real-time updates)

### Frontend Requirements

- Valid authentication token (from Identity Service)
- Player profile ID (from character selection)
- SSE connection established (for real-time updates)
- State management solution (Redux, Zustand, or Context API)

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION                      │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Missions   │───▶│   Mission    │───▶│  Objective   │ │
│  │  List View   │    │ Detail View  │    │   Tracker    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │          │
│         └────────────────────┼────────────────────┘          │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │   Mission Store   │                    │
│                    │   (State Mgmt)    │                    │
│                    └─────────┬─────────┘                    │
│                              │                               │
│         ┌────────────────────┼────────────────────┐         │
│         │                    │                    │         │
│    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐   │
│    │   REST  │         │   SSE   │         │  Local  │   │
│    │   API   │         │ Events  │         │  Cache  │   │
│    └─────────┘         └─────────┘         └─────────┘   │
└─────────┬─────────────────┬──────────────────────┬─────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│                 http://192.168.122.76:8080                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌─────▼──────┐                   ┌─────▼──────┐
    │  Missions  │                   │    SSE     │
    │  Service   │                   │  Fanout    │
    │  (8006)    │                   │  (8086)    │
    └────────────┘                   └────────────┘
```

### State Management Flow

```
User Action → API Call → Update State → Re-render UI
                              ↓
                    SSE Event → Update State → Re-render UI
```

---

## Implementation Steps

### Step 1: Set Up API Client

Create a dedicated missions API module:

```typescript
// src/api/missions.ts

import { apiClient } from './client';

export interface Mission {
  id: string;
  template_name: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned' | 'expired';
  assigned_at: string;
  expires_at?: string;
  completed_at?: string;
  progress_percentage: number;
  reward_credits: number;
  reward_reputation: number;
  objectives: Objective[];
}

export interface Objective {
  id: string;
  description: string;
  objective_type: string;
  current_progress: number;
  target_quantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  is_required: boolean;
}

export interface MissionTemplate {
  template_id: string;
  name: string;
  description: string;
  mission_type: string;
  faction_name?: string;
  required_level: number;
  required_reputation: number;
  reward_credits: number;
  reward_reputation: number;
  reward_items: RewardItem[];
  is_repeatable: boolean;
  cooldown_duration?: string;
  time_limit?: string;
  objectives: TemplateObjective[];
}

export interface TemplateObjective {
  description: string;
  objective_type: string;
  target_quantity: number;
  target_entity_type?: string;
  is_required: boolean;
}

export interface RewardItem {
  resource_type: string;
  quantity: number;
  quality: number;
}

// API Methods
export const missionsAPI = {
  // Get available missions
  getAvailable: async (): Promise<MissionTemplate[]> => {
    const response = await apiClient.get('/missions/available');
    return response.data.missions;
  },

  // Get active missions
  getActive: async (): Promise<Mission[]> => {
    const response = await apiClient.get('/missions/active');
    return response.data.missions;
  },

  // Get mission details
  getDetails: async (missionId: string): Promise<Mission> => {
    const response = await apiClient.get(`/missions/${missionId}`);
    return response.data.mission;
  },

  // Accept a mission
  accept: async (templateId: string): Promise<Mission> => {
    const response = await apiClient.post(`/missions/${templateId}/accept`);
    return response.data.mission;
  },

  // Abandon a mission
  abandon: async (missionId: string): Promise<void> => {
    await apiClient.post(`/missions/${missionId}/abandon`);
  },

  // Get completed missions history
  getCompleted: async (limit = 20, offset = 0): Promise<{
    missions: Mission[];
    total: number;
  }> => {
    const response = await apiClient.get('/missions/completed', {
      params: { limit, offset },
    });
    return response.data;
  },
};
```

### Step 2: Create State Management Store

Using Zustand (recommended for simplicity):

```typescript
// src/stores/missionStore.ts

import { create } from 'zustand';
import { missionsAPI, Mission, MissionTemplate } from '../api/missions';

interface MissionStore {
  // State
  availableMissions: MissionTemplate[];
  activeMissions: Mission[];
  completedMissions: Mission[];
  selectedMission: Mission | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAvailable: () => Promise<void>;
  fetchActive: () => Promise<void>;
  fetchCompleted: (limit?: number, offset?: number) => Promise<void>;
  fetchMissionDetails: (missionId: string) => Promise<void>;
  acceptMission: (templateId: string) => Promise<void>;
  abandonMission: (missionId: string) => Promise<void>;
  updateMissionProgress: (missionId: string, progress: Partial<Mission>) => void;
  clearError: () => void;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  // Initial state
  availableMissions: [],
  activeMissions: [],
  completedMissions: [],
  selectedMission: null,
  loading: false,
  error: null,

  // Fetch available missions
  fetchAvailable: async () => {
    set({ loading: true, error: null });
    try {
      const missions = await missionsAPI.getAvailable();
      set({ availableMissions: missions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch active missions
  fetchActive: async () => {
    set({ loading: true, error: null });
    try {
      const missions = await missionsAPI.getActive();
      set({ activeMissions: missions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch completed missions
  fetchCompleted: async (limit = 20, offset = 0) => {
    set({ loading: true, error: null });
    try {
      const { missions } = await missionsAPI.getCompleted(limit, offset);
      set({ completedMissions: missions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch mission details
  fetchMissionDetails: async (missionId: string) => {
    set({ loading: true, error: null });
    try {
      const mission = await missionsAPI.getDetails(missionId);
      set({ selectedMission: mission, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Accept mission
  acceptMission: async (templateId: string) => {
    set({ loading: true, error: null });
    try {
      const mission = await missionsAPI.accept(templateId);

      // Add to active missions
      set(state => ({
        activeMissions: [...state.activeMissions, mission],
        // Remove from available if non-repeatable
        availableMissions: state.availableMissions.filter(
          m => m.template_id !== templateId || m.is_repeatable
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Abandon mission
  abandonMission: async (missionId: string) => {
    set({ loading: true, error: null });
    try {
      await missionsAPI.abandon(missionId);

      // Remove from active missions
      set(state => ({
        activeMissions: state.activeMissions.filter(m => m.id !== missionId),
        selectedMission: state.selectedMission?.id === missionId ? null : state.selectedMission,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Update mission progress (from SSE events)
  updateMissionProgress: (missionId: string, progress: Partial<Mission>) => {
    set(state => ({
      activeMissions: state.activeMissions.map(mission =>
        mission.id === missionId
          ? { ...mission, ...progress }
          : mission
      ),
      selectedMission: state.selectedMission?.id === missionId
        ? { ...state.selectedMission, ...progress }
        : state.selectedMission,
    }));
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
```

### Step 3: Set Up SSE Event Listeners

```typescript
// src/services/missionEvents.ts

import { useMissionStore } from '../stores/missionStore';

export function setupMissionEventListeners(eventSource: EventSource) {
  const { updateMissionProgress, fetchActive, fetchAvailable } = useMissionStore.getState();

  // Mission assigned (just accepted)
  eventSource.addEventListener('mission_assigned', (event) => {
    const data = JSON.parse(event.data);
    console.log('Mission assigned:', data.payload);

    // Refresh active missions to include the new one
    fetchActive();
  });

  // Objective updated
  eventSource.addEventListener('objective_updated', (event) => {
    const data = JSON.parse(event.data);
    const { mission_id, current_progress, status } = data.payload;

    console.log('Objective updated:', data.payload);

    // Update the mission in state
    updateMissionProgress(mission_id, {
      // Fetch full details to get updated objectives
      // Or implement partial objective updates
    });
  });

  // Objective completed
  eventSource.addEventListener('objective_completed', (event) => {
    const data = JSON.parse(event.data);
    console.log('Objective completed:', data.payload);

    // Show notification
    showNotification('Objective Completed', data.payload.description);

    // Refresh mission details
    fetchActive();
  });

  // Mission completed
  eventSource.addEventListener('mission_completed', (event) => {
    const data = JSON.parse(event.data);
    const { mission_id, template_name, credits_awarded, reputation_awarded } = data.payload;

    console.log('Mission completed:', data.payload);

    // Show completion notification with rewards
    showMissionCompleteNotification({
      name: template_name,
      credits: credits_awarded,
      reputation: reputation_awarded,
    });

    // Refresh lists
    fetchActive();
    fetchAvailable();
  });

  // Mission expired
  eventSource.addEventListener('mission_expired', (event) => {
    const data = JSON.parse(event.data);
    const { mission_id } = data.payload;

    console.log('Mission expired:', data.payload);

    // Show warning notification
    showNotification('Mission Expired', 'A time-limited mission has expired', 'warning');

    // Refresh active missions
    fetchActive();
  });
}

function showNotification(title: string, message: string, type = 'info') {
  // Implement your notification system
  // Could use toast library, browser notifications, or in-game notifications
}

function showMissionCompleteNotification(rewards: {
  name: string;
  credits: number;
  reputation: number;
}) {
  // Show special mission complete modal/toast with animation
}
```

### Step 4: Initialize in Main App

```typescript
// src/App.tsx or equivalent

import { useEffect } from 'react';
import { useSSE } from './hooks/useSSE';
import { setupMissionEventListeners } from './services/missionEvents';
import { useMissionStore } from './stores/missionStore';

function App() {
  const { eventSource } = useSSE();
  const { fetchAvailable, fetchActive } = useMissionStore();

  useEffect(() => {
    if (eventSource) {
      // Set up mission event listeners
      setupMissionEventListeners(eventSource);
    }
  }, [eventSource]);

  useEffect(() => {
    // Fetch initial mission data on login
    fetchAvailable();
    fetchActive();
  }, []);

  return (
    // Your app content
  );
}
```

---

## UI Components

### Mission List Component

```tsx
// src/components/Missions/MissionList.tsx

import React, { useEffect } from 'react';
import { useMissionStore } from '../../stores/missionStore';

export function MissionList() {
  const { availableMissions, loading, error, fetchAvailable } = useMissionStore();

  useEffect(() => {
    fetchAvailable();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="mission-list">
      <h2>Available Missions</h2>
      {availableMissions.length === 0 ? (
        <p>No missions available at your current level</p>
      ) : (
        <div className="grid">
          {availableMissions.map(mission => (
            <MissionCard key={mission.template_id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Mission Card Component

```tsx
// src/components/Missions/MissionCard.tsx

import React from 'react';
import { MissionTemplate } from '../../api/missions';
import { useMissionStore } from '../../stores/missionStore';

interface Props {
  mission: MissionTemplate;
}

export function MissionCard({ mission }: Props) {
  const { acceptMission } = useMissionStore();
  const [accepting, setAccepting] = React.useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptMission(mission.template_id);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="mission-card">
      <div className="mission-header">
        <h3>{mission.name}</h3>
        <span className={`badge ${mission.mission_type}`}>
          {mission.mission_type}
        </span>
      </div>

      <p className="description">{mission.description}</p>

      {mission.faction_name && (
        <p className="faction">Faction: {mission.faction_name}</p>
      )}

      <div className="requirements">
        <span>Level {mission.required_level}</span>
        {mission.required_reputation > 0 && (
          <span>Reputation: {mission.required_reputation}</span>
        )}
      </div>

      <div className="rewards">
        <h4>Rewards:</h4>
        <ul>
          <li>💰 {mission.reward_credits} credits</li>
          <li>⭐ {mission.reward_reputation} reputation</li>
          {mission.reward_items.map((item, idx) => (
            <li key={idx}>
              📦 {item.quantity}x {item.resource_type}
            </li>
          ))}
        </ul>
      </div>

      <div className="objectives">
        <h4>Objectives:</h4>
        <ul>
          {mission.objectives.map((obj, idx) => (
            <li key={idx}>
              {obj.is_required && <span className="required">*</span>}
              {obj.description}
            </li>
          ))}
        </ul>
      </div>

      {mission.time_limit && (
        <p className="time-limit">⏱️ Time Limit: {mission.time_limit}</p>
      )}

      {mission.is_repeatable && (
        <p className="repeatable">
          🔄 Repeatable (Cooldown: {mission.cooldown_duration})
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={accepting}
        className="accept-button"
      >
        {accepting ? 'Accepting...' : 'Accept Mission'}
      </button>
    </div>
  );
}
```

### Active Missions Tracker

```tsx
// src/components/Missions/ActiveMissionTracker.tsx

import React from 'react';
import { useMissionStore } from '../../stores/missionStore';
import { formatDistanceToNow } from 'date-fns';

export function ActiveMissionTracker() {
  const { activeMissions, fetchMissionDetails } = useMissionStore();

  if (activeMissions.length === 0) {
    return null;
  }

  return (
    <div className="active-mission-tracker">
      <h3>Active Missions ({activeMissions.length})</h3>
      <div className="missions-compact">
        {activeMissions.map(mission => (
          <div
            key={mission.id}
            className="mission-compact"
            onClick={() => fetchMissionDetails(mission.id)}
          >
            <div className="info">
              <span className="name">{mission.template_name}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${mission.progress_percentage}%` }}
                />
              </div>
              <span className="percentage">{mission.progress_percentage}%</span>
            </div>

            {mission.expires_at && (
              <div className="expiry">
                ⏱️ Expires {formatDistanceToNow(new Date(mission.expires_at), { addSuffix: true })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Mission Detail Modal

```tsx
// src/components/Missions/MissionDetailModal.tsx

import React from 'react';
import { useMissionStore } from '../../stores/missionStore';

export function MissionDetailModal() {
  const { selectedMission, abandonMission } = useMissionStore();

  if (!selectedMission) return null;

  const handleAbandon = async () => {
    if (confirm('Are you sure you want to abandon this mission?')) {
      await abandonMission(selectedMission.id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="mission-detail-modal">
        <h2>{selectedMission.template_name}</h2>
        <p>{selectedMission.description}</p>

        <div className="progress-section">
          <h3>Progress: {selectedMission.progress_percentage}%</h3>
          <div className="progress-bar-large">
            <div
              className="progress-fill"
              style={{ width: `${selectedMission.progress_percentage}%` }}
            />
          </div>
        </div>

        <div className="objectives-section">
          <h3>Objectives</h3>
          {selectedMission.objectives.map(obj => (
            <div
              key={obj.id}
              className={`objective ${obj.status}`}
            >
              <div className="objective-header">
                <span className="description">{obj.description}</span>
                <span className="badge">{obj.status}</span>
              </div>
              <div className="objective-progress">
                <div className="progress-text">
                  {obj.current_progress} / {obj.target_quantity}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(obj.current_progress / obj.target_quantity) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rewards-section">
          <h3>Rewards</h3>
          <ul>
            <li>💰 {selectedMission.reward_credits} credits</li>
            <li>⭐ {selectedMission.reward_reputation} reputation</li>
          </ul>
        </div>

        <div className="actions">
          <button onClick={handleAbandon} className="danger">
            Abandon Mission
          </button>
          <button onClick={() => useMissionStore.setState({ selectedMission: null })}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Real-Time Updates

### Progress Tracking

The backend automatically tracks mission progress through game events. No additional API calls are needed from the frontend for progress updates.

**Automatic Tracking**:
- **Combat**: Killing NPCs increments `combat_kills` objectives
- **Mining**: Extracting resources increments `mine_resources` objectives
- **Movement**: Jumping/docking completes `visit_sector`/`dock_at_station` objectives

**Frontend receives SSE events** when:
- An objective progresses (`objective_updated`)
- An objective completes (`objective_completed`)
- A mission completes (`mission_completed`)

---

## Best Practices

### Performance

1. **Cache Mission Data**: Store available missions in localStorage to reduce API calls
2. **Debounce SSE Updates**: If receiving many progress updates, debounce state updates
3. **Lazy Load Mission Details**: Only fetch full details when user clicks on a mission
4. **Pagination**: Use pagination for completed missions history

### UX Considerations

1. **Visual Feedback**:
   - Show loading states when accepting/abandoning missions
   - Animate progress bars when objectives update
   - Use different colors for mission types and states

2. **Notifications**:
   - Toast notification when objective completes
   - Modal/celebration when mission completes
   - Warning notification for missions about to expire

3. **Accessibility**:
   - Ensure progress bars have aria-labels
   - Keyboard navigation for mission lists
   - Screen reader announcements for progress updates

### Error Handling

```typescript
// Example error handling

try {
  await acceptMission(templateId);
} catch (error) {
  if (error.response?.status === 400) {
    const code = error.response.data.error.code;

    switch (code) {
      case 'MISSION_ON_COOLDOWN':
        showError('This mission is on cooldown. Try again later.');
        break;
      case 'INSUFFICIENT_LEVEL':
        showError('You need to be a higher level to accept this mission.');
        break;
      case 'INSUFFICIENT_REPUTATION':
        showError('You need higher reputation with this faction.');
        break;
      default:
        showError('Failed to accept mission. Please try again.');
    }
  }
}
```

---

## Testing Recommendations

### Unit Tests

```typescript
// Example mission store test

import { renderHook, act } from '@testing-library/react-hooks';
import { useMissionStore } from '../missionStore';

describe('MissionStore', () => {
  it('should fetch available missions', async () => {
    const { result } = renderHook(() => useMissionStore());

    await act(async () => {
      await result.current.fetchAvailable();
    });

    expect(result.current.availableMissions).toHaveLength(5);
    expect(result.current.loading).toBe(false);
  });

  it('should accept a mission', async () => {
    const { result } = renderHook(() => useMissionStore());

    await act(async () => {
      await result.current.acceptMission('template-uuid');
    });

    expect(result.current.activeMissions).toHaveLength(1);
    expect(result.current.activeMissions[0].status).toBe('active');
  });
});
```

### Integration Tests

```typescript
// Example E2E test with Playwright/Cypress

describe('Mission Flow', () => {
  it('should complete full mission flow', () => {
    // Login
    cy.login('testuser', 'password');

    // Navigate to missions
    cy.visit('/missions');

    // Accept a combat mission
    cy.contains('Clear Pirate Threat').click();
    cy.contains('Accept Mission').click();

    // Verify mission appears in active list
    cy.contains('Active Missions').should('be.visible');
    cy.contains('Clear Pirate Threat').should('be.visible');

    // Simulate combat (through game actions)
    // ...

    // Verify objective progress updates
    cy.contains('3 / 5').should('be.visible');

    // Complete all objectives
    // ...

    // Verify mission completion notification
    cy.contains('Mission Completed').should('be.visible');
    cy.contains('500 credits').should('be.visible');
  });
});
```

---

## Additional Resources

- [API Blueprint - Missions Service](/API-BLUEPRINT.md#missions-service)
- [Backend Implementation Plan](/~/.claude/plans/effervescent-meandering-fern.md)
- [Event Streaming Guide](/API-BLUEPRINT.md#fanout-service-sse)

---

## Support

For questions or issues:
1. Check the API Blueprint for endpoint details
2. Review backend logs for event publishing
3. Test SSE connection is active and receiving events
4. Verify authentication token is valid

---

**Happy coding! 🚀**
