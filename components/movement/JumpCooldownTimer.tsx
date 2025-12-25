import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface JumpCooldownTimerProps {
  lastJumpAt: string | null;
  onCooldownComplete: () => void;
}

export default function JumpCooldownTimer({
  lastJumpAt,
  onCooldownComplete,
}: JumpCooldownTimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!lastJumpAt) {
      setRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const jumpTime = new Date(lastJumpAt).getTime();
      const now = Date.now();
      const elapsed = (now - jumpTime) / 1000; // seconds
      const cooldown = 10; // 10 second cooldown
      const rem = Math.max(0, cooldown - elapsed);
      setRemaining(rem);

      if (rem === 0) {
        onCooldownComplete();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 100);

    return () => clearInterval(interval);
  }, [lastJumpAt, onCooldownComplete]);

  if (remaining === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.text}>
        Jump drive recharging: {remaining.toFixed(1)}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 8,
    marginBottom: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500',
  },
});
