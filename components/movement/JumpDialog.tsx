import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movementApi } from '@/api/movement';
import { Ship, Vector3 } from '@/types/api';
import { MovementError } from '@/types/movement';
import FuelGauge from './FuelGauge';
import Colors from '@/constants/colors';

interface JumpDialogProps {
  visible: boolean;
  ship: Ship;
  onClose: () => void;
}

// Fuel cost calculation (client-side estimation)
function calculateFuelCost(
  fromSector: string,
  toSector: string,
  shipSpeed: number = 5.0,
  sectorType: 'normal' | 'nebula' | 'void' | 'hazard' = 'normal'
): number {
  const from = parseSectorCoords(fromSector);
  const to = parseSectorCoords(toSector);

  const distance = Math.sqrt(
    Math.pow(to.x - from.x, 2) +
    Math.pow(to.y - from.y, 2) +
    Math.pow(to.z - from.z, 2)
  );

  const sectorModifiers = {
    normal: 1.0,
    nebula: 1.5,
    void: 0.8,
    hazard: 2.0,
  };

  return distance * (1.0 / shipSpeed) * sectorModifiers[sectorType];
}

function parseSectorCoords(sector: string): Vector3 {
  const parts = sector.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid sector format');
  }
  return {
    x: parseFloat(parts[0]),
    y: parseFloat(parts[1]),
    z: parseFloat(parts[2]),
  };
}

export default function JumpDialog({ visible, ship, onClose }: JumpDialogProps) {
  const [targetSector, setTargetSector] = useState('');
  const [fuelCost, setFuelCost] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const jumpMutation = useMutation({
    mutationFn: () => movementApi.jump(ship.id, targetSector),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      handleClose();
    },
  });

  // Calculate fuel cost when target sector changes
  useEffect(() => {
    if (!targetSector) {
      setFuelCost(null);
      setValidationError(null);
      return;
    }

    try {
      const cost = calculateFuelCost(ship.location_sector, targetSector);
      setFuelCost(cost);
      setValidationError(null);
    } catch (err) {
      setValidationError('Invalid sector format. Use x.y.z (e.g., 1.0.0)');
      setFuelCost(null);
    }
  }, [targetSector, ship.location_sector]);

  const handleClose = () => {
    if (!jumpMutation.isPending) {
      onClose();
      setTargetSector('');
      setFuelCost(null);
      setValidationError(null);
      jumpMutation.reset();
    }
  };

  const handleJump = () => {
    if (!fuelCost || fuelCost > ship.fuel_current) {
      setValidationError('Insufficient fuel for this jump');
      return;
    }
    jumpMutation.mutate();
  };

  const canJump =
    fuelCost !== null &&
    fuelCost <= ship.fuel_current &&
    !validationError &&
    !jumpMutation.isPending;

  const errorMessage = validationError ||
    (jumpMutation.isError
      ? movementApi.handleError(
          (jumpMutation.error as any)?.response?.data?.error?.code ||
            'VALIDATION_ERROR'
        )
      : null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Jump to Sector</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={jumpMutation.isPending}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Current Location */}
            <View style={styles.infoSection}>
              <Text style={styles.label}>Current Sector</Text>
              <Text style={styles.sectorText}>{ship.location_sector}</Text>
            </View>

            {/* Target Sector Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Target Sector</Text>
              <TextInput
                style={styles.input}
                value={targetSector}
                onChangeText={setTargetSector}
                placeholder="e.g., 1.0.0"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                editable={!jumpMutation.isPending}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>Format: x.y.z (numbers separated by dots)</Text>
            </View>

            {/* Fuel Cost Estimate */}
            {fuelCost !== null && (
              <View style={styles.costSection}>
                <Text style={styles.costLabel}>Estimated fuel cost:</Text>
                <Text style={styles.costValue}>{fuelCost.toFixed(2)} units</Text>
                <Text style={styles.costRemaining}>
                  Remaining after jump: {(ship.fuel_current - fuelCost).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Fuel Gauge */}
            <FuelGauge current={ship.fuel_current} capacity={ship.fuel_capacity} />

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
                disabled={jumpMutation.isPending}
              >
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  !canJump && styles.buttonDisabled,
                ]}
                onPress={handleJump}
                disabled={!canJump}
              >
                {jumpMutation.isPending ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Execute Jump</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  infoSection: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  sectorText: {
    fontSize: 20,
    fontFamily: 'monospace',
    color: Colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 4,
  },
  costSection: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  costLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  costRemaining: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
