import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCommandStore, CommandAction } from '@/stores/commandStore';
import { useLocationStore } from '@/stores/locationStore';
import { useTravelStateStore } from '@/stores/travelStateStore';

/**
 * CommandBar (Action Rail)
 * Command Console aesthetic - action buttons at bottom
 * Context-sensitive primary action based on game state
 */

interface ActionButtonProps {
  label: string;
  color: 'navigation' | 'combat' | 'economy' | 'default';
  isPrimary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function ActionButton({ label, color, isPrimary, disabled, onPress }: ActionButtonProps) {
  const getButtonColor = () => {
    switch (color) {
      case 'navigation':
        return tokens.colors.command.blue;
      case 'combat':
        return tokens.colors.command.red;
      case 'economy':
        return tokens.colors.operations.engineering;
      default:
        return tokens.colors.text.secondary;
    }
  };

  const buttonColor = getButtonColor();

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isPrimary && styles.primaryButton,
        {
          backgroundColor: isPrimary
            ? disabled
              ? tokens.colors.console.hull
              : buttonColor
            : 'transparent',
        },
        !isPrimary && { borderColor: buttonColor, borderWidth: 1 },
      ]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <Text
        style={[
          styles.actionLabel,
          {
            color: isPrimary
              ? disabled
                ? tokens.colors.text.muted
                : tokens.colors.console.void
              : buttonColor,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function CommandBar() {
  const primaryAction = useCockpitStore((s) => s.primaryAction);
  const secondaryActions = useCockpitStore((s) => s.secondaryActions);
  const tickerMessage = useCockpitStore((s) => s.tickerMessage);
  const activeRail = useCockpitStore((s) => s.activeRail);

  const dispatchAction = useCommandStore((s) => s.dispatchAction);
  const actionFeedback = useCommandStore((s) => s.actionFeedback);

  // Get current game state for context-aware actions
  const isDocked = useLocationStore((s) => s.docked.isDocked);
  const travelMode = useTravelStateStore((s) => s.mode);
  const isInTransit = travelMode !== 'idle';
  const canJump = useTravelStateStore((s) => s.canInitiateJump);

  // Context-aware primary actions based on rail and game state
  const getDefaultPrimaryAction = (): {
    label: string;
    action: CommandAction;
    color: 'navigation' | 'combat' | 'economy';
    disabled?: boolean;
  } | null => {
    switch (activeRail) {
      case 'NAV':
        if (isDocked) {
          return { label: 'UNDOCK', action: 'nav:undock', color: 'navigation' };
        }
        if (isInTransit) {
          return { label: 'ABORT', action: 'nav:abort', color: 'navigation' };
        }
        return {
          label: 'ENGAGE',
          action: 'nav:engage',
          color: 'navigation',
          disabled: !canJump,
        };
      case 'FLT':
        if (isDocked) {
          return { label: 'UNDOCK', action: 'nav:undock', color: 'navigation' };
        }
        return { label: 'LAUNCH', action: 'flt:launch', color: 'navigation' };
      case 'TAC':
        return { label: 'FIRE', action: 'tac:fire', color: 'combat' };
      case 'OPS':
        return { label: 'EXECUTE', action: 'ops:execute', color: 'economy' };
      case 'COM':
        return { label: 'HAIL', action: 'com:hail', color: 'navigation' };
      default:
        return null;
    }
  };

  const defaultAction = getDefaultPrimaryAction();
  const displayPrimary = primaryAction
    ? { ...primaryAction, disabled: false }
    : defaultAction;

  const handlePrimaryAction = () => {
    if (displayPrimary && !displayPrimary?.disabled) {
      dispatchAction(displayPrimary.action as CommandAction);
    }
  };

  const handleSecondaryAction = (action: string) => {
    dispatchAction(action as CommandAction);
  };

  // Show feedback as ticker if available
  const displayTicker = actionFeedback?.message || tickerMessage;

  return (
    <View style={styles.container}>
      {/* Left: Ticker */}
      <View style={styles.tickerSection}>
        {displayTicker ? (
          <Text
            style={[
              styles.tickerText,
              actionFeedback && !actionFeedback.success && styles.tickerError,
              actionFeedback && actionFeedback.success && styles.tickerSuccess,
            ]}
            numberOfLines={1}
          >
            {displayTicker}
          </Text>
        ) : (
          <Text style={styles.tickerPlaceholder}>SYSTEMS READY</Text>
        )}
      </View>

      {/* Right: Actions */}
      <View style={styles.actionsSection}>
        {/* Secondary actions */}
        {secondaryActions.map((action, index) => (
          <ActionButton
            key={index}
            label={action.label}
            color="default"
            onPress={() => handleSecondaryAction(action.action)}
          />
        ))}

        {/* Primary action */}
        {displayPrimary && (
          <ActionButton
            label={displayPrimary.label}
            color={displayPrimary.color}
            isPrimary
            disabled={displayPrimary.disabled}
            onPress={handlePrimaryAction}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.console.deepSpace,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    paddingHorizontal: tokens.spacing.md,
  },
  tickerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  tickerText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
    letterSpacing: 1,
  },
  tickerError: {
    color: tokens.colors.command.red,
  },
  tickerSuccess: {
    color: tokens.colors.status.online,
  },
  tickerPlaceholder: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.mono,
    letterSpacing: 1,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    minWidth: 100,
  },
  actionLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    fontFamily: tokens.typography.fontFamily.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
