import { apiClient } from './client';
import { AuthResponse, UserProfile } from '@/types/api';

export interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface LogoutRequest {
  all_sessions?: boolean;
}

export interface Session {
  session_id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_active_at: string;
  is_current: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}

export const authApi = {
  /**
   * Register new account
   * POST /v1/auth/signup
   */
  signup: (data: SignupRequest) =>
    apiClient.post<AuthResponse>('/auth/signup', data),

  /**
   * Login to existing account
   * POST /v1/auth/login
   */
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  /**
   * Refresh access token
   * POST /v1/auth/refresh
   */
  refreshToken: (data: RefreshTokenRequest) =>
    apiClient.post<AuthResponse>('/auth/refresh', data),

  /**
   * Get current user profile
   * GET /v1/auth/me
   */
  getMe: () => apiClient.get<UserProfile>('/auth/me'),

  /**
   * Logout from current or all sessions
   * POST /v1/auth/logout
   */
  logout: (data?: LogoutRequest) =>
    apiClient.post<{ message: string }>('/auth/logout', data || {}),

  /**
   * Change password (revokes all other sessions)
   * POST /v1/auth/password
   */
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<{ message: string }>('/auth/password', data),

  /**
   * List active sessions
   * GET /v1/auth/sessions
   */
  getSessions: () =>
    apiClient.get<SessionsResponse>('/auth/sessions'),

  /**
   * Revoke a specific session
   * DELETE /v1/auth/sessions/{session_id}
   */
  revokeSession: (sessionId: string) =>
    apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`),

  /**
   * Delete account (30-day grace period)
   * DELETE /v1/auth/account
   */
  deleteAccount: () =>
    apiClient.delete<{ message: string; deletion_scheduled_at: string }>('/auth/account'),
};
