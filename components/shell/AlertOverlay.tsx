import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';

/**
 * AlertOverlay
 * Per UI/UX Doctrine Section 2: Alert Escalation Behavior
 *
 * GREEN: No overlay
 * YELLOW: Subtle yellow vignette on viewport
 * RED: Header bar pulses red at 0.5Hz, viewport gains red vignette
 *
 * This overlay sits above the viewport but below panels/modals
 * It never destroys or remounts the underlying layout
 */

export function AlertOverlay() {
  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alertLevel === 'red') {
      // 0.5Hz pulse = 2 second cycle
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (alertLevel === 'yellow') {
      // Static yellow vignette
      pulseAnim.setValue(0.5);
    } else {
      pulseAnim.setValue(0);
    }

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [alertLevel, pulseAnim]);

  if (alertLevel === 'green') {
    return null;
  }

  const overlayColor = alertLevel === 'red'
    ? tokens.colors.alert.redPulse
    : tokens.colors.alert.yellowVignette;

  const opacity = alertLevel === 'red'
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 0.25],
      })
    : pulseAnim;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: overlayColor, opacity },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: tokens.zIndex.fixed,
  },
});
