import { useState } from 'react';
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
import {
  inventoryApi,
  InventoryItem,
  OwnerType,
  TransferRequest,
} from '@/api/inventory';
import { RESOURCE_METADATA } from '@/constants/resources';
import Colors from '@/constants/colors';

interface TransferModalProps {
  visible: boolean;
  sourceId: string;
  sourceType: OwnerType;
  item: InventoryItem;
  onClose: () => void;
}

export default function TransferModal({
  visible,
  sourceId,
  sourceType,
  item,
  onClose,
}: TransferModalProps) {
  const [targetId, setTargetId] = useState('');
  const [targetType, setTargetType] = useState<OwnerType>('station');
  const [quantity, setQuantity] = useState('1');
  const queryClient = useQueryClient();

  const metadata = RESOURCE_METADATA[item.resource_type];

  const transferMutation = useMutation({
    mutationFn: (request: TransferRequest) => inventoryApi.transfer(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      onClose();
      setTargetId('');
      setQuantity('1');
    },
  });

  const handleSubmit = () => {
    const qty = parseInt(quantity, 10);
    if (!targetId || isNaN(qty) || qty < 1 || qty > item.quantity) {
      return;
    }

    transferMutation.mutate({
      source_id: sourceId,
      source_type: sourceType,
      target_id: targetId,
      target_type: targetType,
      resource_type: item.resource_type,
      quantity: qty,
      quality: item.quality,
    });
  };

  const handleClose = () => {
    if (!transferMutation.isPending) {
      onClose();
      setTargetId('');
      setQuantity('1');
      transferMutation.reset();
    }
  };

  const quantityNum = parseInt(quantity, 10) || 0;
  const isValidQuantity = quantityNum >= 1 && quantityNum <= item.quantity;
  const canSubmit = targetId.trim() !== '' && isValidQuantity && !transferMutation.isPending;

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
              <Text style={styles.title}>Transfer Resources</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={transferMutation.isPending}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Resource Info */}
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceIcon, { color: metadata.color }]}>
                {metadata.icon}
              </Text>
              <View style={styles.resourceDetails}>
                <Text style={styles.resourceName}>{metadata.name}</Text>
                <Text style={styles.resourceAvailable}>
                  Available: {item.quantity} units (Quality: {item.quality.toFixed(2)}x)
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Target Type */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Target Type</Text>
                <View style={styles.targetTypeContainer}>
                  {(['ship', 'station', 'planet'] as OwnerType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.targetTypeButton,
                        targetType === type && styles.targetTypeButtonActive,
                      ]}
                      onPress={() => setTargetType(type)}
                      disabled={transferMutation.isPending}
                    >
                      <Text
                        style={[
                          styles.targetTypeText,
                          targetType === type && styles.targetTypeTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target ID */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Target ID</Text>
                <TextInput
                  style={styles.input}
                  value={targetId}
                  onChangeText={setTargetId}
                  placeholder="Enter target UUID"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  editable={!transferMutation.isPending}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Quantity */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Quantity (max: {item.quantity})
                </Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (text === '' || (!isNaN(num) && num <= item.quantity)) {
                      setQuantity(text);
                    }
                  }}
                  placeholder="Enter quantity"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="number-pad"
                  editable={!transferMutation.isPending}
                />
                {!isValidQuantity && quantity !== '' && (
                  <Text style={styles.errorText}>
                    Quantity must be between 1 and {item.quantity}
                  </Text>
                )}
              </View>

              {/* Error Message */}
              {transferMutation.isError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorMessage}>
                    {(transferMutation.error as any)?.response?.data?.error?.message ||
                      'Transfer failed. Please try again.'}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleClose}
                  disabled={transferMutation.isPending}
                >
                  <Text style={styles.buttonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonPrimary,
                    !canSubmit && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {transferMutation.isPending ? (
                    <ActivityIndicator color={Colors.text} size="small" />
                  ) : (
                    <Text style={styles.buttonTextPrimary}>Transfer</Text>
                  )}
                </TouchableOpacity>
              </View>
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
    fontWeight: '600' as const,
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
  resourceInfo: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  resourceIcon: {
    fontSize: 48,
    textShadowColor: 'currentColor',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  resourceAvailable: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  targetTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  targetTypeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  targetTypeButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.primary,
  },
  targetTypeText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  targetTypeTextActive: {
    color: Colors.text,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6666',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF6666',
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
    fontWeight: '600' as const,
    color: Colors.text,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
