/**
 * Notification Types
 * Based on B1-ux-system-definition.md Section 5.2
 */

export type NotificationUrgency = 'critical' | 'important' | 'informational';

export type NotificationType =
  | 'combat_start'
  | 'combat_outcome'
  | 'mission_completed'
  | 'mission_failed'
  | 'order_filled'
  | 'loot_received'
  | 'reputation_change'
  | 'chat_message'
  | 'system_alert'
  | 'achievement';

export interface GameNotification {
  id: string;
  type: NotificationType;
  urgency: NotificationUrgency;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

// SSE Event → Notification Level mapping
export const EVENT_URGENCY_MAP: Record<string, NotificationUrgency> = {
  'game.combat.start': 'critical',
  'game.combat.outcome': 'important',
  'game.combat.loot': 'important',
  'game.missions.completed': 'important',
  'game.missions.failed': 'important',
  'game.missions.assigned': 'informational',
  'game.economy.order_filled': 'informational',
  'game.economy.trade': 'informational',
  'game.chat.message': 'informational',
  'game.social.reputation': 'informational',
};

// Auto-dismiss times in milliseconds
export const NOTIFICATION_DURATIONS: Record<NotificationUrgency, number | null> = {
  critical: null, // Manual dismiss only
  important: 5000, // 5 seconds
  informational: 3000, // 3 seconds (for toasts, though typically feed-only)
};
