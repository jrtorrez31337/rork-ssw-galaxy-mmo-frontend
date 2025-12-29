import React, { ReactNode, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  AccessibilityProps,
} from 'react-native';
import { tokens } from '@/ui/theme';

/**
 * LCARSRail - LCARS-style button strip
 *
 * Per UI/UX Doctrine:
 * - Vertical stacked commands in rails (mobile portrait)
 * - Horizontal bars for landscape/tablet
 * - Minimum 44pt touch targets
 * - Color indicates function category
 *
 * Accessibility:
 * - Role as tablist/toolbar
 * - Individual buttons as tabs/buttons
 * - Keyboard navigation support
 */

export type RailOrientation = 'horizontal' | 'vertical';
export type RailVariant = 'navigation' | 'combat' | 'economy' | 'communications' | 'default';

interface RailItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

interface RailProps extends AccessibilityProps {
  items: RailItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  orientation?: RailOrientation;
  variant?: RailVariant;
  style?: ViewStyle;
  compact?: boolean;
}

function getVariantColor(variant: RailVariant): string {
  switch (variant) {
    case 'navigation': return tokens.colors.semantic.navigation;
    case 'combat': return tokens.colors.semantic.combat;
    case 'economy': return tokens.colors.semantic.economy;
    case 'communications': return tokens.colors.semantic.communications;
    default: return tokens.colors.lcars.orange;
  }
}

export function Rail({
  items,
  selectedId,
  onSelect,
  orientation = 'horizontal',
  variant = 'default',
  style,
  compact = false,
  ...accessibilityProps
}: RailProps) {
  const accentColor = getVariantColor(variant);
  const isHorizontal = orientation === 'horizontal';

  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontal : styles.vertical,
        style,
      ]}
      accessibilityRole="tablist"
      {...accessibilityProps}
    >
      {items.map((item, index) => {
        const isSelected = item.id === selectedId;
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.item,
              isHorizontal ? styles.itemHorizontal : styles.itemVertical,
              compact && styles.itemCompact,
              isSelected && { backgroundColor: accentColor },
              !isSelected && styles.itemInactive,
              // LCARS pill shape: rounded ends
              isHorizontal && isFirst && styles.itemFirstHorizontal,
              isHorizontal && isLast && styles.itemLastHorizontal,
              !isHorizontal && isFirst && styles.itemFirstVertical,
              !isHorizontal && isLast && styles.itemLastVertical,
            ]}
            onPress={() => !item.disabled && handleSelect(item.id)}
            disabled={item.disabled}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled: item.disabled }}
            accessibilityLabel={item.label}
          >
            {item.icon && (
              <View style={styles.icon}>
                {item.icon}
              </View>
            )}
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                isSelected && styles.labelSelected,
                item.disabled && styles.labelDisabled,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.badge !== undefined && (
              <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                <Text style={styles.badgeText}>
                  {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * RailButton - Standalone LCARS pill button
 */
interface RailButtonProps extends AccessibilityProps {
  label: string;
  icon?: ReactNode;
  variant?: RailVariant;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  filled?: boolean;
}

export function RailButton({
  label,
  icon,
  variant = 'default',
  onPress,
  disabled = false,
  compact = false,
  filled = true,
  ...accessibilityProps
}: RailButtonProps) {
  const accentColor = getVariantColor(variant);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        compact && styles.buttonCompact,
        filled && { backgroundColor: accentColor },
        !filled && { borderColor: accentColor, borderWidth: 1 },
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      {...accessibilityProps}
    >
      {icon && <View style={styles.buttonIcon}>{icon}</View>}
      <Text
        style={[
          styles.buttonLabel,
          compact && styles.labelCompact,
          filled && styles.labelSelected,
          !filled && { color: accentColor },
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing[1],
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vertical: {
    flexDirection: 'column',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: tokens.interaction.minTouchTarget,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.lcars.beige,
  },
  itemHorizontal: {
    flex: 1,
  },
  itemVertical: {
    width: '100%',
  },
  itemCompact: {
    minHeight: 36,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
  },
  itemInactive: {
    backgroundColor: tokens.colors.background.tertiary,
  },
  itemFirstHorizontal: {
    borderTopLeftRadius: tokens.radius.full,
    borderBottomLeftRadius: tokens.radius.full,
  },
  itemLastHorizontal: {
    borderTopRightRadius: tokens.radius.full,
    borderBottomRightRadius: tokens.radius.full,
  },
  itemFirstVertical: {
    borderTopLeftRadius: tokens.radius.md,
    borderTopRightRadius: tokens.radius.md,
  },
  itemLastVertical: {
    borderBottomLeftRadius: tokens.radius.md,
    borderBottomRightRadius: tokens.radius.md,
  },
  icon: {
    marginRight: tokens.spacing[2],
  },
  label: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelCompact: {
    fontSize: tokens.typography.fontSize.xs,
  },
  labelSelected: {
    color: tokens.colors.text.inverse,
  },
  labelDisabled: {
    color: tokens.colors.text.disabled,
  },
  badge: {
    marginLeft: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: 2,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.lcars.red,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeSelected: {
    backgroundColor: tokens.colors.text.inverse,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: tokens.interaction.minTouchTarget,
    paddingHorizontal: tokens.spacing[5],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.full,
  },
  buttonCompact: {
    minHeight: 36,
    paddingHorizontal: tokens.spacing[4],
  },
  buttonIcon: {
    marginRight: tokens.spacing[2],
  },
  buttonLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
