import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Coins } from 'lucide-react-native';
import { Text } from '../Text';
import { tokens } from '../../theme';

interface CreditsDisplayProps {
  credits: number;
  animated?: boolean;
  size?: 'sm' | 'md';
  onPress?: () => void;
}

export function CreditsDisplay({
  credits,
  animated = true,
  size = 'md',
  onPress,
}: CreditsDisplayProps) {
  const [displayValue, setDisplayValue] = useState(credits);
  const previousCredits = useRef(credits);
  const flashAnim = useRef(new Animated.Value(0)).current;

  const creditsChanged = previousCredits.current !== credits && previousCredits.current !== 0;
  const isIncrease = creditsChanged ? credits > previousCredits.current : false;

  useEffect(() => {
    if (!animated || !creditsChanged) {
      setDisplayValue(credits);
      previousCredits.current = credits;
      return;
    }

    // Animate the value change
    const start = previousCredits.current;
    const end = credits;
    const duration = 500;
    const steps = 30;
    const increment = (end - start) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newValue = start + increment * currentStep;

      if (currentStep >= steps) {
        setDisplayValue(credits);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.round(newValue));
      }
    }, duration / steps);

    // Flash animation
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start();

    previousCredits.current = credits;

    return () => clearInterval(interval);
  }, [credits, animated, creditsChanged, flashAnim]);

  const formatCredits = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(0, 0, 0, 0)',
      isIncrease ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    ],
  });

  const iconSize = size === 'sm' ? tokens.interaction.iconSize.sm : tokens.interaction.iconSize.base;

  const content = (
    <>
      <Coins size={iconSize} color={tokens.colors.success} />
      <Text variant="mono" weight="bold" style={styles.amount}>
        {formatCredits(displayValue)}
      </Text>
      <Text variant="caption" weight="semibold" color={tokens.colors.text.secondary}>
        CR
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        accessible
        accessibilityLabel={`${formatCredits(displayValue)} credits`}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: flashColor }]}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  amount: {
    fontSize: tokens.typography.fontSize.base,
  },
});
