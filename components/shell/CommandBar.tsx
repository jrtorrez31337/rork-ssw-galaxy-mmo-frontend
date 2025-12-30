import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCommandStore, CommandAction } from '@/stores/commandStore';
import { useLocationStore } from '@/stores/locationStore';
import { useTravelStateStore } from '@/stores/travelStateStore';

/**
 * CommandBar (Action Rail)
 * Per UI/UX Doctrine Section 2: Always visible, 56-64pt height
 * Contains: Quick-info ticker (left), Secondary actions (center), Primary action (right)
 * Primary action is context-sensitive: ENGAGE, DOCK, FIRE, UNDOCK, etc.
 *
 * Actions are dispatched via commandStore for consumption by game systems.
 */

interface ActionButtonProps {
  label: string;
  color: 'navigation' | 'combat' | 'economy' | 'default';
  isPrimary?: boolean;
  onPress: () => void;
}

function ActionButton({ label, color, isPrimary, onPress }: ActionButtonProps) {
  const getButtonColor = () => {
    switch (color) {
      case 'navigation': return tokens.colors.semantic.navigation;
      case 'combat': return tokens.colors.semantic.combat;
      case 'economy': return tokens.colors.semantic.economy;
      default: return tokens.colors.lcars.peach;
    }
  };

  const buttonColor = getButtonColor();

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isPrimary && styles.primaryButton,
        { backgroundColor: isPrimary ? buttonColor : 'transparent' },
        !isPrimary && { borderColor: buttonColor, borderWidth: 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.actionLabel,
          { color: isPrimary ? tokens.colors.text.inverse : buttonColor },
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
          <Text style={styles.tickerPlaceholder}>READY</Text>
        )}
      </View>

      {/* Center-Right: Actions */}
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
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              {
                backgroundColor: displayPrimary.disabled
                  ? tokens.colors.background.tertiary
                  : getButtonColorValue(displayPrimary.color),
              },
            ]}
            onPress={handlePrimaryAction}
            activeOpacity={displayPrimary.disabled ? 1 : 0.7}
            disabled={displayPrimary.disabled}
          >
            <Text
              style={[
                styles.actionLabel,
                {
                  color: displayPrimary.disabled
                    ? tokens.colors.text.tertiary
                    : tokens.colors.text.inverse,
                },
              ]}
            >
              {displayPrimary.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Helper to get button color value
function getButtonColorValue(color: 'navigation' | 'combat' | 'economy' | 'default'): string {
  switch (color) {
    case 'navigation': return tokens.colors.semantic.navigation;
    case 'combat': return tokens.colors.semantic.combat;
    case 'economy': return tokens.colors.semantic.economy;
    default: return tokens.colors.lcars.peach;
  }
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.panel,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    paddingHorizontal: tokens.spacing[3],
  },
  tickerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  tickerText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  tickerError: {
    color: tokens.colors.semantic.combat,
  },
  tickerSuccess: {
    color: tokens.colors.semantic.navigation,
  },
  tickerPlaceholder: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  actionButton: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    minWidth: 100,
  },
  actionLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
});
