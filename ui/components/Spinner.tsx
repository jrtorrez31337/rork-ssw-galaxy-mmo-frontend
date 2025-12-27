import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { tokens } from '../theme';

export interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  label?: string;
  centered?: boolean;
  style?: ViewStyle;
}

export function Spinner({
  size = 'large',
  color = tokens.colors.primary.main,
  label,
  centered = false,
  style,
}: SpinnerProps) {
  const containerStyle = [
    styles.container,
    centered && styles.centered,
    style,
  ].filter(Boolean);

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {label && (
        <Text
          variant="caption"
          color={tokens.colors.text.secondary}
          align="center"
          style={styles.label}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
  },

  label: {
    marginTop: tokens.spacing[3],
  },
});
