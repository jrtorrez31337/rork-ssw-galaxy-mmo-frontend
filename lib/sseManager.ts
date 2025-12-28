import EventSource from 'react-native-sse';
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
      this.eventSource = new EventSource(
        `${config.FANOUT_URL}/v1/stream/gameplay`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
      ];

      eventTypes.forEach(eventType => {
        this.eventSource.addEventListener(eventType, (event: any) => {
          this.handleNamedEvent(eventType, event);
        });
      });

      this.eventSource.addEventListener('error', (error: any) => {
        console.error('[SSE Manager] Connection error:', error);
        this.handleError(error);
      });

    } catch (error) {
      console.error('[SSE Manager] Failed to connect:', error);
      this.isConnecting = false;
      this.handleError(error);
    }
  }

  /**
   * Subscribe to all relevant channels for the player
   * Per API spec (04-REALTIME-SSE.apib:169-194), requires subscriber_id from 'connected' event
   */
  private async subscribeToChannels(): Promise<void> {
    if (!this.playerId || !this.subscriberId) {
      console.log('[SSE Manager] Cannot subscribe: missing playerId or subscriberId');
      return;
    }

    try {
      const accessToken = await storage.getAccessToken();
      if (!accessToken) return;

      // Subscribe to all game channels through Gateway
      // Per API spec: subscriber_id is required in body
      const response = await fetch(
        `${config.FANOUT_URL}/v1/stream/gameplay/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            subscriber_id: this.subscriberId,  // Required per API spec
            channels: [
              `player.${this.playerId}`,       // Personal notifications
              'game.movement.jump',            // Movement events
              'game.movement.dock',
              'game.movement.undock',
              'game.travel.started',           // Async travel events
              'game.travel.completed',
              'game.travel.cancelled',
              'game.travel.interrupted',
              'game.combat.start',             // Combat events
              'game.combat.action',
              'game.combat.outcome',
              'game.combat.loot',
              'game.economy.trade',            // Economy events
              'game.mining.extract',           // Mining events
              'game.missions.assigned',        // Mission events
              'game.missions.objective',
              'game.missions.completed',
              'game.services.fuel_purchase',   // Station services
              'game.services.repair',
              'game.social.reputation',        // Social events
              'game.chat.message',             // Chat messages
            ],
          }),
        }
      );

      if (response.ok) {
        console.log('[SSE Manager] Subscribed to all channels');
      } else if (response.status === 404) {
        // Subscription endpoint not implemented - this is OK
        // Backend may broadcast all events without explicit subscriptions
        console.log('[SSE Manager] Subscription endpoint not available (404) - using broadcast mode');
      } else {
        console.warn('[SSE Manager] Subscription failed:', response.status, await response.text());
      }
    } catch (error) {
      // Network error or endpoint doesn't exist - gracefully continue
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

    if (this.reconnectAttempts < this.maxReconnectAttempts && this.playerId) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[SSE Manager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        if (this.playerId) {
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

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.playerId = null;
    this.subscriberId = null;
    this.reconnectAttempts = 0;
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
