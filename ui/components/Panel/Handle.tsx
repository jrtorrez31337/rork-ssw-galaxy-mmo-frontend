import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '../../theme';

export function Handle() {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[3],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.colors.border.light,
  },
});
