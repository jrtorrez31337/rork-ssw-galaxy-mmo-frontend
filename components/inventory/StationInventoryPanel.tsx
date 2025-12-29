import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { X, Package, Warehouse, ArrowLeftRight, RefreshCw } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Text, Button, Spinner, EmptyState } from '@/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, InventoryItem, Inventory } from '@/api/inventory';
import ResourceItem from './ResourceItem';
import CargoCapacityBar from './CargoCapacityBar';
import TransferPanel from './TransferPanel';
import type { Ship } from '@/types/api';

type ViewMode = 'station' | 'ship';

interface StationInventoryPanelProps {
  visible: boolean;
  onClose: () => void;
  ship: Ship;
  stationId: string;
  stationName?: string;
}

/**
 * StationInventoryPanel
 * Slide-up panel for managing inventory when docked at a station
 * Shows both ship and station inventory with easy transfer options
 */
export function StationInventoryPanel({
  visible,
  onClose,
  ship,
  stationId,
  stationName = 'Station',
}: StationInventoryPanelProps) {
  const [slideAnim] = useState(new Animated.Value(0));
  const [viewMode, setViewMode] = useState<ViewMode>('station');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transferDirection, setTransferDirection] = useState<'to_ship' | 'to_station'>('to_ship');
  const [showTransfer, setShowTransfer] = useState(false);
  const queryClient = useQueryClient();

  // Fetch station inventory
  const {
    data: stationInventory,
    isLoading: loadingStation,
    refetch: refetchStation,
  } = useQuery({
    queryKey: ['inventory', stationId, 'station'],
    queryFn: () => inventoryApi.getInventory(stationId, 'station'),
    enabled: visible && !!stationId,
  });

  // Fetch ship inventory
  const {
    data: shipInventory,
    isLoading: loadingShip,
    refetch: refetchShip,
  } = useQuery({
    queryKey: ['inventory', ship.id, 'ship'],
    queryFn: () => inventoryApi.getInventory(ship.id, 'ship'),
    enabled: visible && !!ship.id,
  });

  useEffect(() => {
    if (visible) {
      setSelectedItem(null);
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
  }, [visible]);

  const handleRefresh = () => {
    refetchStation();
    refetchShip();
  };

  const handleItemSelect = (item: InventoryItem) => {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
      setTransferDirection(viewMode === 'station' ? 'to_ship' : 'to_station');
    }
  };

  const handleTransferStart = () => {
    if (selectedItem) {
      setShowTransfer(true);
    }
  };

  const handleTransferComplete = () => {
    setShowTransfer(false);
    setSelectedItem(null);
    handleRefresh();
  };

  if (!visible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [700, 0],
  });

  const currentInventory = viewMode === 'station' ? stationInventory : shipInventory;
  const isLoading = viewMode === 'station' ? loadingStation : loadingShip;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
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
            <Warehouse size={24} color={tokens.colors.primary.main} />
            <View>
              <Text variant="heading" weight="bold">
                Storage Management
              </Text>
              <Text variant="caption" color={tokens.colors.text.tertiary}>
                {stationName}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <RefreshCw size={20} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <X size={24} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Mode Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'station' && styles.tabActive]}
            onPress={() => {
              setViewMode('station');
              setSelectedItem(null);
            }}
          >
            <Warehouse
              size={18}
              color={viewMode === 'station' ? tokens.colors.primary.main : tokens.colors.text.secondary}
            />
            <Text
              variant="body"
              weight={viewMode === 'station' ? 'semibold' : 'normal'}
              color={viewMode === 'station' ? tokens.colors.primary.main : tokens.colors.text.secondary}
            >
              Station
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'ship' && styles.tabActive]}
            onPress={() => {
              setViewMode('ship');
              setSelectedItem(null);
            }}
          >
            <Package
              size={18}
              color={viewMode === 'ship' ? tokens.colors.primary.main : tokens.colors.text.secondary}
            />
            <Text
              variant="body"
              weight={viewMode === 'ship' ? 'semibold' : 'normal'}
              color={viewMode === 'ship' ? tokens.colors.primary.main : tokens.colors.text.secondary}
            >
              Ship Cargo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Spinner size="large" />
              <Text variant="body" color={tokens.colors.text.secondary}>
                Loading inventory...
              </Text>
            </View>
          ) : !currentInventory ? (
            <EmptyState
              icon={Package}
              title="No inventory data"
              description="Unable to load inventory"
            />
          ) : (
            <>
              {/* Capacity Bar */}
              <View style={styles.capacitySection}>
                <Text variant="caption" weight="semibold" color={tokens.colors.text.secondary}>
                  {viewMode === 'station' ? 'STATION STORAGE' : 'SHIP CARGO'}
                </Text>
                <CargoCapacityBar
                  used={currentInventory.used}
                  capacity={currentInventory.capacity}
                />
              </View>

              {/* Items List */}
              {currentInventory.items.length === 0 ? (
                <View style={styles.emptyInventory}>
                  <Package size={40} color={tokens.colors.text.tertiary} />
                  <Text variant="body" color={tokens.colors.text.secondary}>
                    {viewMode === 'station'
                      ? 'No items stored at station'
                      : 'Ship cargo is empty'}
                  </Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {currentInventory.items.map((item) => (
                    <ResourceItem
                      key={item.id}
                      item={item}
                      onPress={() => handleItemSelect(item)}
                      selected={selectedItem?.id === item.id}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Transfer Actions */}
        {selectedItem && (
          <View style={styles.transferActions}>
            <View style={styles.selectedInfo}>
              <Text variant="caption" color={tokens.colors.text.secondary}>
                Selected:
              </Text>
              <Text variant="body" weight="semibold">
                {selectedItem.quantity}x {selectedItem.resource_type.replace(/_/g, ' ')}
              </Text>
            </View>
            <Button
              variant="primary"
              fullWidth
              icon={ArrowLeftRight}
              onPress={handleTransferStart}
            >
              Transfer to {viewMode === 'station' ? 'Ship' : 'Station'}
            </Button>
          </View>
        )}
      </Animated.View>

      {/* Transfer Panel */}
      {selectedItem && showTransfer && (
        <TransferPanel
          visible={showTransfer}
          sourceId={viewMode === 'station' ? stationId : ship.id}
          sourceType={viewMode === 'station' ? 'station' : 'ship'}
          item={selectedItem}
          defaultTargetId={viewMode === 'station' ? ship.id : stationId}
          defaultTargetType={viewMode === 'station' ? 'ship' : 'station'}
          onClose={() => setShowTransfer(false)}
          onSuccess={handleTransferComplete}
        />
      )}
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
    height: '85%',
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
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

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.base,
    backgroundColor: tokens.colors.surface.raised,
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    padding: tokens.spacing[2],
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.surface.overlay,
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.base,
  },

  tabActive: {
    backgroundColor: tokens.colors.surface.base,
  },

  content: {
    flex: 1,
    padding: tokens.spacing[4],
  },

  loadingContainer: {
    padding: tokens.spacing[8],
    alignItems: 'center',
    gap: tokens.spacing[3],
  },

  capacitySection: {
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[4],
  },

  emptyInventory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[8],
    gap: tokens.spacing[3],
  },

  itemsList: {
    gap: tokens.spacing[3],
  },

  transferActions: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    backgroundColor: tokens.colors.surface.overlay,
  },

  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
});
