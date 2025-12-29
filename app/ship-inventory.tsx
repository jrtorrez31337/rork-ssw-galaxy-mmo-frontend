import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package } from 'lucide-react-native';
import { inventoryApi } from '@/api/inventory';
import { shipApi } from '@/api/ships';
import ResourceItem from '@/components/inventory/ResourceItem';
import CargoCapacityBar from '@/components/inventory/CargoCapacityBar';
import TransferPanel from '@/components/inventory/TransferPanel';
import type { InventoryItem } from '@/api/inventory';
import Colors from '@/constants/colors';

export default function ShipInventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shipId = params.shipId as string;

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const { data: ship, isLoading: loadingShip } = useQuery({
    queryKey: ['ship', shipId],
    queryFn: () => shipApi.getById(shipId),
    enabled: !!shipId,
  });

  const { data: inventory, isLoading: loadingInventory, error: inventoryError } = useQuery({
    queryKey: ['inventory', shipId],
    queryFn: () => inventoryApi.getInventory(shipId, 'ship'),
    enabled: !!shipId,
    retry: false, // Don't retry on 404 - empty inventory is expected
  });

  // Create default empty inventory if API returns 404
  const effectiveInventory = inventory || (inventoryError ? {
    owner_id: shipId,
    owner_type: 'ship' as const,
    capacity: ship?.cargo_capacity || 0,
    used: 0,
    items: [],
  } : null);

  const handleItemPress = (item: InventoryItem) => {
    setSelectedItem(item);
  };

  const handleTransfer = () => {
    if (selectedItem) {
      setShowTransferModal(true);
    }
  };

  const handleDeselect = () => {
    setSelectedItem(null);
  };

  if (loadingShip || loadingInventory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  if (!ship) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ship not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use effective inventory (either from API or default empty)
  const displayInventory = effectiveInventory || {
    owner_id: shipId,
    owner_type: 'ship' as const,
    capacity: ship.cargo_capacity || 0,
    used: 0,
    items: [],
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.shipName}>{ship.name || 'Unnamed Ship'}</Text>
          <View style={styles.shipTypeBadge}>
            <Text style={styles.shipTypeText}>{ship.ship_type}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cargo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Cargo Hold</Text>
          </View>

          <CargoCapacityBar used={displayInventory.used} capacity={displayInventory.capacity} />

          {displayInventory.items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Your cargo hold is empty</Text>
              <Text style={styles.emptySubtext}>
                Collect resources through mining or trading
              </Text>
            </View>
          ) : (
            <View style={styles.resourceList}>
              {displayInventory.items.map((item) => (
                <ResourceItem
                  key={item.id}
                  item={item}
                  onPress={() => handleItemPress(item)}
                  selected={selectedItem?.id === item.id}
                />
              ))}
            </View>
          )}

          {selectedItem && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleTransfer}
              >
                <Text style={styles.buttonText}>Transfer Selected Resource</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleDeselect}
              >
                <Text style={styles.buttonTextSecondary}>Deselect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ship Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ship Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hull:</Text>
              <Text style={styles.detailValue}>
                {ship.hull_points} / {ship.hull_max}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shield:</Text>
              <Text style={styles.detailValue}>
                {ship.shield_points} / {ship.shield_max}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{ship.location_sector}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cargo Capacity:</Text>
              <Text style={styles.detailValue}>{ship.cargo_capacity} units</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Transfer Panel */}
      {selectedItem && (
        <TransferPanel
          visible={showTransferModal}
          sourceId={shipId}
          sourceType="ship"
          item={selectedItem}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  backIcon: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shipName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  shipTypeBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shipTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
  },
  resourceList: {
    gap: 12,
  },
  actions: {
    gap: 12,
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.danger,
    fontWeight: '600' as const,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
