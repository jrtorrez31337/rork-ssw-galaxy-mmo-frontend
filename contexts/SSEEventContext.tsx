import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSSEEvents, SSEEventCallbacks } from '@/hooks/useSSEEvents';
import { sseManager } from '@/lib/sseManager';

/**
 * SSE Event Context
 *
 * Provides centralized SSE event handling for the entire application.
 * This context:
 * 1. Automatically connects SSE when user is authenticated
 * 2. Sets up all event listeners via useSSEEvents hook
 * 3. Provides connection status to the UI
 * 4. Allows components to subscribe to specific events
 *
 * Usage:
 * ```tsx
 * // In app layout
 * <SSEEventProvider>
 *   <App />
 * </SSEEventProvider>
 *
 * // In any component
 * const { isConnected, connectionStatus } = useSSEContext();
 * ```
 */

export type SSEConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface SSEEventContextValue {
  /** Whether SSE is currently connected */
  isConnected: boolean;

  /** Detailed connection status */
  connectionStatus: SSEConnectionStatus;

  /** Last error message if any */
  lastError: string | null;

  /** Subscribe to a specific sector's events */
  subscribeToSector: (sectorId: string) => Promise<void>;

  /** Unsubscribe from a sector's events */
  unsubscribeFromSector: (sectorId: string) => Promise<void>;

  /** Subscribe to a combat instance's events */
  subscribeToCombat: (combatId: string) => Promise<void>;

  /** Subscribe to a market's events */
  subscribeToMarket: (marketId: string) => Promise<void>;

  /** Subscribe to a chat channel's events */
  subscribeToChat: (channelName: string) => Promise<void>;
}

const SSEEventContext = createContext<SSEEventContextValue | null>(null);

interface SSEEventProviderProps {
  children: React.ReactNode;
  /** Optional callbacks for handling specific events */
  callbacks?: SSEEventCallbacks;
}

export function SSEEventProvider({ children, callbacks }: SSEEventProviderProps) {
  const { profileId, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  // Set up SSE events when authenticated
  const { isConnected } = useSSEEvents(
    isAuthenticated ? profileId : null,
    {
      ...callbacks,
      onError: (error) => {
        setLastError(error?.message || 'Connection error');
        setConnectionStatus('error');
        callbacks?.onError?.(error);
      },
    }
  );

  // Update connection status based on sseManager state
  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    // Poll connection status (sseManager doesn't emit events for status changes)
    const checkStatus = () => {
      const connected = sseManager.isStreamConnected();
      if (connected) {
        setConnectionStatus('connected');
        setLastError(null);
      } else if (connectionStatus === 'connected') {
        setConnectionStatus('reconnecting');
      }
    };

    // Check immediately
    checkStatus();

    // Check periodically
    const interval = setInterval(checkStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, connectionStatus]);

  // Channel subscription helpers
  const subscribeToSector = useCallback(async (sectorId: string) => {
    await sseManager.subscribeToSector(sectorId);
  }, []);

  const unsubscribeFromSector = useCallback(async (sectorId: string) => {
    await sseManager.unsubscribeFromChannel(`sector.${sectorId}`);
  }, []);

  const subscribeToCombat = useCallback(async (combatId: string) => {
    await sseManager.subscribeToCombat(combatId);
  }, []);

  const subscribeToMarket = useCallback(async (marketId: string) => {
    await sseManager.subscribeToMarket(marketId);
  }, []);

  const subscribeToChat = useCallback(async (channelName: string) => {
    await sseManager.subscribeToChat(channelName);
  }, []);

  const value: SSEEventContextValue = {
    isConnected,
    connectionStatus,
    lastError,
    subscribeToSector,
    unsubscribeFromSector,
    subscribeToCombat,
    subscribeToMarket,
    subscribeToChat,
  };

  return (
    <SSEEventContext.Provider value={value}>
      {children}
    </SSEEventContext.Provider>
  );
}

/**
 * Hook to access SSE event context
 *
 * @throws Error if used outside SSEEventProvider
 */
export function useSSEContext(): SSEEventContextValue {
  const context = useContext(SSEEventContext);
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEEventProvider');
  }
  return context;
}

/**
 * Hook to get just the connection status (safe to use outside provider)
 */
export function useSSEConnectionStatus(): SSEConnectionStatus {
  const context = useContext(SSEEventContext);
  return context?.connectionStatus ?? 'disconnected';
}
