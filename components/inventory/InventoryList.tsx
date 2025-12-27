import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Package } from 'lucide-react-native';
import { Text, EmptyState, Button } from '@/ui';
import { tokens } from '@/ui/theme';
import ResourceItem from './ResourceItem';
import CargoCapacityBar from './CargoCapacityBar';
import TransferModal from './TransferModal';
import type { InventoryItem } from '@/api/inventory';

interface InventoryListProps {
  shipId: string;
  items: InventoryItem[];
  used: number;
  capacity: number;
}

const InventoryList = React.memo(function InventoryList({ shipId, items, used, capacity }: InventoryListProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const handleItemPress = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
  }, []);

  const handleTransfer = useCallback(() => {
    if (selectedItem) {
      setShowTransferModal(true);
    }
  }, [selectedItem]);

  const handleDeselect = useCallback(() => {
    setSelectedItem(null);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Package size={20} color={tokens.colors.primary.main} />
        <Text variant="heading" weight="bold">
          Cargo Hold
        </Text>
      </View>

      <CargoCapacityBar used={used} capacity={capacity} />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Cargo hold is empty"
          description="Collect resources through mining or trading"
        />
      ) : (
        <>
          <View style={styles.resourceList}>
            {items.map((item) => (
              <ResourceItem
                key={item.id}
                item={item}
                onPress={() => handleItemPress(item)}
                selected={selectedItem?.id === item.id}
              />
            ))}
          </View>

          {selectedItem && (
            <View style={styles.actions}>
              <Button
                variant="primary"
                fullWidth
                onPress={handleTransfer}
              >
                Transfer Selected Resource
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onPress={handleDeselect}
              >
                Deselect
              </Button>
            </View>
          )}
        </>
      )}

      {/* Transfer Modal */}
      {selectedItem && (
        <TransferModal
          visible={showTransferModal}
          sourceId={shipId}
          sourceType="ship"
          item={selectedItem}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </View>
  );
});

export default InventoryList;

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  resourceList: {
    gap: tokens.spacing[3],
  },
  actions: {
    gap: tokens.spacing[3],
    paddingTop: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
  },
});
