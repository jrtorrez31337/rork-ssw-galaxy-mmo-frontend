import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { authApi, LoginRequest, SignupRequest } from '@/api/auth';
import { storage } from '@/utils/storage';
import { sseManager } from '@/lib/sseManager';
import { AuthResponse } from '@/types/api';

/**
 * Decode JWT token to extract expiration time
 * Returns expiration timestamp in milliseconds
 */
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('[Auth] Failed to decode token:', error);
    return null;
  }
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getMe,
    enabled: isInitialized && profileId !== null,
    retry: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      const savedProfileId = await storage.getProfileId();
      setProfileId(savedProfileId);
      setIsInitialized(true);

      // Connect SSE if already logged in
      if (savedProfileId) {
        sseManager.connect(savedProfileId);
      }
    };
    initAuth();
  }, []);

  // Auto-refresh access token before expiration
  useEffect(() => {
    if (!isInitialized || !profileId) {
      return;
    }

    const setupTokenRefresh = async () => {
      const accessToken = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        console.log('[Auth] No tokens available for refresh setup');
        return;
      }

      const expiresAt = getTokenExpiration(accessToken);
      if (!expiresAt) {
        console.log('[Auth] Could not decode token expiration');
        return;
      }

      // Refresh 1 minute before expiration (60 seconds = 60000 ms)
      const refreshTime = expiresAt - Date.now() - 60000;

      if (refreshTime <= 0) {
        // Token already expired or about to expire, refresh immediately
        console.log('[Auth] Token expired or expiring soon, refreshing now');
        await performTokenRefresh();
      } else {
        console.log(`[Auth] Token refresh scheduled in ${Math.floor(refreshTime / 1000)} seconds`);
        refreshTimerRef.current = setTimeout(async () => {
          await performTokenRefresh();
        }, refreshTime);
      }
    };

    const performTokenRefresh = async () => {
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          console.error('[Auth] No refresh token available');
          await logout();
          return;
        }

        console.log('[Auth] Refreshing access token...');
        const response = await authApi.refreshToken({ refresh_token: refreshToken });

        await storage.setAccessToken(response.access_token);
        await storage.setRefreshToken(response.refresh_token);

        console.log('[Auth] Token refreshed successfully');

        // Set up next refresh
        setupTokenRefresh();
      } catch (error) {
        console.error('[Auth] Token refresh failed:', error);
        // If refresh fails, log out user
        await logout();
      }
    };

    setupTokenRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isInitialized, profileId]);

  const signupMutation = useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: async (response: AuthResponse) => {
      await storage.setAccessToken(response.access_token);
      await storage.setRefreshToken(response.refresh_token);
      const userProfile = await authApi.getMe();
      await storage.setProfileId(userProfile.profile_id);
      setProfileId(userProfile.profile_id);
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Connect SSE stream for real-time events
      sseManager.connect(userProfile.profile_id);
    },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response: AuthResponse) => {
      await storage.setAccessToken(response.access_token);
      await storage.setRefreshToken(response.refresh_token);
      const userProfile = await authApi.getMe();
      await storage.setProfileId(userProfile.profile_id);
      setProfileId(userProfile.profile_id);
      queryClient.invalidateQueries({ queryKey: ['user'] });

      // Connect SSE stream for real-time events
      sseManager.connect(userProfile.profile_id);
    },
  });

  const logout = async () => {
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Disconnect SSE stream
    sseManager.disconnect();

    await storage.clearAll();
    setProfileId(null);
    queryClient.clear();
  };

  const isAuthenticated = !!profileId && !!user;

  return {
    user,
    profileId,
    isAuthenticated,
    isLoading: !isInitialized || isLoadingUser,
    signup: signupMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout,
    signupError: signupMutation.error,
    loginError: loginMutation.error,
    isSigningUp: signupMutation.isPending,
    isLoggingIn: loginMutation.isPending,
  };
});
