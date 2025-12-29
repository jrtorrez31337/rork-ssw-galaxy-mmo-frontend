import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/stores/notificationStore';
import { EVENT_URGENCY_MAP } from '@/types/notifications';
import ToastNotification from './ToastNotification';
import CriticalAlert from './CriticalAlert';

/**
 * NotificationProvider
 *
 * Renders toast and critical alert components.
 * SSE event handlers should call addNotification() from the store
 * to trigger notifications.
 *
 * Usage: Wrap your app with this component at the root level.
 */
export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastNotification />
      <CriticalAlert />
    </>
  );
}

/**
 * Helper hook to create notifications from SSE events
 * Use this in your SSE event handlers
 */
export function useNotifications() {
  const { addNotification } = useNotificationStore();

  const notifyCombatStart = (enemyName: string) => {
    addNotification({
      type: 'combat_start',
      urgency: 'critical',
      title: 'COMBAT INITIATED',
      message: `${enemyName} is attacking! Prepare for battle.`,
    });
  };

  const notifyCombatOutcome = (victory: boolean, enemyName: string) => {
    addNotification({
      type: 'combat_outcome',
      urgency: 'important',
      title: victory ? 'VICTORY' : 'DEFEAT',
      message: victory
        ? `You defeated ${enemyName}!`
        : `You were defeated by ${enemyName}.`,
    });
  };

  const notifyMissionCompleted = (missionName: string, rewards: string) => {
    addNotification({
      type: 'mission_completed',
      urgency: 'important',
      title: 'Mission Complete',
      message: `${missionName} completed! Rewards: ${rewards}`,
    });
  };

  const notifyMissionFailed = (missionName: string, reason: string) => {
    addNotification({
      type: 'mission_failed',
      urgency: 'important',
      title: 'Mission Failed',
      message: `${missionName} failed: ${reason}`,
    });
  };

  const notifyLootReceived = (items: string) => {
    addNotification({
      type: 'loot_received',
      urgency: 'important',
      title: 'Loot Collected',
      message: `You received: ${items}`,
    });
  };

  const notifyOrderFilled = (commodity: string, quantity: number, price: number) => {
    addNotification({
      type: 'order_filled',
      urgency: 'informational',
      title: 'Trade Executed',
      message: `${quantity}x ${commodity} at ${price.toFixed(2)} CR each`,
    });
  };

  const notifyReputationChange = (factionName: string, change: number, newTier: string) => {
    addNotification({
      type: 'reputation_change',
      urgency: 'informational',
      title: 'Reputation Changed',
      message: `${factionName}: ${change > 0 ? '+' : ''}${change} (Now: ${newTier})`,
    });
  };

  const notifySystemAlert = (title: string, message: string) => {
    addNotification({
      type: 'system_alert',
      urgency: 'critical',
      title,
      message,
    });
  };

  return {
    notifyCombatStart,
    notifyCombatOutcome,
    notifyMissionCompleted,
    notifyMissionFailed,
    notifyLootReceived,
    notifyOrderFilled,
    notifyReputationChange,
    notifySystemAlert,
    addNotification,
  };
}
