import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Pickaxe, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import QualityIndicator from './QualityIndicator';
import type { ResourceNode } from '@/types/mining';

interface MiningControlsProps {
  node: ResourceNode;
  cargoUsed: number;
  cargoCapacity: number;
  onExtract: (quantity: number) => void;
  disabled?: boolean;
}

/**
 * Mining extraction controls
 * Quantity slider, cargo display, and extract button
 */
export default function MiningControls({
  node,
  cargoUsed,
  cargoCapacity,
  onExtract,
  disabled = false,
}: MiningControlsProps) {
  const cargoAvailable = cargoCapacity - cargoUsed;
  const maxQuantity = Math.min(node.quantity_remaining, cargoAvailable);

  const [quantity, setQuantity] = useState(Math.min(100, maxQuantity));
  const [customInput, setCustomInput] = useState('');

  // Update quantity when maxQuantity changes
  useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(maxQuantity);
    }
  }, [maxQuantity]);

  // Quality range estimation (±1 stddev)
  const qualityMean = parseFloat(node.quality_mean);
  const qualityStddev = node.quality_stddev
    ? parseFloat(node.quality_stddev)
    : 0.2;
  const qualityMin = Math.max(0.5, qualityMean - qualityStddev);
  const qualityMax = Math.min(2.0, qualityMean + qualityStddev);

  const handleExtract = () => {
    if (quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please select a quantity to extract');
      return;
    }
    if (quantity > maxQuantity) {
      Alert.alert(
        'Not Enough Space',
        `You can only extract up to ${maxQuantity} units`
      );
      return;
    }
    onExtract(quantity);
  };

  const handleCustomInput = () => {
    const value = parseInt(customInput, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(Math.min(value, maxQuantity));
      setCustomInput('');
    }
  };

  const canExtract = !disabled && quantity > 0 && quantity <= maxQuantity;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mining Controls</Text>
        <View style={styles.cargoDisplay}>
          <Package size={16} color={Colors.textSecondary} />
          <Text style={styles.cargoText}>
            {cargoUsed} / {cargoCapacity}
          </Text>
          <Text
            style={[
              styles.cargoAvailable,
              cargoAvailable === 0 && styles.cargoFull,
            ]}
          >
            ({cargoAvailable} available)
          </Text>
        </View>
      </View>

      {/* Quality Range */}
      <View style={styles.qualitySection}>
        <Text style={styles.sectionLabel}>Expected Quality Range</Text>
        <View style={styles.qualityRange}>
          <QualityIndicator quality={qualityMin} showLabel={false} size="small" />
          <Text style={styles.rangeSeparator}>to</Text>
          <QualityIndicator quality={qualityMax} showLabel={false} size="small" />
          <Text style={styles.rangeNote}>(68% of extractions)</Text>
        </View>
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantitySection}>
        <View style={styles.quantityHeader}>
          <Text style={styles.sectionLabel}>Quantity to Extract</Text>
          <Text style={styles.quantityValue}>{quantity} units</Text>
        </View>

        {/* Slider component would go here - using quick selects for now */}
        <View style={styles.sliderPlaceholder}>
          <Text style={styles.sliderNote}>
            Use quick selects or custom input to set quantity
          </Text>
        </View>

        {/* Quick selects */}
        <View style={styles.quickSelects}>
          {[25, 50, 100, maxQuantity].map((preset) => {
            if (preset > maxQuantity) return null;
            return (
              <TouchableOpacity
                key={preset}
                style={styles.quickButton}
                onPress={() => setQuantity(preset === maxQuantity ? maxQuantity : preset)}
                activeOpacity={0.7}
                disabled={disabled}
              >
                <Text style={styles.quickButtonText}>
                  {preset === maxQuantity ? 'Max' : preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom input */}
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={handleCustomInput}
            placeholder="Custom amount"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="number-pad"
            editable={!disabled}
          />
          <TouchableOpacity
            style={styles.setButton}
            onPress={handleCustomInput}
            activeOpacity={0.7}
            disabled={disabled || !customInput}
          >
            <Text style={styles.setButtonText}>Set</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Extract Button */}
      <TouchableOpacity
        style={[
          styles.extractButton,
          (!canExtract) && styles.extractButtonDisabled,
        ]}
        onPress={handleExtract}
        activeOpacity={0.8}
        disabled={!canExtract}
      >
        <Pickaxe size={20} color="#FFFFFF" />
        <Text style={styles.extractButtonText}>
          {disabled ? 'Mining in Progress...' : 'Extract Resources'}
        </Text>
      </TouchableOpacity>

      {/* Warnings */}
      {cargoAvailable === 0 && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Cargo hold is full</Text>
        </View>
      )}
      {node.quantity_remaining === 0 && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Resource node is depleted</Text>
        </View>
      )}
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
    gap: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  cargoDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cargoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  cargoAvailable: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cargoFull: {
    color: Colors.danger,
    fontWeight: '600',
  },
  qualitySection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  qualityRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rangeSeparator: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rangeNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  quantitySection: {
    gap: 12,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  sliderPlaceholder: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sliderNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickSelects: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 14,
  },
  setButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.border,
    borderRadius: 8,
    justifyContent: 'center',
  },
  setButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  extractButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  extractButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warning: {
    backgroundColor: Colors.danger + '20',
    padding: 10,
    borderRadius: 8,
    marginTop: -8,
  },
  warningText: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});
