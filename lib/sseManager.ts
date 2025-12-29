import EventSource from 'react-native-sse';
import { AppState, AppStateStatus } from 'react-native';
import { config } from '@/constants/config';
import { storage } from '@/utils/storage';

type EventListener = (data: any) => void;

/**
 * SSE Manager - Singleton for managing a single SSE connection
 *
 * Per A3-bug-remediation-plan.md Bug #2:
 * - Consolidates multiple SSE connections into one
 * - All events multiplexed through single connection
 * - Channel subscriptions managed via POST /v1/stream/gameplay/subscribe
 * - Connection cleaned up on logout
 *
 * Handles iOS app lifecycle:
 * - Closes connection when app goes to background (iOS suspends connections)
 * - Reconnects immediately when app returns to foreground
 */
class SSEManager {
  private eventSource: any | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private playerId: string | null = null;
  private subscriberId: string | null = null; // From 'connected' event per API spec
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private appState: AppStateStatus = 'active';
  private appStateSubscription: any = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isBackgrounded: boolean = false;

  constructor() {
    this.setupAppStateListener();
  }

  /**
   * Setup listener for app state changes (background/foreground)
   * iOS suspends network connections when backgrounded
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      const wasBackgrounded = this.appState === 'background' || this.appState === 'inactive';
      const isNowActive = nextAppState === 'active';
      const isGoingBackground = nextAppState === 'background' || nextAppState === 'inactive';

      this.appState = nextAppState;

      if (isGoingBackground && !this.isBackgrounded) {
        // App going to background - close connection cleanly
        this.isBackgrounded = true;
        console.log('[SSE Manager] App backgrounded - closing connection');
        this.closeConnection();
      } else if (wasBackgrounded && isNowActive && this.isBackgrounded) {
        // App returning to foreground - reconnect
        this.isBackgrounded = false;
        console.log('[SSE Manager] App foregrounded - reconnecting');
        this.reconnectAttempts = 0; // Reset attempts on foreground
        if (this.playerId) {
          this.connect(this.playerId);
        }
      }
    });
  }

  /**
   * Close the EventSource connection without full disconnect
   * (preserves playerId and listeners for reconnection)
   */
  private closeConnection(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.subscriberId = null;
  }

