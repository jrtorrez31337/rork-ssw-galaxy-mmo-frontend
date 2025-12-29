import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import {
  X,
  Swords,
  Trophy,
  Target,
  Package,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useNotificationStore } from '@/stores/notificationStore';
import { NOTIFICATION_DURATIONS } from '@/types/notifications';
import type { GameNotification } from '@/types/notifications';

export default function ToastNotification() {
  const { activeToast, dismissToast } = useNotificationStore();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pan responder for swipe-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          // Swipe down - dismiss
          handleDismiss();
        } else {
          // Snap back
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (activeToast) {
      // Show animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss timer
      const duration = NOTIFICATION_DURATIONS[activeToast.urgency];
      if (duration) {
        timerRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeToast]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissToast();
    });
  };

  if (!activeToast) {
    return null;
  }

  const getIcon = (notification: GameNotification) => {
    switch (notification.type) {
      case 'combat_start':
      case 'combat_outcome':
        return <Swords size={24} color={tokens.colors.danger} />;
      case 'mission_completed':
        return <Trophy size={24} color={tokens.colors.success} />;
      case 'mission_failed':
        return <Target size={24} color={tokens.colors.danger} />;
      case 'loot_received':
        return <Package size={24} color={tokens.colors.warning} />;
      case 'order_filled':
        return <CheckCircle size={24} color={tokens.colors.success} />;
      case 'system_alert':
        return <AlertTriangle size={24} color={tokens.colors.warning} />;
      default:
        return <Info size={24} color={tokens.colors.info} />;
    }
  };

  const getAccentColor = (notification: GameNotification): string => {
    switch (notification.type) {
      case 'combat_start':
      case 'combat_outcome':
      case 'mission_failed':
        return tokens.colors.danger;
      case 'mission_completed':
      case 'order_filled':
      case 'loot_received':
        return tokens.colors.success;
      case 'system_alert':
        return tokens.colors.warning;
      default:
        return tokens.colors.primary.main;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.toast, { borderLeftColor: getAccentColor(activeToast) }]}>
        <View style={styles.iconContainer}>{getIcon(activeToast)}</View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {activeToast.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {activeToast.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <X size={20} color={tokens.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Swipe indicator */}
      <View style={styles.swipeIndicator} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    left: tokens.spacing[4],
    right: tokens.spacing[4],
    alignItems: 'center',
  },

  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    padding: tokens.spacing[3],
    gap: tokens.spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.base,
    backgroundColor: tokens.colors.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    gap: tokens.spacing[1],
  },

  title: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  message: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 18,
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.text.tertiary,
    borderRadius: 2,
    marginTop: tokens.spacing[2],
    opacity: 0.5,
  },
});
