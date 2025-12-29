import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  AccessibilityProps,
} from 'react-native';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';

/**
 * LCARSAlert - LCARS-style alert/notification
 *
 * Per UI/UX Doctrine:
 * - Alerts escalate, not accumulate (one at a time)
 * - Higher priority replaces lower
 * - RED alert is 0.5Hz pulse
 * - Never stack modals
 *
 * Accessibility:
 * - Announces via accessibilityLiveRegion
 * - Focus management for dismissible alerts
 * - Screen reader announcements for priority
 */

export type AlertPriority = 'critical' | 'warning' | 'info' | 'success';

interface AlertProps extends AccessibilityProps {
  priority: AlertPriority;
  title: string;
  message?: string;
  onDismiss?: () => void;
  dismissable?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: ReactNode;
}

function getPriorityConfig(priority: AlertPriority) {
  switch (priority) {
    case 'critical':
      return {
        color: tokens.colors.alert.red,
        icon: AlertCircle,
        pulseRate: 1000, // 0.5Hz = 2 seconds per cycle = 1000ms per half
        label: 'Critical alert',
      };
    case 'warning':
      return {
        color: tokens.colors.alert.yellow,
        icon: AlertTriangle,
        pulseRate: 0,
        label: 'Warning',
      };
    case 'success':
      return {
        color: tokens.colors.semantic.success,
        icon: CheckCircle,
        pulseRate: 0,
        label: 'Success',
      };
    case 'info':
    default:
      return {
        color: tokens.colors.semantic.information,
        icon: Info,
        pulseRate: 0,
        label: 'Information',
      };
  }
}

export function Alert({
  priority,
  title,
  message,
  onDismiss,
  dismissable = true,
  action,
  icon,
  ...accessibilityProps
}: AlertProps) {
  const config = getPriorityConfig(priority);
  const DefaultIcon = config.icon;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Announce to screen readers
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `${config.label}: ${title}${message ? `. ${message}` : ''}`
    );
  }, [title, message, config.label]);

  // Pulse animation for critical alerts
  useEffect(() => {
    if (config.pulseRate > 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: config.pulseRate,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: config.pulseRate,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [config.pulseRate, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: config.color },
        config.pulseRate > 0 && { opacity: pulseAnim },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      {...accessibilityProps}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: config.color }]} />

      {/* Icon */}
      <View style={styles.iconContainer}>
        {icon || <DefaultIcon size={20} color={config.color} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: config.color }]}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}

        {/* Action button */}
        {action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: config.color }]}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text style={[styles.actionLabel, { color: config.color }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dismiss button */}
      {dismissable && onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={tokens.colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

/**
 * AlertBanner - Full-width alert for header/footer areas
 */
interface AlertBannerProps {
  priority: AlertPriority;
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ priority, message, onDismiss }: AlertBannerProps) {
  const config = getPriorityConfig(priority);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (config.pulseRate > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: config.pulseRate,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: config.pulseRate,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [config.pulseRate, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: config.color },
        config.pulseRate > 0 && { opacity: pulseAnim },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.bannerText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={tokens.colors.text.inverse} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

/**
 * InlineAlert - Compact inline alert for forms/panels
 */
interface InlineAlertProps {
  priority: AlertPriority;
  message: string;
}

export function InlineAlert({ priority, message }: InlineAlertProps) {
  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <View
      style={[styles.inline, { backgroundColor: `${config.color}15` }]}
      accessibilityRole="alert"
    >
      <Icon size={14} color={config.color} />
      <Text style={[styles.inlineText, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: tokens.colors.background.panel,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconContainer: {
    padding: tokens.spacing[3],
  },
  content: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    paddingRight: tokens.spacing[3],
  },
  title: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing[1],
    lineHeight: tokens.typography.fontSize.sm * tokens.typography.lineHeight.normal,
  },
  actionButton: {
    marginTop: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderWidth: 1,
    borderRadius: tokens.radius.full,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  dismissButton: {
    padding: tokens.spacing[3],
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
  bannerText: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.sm,
    gap: tokens.spacing[2],
  },
  inlineText: {
    flex: 1,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
  },
});
