import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MiningProgressBarProps {
  durationSeconds: number;
  resourceType: string;
  quantity: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Mining progress bar with countdown timer
 * Shows extraction progress over 30 seconds (or custom duration)
 * Includes cancel button if onCancel is provided
 */
export default function MiningProgressBar({
  durationSeconds,
  resourceType,
  quantity,
  onComplete,
  onCancel,
}: MiningProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - startTime) / 1000;

      if (elapsedSeconds >= durationSeconds) {
        setElapsed(durationSeconds);
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      } else {
        setElapsed(elapsedSeconds);
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [durationSeconds, startTime, onComplete]);

  const progress = (elapsed / durationSeconds) * 100;
  const remaining = Math.max(0, Math.ceil(durationSeconds - elapsed));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Extracting {quantity}× {resourceType}
        </Text>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <X size={18} color={Colors.danger} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, progress)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.timeRemaining}>
          {remaining > 0 ? `${remaining}s remaining` : 'Complete!'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.danger + '20',
  },
  cancelText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  timeRemaining: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
