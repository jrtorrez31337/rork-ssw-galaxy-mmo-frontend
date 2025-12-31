# Authentication & Identity

## Overview

The authentication system handles user registration, login, session management, and token lifecycle. It uses JWT tokens with automatic refresh and manages SSE (Server-Sent Events) connections based on authentication state.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new account |
| POST | `/auth/login` | Login to existing account |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | Logout from session(s) |
| POST | `/auth/password` | Change password |
| GET | `/auth/sessions` | List active sessions |
| DELETE | `/auth/sessions/{id}` | Revoke specific session |
| DELETE | `/auth/account` | Delete account (30-day grace) |

## Data Types

### SignupRequest
```typescript
interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
}
```

### LoginRequest
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### Session
```typescript
interface Session {
  session_id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}
```

## Source Files

| File | Purpose |
|------|---------|
| `api/auth.ts` | API client methods for auth endpoints |
| `api/client.ts` | Base API client with token refresh logic |
| `contexts/AuthContext.tsx` | React context for auth state |
| `utils/storage.ts` | Token and profile persistence |
| `app/(auth)/login.tsx` | Login screen |
| `app/(auth)/signup.tsx` | Registration screen |

## Authentication Flow

### Login Flow
1. User submits email/password
2. `authApi.login()` called
3. On success, tokens stored via `storage.setAccessToken()` and `storage.setRefreshToken()`
4. Profile fetched via `authApi.getMe()`
5. Profile ID stored, state updated
6. SSE connection established via `sseManager.connect()`
7. User redirected to main app

### Token Refresh
- Access tokens are decoded to extract expiration time
- Refresh scheduled 60 seconds before expiration
- On refresh: new access and refresh tokens stored
- If refresh fails: user logged out automatically

### Logout Flow
1. Refresh timer cleared
2. SSE connection disconnected
3. All stored data cleared via `storage.clearAll()`
4. Profile state reset
5. React Query cache cleared

## Context API

The `useAuth` hook provides:

```typescript
{
  user: UserProfile | undefined;
  profileId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  signupError: Error | null;
  loginError: Error | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
}
```

## Security Features

- **Token rotation**: Both access and refresh tokens rotated on refresh
- **Session management**: List and revoke individual sessions
- **Password change**: Revokes all other sessions on password change
- **Account deletion**: 30-day grace period before permanent deletion
- **Auto-logout**: On token refresh failure

## Integration Points

- **SSE Manager**: Connects/disconnects based on auth state
- **React Query**: Cache cleared on logout
- **API Client**: All requests include auth token, 401s trigger refresh
