import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { AlertTriangle, Swords, ShieldAlert, X } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useNotificationStore } from '@/stores/notificationStore';
import type { GameNotification } from '@/types/notifications';

export default function CriticalAlert() {
  const { criticalAlert, dismissCritical, markAsRead } = useNotificationStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (criticalAlert) {
      // Entry animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation loop
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [criticalAlert]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (criticalAlert) {
        markAsRead(criticalAlert.id);
      }
      dismissCritical();
    });
  };

  if (!criticalAlert) {
    return null;
  }

  const getIcon = (notification: GameNotification) => {
    switch (notification.type) {
      case 'combat_start':
        return <Swords size={64} color={tokens.colors.danger} />;
      case 'system_alert':
        return <ShieldAlert size={64} color={tokens.colors.warning} />;
      default:
        return <AlertTriangle size={64} color={tokens.colors.danger} />;
    }
  };

  const getAccentColor = (notification: GameNotification): string => {
    switch (notification.type) {
      case 'combat_start':
        return tokens.colors.danger;
      case 'system_alert':
        return tokens.colors.warning;
      default:
        return tokens.colors.danger;
    }
  };

  return (
    <Modal
      visible={!!criticalAlert}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              borderColor: getAccentColor(criticalAlert),
            },
          ]}
        >
          {/* Pulsing Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            {getIcon(criticalAlert)}
          </Animated.View>

          {/* Alert Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: getAccentColor(criticalAlert) }]}>
              {criticalAlert.title}
            </Text>
            <Text style={styles.message}>{criticalAlert.message}</Text>
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: getAccentColor(criticalAlert) }]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissText}>ACKNOWLEDGE</Text>
          </TouchableOpacity>

          {/* Close Icon */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <X size={24} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[6],
  },

  container: {
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    padding: tokens.spacing[6],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: tokens.spacing[4],
  },

  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: tokens.colors.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: 1,
  },

  message: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  dismissButton: {
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[6],
    borderRadius: tokens.radius.base,
    marginTop: tokens.spacing[2],
    minWidth: 200,
  },

  dismissText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },

  closeButton: {
    position: 'absolute',
    top: tokens.spacing[3],
    right: tokens.spacing[3],
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
