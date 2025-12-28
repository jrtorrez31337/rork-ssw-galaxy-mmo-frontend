import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { travelApi } from '@/api/travel';
import { useTravelStore } from '@/stores/travelStore';
import { Ship, Vector3 } from '@/types/api';
import { X, Zap, Navigation, Clock } from 'lucide-react-native';
import { tokens } from '@/ui/theme';

// Base travel time factor: seconds per distance unit
const BASE_TRAVEL_TIME_PER_UNIT = 7;

interface JumpPanelProps {
  ship: Ship;
  targetSector?: string; // Optional pre-filled target
  isVisible: boolean;
  onClose: () => void;
  onJumpSuccess?: () => void;
}

// Fuel cost calculation (client-side estimation)
function calculateFuelCost(
  fromSector: string,
  toSector: string,
  shipSpeed: number = 5.0
): number {
  const from = parseSectorCoords(fromSector);
  const to = parseSectorCoords(toSector);

  const distance = Math.sqrt(
    Math.pow(to.x - from.x, 2) +
    Math.pow(to.y - from.y, 2) +
    Math.pow(to.z - from.z, 2)
  );

  return distance * (1.0 / shipSpeed);
}

function parseSectorCoords(sector: string): Vector3 {
  const parts = sector.split(',');
  if (parts.length !== 3) {
    throw new Error('Invalid sector format');
  }
  return {
    x: parseFloat(parts[0]),
    y: parseFloat(parts[1]),
    z: parseFloat(parts[2]),
  };
}

/**
 * Jump Panel (Inline Panel)
 * According to B1-ux-system-definition.md (lines 373-424)
 *
 * Features:
 * - Slides up from bottom (not modal)
 * - Map remains visible (dimmed)
 * - Shows distance, fuel cost, cooldown
 * - Cancel/Confirm buttons
 */
