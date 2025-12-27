import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { MoreVertical, Zap, Anchor, Wrench, Settings } from 'lucide-react-native';
import { Text } from '../Text';
import { Divider } from '../Divider';
import { tokens } from '../../theme';
import * as Haptics from 'expo-haptics';

interface MenuAction {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface QuickActionsMenuProps {
  actions: MenuAction[];
}

export function QuickActionsMenu({ actions }: QuickActionsMenuProps) {
  const [visible, setVisible] = useState(false);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleActionPress = (action: MenuAction) => {
    if (!action.disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleClose();
      action.onPress();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleOpen}
        accessible
        accessibilityLabel="Quick actions menu"
        accessibilityRole="button"
      >
        <MoreVertical size={tokens.interaction.iconSize.md} color={tokens.colors.text.primary} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <View style={styles.menu}>
            {actions.map((action, index) => {
              const Icon = action.icon;
              const isLast = index === actions.length - 1;
              const textColor =
                action.variant === 'danger'
                  ? tokens.colors.danger
                  : action.disabled
                  ? tokens.colors.text.disabled
                  : tokens.colors.text.primary;
              const iconColor =
                action.variant === 'danger'
                  ? tokens.colors.danger
                  : action.disabled
                  ? tokens.colors.text.disabled
                  : tokens.colors.primary.main;

              return (
                <View key={action.label}>
                  <TouchableOpacity
                    style={[styles.menuItem, action.disabled && styles.menuItemDisabled]}
                    onPress={() => handleActionPress(action)}
                    disabled={action.disabled}
                    accessible
                    accessibilityLabel={action.label}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: action.disabled }}
                  >
                    <Icon size={tokens.interaction.iconSize.base} color={iconColor} />
                    <Text variant="body" color={textColor} weight="medium">
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                  {!isLast && <Divider />}
                </View>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: tokens.spacing[2],
  },
  backdrop: {
    flex: 1,
    backgroundColor: tokens.colors.backdrop,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // Below TopBar
    paddingRight: tokens.spacing[2],
  },
  menu: {
    backgroundColor: tokens.colors.surface.modal,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    minWidth: 200,
    ...tokens.elevation[3],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});
