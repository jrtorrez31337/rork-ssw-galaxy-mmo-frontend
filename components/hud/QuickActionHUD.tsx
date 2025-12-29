import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation, Anchor, Swords, MessageCircle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';

interface QuickActionHUDProps {
  onJumpPress: () => void;
  onDockPress: () => void;
  onCombatPress: () => void;
  onChatPress: () => void;
  jumpDisabled?: boolean;
  dockDisabled?: boolean;
  combatDisabled?: boolean;
  chatDisabled?: boolean;
}

/**
 * Quick Action HUD (Floating Action Buttons)
 * According to B1-ux-system-definition.md (lines 123-151)
 *
 * Features:
 * - Floating overlay on viewport (bottom-right)
 * - 4 buttons: Jump, Dock, Combat, Chat
 * - Semi-transparent background (60% opacity)
 * - 44x44px minimum touch targets
 * - Icon + text label
 * - Context-aware disabled states
 */
export function QuickActionHUD({
  onJumpPress,
  onDockPress,
  onCombatPress,
  onChatPress,
  jumpDisabled = false,
  dockDisabled = false,
  combatDisabled = false,
  chatDisabled = false,
}: QuickActionHUDProps) {
  const actions = [
    {
      id: 'jump',
      icon: Navigation,
      label: 'JUMP',
      accessibilityLabel: 'Jump to another sector',
      accessibilityHint: 'Opens jump navigation panel',
      onPress: onJumpPress,
      disabled: jumpDisabled,
      color: tokens.colors.primary.main,
    },
    {
      id: 'dock',
      icon: Anchor,
      label: 'DOCK',
      accessibilityLabel: 'Dock at station',
      accessibilityHint: 'Opens docking options panel',
      onPress: onDockPress,
      disabled: dockDisabled,
      color: tokens.colors.secondary.main,
    },
    {
      id: 'combat',
      icon: Swords,
      label: 'COMBAT',
      accessibilityLabel: 'Initiate combat',
      accessibilityHint: 'Engage selected target in combat',
      onPress: onCombatPress,
      disabled: combatDisabled,
      color: tokens.colors.danger,
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'CHAT',
      accessibilityLabel: 'Open chat',
      accessibilityHint: 'Opens sector chat panel',
      onPress: onChatPress,
      disabled: chatDisabled,
      color: tokens.colors.success,
    },
  ];

  return (
    <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Quick actions">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.button,
              action.disabled && styles.buttonDisabled,
            ]}
            onPress={action.onPress}
            disabled={action.disabled}
            activeOpacity={0.8}
            accessible
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            accessibilityHint={action.disabled ? 'Currently unavailable' : action.accessibilityHint}
            accessibilityState={{ disabled: action.disabled }}
          >
            <View style={styles.iconContainer}>
              <Icon
                size={20}
                color={action.disabled ? tokens.colors.text.disabled : action.color}
              />
            </View>
            <Text
              style={[
                styles.label,
                action.disabled && styles.labelDisabled,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: tokens.layout.tabBar.height + tokens.spacing[4],
    right: tokens.spacing[4],
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 60% opacity
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    overflow: 'hidden',
    ...tokens.elevation[3],
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    minHeight: tokens.interaction.minTouchTarget,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  buttonDisabled: {
    opacity: 0.4,
  },

  iconContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing[3],
  },

  label: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    letterSpacing: 0.5,
  },

  labelDisabled: {
    color: tokens.colors.text.disabled,
  },
});
