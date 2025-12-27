import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, type SpacingToken } from '../theme';

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: SpacingToken;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({
  variant = 'default',
  padding = 4,
  onPress,
  children,
  style,
}: CardProps) {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}`],
    { padding: tokens.spacing[padding] },
    style,
  ].filter(Boolean);

  if (onPress) {
    return (
      <Pressable
        style={containerStyle}
        onPress={handlePress}
        accessible
        accessibilityRole="button"
        android_ripple={{
          color: tokens.colors.primary.light,
          borderless: false,
        }}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.md,
  },

  variant_default: {
    backgroundColor: tokens.colors.surface.card,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },

  variant_elevated: {
    backgroundColor: tokens.colors.surface.raised,
    ...tokens.elevation[2],
  },

  variant_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },
});