export function JumpPanel({
  ship,
  targetSector: initialTarget,
  isVisible,
  onClose,
  onJumpSuccess,
}: JumpPanelProps) {
  const [targetSector, setTargetSector] = useState(initialTarget || '');
  const [fuelCost, setFuelCost] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [travelTime, setTravelTime] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { setActiveTravel } = useTravelStore();

  // Slide animation
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Prefill target if provided
  useEffect(() => {
    if (initialTarget && isVisible) {
      setTargetSector(initialTarget);
    }
  }, [initialTarget, isVisible]);

  const travelMutation = useMutation({
    mutationFn: () => travelApi.start(ship.id, targetSector),
    onSuccess: (response) => {
      // Update travel store with active travel info
      setActiveTravel({
        travel_id: response.travel_id,
        ship_id: response.ship_id,
        from_sector: response.from_sector,
        to_sector: response.to_sector,
        distance: response.distance,
        status: 'in_transit',
        started_at: response.started_at,
        arrives_at: response.arrives_at,
        completed_at: null,
        remaining_seconds: response.travel_time_seconds,
        progress_percent: 0,
        fuel_consumed: response.fuel_consumed,
      });

      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      onJumpSuccess?.();
      handleClose();
    },
  });

  // Calculate fuel cost and travel time when target sector changes
  useEffect(() => {
    if (!targetSector || !isVisible) {
      setFuelCost(null);
      setDistance(null);
      setTravelTime(null);
      setValidationError(null);
      return;
    }

    try {
      const cost = calculateFuelCost(ship.location_sector, targetSector, ship.stat_allocation?.speed ?? 5.0);
      const from = parseSectorCoords(ship.location_sector);
      const to = parseSectorCoords(targetSector);
      const dist = Math.sqrt(
        Math.pow(to.x - from.x, 2) +
        Math.pow(to.y - from.y, 2) +
        Math.pow(to.z - from.z, 2)
      );

      // Estimate travel time based on distance
      const estimatedTime = Math.ceil(dist * BASE_TRAVEL_TIME_PER_UNIT);

      setFuelCost(cost);
      setDistance(dist);
      setTravelTime(estimatedTime);
      setValidationError(null);
    } catch (err) {
      setValidationError('Invalid sector format. Use x,y,z');
      setFuelCost(null);
      setDistance(null);
      setTravelTime(null);
    }
  }, [targetSector, ship.location_sector, isVisible]);

  const handleClose = () => {
    if (!travelMutation.isPending) {
      onClose();
      setTargetSector('');
      setFuelCost(null);
      setDistance(null);
      setTravelTime(null);
      setValidationError(null);
      travelMutation.reset();
    }
  };

  const handleTravel = () => {
    if (!fuelCost || fuelCost > ship.fuel_current) {
      setValidationError('Insufficient fuel for this journey');
      return;
    }
    travelMutation.mutate();
  };

  const canTravel =
    fuelCost !== null &&
    fuelCost <= ship.fuel_current &&
    !validationError &&
    !travelMutation.isPending;

  const errorMessage = validationError ||
    (travelMutation.isError
      ? 'Travel failed. Please try again.'
      : null);

  // Format travel time for display
  const formatTravelTime = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (secs > 0) return `~${mins}m ${secs}s`;
      return `~${mins}m`;
    }
    return `~${seconds}s`;
  };

  if (!isVisible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Navigation size={20} color={tokens.colors.primary.main} />
          <Text style={styles.headerTitle}>TRAVEL TO SECTOR</Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          disabled={travelMutation.isPending}
          style={styles.closeButton}
        >
          <X size={20} color={tokens.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Target Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Sector</Text>
        <TextInput
          style={styles.input}
          value={targetSector}
          onChangeText={setTargetSector}
          placeholder="e.g., 12,6,8"
          placeholderTextColor={tokens.colors.text.tertiary}
          editable={!travelMutation.isPending}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
        <Text style={styles.hint}>Format: x,y,z (comma-separated coordinates)</Text>
      </View>

      {/* Travel Info */}
      {fuelCost !== null && distance !== null && travelTime !== null && (
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>{distance.toFixed(1)} units</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Travel Time:</Text>
            <View style={styles.infoValueRow}>
              <Clock size={14} color={tokens.colors.info} />
              <Text style={[styles.infoValue, styles.timeValue]}>
                {formatTravelTime(travelTime)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Cost:</Text>
            <View style={styles.infoValueRow}>
              <Zap size={14} color={tokens.colors.warning} />
              <Text style={[styles.infoValue, styles.fuelValue]}>
                {Math.ceil(fuelCost)} fuel
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fuel Remaining:</Text>
            <Text style={[
              styles.infoValue,
              (ship.fuel_current - fuelCost) < ship.fuel_capacity * 0.2 && styles.lowFuel,
            ]}>
              {Math.floor(ship.fuel_current - fuelCost)}/{ship.fuel_capacity}
            </Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleClose}
          disabled={travelMutation.isPending}
        >
          <Text style={styles.buttonTextSecondary}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            !canTravel && styles.buttonDisabled,
          ]}
          onPress={handleTravel}
          disabled={!canTravel}
        >
          {travelMutation.isPending ? (
            <ActivityIndicator color={tokens.colors.text.primary} size="small" />
          ) : (
            <Text style={styles.buttonTextPrimary}>BEGIN TRAVEL</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.spacing[6],
    paddingBottom: tokens.spacing[8],
    borderTopWidth: 2,
    borderTopColor: tokens.colors.primary.alpha[30],
    ...tokens.elevation[4],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[6],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputGroup: {
    marginBottom: tokens.spacing[6],
  },

  label: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[2],
  },

  input: {
    backgroundColor: tokens.colors.surface.raised,
    borderWidth: 2,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  hint: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[1],
  },

  infoSection: {
    backgroundColor: tokens.colors.primary.alpha[10],
    borderWidth: 1,
    borderColor: tokens.colors.primary.alpha[30],
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
    gap: tokens.spacing[3],
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  infoValue: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
    fontWeight: tokens.typography.fontWeight.semibold,
  },

  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  fuelValue: {
    color: tokens.colors.warning,
  },

  timeValue: {
    color: tokens.colors.info,
  },

  lowFuel: {
    color: tokens.colors.danger,
  },

  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: tokens.colors.danger,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },

  errorMessage: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.danger,
  },

  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },

  button: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: tokens.interaction.minTouchTarget,
  },

  buttonSecondary: {
    backgroundColor: tokens.colors.surface.raised,
    borderWidth: 2,
    borderColor: tokens.colors.border.light,
  },

  buttonPrimary: {
    backgroundColor: tokens.colors.primary.main,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonTextSecondary: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },

  buttonTextPrimary: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
});