  /**
   * Connect to the SSE stream
   * Should be called once after login
   */
  async connect(playerId: string): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      console.log('[SSE Manager] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.playerId = playerId;

    try {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) {
        console.error('[SSE Manager] No access token available');
        this.isConnecting = false;
        return;
      }

      console.log('[SSE Manager] Connecting to SSE stream...');

      // Connect through Gateway (not directly to Fanout)
      // Bug #3 fix: Use config.FANOUT_URL which points to Gateway
      // Per SSE-STREAMING-FIX.md: Include X-Player-ID header (required) and initial channels
      const initialChannels = `player.${playerId}`;
      this.eventSource = new EventSource(
        `${config.FANOUT_URL}/v1/stream/gameplay?channels=${initialChannels}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Player-ID': playerId,
            'Accept': 'text/event-stream',
          },
        }
      );

      this.eventSource.addEventListener('open', () => {
        console.log('[SSE Manager] Connection opened, waiting for connected event...');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      });

      // Handle 'connected' event per API spec (04-REALTIME-SSE.apib:132-146)
      // This event provides the subscriber_id needed for channel subscriptions
      this.eventSource.addEventListener('connected', async (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.subscriberId = data.subscriber_id;
          console.log('[SSE Manager] Connected with subscriber_id:', this.subscriberId);
          this.isConnected = true;

          // Subscribe to all channels for this player
          await this.subscribeToChannels();
        } catch (error) {
          console.error('[SSE Manager] Failed to parse connected event:', error);
        }
      });

      // Handle generic 'message' events (fallback for unnamed events)
      this.eventSource.addEventListener('message', (event: any) => {
        this.handleMessage(event);
      });

      // Handle heartbeat events per API spec
      this.eventSource.addEventListener('heartbeat', (event: any) => {
        console.log('[SSE Manager] Heartbeat received');
      });

      // Register handlers for all named event types per API spec (04-REALTIME-SSE.apib)
      // Named SSE events don't trigger 'message', they need explicit handlers
      const eventTypes = [
        'game.movement.jump', 'game.movement.dock', 'game.movement.undock',
        'game.travel.started', 'game.travel.completed', 'game.travel.cancelled', 'game.travel.interrupted',
        'game.combat.start', 'game.combat.action', 'game.combat.outcome', 'game.combat.loot',
        'game.economy.trade', 'game.economy.order_placed', 'game.economy.order_cancelled',
        'game.mining.extract',
        'game.missions.assigned', 'game.missions.objective', 'game.missions.completed',
        'game.services.fuel_purchase', 'game.services.repair',
        'game.social.reputation',
        'game.chat.message',
        'game.sector.delta', // Procgen state changes
      ];

      eventTypes.forEach(eventType => {
        this.eventSource.addEventListener(eventType, (event: any) => {
          this.handleNamedEvent(eventType, event);
        });
      });

      this.eventSource.addEventListener('error', (error: any) => {
        // Don't log as error if app is backgrounded - this is expected on iOS
        if (this.isBackgrounded) {
          console.log('[SSE Manager] Connection closed (app backgrounded)');
          return;
        }
        // "Network connection was lost" is common and expected, log as warning
        const isNetworkLost = error?.message?.includes('network connection was lost');
        if (isNetworkLost) {
          console.warn('[SSE Manager] Network connection lost, will attempt reconnect');
        } else {
          console.error('[SSE Manager] Connection error:', error);
        }
        this.handleError(error);
      });

    } catch (error) {
      console.error('[SSE Manager] Failed to connect:', error);
      this.isConnecting = false;
      this.handleError(error);
    }
  }

  /**
   * Subscribe to additional channels after connection
   * Per SSE-STREAMING-FIX.md: Channel patterns are:
   * - player.<player-id>: Personal events (already subscribed via initial URL)
   * - sector.<sector-name>: Sector activity (subscribe dynamically)
   * - market.<market-id>: Market updates (subscribe dynamically)
   * - combat.<instance-id>: Combat events (subscribe dynamically)
   * - chat.<channel-name>: Chat messages (subscribe dynamically)
   *
   * Note: game.* events are BROADCAST to all subscribers automatically
   */
  private async subscribeToChannels(): Promise<void> {
    if (!this.playerId || !this.subscriberId) {
      console.log('[SSE Manager] Cannot subscribe: missing playerId or subscriberId');
      return;
    }

    // Player channel is already subscribed via initial connection URL
    // game.* events are broadcast to all subscribers - no explicit subscription needed
    console.log('[SSE Manager] Connected with player channel. Game events are broadcast automatically.');
  }

  /**
   * Subscribe to a specific sector channel (call when entering a sector)
   */
  async subscribeToSector(sectorId: string): Promise<void> {
    await this.subscribeToChannel(`sector.${sectorId}`);
  }

  /**
   * Subscribe to a specific market channel
   */
  async subscribeToMarket(marketId: string): Promise<void> {
    await this.subscribeToChannel(`market.${marketId}`);
  }

  /**
   * Subscribe to a combat instance channel
   */
  async subscribeToCombat(combatId: string): Promise<void> {
    await this.subscribeToChannel(`combat.${combatId}`);
  }

  /**
   * Subscribe to a chat channel
   */
  async subscribeToChat(channelName: string): Promise<void> {
    await this.subscribeToChannel(`chat.${channelName}`);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribeFromChannel(channel: string): Promise<void> {
    if (!this.subscriberId) {
      console.log('[SSE Manager] Cannot unsubscribe: no subscriberId');
      return;
    }

    try {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) return;

      const response = await fetch(
        `${config.FANOUT_URL}/v1/stream/gameplay/unsubscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            subscriber_id: this.subscriberId,
            channels: [channel],
          }),
        }
      );

      if (response.ok) {
        console.log(`[SSE Manager] Unsubscribed from: ${channel}`);
      }
    } catch (error) {
      console.log('[SSE Manager] Unsubscribe error:', (error as Error).message);
    }
  }

  /**
   * Subscribe to a specific channel via POST /v1/stream/gameplay/subscribe
   * Per SSE-STREAMING-FIX.md
   */
  private async subscribeToChannel(channel: string): Promise<void> {
    if (!this.subscriberId) {
      console.log('[SSE Manager] Cannot subscribe: no subscriberId');
      return;
    }

    try {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) return;

      const response = await fetch(
        `${config.FANOUT_URL}/v1/stream/gameplay/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            subscriber_id: this.subscriberId,
            channels: [channel],
          }),
        }
      );

      if (response.ok) {
        console.log(`[SSE Manager] Subscribed to: ${channel}`);
      } else if (response.status === 404) {
        console.log('[SSE Manager] Subscription endpoint not available - broadcast mode');
      } else {
        console.warn('[SSE Manager] Subscription failed:', response.status);
      }
    } catch (error) {
      console.log('[SSE Manager] Subscription not available:', (error as Error).message);
    }
  }

  /**
   * Handle named SSE events (e.g., game.movement.jump)
   * These are dispatched by the EventSource for named event types
   */
  private handleNamedEvent(eventType: string, event: any): void {
    try {
      const data = JSON.parse(event.data);
      console.log('[SSE Manager] Received event:', eventType);
      this.dispatchToListeners(eventType, data);
    } catch (error) {
      console.error('[SSE Manager] Parse error for', eventType, ':', error);
    }
  }

  /**
   * Handle incoming generic SSE message (for unnamed events)
   */
  private handleMessage(event: any): void {
    try {
      const data = JSON.parse(event.data);
      const eventType = data.type || data.event;

      if (eventType) {
        console.log('[SSE Manager] Received message event:', eventType);
        this.dispatchToListeners(eventType, data);
      }
    } catch (error) {
      console.error('[SSE Manager] Parse error:', error);
    }
  }

  /**
   * Dispatch event data to all registered listeners
   */
  private dispatchToListeners(eventType: string, data: any): void {
    // Dispatch to exact match listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('[SSE Manager] Listener error:', error);
        }
      });
    }

    // Also dispatch to wildcard listeners (e.g., 'game.movement.*')
    const parts = eventType.split('.');
    if (parts.length >= 2) {
      const prefix = parts.slice(0, 2).join('.') + '.*';
      const wildcardListeners = this.listeners.get(prefix);
      if (wildcardListeners) {
        wildcardListeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('[SSE Manager] Wildcard listener error:', error);
          }
        });
      }
    }
  }

  /**
   * Handle connection errors with exponential backoff reconnection
   */
  private handleError(error: any): void {
    this.isConnected = false;
    this.isConnecting = false;

    // Don't attempt reconnect if app is backgrounded - will reconnect on foreground
    if (this.isBackgrounded) {
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.playerId) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[SSE Manager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        if (this.playerId && !this.isBackgrounded) {
          this.connect(this.playerId);
        }
      }, delay);
    } else {
      console.error('[SSE Manager] Max reconnection attempts reached');
    }
  }

  /**
   * Add an event listener for a specific event type
   * Returns a cleanup function to remove the listener
   */
  addEventListener(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    console.log(`[SSE Manager] Added listener for: ${eventType}`);

    // Return cleanup function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
      console.log(`[SSE Manager] Removed listener for: ${eventType}`);
    };
  }

  /**
   * Disconnect from SSE stream
   * Should be called on logout
   */
  disconnect(): void {
    console.log('[SSE Manager] Disconnecting...');

    // Clear any pending reconnect
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.playerId = null;
    this.subscriberId = null;
    this.reconnectAttempts = 0;
    this.isBackgrounded = false;
    this.listeners.clear();

    console.log('[SSE Manager] Disconnected');
  }

  /**
   * Check if connected
   */
  isStreamConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const sseManager = new SSEManager();
