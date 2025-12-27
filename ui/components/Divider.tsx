import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '../theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  style?: ViewStyle;
}

export function Divider({ orientation = 'horizontal', spacing = 0, style }: DividerProps) {
  const dividerStyle = [
    styles.base,
    orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    spacing > 0 && (orientation === 'horizontal'
      ? { marginVertical: spacing }
      : { marginHorizontal: spacing }
    ),
    style,
  ].filter(Boolean);

  return <View style={dividerStyle} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.colors.border.default,
  },

  horizontal: {
    height: 1,
    width: '100%',
  },

  vertical: {
    width: 1,
    height: '100%',
  },
});
