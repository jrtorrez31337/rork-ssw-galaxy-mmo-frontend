import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens } from '../theme';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ size: number; color: string }>;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  children,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ].filter(Boolean);

  const textStyle = [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
    (disabled || loading) && styles.textDisabled,
  ].filter(Boolean);

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const iconColor = getIconColor(variant, disabled || loading);

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' && (
            <Icon size={iconSize} color={iconColor} />
          )}
          <Text style={textStyle}>{children}</Text>
          {Icon && iconPosition === 'right' && (
            <Icon size={iconSize} color={iconColor} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function getIconColor(variant: string, disabled: boolean): string {
  if (disabled) return tokens.colors.text.disabled;

  switch (variant) {
    case 'primary':
    case 'danger':
      return tokens.colors.text.inverse;
    case 'secondary':
    case 'ghost':
      return tokens.colors.primary.main;
    default:
      return tokens.colors.text.primary;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.base,
    borderWidth: 0,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  // Sizes
  size_sm: {
    height: 32,
    paddingHorizontal: tokens.spacing[3],
  },
  size_md: {
    height: 40,
    paddingHorizontal: tokens.spacing[4],
  },
  size_lg: {
    height: 48,
    paddingHorizontal: tokens.spacing[5],
  },

  // Variants
  variant_primary: {
    backgroundColor: tokens.colors.primary.main,
  },
  variant_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.primary.main,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: tokens.colors.danger,
  },

  // Text styles
  text: {
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  text_sm: {
    fontSize: tokens.typography.fontSize.sm,
  },
  text_md: {
    fontSize: tokens.typography.fontSize.base,
  },
  text_lg: {
    fontSize: tokens.typography.fontSize.md,
  },

  // Text variants
  text_primary: {
    color: tokens.colors.text.inverse,
  },
  text_secondary: {
    color: tokens.colors.primary.main,
  },
  text_ghost: {
    color: tokens.colors.primary.main,
  },
  text_danger: {
    color: tokens.colors.text.inverse,
  },

  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: tokens.colors.text.disabled,
  },
});
