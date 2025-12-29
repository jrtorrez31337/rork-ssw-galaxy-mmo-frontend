import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Package, ArrowRightLeft, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory';
import { tokens } from '@/ui/theme';
import type { InventoryItem } from '@/api/inventory';

interface TransferPanelProps {
  visible: boolean;
  onClose: () => void;
  sourceId: string;
  sourceType: 'ship' | 'station' | 'planet';
  item: InventoryItem;
  defaultTargetId?: string;
  defaultTargetType?: 'ship' | 'station' | 'planet';
  onSuccess?: () => void;
}

export default function TransferPanel({
  visible,
  onClose,
  sourceId,
  sourceType,
  item,
  defaultTargetId,
  defaultTargetType,
  onSuccess,
}: TransferPanelProps) {
  const queryClient = useQueryClient();
  const [slideAnim] = useState(new Animated.Value(0));
  const [targetType, setTargetType] = useState<'ship' | 'station' | 'planet'>(defaultTargetType || 'ship');
  const [targetId, setTargetId] = useState(defaultTargetId || '');
  const [quantity, setQuantity] = useState('1');

  // Reset to defaults when visible changes
  useEffect(() => {
    if (visible) {
      setTargetType(defaultTargetType || 'ship');
      setTargetId(defaultTargetId || '');
      setQuantity('1');
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
  }, [visible, defaultTargetId, defaultTargetType]);

  const transferMutation = useMutation({
    mutationFn: () => {
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        throw new Error('Invalid quantity');
      }
      if (quantityNum > item.quantity) {
        throw new Error('Quantity exceeds available amount');
      }
      if (!targetId.trim()) {
        throw new Error('Target ID is required');
      }

      return inventoryApi.transfer({
        source_id: sourceId,
        source_type: sourceType,
        target_id: targetId.trim(),
        target_type: targetType,
        resource_type: item.resource_type,
        quantity: quantityNum,
        quality: item.quality || 1.0,
      });
    },
    onSuccess: () => {
      // Invalidate inventory queries for both source and target
      queryClient.invalidateQueries({ queryKey: ['inventory', sourceId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', targetId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      Alert.alert(
        'Transfer Complete',
        `Transferred ${quantity} ${item.resource_type} to ${targetType}`,
        [{ text: 'OK' }]
      );

      if (onSuccess) {
        onSuccess();
      } else {
        handleClose();
      }
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error_code;
      let errorMessage = 'Failed to transfer items. Please try again.';

      switch (errorCode) {
        case 'INV_INSUFFICIENT_QUANTITY':
          errorMessage = "You don't have enough of this resource to transfer.";
          break;
        case 'INV_CARGO_FULL':
          errorMessage = 'Target cargo is full! Clear space and try again.';
          break;
        case 'INV_INVALID_TARGET':
          errorMessage = 'Invalid target ID. Please check and try again.';
          break;
        case 'INV_NOT_DOCKED':
          errorMessage = 'You must be docked to transfer items to a station.';
          break;
      }

      Alert.alert('Transfer Failed', errorMessage, [{ text: 'OK' }]);
    },
  });

  const handleClose = () => {
    setTargetType(defaultTargetType || 'ship');
    setTargetId(defaultTargetId || '');
    setQuantity('1');
    onClose();
  };

  const handleTransfer = () => {
    const quantityNum = parseInt(quantity);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Invalid Quantity', 'Quantity must be greater than 0');
      return;
    }

    if (quantityNum > item.quantity) {
      Alert.alert('Insufficient Quantity', `You only have ${item.quantity} units available`);
      return;
    }

    if (!targetId.trim()) {
      Alert.alert('Missing Target', 'Please enter a target ID');
      return;
    }

    transferMutation.mutate();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  if (!visible) {
    return null;
  }

  // Calculate quality display
  const quality = item.quality || 1.0;
  const qualityPercentage = Math.round(quality * 100);

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Package size={24} color={tokens.colors.primary.main} />
            <Text style={styles.title}>Transfer Items</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <X size={24} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Resource Info */}
        <View style={styles.resourceInfo}>
          <View style={styles.resourceHeader}>
            <Text style={styles.resourceName}>{item.resource_type}</Text>
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{qualityPercentage}% Quality</Text>
            </View>
          </View>
          <Text style={styles.availableText}>
            Available: {item.quantity} units
          </Text>
        </View>

        {/* Transfer Form */}
        <View style={styles.form}>
          {/* Target Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  targetType === 'ship' && styles.typeButtonActive,
                ]}
                onPress={() => setTargetType('ship')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    targetType === 'ship' && styles.typeButtonTextActive,
                  ]}
                >
                  Ship
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  targetType === 'station' && styles.typeButtonActive,
                ]}
                onPress={() => setTargetType('station')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    targetType === 'station' && styles.typeButtonTextActive,
                  ]}
                >
                  Station
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  targetType === 'planet' && styles.typeButtonActive,
                ]}
                onPress={() => setTargetType('planet')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    targetType === 'planet' && styles.typeButtonTextActive,
                  ]}
                >
                  Planet
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target ID Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target ID</Text>
            <TextInput
              style={styles.input}
              value={targetId}
              onChangeText={setTargetId}
              placeholder={`Enter ${targetType} ID`}
              placeholderTextColor={tokens.colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Quantity Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={tokens.colors.text.tertiary}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setQuantity(item.quantity.toString())}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={transferMutation.isPending}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.transferButton,
              transferMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={transferMutation.isPending}
          >
            {transferMutation.isPending ? (
              <ActivityIndicator size="small" color={tokens.colors.text.primary} />
            ) : (
              <>
                <ArrowRightLeft size={20} color={tokens.colors.text.primary} />
                <Text style={styles.transferButtonText}>Transfer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingBottom: tokens.spacing[6],
    maxHeight: '80%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },

  title: {
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

  resourceInfo: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    backgroundColor: tokens.colors.surface.raised,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
  },

  resourceName: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
  },

  qualityBadge: {
    backgroundColor: tokens.colors.primary.alpha[20],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },

  qualityText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary.main,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  availableText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  form: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    gap: tokens.spacing[4],
  },

  inputGroup: {
    gap: tokens.spacing[2],
  },

  label: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },

  typeSelector: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },

  typeButton: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    backgroundColor: tokens.colors.surface.overlay,
    alignItems: 'center',
  },

  typeButtonActive: {
    borderColor: tokens.colors.primary.main,
    backgroundColor: tokens.colors.primary.alpha[20],
  },

  typeButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },

  typeButtonTextActive: {
    color: tokens.colors.primary.main,
  },

  input: {
    backgroundColor: tokens.colors.surface.overlay,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  quantityRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },

  quantityInput: {
    flex: 1,
  },

  maxButton: {
    backgroundColor: tokens.colors.primary.alpha[20],
    borderWidth: 1,
    borderColor: tokens.colors.primary.main,
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },

  maxButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary.main,
  },

  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
  },

  button: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: tokens.interaction.minTouchTarget,
  },

  cancelButton: {
    backgroundColor: tokens.colors.surface.overlay,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },

  cancelButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },

  transferButton: {
    backgroundColor: tokens.colors.primary.main,
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },

  transferButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});
