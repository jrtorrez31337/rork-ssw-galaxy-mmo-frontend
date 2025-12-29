import { storage } from '@/utils/storage';
import { ApiErrorResponse, ApiResponse } from '@/types/api';
import { config, DEV_INSTRUCTIONS } from '@/constants/config';
import { router } from 'expo-router';

const API_BASE_URL = config.API_BASE_URL;

/**
 * API Client with comprehensive 401 error handling
 *
 * Per A3-bug-remediation-plan.md Bug #4:
 * - 401 responses trigger token refresh attempt
 * - If refresh fails, user is logged out and redirected to login
 * - Token rotation: both access and refresh tokens are updated
 */

interface RequestConfig {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;
  private isLoggingOut = false; // Prevent multiple logout attempts
  private lastLogoutAttempt = 0;
  private static LOGOUT_DEBOUNCE_MS = 2000; // Prevent rapid logout attempts

  /**
   * Set callback for when user becomes unauthorized (for logout handling)
   */
  setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  /**
   * Check if we should skip logout (refresh in progress or recently attempted)
   */
  private shouldSkipLogout(): boolean {
    const now = Date.now();
    if (this.isRefreshing) {
      console.log('[API Client] Skipping logout - refresh in progress');
      return true;
    }
    if (this.isLoggingOut) {
      console.log('[API Client] Skipping logout - already logging out');
      return true;
    }
    if (now - this.lastLogoutAttempt < ApiClient.LOGOUT_DEBOUNCE_MS) {
      console.log('[API Client] Skipping logout - debounced');
      return true;
    }
    return false;
  }

  async request<T>(endpoint: string, config: RequestConfig): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const token = await storage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestInit: RequestInit = {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestInit);

      // Handle 401 - attempt token refresh
      if (response.status === 401 && token && !endpoint.includes('/auth/')) {
        console.log('[API Client] 401 received, attempting token refresh');

        // Wait briefly for any ongoing refresh (e.g., from AuthContext) to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        const newToken = await this.handleTokenRefresh();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...requestInit,
            headers,
          });

          // If retry also fails with 401, force logout
          if (retryResponse.status === 401) {
            console.error('[API Client] Retry failed with 401, forcing logout');
            if (!this.shouldSkipLogout()) {
              await this.forceLogout();
            }
            throw new Error('Session expired. Please log in again.');
          }

          return this.handleResponse<T>(retryResponse);
        } else {
          // Refresh failed - check if we should wait for another refresh
          // Try getting token one more time (AuthContext may have refreshed it)
          await new Promise(resolve => setTimeout(resolve, 500));
          const latestToken = await storage.getAccessToken();
          if (latestToken && latestToken !== token) {
            console.log('[API Client] Found new token from parallel refresh, retrying');
            headers['Authorization'] = `Bearer ${latestToken}`;
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...requestInit,
              headers,
            });
            if (retryResponse.ok) {
              return this.handleResponse<T>(retryResponse);
            }
          }
          throw new Error('Session expired. Please log in again.');
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      // Check if it's a network error vs our thrown errors
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.error('API request failed:', error);
        console.error(DEV_INSTRUCTIONS);
        throw new Error('Failed to connect to backend. Check console for setup instructions.');
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      // Handle 401 that wasn't caught earlier (no token case)
      if (response.status === 401) {
        // Only force logout if not already refreshing/logging out
        if (!this.shouldSkipLogout()) {
          console.error('[API Client] Unauthorized request - forcing logout');
          await this.forceLogout();
        } else {
          console.log('[API Client] 401 received but refresh/logout in progress - skipping');
        }
        throw new Error('Unauthorized. Please log in.');
      }

      if (isJson) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error?.message || 'Request failed');
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    if (isJson) {
      const data = (await response.json()) as ApiResponse<T>;
      return data.data;
    }

    return {} as T;
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshToken();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) {
        console.error('[API Client] No refresh token available');
        await this.forceLogout();
        return null;
      }

      console.log('[API Client] Refreshing access token...');
      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.error('[API Client] Token refresh failed with status:', response.status);
        await this.forceLogout();
        return null;
      }

      const data = (await response.json()) as ApiResponse<{
        access_token: string;
        refresh_token: string;
      }>;

      // Token rotation: update BOTH tokens
      const newAccessToken = data.data.access_token;
      const newRefreshToken = data.data.refresh_token;

      await storage.setAccessToken(newAccessToken);
      if (newRefreshToken) {
        await storage.setRefreshToken(newRefreshToken);
      }

      console.log('[API Client] Token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('[API Client] Token refresh error:', error);
      await this.forceLogout();
      return null;
    }
  }

  /**
   * Force logout user and redirect to login screen
   * Includes debouncing to prevent race conditions with token refresh
   */
  private async forceLogout(): Promise<void> {
    // Prevent concurrent logout attempts
    if (this.isLoggingOut) {
      console.log('[API Client] Logout already in progress, skipping');
      return;
    }

    this.isLoggingOut = true;
    this.lastLogoutAttempt = Date.now();

    try {
      console.log('[API Client] Forcing logout due to authentication failure');
      await storage.clearAll();

      // Call the unauthorized callback if set (for AuthContext to handle)
      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }

      // Navigate to login screen
      try {
        router.replace('/login');
      } catch (e) {
        // Router may not be ready, app will handle via auth state
        console.log('[API Client] Could not navigate to login, auth state will handle');
      }
    } finally {
      this.isLoggingOut = false;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
