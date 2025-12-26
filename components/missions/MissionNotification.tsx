import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, Trophy, Clock, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';

export type NotificationType = 'objective_completed' | 'mission_completed' | 'mission_expired' | 'progress';

interface MissionNotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

/**
 * Mission notification toast component
 * Shows animated notifications for mission events
 */
export default function MissionNotification({
  type,
  title,
  message,
  visible,
  onHide,
  duration = 3000,
}: MissionNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'objective_completed':
        return <CheckCircle size={24} color={Colors.success} />;
      case 'mission_completed':
        return <Trophy size={24} color={Colors.warning} />;
      case 'mission_expired':
        return <Clock size={24} color={Colors.danger} />;
      case 'progress':
        return <AlertTriangle size={24} color={Colors.info} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'objective_completed':
        return `${Colors.success}20`;
      case 'mission_completed':
        return `${Colors.warning}20`;
      case 'mission_expired':
        return `${Colors.danger}20`;
      case 'progress':
        return `${Colors.info}20`;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'objective_completed':
        return Colors.success;
      case 'mission_completed':
        return Colors.warning;
      case 'mission_expired':
        return Colors.danger;
      case 'progress':
        return Colors.info;
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  message: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
