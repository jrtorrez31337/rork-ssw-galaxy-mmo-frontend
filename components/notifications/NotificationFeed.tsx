import { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Bell,
  AlertTriangle,
  Swords,
  Package,
  Target,
  DollarSign,
  Shield,
  Check,
  Trash2,
  Filter,
} from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Text, Button, EmptyState } from '@/ui';
import { useNotificationStore } from '@/stores/notificationStore';
import type { GameNotification, NotificationType, NotificationUrgency } from '@/types/notifications';

type FilterType = 'all' | NotificationUrgency;

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Important', value: 'important' },
  { label: 'Info', value: 'informational' },
];

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'combat_start':
    case 'combat_outcome':
      return Swords;
    case 'loot_received':
      return Package;
    case 'mission_completed':
    case 'mission_failed':
      return Target;
    case 'order_filled':
      return DollarSign;
    case 'reputation_change':
      return Shield;
    case 'system_alert':
      return AlertTriangle;
    case 'chat_message':
    case 'achievement':
    default:
      return Bell;
  }
};

const getUrgencyColor = (urgency: NotificationUrgency): string => {
  switch (urgency) {
    case 'critical':
      return tokens.colors.danger;
    case 'important':
      return tokens.colors.warning;
    case 'informational':
    default:
      return tokens.colors.primary.main;
  }
};

interface NotificationItemProps {
  notification: GameNotification;
  onPress: () => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const urgencyColor = getUrgencyColor(notification.urgency);

  const timeAgo = useMemo(() => {
    const now = new Date();
    const notifTime = new Date(notification.timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, [notification.timestamp]);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.notificationItemUnread,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${notification.read ? '' : 'Unread: '}${notification.title}. ${notification.message}. ${timeAgo}`}
      accessibilityHint={notification.read ? undefined : 'Double tap to mark as read'}
    >
      <View style={[styles.iconContainer, { backgroundColor: urgencyColor + '20' }]}>
        <Icon size={20} color={urgencyColor} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            variant="body"
            weight={notification.read ? 'normal' : 'semibold'}
            style={styles.notificationTitle}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text variant="caption" color={tokens.colors.text.tertiary}>
            {timeAgo}
          </Text>
        </View>
        <Text
          variant="caption"
          color={tokens.colors.text.secondary}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export function NotificationFeed() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotificationStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.urgency === filter);
  }, [notifications, filter]);

  const handleNotificationPress = useCallback(
    (notification: GameNotification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearNotifications(),
        },
      ]
    );
  }, [clearNotifications]);

  const renderItem = useCallback(
    ({ item }: { item: GameNotification }) => (
      <NotificationItem
        notification={item}
        onPress={() => handleNotificationPress(item)}
      />
    ),
    [handleNotificationPress]
  );

  const keyExtractor = useCallback((item: GameNotification) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header with actions */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={20} color={tokens.colors.primary.main} />
          <Text variant="heading" weight="bold">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" color={tokens.colors.text.primary}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllRead}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Check size={18} color={tokens.colors.primary.main} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAll}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Trash2 size={18} color={tokens.colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              filter === option.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(option.value)}
          >
            <Text
              variant="caption"
              weight={filter === option.value ? 'semibold' : 'normal'}
              color={
                filter === option.value
                  ? tokens.colors.primary.main
                  : tokens.colors.text.secondary
              }
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            filter === 'all'
              ? 'Game events will appear here'
              : `No ${filter} notifications`
          }
        />
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  badge: {
    backgroundColor: tokens.colors.danger,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
    minWidth: 24,
    alignItems: 'center',
  },

  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.base,
    backgroundColor: tokens.colors.surface.raised,
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.surface.overlay,
  },

  filterChip: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.surface.base,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },

  filterChipActive: {
    borderColor: tokens.colors.primary.main,
    backgroundColor: tokens.colors.primary.alpha[10],
  },

  listContent: {
    padding: tokens.spacing[4],
  },

  separator: {
    height: tokens.spacing[2],
  },

  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[3],
  },

  notificationItemUnread: {
    backgroundColor: tokens.colors.surface.raised,
    borderColor: tokens.colors.primary.alpha[30],
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationContent: {
    flex: 1,
    gap: tokens.spacing[1],
  },

  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  notificationTitle: {
    flex: 1,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.primary.main,
    position: 'absolute',
    top: tokens.spacing[3],
    right: tokens.spacing[3],
  },
});
