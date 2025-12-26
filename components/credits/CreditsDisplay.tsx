import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { DollarSign } from 'lucide-react-native';
import Decimal from 'decimal.js';
import Colors from '@/constants/colors';

interface CreditsDisplayProps {
  credits: string; // Decimal string
  animated?: boolean;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  lastTransaction?: {
    amount: string;
    reason: string;
  };
}

export default function CreditsDisplay({
  credits,
  animated = true,
  showIcon = true,
  size = 'medium',
  lastTransaction,
}: CreditsDisplayProps) {
  const [displayValue, setDisplayValue] = useState(credits);
  const previousCredits = useRef(credits);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Determine if credits increased or decreased
  const creditsChanged =
    previousCredits.current !== credits &&
    previousCredits.current !== '0' &&
    credits !== '0';
  const isIncrease = creditsChanged
    ? new Decimal(credits).greaterThan(new Decimal(previousCredits.current))
    : false;

  useEffect(() => {
    if (!animated || !creditsChanged) {
      setDisplayValue(credits);
      previousCredits.current = credits;
      return;
    }

    // Animate the value change
    const start = parseFloat(previousCredits.current);
    const end = parseFloat(credits);
    const duration = 500; // ms
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
        setDisplayValue(newValue.toFixed(2));
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

  // Format credits with commas and 2 decimal places
  const formatCredits = (value: string): string => {
    const decimal = new Decimal(value);
    const parts = decimal.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const flashColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(0, 0, 0, 0)',
      isIncrease ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    ],
  });

  const sizeStyles = {
    small: {
      fontSize: 14,
      iconSize: 14,
      padding: 6,
    },
    medium: {
      fontSize: 18,
      iconSize: 18,
      padding: 8,
    },
    large: {
      fontSize: 24,
      iconSize: 24,
      padding: 12,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: flashColor,
          paddingHorizontal: currentSize.padding,
          paddingVertical: currentSize.padding / 2,
        },
      ]}
    >
      <View style={styles.content}>
        {showIcon && (
          <DollarSign size={currentSize.iconSize} color={Colors.success} />
        )}
        <Text style={[styles.amount, { fontSize: currentSize.fontSize }]}>
          {formatCredits(displayValue)}
        </Text>
        <Text
          style={[styles.currency, { fontSize: currentSize.fontSize * 0.7 }]}
        >
          CR
        </Text>
      </View>
      {lastTransaction && (
        <Text style={styles.tooltip}>{lastTransaction.reason}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    fontWeight: '700',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tooltip: {
    fontSize: 10,
    color: Colors.textDim,
    marginTop: 2,
  },
});
