import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { authApi, LoginRequest, SignupRequest } from '@/api/auth';
import { storage } from '@/utils/storage';
import { AuthResponse } from '@/types/api';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

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
    };
    initAuth();
  }, []);

  const signupMutation = useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: async (response: AuthResponse) => {
      await storage.setAccessToken(response.access_token);
      await storage.setRefreshToken(response.refresh_token);
      const userProfile = await authApi.getMe();
      await storage.setProfileId(userProfile.profile_id);
      setProfileId(userProfile.profile_id);
      queryClient.invalidateQueries({ queryKey: ['user'] });
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
    },
  });

  const logout = async () => {
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
