import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Navigation, Zap, Clock, X, AlertTriangle } from 'lucide-react-native';
import { tokens } from '@/ui/theme/tokens';

interface TravelConfirmationModalProps {
  visible: boolean;
  fromSector: string;
  toSector: string;
  distance: number;
  fuelCost: number;
  currentFuel: number;
  maxFuel: number;
  travelTimeSeconds: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal dialog for confirming travel initiation
 * Shows route, travel time, fuel cost, and warnings
 */
export function TravelConfirmationModal({
  visible,
  fromSector,
  toSector,
  distance,
  fuelCost,
  currentFuel,
  maxFuel,
  travelTimeSeconds,
  isLoading,
  onConfirm,
  onCancel,
}: TravelConfirmationModalProps) {
  const hasEnoughFuel = currentFuel >= fuelCost;
  const fuelAfterTravel = currentFuel - fuelCost;
  const isLowFuelAfter = fuelAfterTravel < maxFuel * 0.2;

  const formatTime = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (secs > 0) return `${mins}m ${secs}s`;
      return `${mins}m`;
    }
    return `${seconds}s`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Navigation size={20} color={tokens.colors.primary.main} />
              <Text style={styles.headerTitle}>CONFIRM TRAVEL</Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeButton}
              disabled={isLoading}
            >
              <X size={20} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Route Info */}
          <View style={styles.routeSection}>
            <Text style={styles.routeLabel}>Route</Text>
            <Text style={styles.routeValue}>{fromSector} → {toSector}</Text>
            <Text style={styles.distanceText}>{distance.toFixed(2)} units</Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Clock size={14} color={tokens.colors.info} />
              </View>
              <Text style={styles.infoLabel}>Travel Time</Text>
              <Text style={styles.infoValue}>{formatTime(travelTimeSeconds)}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Zap size={14} color={tokens.colors.warning} />
              </View>
              <Text style={styles.infoLabel}>Fuel Cost</Text>
              <Text style={[styles.infoValue, !hasEnoughFuel && styles.errorText]}>
                {fuelCost.toFixed(1)} units
              </Text>
            </View>
          </View>

          {/* Insufficient Fuel Warning */}
          {!hasEnoughFuel && (
            <View style={styles.errorContainer}>
              <AlertTriangle size={16} color={tokens.colors.danger} />
              <Text style={styles.errorText}>
                Insufficient fuel! Need {(fuelCost - currentFuel).toFixed(1)} more units.
              </Text>
            </View>
          )}

          {/* Low Fuel After Warning */}
          {hasEnoughFuel && isLowFuelAfter && (
            <View style={styles.warningContainer}>
              <AlertTriangle size={16} color={tokens.colors.warning} />
              <Text style={styles.warningText}>
                Fuel will be low after travel ({fuelAfterTravel.toFixed(1)} units remaining)
              </Text>
            </View>
          )}

          {/* Fuel After Travel */}
          {hasEnoughFuel && (
            <View style={styles.fuelAfterRow}>
              <Text style={styles.fuelAfterLabel}>Fuel After Travel:</Text>
              <Text
                style={[
                  styles.fuelAfterValue,
                  isLowFuelAfter && styles.lowFuelText,
                ]}
              >
                {fuelAfterTravel.toFixed(1)} / {maxFuel.toFixed(0)}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.buttonTextSecondary}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                (!hasEnoughFuel || isLoading) && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={!hasEnoughFuel || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={tokens.colors.text.primary} size="small" />
              ) : (
                <Text style={styles.buttonTextPrimary}>BEGIN TRAVEL</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: tokens.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[6],
  },
  container: {
    backgroundColor: tokens.colors.surface.modal,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[6],
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
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
  routeSection: {
    marginBottom: tokens.spacing[4],
    alignItems: 'center',
  },
  routeLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginBottom: tokens.spacing[1],
  },
  routeValue: {
    fontSize: tokens.typography.fontSize.xl,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  distanceText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing[1],
  },
  infoGrid: {
    flexDirection: 'row',
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[4],
  },
  infoItem: {
    flex: 1,
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
  },
  infoIcon: {
    marginBottom: tokens.spacing[2],
  },
  infoLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginBottom: tokens.spacing[1],
  },
  infoValue: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: tokens.colors.danger,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },
  errorText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.danger,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: tokens.colors.warning,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },
  warningText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.warning,
    flex: 1,
  },
  fuelAfterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  fuelAfterLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  fuelAfterValue: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  lowFuelText: {
    color: tokens.colors.warning,
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
    color: tokens.colors.text.inverse,
  },
});
