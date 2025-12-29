import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameNotification, NotificationUrgency } from '@/types/notifications';

interface NotificationState {
  // All notifications (persisted)
  notifications: GameNotification[];

  // Currently visible toast (not persisted)
  activeToast: GameNotification | null;

  // Critical notification overlay (not persisted)
  criticalAlert: GameNotification | null;

  // Unread count
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp' | 'read'>) => void;
  dismissToast: () => void;
  dismissCritical: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getNotificationsByType: (type: string) => GameNotification[];
  getNotificationsByUrgency: (urgency: NotificationUrgency) => GameNotification[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      activeToast: null,
      criticalAlert: null,
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: GameNotification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          read: false,
        };

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications].slice(0, 100); // Keep last 100

          // Handle based on urgency
          if (notification.urgency === 'critical') {
            return {
              notifications: updatedNotifications,
              criticalAlert: newNotification,
              unreadCount: state.unreadCount + 1,
            };
          } else if (notification.urgency === 'important') {
            return {
              notifications: updatedNotifications,
              activeToast: newNotification,
              unreadCount: state.unreadCount + 1,
            };
          } else {
            // Informational - just add to feed, no toast
            return {
              notifications: updatedNotifications,
              unreadCount: state.unreadCount + 1,
            };
          }
        });
      },

      dismissToast: () => {
        set({ activeToast: null });
      },

      dismissCritical: () => {
        set({ criticalAlert: null });
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },

      getNotificationsByUrgency: (urgency) => {
        return get().notifications.filter((n) => n.urgency === urgency);
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
