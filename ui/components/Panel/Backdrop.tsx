import React from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { tokens } from '../../theme';

interface BackdropProps {
  visible: boolean;
  onPress: () => void;
  opacity: Animated.Value;
}

export function Backdrop({ visible, onPress, opacity }: BackdropProps) {
  if (!visible) return null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onPress}>
      <Animated.View style={[styles.backdrop, { opacity }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.colors.backdrop,
  },
});
