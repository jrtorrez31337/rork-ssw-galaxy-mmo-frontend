# Authentication, Character Creation & Session Initialization Guide

**Target Audience**: Agentic AI / Doctorate-level Software Engineer
**Focus**: Login flow, character/ship creation, and loading into the game environment
**Codebase**: SSW Galaxy MMO Frontend

---

## Table of Contents

1. [Complete Flow Overview](#1-complete-flow-overview)
2. [Provider Hierarchy](#2-provider-hierarchy)
3. [Authentication Flow](#3-authentication-flow)
4. [Session Initialization](#4-session-initialization)
5. [Character Creation Flow](#5-character-creation-flow)
6. [Ship Customization Flow](#6-ship-customization-flow)
7. [Game Environment Loading](#7-game-environment-loading)
8. [Data Queries After Login](#8-data-queries-after-login)
9. [Real-Time Event Subscription](#9-real-time-event-subscription)
10. [Validation Utilities](#10-validation-utilities)
11. [Error Handling Patterns](#11-error-handling-patterns)

---

## 1. Complete Flow Overview

### User Journey State Machine

```
App Launch
    |
    v
[index.tsx] Check Auth State
    |
    +--[Not Authenticated]--> /login --> /signup (optional)
    |                              |
    |                              v
    |                         Auth Success
    |                              |
    +--[Authenticated]-------------+
    |
    v
[Dashboard/Tabs] Load User Data
    |
    +--[No Character]--> /character-create
    |                          |
    |                          v
    +--[Has Character]<--------+
    |
    +--[No Ship]--> /ship-customize
    |                    |
    |                    v
    +--[Has Ship]<-------+
    |
    v
[Bridge View] Game Ready
```

### Key Files in Flow

| Step | File | Purpose |
|------|------|---------|
| Entry | `app/index.tsx:1-36` | Auth check, route to login or game |
| Login | `app/login.tsx:1-233` | Email/password login form |
| Signup | `app/signup.tsx:1-258` | Account creation form |
| Auth Context | `contexts/AuthContext.tsx:1-197` | Auth state, token management |
| Character Create | `app/character-create.tsx:1-671` | Multi-step character wizard |
| Ship Customize | `app/ship-customize.tsx:1-568` | Ship type and stats allocation |
| Dashboard | `app/dashboard.tsx:1-725` | Character/ship display, legacy entry |
| Bridge | `app/(tabs)/index.tsx:1-168` | Primary game viewport |

---

## 2. Provider Hierarchy

**Source**: `app/_layout.tsx:46-66`

The app wraps all screens in a specific provider order:

```tsx
<SafeAreaProvider>
  <QueryClientProvider client={queryClient}>
    <GestureHandlerRootView>
      <AuthProvider>           // Authentication state
        <SSEEventProvider>     // Real-time event bus
          <NotificationProvider>  // Toast notifications
            <RootLayoutNav />  // Screen stack
          </NotificationProvider>
        </SSEEventProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  </QueryClientProvider>
</SafeAreaProvider>
```

### React Query Configuration
**Source**: `app/_layout.tsx:13-20`
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 3. Authentication Flow

### 3.1 Entry Point Router
**Source**: `app/index.tsx:1-36`

```typescript
export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/map');  // Go to game
      } else {
        router.replace('/login');        // Go to login
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return <ActivityIndicator />;  // Show spinner while checking
}
```

### 3.2 Login Screen
**Source**: `app/login.tsx:19-130`

#### State Management
```typescript
const { login, isLoggingIn, loginError } = useAuth();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
```

#### Login Handler
```typescript
// app/login.tsx:26-46
const handleLogin = async () => {
  // 1. Client-side validation
  if (!email || !password) {
    setError('Please fill in all fields');
    return;
  }

  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    setError(emailResult.error!);
    return;
  }

  try {
    setError('');
    // 2. Call auth context login
    await login({ email: email.trim(), password });
    // 3. Navigate to dashboard on success
    router.replace('/dashboard');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  }
};
```

### 3.3 Signup Screen
**Source**: `app/signup.tsx:19-155`

#### Validation Chain
```typescript
// app/signup.tsx:27-56
const handleSignup = async () => {
  // 1. Validate email
  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    setError(emailResult.error!);
    return;
  }

  // 2. Validate display name
  const displayNameResult = validateDisplayName(displayName);
  if (!displayNameResult.isValid) {
    setError(displayNameResult.error!);
    return;
  }

  // 3. Validate password
  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid) {
    setError(passwordResult.error!);
    return;
  }

  try {
    setError('');
    await signup({
      email: email.trim(),
      password,
      display_name: displayName.trim()
    });
    router.replace('/dashboard');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Signup failed');
  }
};
```

### 3.4 AuthContext Implementation
**Source**: `contexts/AuthContext.tsx:1-197`

#### Exported Values
```typescript
// contexts/AuthContext.tsx:183-196
return {
  user,              // UserProfile | undefined
  profileId,         // string | null
  isAuthenticated,   // boolean (!!profileId && !!user)
  isLoading,         // boolean
  signup,            // (data: SignupRequest) => Promise<AuthResponse>
  login,             // (data: LoginRequest) => Promise<AuthResponse>
  logout,            // () => Promise<void>
  signupError,       // Error | null
  loginError,        // Error | null
  isSigningUp,       // boolean
  isLoggingIn,       // boolean
};
```

#### Login Mutation
```typescript
// contexts/AuthContext.tsx:149-163
const loginMutation = useMutation({
  mutationFn: (data: LoginRequest) => authApi.login(data),
  onSuccess: async (response: AuthResponse) => {
    // 1. Store tokens
    await storage.setAccessToken(response.access_token);
    await storage.setRefreshToken(response.refresh_token);

    // 2. Fetch user profile
    const userProfile = await authApi.getMe();
    await storage.setProfileId(userProfile.profile_id);
    setProfileId(userProfile.profile_id);

    // 3. Mark token as validated
    setIsTokenValidated(true);

    // 4. Invalidate cached user query
    queryClient.invalidateQueries({ queryKey: ['user'] });

    // 5. Connect SSE stream
    sseManager.connect(userProfile.profile_id);
  },
});
```

#### Signup Mutation
```typescript
// contexts/AuthContext.tsx:133-147
const signupMutation = useMutation({
  mutationFn: (data: SignupRequest) => authApi.signup(data),
  onSuccess: async (response: AuthResponse) => {
    await storage.setAccessToken(response.access_token);
    await storage.setRefreshToken(response.refresh_token);
    const userProfile = await authApi.getMe();
    await storage.setProfileId(userProfile.profile_id);
    setProfileId(userProfile.profile_id);
    setIsTokenValidated(true);
    queryClient.invalidateQueries({ queryKey: ['user'] });
    sseManager.connect(userProfile.profile_id);
  },
});
```

#### Logout Function
```typescript
// contexts/AuthContext.tsx:165-179
const logout = async () => {
  // 1. Clear refresh timer
  if (refreshTimerRef.current) {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = null;
  }

  // 2. Disconnect SSE
  sseManager.disconnect();

  // 3. Clear all storage
  await storage.clearAll();

  // 4. Reset state
  setProfileId(null);
  setIsTokenValidated(false);

  // 5. Clear React Query cache
  queryClient.clear();
};
```

---

## 4. Session Initialization

### 4.1 Token Refresh Setup
**Source**: `contexts/AuthContext.tsx:48-131`

On app load with existing session:

```typescript
useEffect(() => {
  if (!isInitialized || !profileId) return;

  const setupTokenRefresh = async () => {
    const accessToken = await storage.getAccessToken();
    const refreshToken = await storage.getRefreshToken();

    if (!accessToken || !refreshToken) {
      // No tokens - clear auth state
      setProfileId(null);
      setIsTokenValidated(false);
      return;
    }

    // Decode JWT to get expiration
    const expiresAt = getTokenExpiration(accessToken);

    // Refresh 1 minute before expiration
    const refreshTime = expiresAt - Date.now() - 60000;

    if (refreshTime <= 0) {
      // Token expired - refresh immediately
      await performTokenRefresh();
    } else {
      // Token valid - mark validated, connect SSE
      setIsTokenValidated(true);
      sseManager.connect(profileId);

      // Schedule refresh
      refreshTimerRef.current = setTimeout(async () => {
        await performTokenRefresh();
      }, refreshTime);
    }
  };

  setupTokenRefresh();
}, [isInitialized, profileId]);
```

### 4.2 Token Refresh Execution
```typescript
// contexts/AuthContext.tsx:93-121
const performTokenRefresh = async () => {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    await logout();
    return;
  }

  try {
    // Call refresh endpoint
    const response = await authApi.refreshToken({ refresh_token: refreshToken });

    // Update both tokens (rotation)
    await storage.setAccessToken(response.access_token);
    await storage.setRefreshToken(response.refresh_token);

    // Validate and connect SSE
    setIsTokenValidated(true);
    sseManager.connect(profileId);

    // Schedule next refresh
    setupTokenRefresh();
  } catch (error) {
    // Refresh failed - force logout
    await logout();
  }
};
```

### 4.3 JWT Decoding Helper
```typescript
// contexts/AuthContext.tsx:13-21
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('[Auth] Failed to decode token:', error);
    return null;
  }
}
```

---

## 5. Character Creation Flow

### 5.1 Multi-Step Wizard
**Source**: `app/character-create.tsx:1-671`

#### Step State Machine
```typescript
type Step = 'name' | 'faction' | 'attributes';
const [step, setStep] = useState<Step>('name');
```

#### Form State
```typescript
// app/character-create.tsx:63-72
const [name, setName] = useState('');
const [nameError, setNameError] = useState('');
const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
const [attributes, setAttributes] = useState<CharacterAttributes>({
  piloting: 4,
  engineering: 4,
  science: 4,
  tactics: 4,
  leadership: 4,
});
```

### 5.2 Attribute Point Allocation
**Source**: `app/character-create.tsx:21-53`

```typescript
const TOTAL_POINTS = 20;
const MIN_STAT = 1;
const MAX_STAT = 10;

const ATTRIBUTES = [
  { key: 'piloting', label: 'Piloting', description: 'Ship maneuverability and flight control' },
  { key: 'engineering', label: 'Engineering', description: 'Tech/repair bonuses and ship systems' },
  { key: 'science', label: 'Science', description: 'Research, discovery, and scanning' },
  { key: 'tactics', label: 'Tactics', description: 'Combat effectiveness and strategy' },
  { key: 'leadership', label: 'Leadership', description: 'Crew bonuses and faction influence' },
];

// Remaining points calculation
const totalAllocated = Object.values(attributes).reduce((sum, val) => sum + val, 0);
const remaining = TOTAL_POINTS - totalAllocated;

// Increment/decrement handlers
const increment = (key: keyof CharacterAttributes) => {
  if (remaining > 0 && attributes[key] < MAX_STAT) {
    setAttributes({ ...attributes, [key]: attributes[key] + 1 });
  }
};

const decrement = (key: keyof CharacterAttributes) => {
  if (attributes[key] > MIN_STAT) {
    setAttributes({ ...attributes, [key]: attributes[key] - 1 });
  }
};
```

### 5.3 Faction Selection
**Source**: `app/character-create.tsx:92-102`

```typescript
// Get home sector from faction metadata
const getHomeSector = () => {
  if (!selectedFaction || selectedFaction === 'neutral') return '0.0.0';
  return FACTION_METADATA[selectedFaction].capitalSector;
};

// Get faction UUID for API
const getFactionUUID = () => {
  if (!selectedFaction || selectedFaction === 'neutral') return undefined;
  return FACTION_UUIDS[selectedFaction];
};
```

### 5.4 Character Creation API Call
**Source**: `app/character-create.tsx:104-116`

```typescript
const createMutation = useMutation({
  mutationFn: () =>
    characterApi.create({
      profile_id: profileId!,
      name,
      faction_id: getFactionUUID()!,
      home_sector: getHomeSector(),
      attributes,
    }),
  onSuccess: () => {
    router.back();  // Return to previous screen
  },
});
```

### 5.5 API Request/Response
**Source**: `api/characters.ts:4-22`

```typescript
// Request
interface CreateCharacterRequest {
  profile_id: string;
  name: string;
  faction_id: string;
  home_sector: string;
  attributes: CharacterAttributes;
}

// API Call
const characterApi = {
  create: (data: CreateCharacterRequest): Promise<Character> =>
    apiClient.post('/characters', data),

  getByProfile: (profileId: string): Promise<Character[]> =>
    apiClient.get(`/characters/by-profile/${profileId}`),
};
```

### 5.6 Response Type
**Source**: `types/api.ts:20-36`

```typescript
interface CharacterAttributes {
  piloting: number;
  engineering: number;
  science: number;
  tactics: number;
  leadership: number;
}

interface Character {
  id: string;
  profile_id: string;
  name: string;
  home_sector: string;
  faction_id?: string;
  attributes: CharacterAttributes;
  created_at: string;
}
```

---

## 6. Ship Customization Flow

### 6.1 Ship Type Selection
**Source**: `app/ship-customize.tsx:23-53`

```typescript
type ShipType = 'scout' | 'fighter' | 'trader' | 'explorer';

const SHIP_TYPES = [
  {
    type: 'scout',
    label: 'Scout',
    description: 'Fast and stealthy reconnaissance vessel',
    bonuses: ['Speed +2', 'Sensors +2'],
  },
  {
    type: 'fighter',
    label: 'Fighter',
    description: 'Heavy combat ship with strong defenses',
    bonuses: ['Hull +300 HP', 'Shield +100'],
  },
  {
    type: 'trader',
    label: 'Trader',
    description: 'Cargo hauler for commerce and transport',
    bonuses: ['Hull +100 HP', 'Cargo +40 units'],
  },
  {
    type: 'explorer',
    label: 'Explorer',
    description: 'Long-range vessel for discovery missions',
    bonuses: ['Speed +1', 'Cargo +10', 'Sensors +2'],
  },
];
```

### 6.2 Stat Point Allocation
**Source**: `app/ship-customize.tsx:55-81`

```typescript
const TOTAL_POINTS = 30;
const MIN_STAT = 1;
const MAX_STAT = 15;

const STATS = [
  { key: 'hull_strength', label: 'Hull Strength', description: 'Ship durability (x100 HP)' },
  { key: 'shield_capacity', label: 'Shield Capacity', description: 'Energy shields (x50 points)' },
  { key: 'speed', label: 'Speed', description: 'Engine velocity and agility' },
  { key: 'cargo_space', label: 'Cargo Space', description: 'Storage capacity (x10 units)' },
  { key: 'sensors', label: 'Sensors', description: 'Detection and scanning range' },
];

// Default allocation (6 points each = 30 total)
const [stats, setStats] = useState<ShipStats>({
  hull_strength: 6,
  shield_capacity: 6,
  speed: 6,
  cargo_space: 6,
  sensors: 6,
});
```

### 6.3 Ship Creation API Call
**Source**: `app/ship-customize.tsx:114-125`

```typescript
const createMutation = useMutation({
  mutationFn: () =>
    shipApi.create({
      owner_id: profileId!,
      ship_type: shipType,
      name: name.trim(),
      stat_allocation: stats,
    }),
  onSuccess: () => {
    router.back();
  },
});

// Submit validation
const isValidName = name.trim().length >= 3 && name.trim().length <= 32;
const canSubmit = remaining === 0 && isValidName;
```

### 6.4 API Request/Response
**Source**: `api/ships.ts:1-22`

```typescript
interface CreateShipRequest {
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  stat_allocation: ShipStats;
}

const shipApi = {
  create: (data: CreateShipRequest): Promise<Ship> =>
    apiClient.post('/ships', data),

  getByOwner: (ownerId: string): Promise<Ship[]> =>
    apiClient.get(`/ships/by-owner/${ownerId}`),
};
```

### 6.5 Ship Response Type
**Source**: `types/api.ts:38-84`

```typescript
interface ShipStats {
  hull_strength: number;
  shield_capacity: number;
  speed: number;
  cargo_space: number;
  sensors: number;
}

interface Ship {
  id: string;
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  hull_points: number;
  hull_max: number;
  shield_points: number;
  shield_max: number;
  cargo_capacity: number;
  current_cargo_used?: number;
  location_sector: string;
  position: Vector3;
  fuel_current: number;
  fuel_capacity: number;
  in_combat: boolean;
  docked_at?: string;
  last_jump_at?: string;
  created_at: string;
  stat_allocation?: ShipStats;
  travel_status?: TravelStatus;
  current_travel_id?: string;
  sensor_range?: number;
  signature?: number;
  faction_id?: string;
}
```

---

## 7. Game Environment Loading

### 7.1 Bridge Screen (Primary Viewport)
**Source**: `app/(tabs)/index.tsx:32-168`

```typescript
export default function BridgeScreen() {
  const { profileId } = useAuth();

  // 1. Load player's ships
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;
  const currentSector = currentShip?.location_sector || '0,0,0';
  const isDocked = !!currentShip?.docked_at;

  // 2. Load NPCs in sector (if not docked)
  const { data: npcData } = useQuery({
    queryKey: ['npcs', currentSector],
    queryFn: () => npcApi.getNPCsInSector(currentSector),
    enabled: !!currentShip && !isDocked,
    refetchInterval: 30000,
  });

  // 3. Load stations for minimap
  const { data: stationsData } = useQuery({
    queryKey: ['stations', currentSector],
    queryFn: () => movementApi.getStations(currentSector),
    enabled: !!currentShip && !isDocked,
  });

  // 4. Load other player ships in sector
  const { data: shipsData } = useQuery({
    queryKey: ['sector-ships', currentSector, profileId],
    queryFn: () => sectorEntitiesApi.getShips(currentSector, profileId),
    enabled: !!currentShip && !isDocked && !!profileId,
    staleTime: 3000,
    refetchInterval: 5000,
  });

  // 5. Sync to stores
  const { npcs, setNPCs } = useNPCStore();
  const { isInCombat } = useCombatStore();

  useEffect(() => {
    if (npcData?.npcs) {
      setNPCs(npcData.npcs, currentSector);
    }
  }, [npcData, currentSector]);

  // 6. Subscribe to real-time events
  useCombatEvents(profileId || '');
  useTravelEvents(profileId || '');

  // 7. Render view based on state
  if (isDocked) {
    return <DockedView stationId={currentShip.docked_at} />;
  }

  return (
    <View style={styles.viewport}>
      <SectorView npcs={npcs} ... />
      {isInCombat && <CombatHUD playerId={profileId} />}
      <CombatResults />
      <LootNotification />
      <MiniMap ship={currentShip} stations={stationsData?.stations} />
    </View>
  );
}
```

### 7.2 Dashboard Data Loading (Legacy)
**Source**: `app/dashboard.tsx:49-75`

```typescript
// Load characters
const { data: characters, isLoading: loadingCharacters } = useQuery({
  queryKey: ['characters', profileId],
  queryFn: () => characterApi.getByProfile(profileId!),
  enabled: !!profileId,
});

// Load ships
const { data: ships, isLoading: loadingShips } = useQuery({
  queryKey: ['ships', profileId],
  queryFn: () => shipApi.getByOwner(profileId!),
  enabled: !!profileId,
});

// Load reputations
const { data: reputations, isLoading: loadingReputations } = useQuery({
  queryKey: ['reputations', profileId],
  queryFn: () => reputationApi.getAllReputations(profileId!),
  enabled: !!profileId,
});
```

---

## 8. Data Queries After Login

### 8.1 User Profile Query
**Source**: `contexts/AuthContext.tsx:30-35`

```typescript
const { data: user, isLoading: isLoadingUser } = useQuery({
  queryKey: ['user'],
  queryFn: authApi.getMe,
  enabled: isInitialized && profileId !== null && isTokenValidated,
  retry: false,
});
```

### 8.2 Characters Query
```typescript
// Query Key: ['characters', profileId]
const { data: characters } = useQuery({
  queryKey: ['characters', profileId],
  queryFn: () => characterApi.getByProfile(profileId!),
  enabled: !!profileId,
});

// Response: Character[]
```

### 8.3 Ships Query
```typescript
// Query Key: ['ships', profileId]
const { data: ships } = useQuery({
  queryKey: ['ships', profileId],
  queryFn: () => shipApi.getByOwner(profileId!),
  enabled: !!profileId,
});

// Response: Ship[]
```

### 8.4 Reputations Query
```typescript
// Query Key: ['reputations', profileId]
const { data: reputations } = useQuery({
  queryKey: ['reputations', profileId],
  queryFn: () => reputationApi.getAllReputations(profileId!),
  enabled: !!profileId,
});

// Response: PlayerReputations { player_id, reputations: FactionReputation[] }
```

### 8.5 Query Invalidation Pattern
After mutations, invalidate related queries:

```typescript
// After character creation
queryClient.invalidateQueries({ queryKey: ['characters'] });

// After ship creation
queryClient.invalidateQueries({ queryKey: ['ships'] });

// After login/logout
queryClient.clear();  // Clear all cached data
```

---

## 9. Real-Time Event Subscription

### 9.1 SSE Connection on Login
**Source**: `contexts/AuthContext.tsx:144-146, 160-162`

```typescript
// In login/signup onSuccess:
sseManager.connect(userProfile.profile_id);

// In logout:
sseManager.disconnect();
```

### 9.2 Event Hook Registration
**Source**: `app/(tabs)/index.tsx:89-91`

```typescript
// Subscribe to combat events
useCombatEvents(profileId || '');

// Subscribe to travel events
useTravelEvents(profileId || '');
```

### 9.3 Dashboard Event Subscriptions
**Source**: `app/dashboard.tsx:111-131`

```typescript
// Reputation tier change events
useReputationEvents(profileId || '', {
  onTierChange: (event) => {
    Alert.alert('Reputation Changed',
      `${factionName}: ${event.old_tier} -> ${event.new_tier}`);
  },
});

// Station service events (fuel, repair)
useStationServices(profileId || '', {
  onCreditsChanged: (event) => {
    Alert.alert('Credits Updated', `${sign}${event.amount_changed} CR`);
  },
});

// Mission events
useMissionEvents(profileId || '', {
  onMissionCompleted: (event) => {
    Alert.alert('Mission Completed!',
      `Rewards: ${event.credits_awarded} Credits`);
    fetchActive();
    fetchAvailable();
  },
});
```

---

## 10. Validation Utilities

**Source**: `utils/validation.ts:1-186`

### 10.1 Email Validation
```typescript
// Rules: Required, max 254 chars, RFC 5322 format
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) return { isValid: false, error: 'Email is required' };
  if (trimmed.length > 254) return { isValid: false, error: 'Email must be 254 characters or less' };
  if (!EMAIL_REGEX.test(trimmed)) return { isValid: false, error: 'Please enter a valid email address' };

  return { isValid: true };
}
```

### 10.2 Display Name Validation
```typescript
// Rules: 3-32 chars, alphanumeric + spaces + basic punctuation
const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s\-_'.]+$/;

function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) return { isValid: false, error: 'Display name is required' };
  if (trimmed.length < 3) return { isValid: false, error: 'Display name must be at least 3 characters' };
  if (trimmed.length > 32) return { isValid: false, error: 'Display name must be 32 characters or less' };
  if (!DISPLAY_NAME_REGEX.test(trimmed)) return { isValid: false, error: 'Display name can only contain letters, numbers, spaces, and basic punctuation' };

  return { isValid: true };
}
```

### 10.3 Password Validation
```typescript
// Rules: 8-128 chars
function validatePassword(password: string): ValidationResult {
  if (!password) return { isValid: false, error: 'Password is required' };
  if (password.length < 8) return { isValid: false, error: 'Password must be at least 8 characters' };
  if (password.length > 128) return { isValid: false, error: 'Password must be 128 characters or less' };

  return { isValid: true };
}
```

### 10.4 Character/Ship Name Validation
```typescript
// Rules: 3-32 chars, alphanumeric + spaces + basic punctuation
function validateName(name: string): ValidationResult {
  // Same rules as display name
  const trimmed = name.trim();

  if (!trimmed) return { isValid: false, error: 'Name is required' };
  if (trimmed.length < 3) return { isValid: false, error: 'Name must be at least 3 characters' };
  if (trimmed.length > 32) return { isValid: false, error: 'Name must be 32 characters or less' };
  if (!DISPLAY_NAME_REGEX.test(trimmed)) return { isValid: false, error: 'Name can only contain letters, numbers, spaces, and basic punctuation' };

  return { isValid: true };
}
```

### 10.5 Sector Format Validation
```typescript
// Rules: X.Y.Z format where X, Y, Z are integers (can be negative)
const SECTOR_REGEX = /^-?\d+\.-?\d+\.-?\d+$/;

function validateSectorFormat(sector: string): ValidationResult {
  const trimmed = sector.trim();

  if (!trimmed) return { isValid: false, error: 'Sector is required' };
  if (!SECTOR_REGEX.test(trimmed)) return { isValid: false, error: 'Sector must be in X.Y.Z format (e.g., 0.0.0)' };

  return { isValid: true };
}
```

---

## 11. Error Handling Patterns

### 11.1 Form-Level Error Display
```typescript
// Pattern used in login/signup/create screens
const [error, setError] = useState('');

// In handler
try {
  setError('');  // Clear previous error
  await someAction();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Action failed');
}

// In render
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
  </View>
)}
```

### 11.2 Mutation Error Display
```typescript
const mutation = useMutation({
  mutationFn: api.action,
  onError: (error) => {
    // Error available in mutation.error
  },
});

// In render
{mutation.isError && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>
      {mutation.error?.message || 'Operation failed'}
    </Text>
  </View>
)}
```

### 11.3 Auth Context Errors
```typescript
// Login error from context
const { loginError } = useAuth();

// In render - combine local and context errors
{(error || loginError) && (
  <Text style={styles.errorText}>
    {error || loginError?.message}
  </Text>
)}
```

---

## Quick Reference: Complete Login Flow

```
1. User enters email/password on /login screen
   Source: app/login.tsx:26-46

2. Client-side validation
   Source: utils/validation.ts (validateEmail)

3. Call useAuth().login({ email, password })
   Source: contexts/AuthContext.tsx:149-163

4. authApi.login() -> POST /auth/login
   Source: api/auth.ts:54-55

5. Response: { access_token, refresh_token, expires_in, session_id }
   Source: types/api.ts:1-7

6. Store tokens in AsyncStorage
   Source: utils/storage.ts:14-24

7. Fetch user profile: authApi.getMe() -> GET /auth/me
   Source: api/auth.ts:68

8. Store profileId in AsyncStorage
   Source: utils/storage.ts:30-32

9. Mark token as validated, connect SSE
   Source: contexts/AuthContext.tsx:157-161

10. Navigate to /dashboard (or /(tabs)/map)
    Source: app/login.tsx:42

11. Dashboard loads characters, ships, reputations via React Query
    Source: app/dashboard.tsx:49-75

12. User creates character if none exists
    Source: app/character-create.tsx:104-116

13. User creates ship if none exists
    Source: app/ship-customize.tsx:114-125

14. Navigate to Bridge view, game is ready
    Source: app/(tabs)/index.tsx:32-168
```

---

*Document generated from codebase analysis. All source references are exact file paths and line numbers.*
