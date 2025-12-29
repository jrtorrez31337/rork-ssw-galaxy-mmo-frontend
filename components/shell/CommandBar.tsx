import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';

/**
 * CommandBar (Action Rail)
 * Per UI/UX Doctrine Section 2: Always visible, 56-64pt height
 * Contains: Quick-info ticker (left), Secondary actions (center), Primary action (right)
 * Primary action is context-sensitive: ENGAGE, DOCK, FIRE, UNDOCK, etc.
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

  // Default primary actions based on rail context
  const getDefaultPrimaryAction = () => {
    switch (activeRail) {
      case 'NAV':
        return { label: 'ENGAGE', action: 'nav:engage', color: 'navigation' as const };
      case 'TAC':
        return { label: 'FIRE', action: 'tac:fire', color: 'combat' as const };
      case 'OPS':
        return { label: 'EXECUTE', action: 'ops:execute', color: 'economy' as const };
      default:
        return null;
    }
  };

  const displayPrimary = primaryAction || getDefaultPrimaryAction();

  const handlePrimaryAction = () => {
    if (displayPrimary) {
      console.log('[CommandBar] Primary action:', displayPrimary.action);
      // TODO: Dispatch action through event system
    }
  };

  const handleSecondaryAction = (action: string) => {
    console.log('[CommandBar] Secondary action:', action);
    // TODO: Dispatch action through event system
  };

  return (
    <View style={styles.container}>
      {/* Left: Ticker */}
      <View style={styles.tickerSection}>
        {tickerMessage ? (
          <Text style={styles.tickerText} numberOfLines={1}>
            {tickerMessage}
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
          <ActionButton
            label={displayPrimary.label}
            color={displayPrimary.color}
            isPrimary
            onPress={handlePrimaryAction}
          />
        )}
      </View>
    </View>
  );
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
