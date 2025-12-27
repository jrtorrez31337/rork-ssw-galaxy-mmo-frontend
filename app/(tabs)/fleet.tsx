import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TopBar, Text, Button, BottomSheet, ShipCard, EmptyState, Spinner, ShipCardSkeleton } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { inventoryApi } from '@/api/inventory';
import ShipControlPanel from '@/components/movement/ShipControlPanel';
import InventoryList from '@/components/inventory/InventoryList';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Ship } from '@/types/api';

export default function FleetTab() {
  const router = useRouter();
  const { user, profileId } = useAuth();
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);

  const { data: ships, isLoading } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory', selectedShip?.id],
    queryFn: () => inventoryApi.getInventory(selectedShip!.id, 'ship'),
    enabled: !!selectedShip && inventoryVisible,
  });

  const currentShip = ships?.[0] || null;

  const handleControlsPress = useCallback((ship: Ship) => {
    setSelectedShip(ship);
    setControlsVisible(true);
  }, []);

  const handleInventoryPress = useCallback((ship: Ship) => {
    setSelectedShip(ship);
    setInventoryVisible(true);
  }, []);

  const handleTradingPress = useCallback((ship: Ship) => {
    if (ship.docked_at) {
      router.push({ pathname: '/trading' as any, params: { shipId: ship.id } });
    } else {
      Alert.alert('Not Docked', 'You must be docked at a station to access trading', [
        { text: 'OK' },
      ]);
    }
  }, [router]);

  const handleMiningPress = useCallback((ship: Ship) => {
    if (!ship.docked_at) {
      router.push({ pathname: '/mining' as any, params: { shipId: ship.id } });
    } else {
      Alert.alert('Cannot Mine', 'You must undock before mining', [{ text: 'OK' }]);
    }
  }, [router]);

  const handleSectorPress = useCallback((ship: Ship) => {
    if (!ship.docked_at) {
      router.push({ pathname: '/sector' as any, params: { shipId: ship.id } });
    } else {
      Alert.alert('Cannot Scan', 'You must undock to access sector view', [{ text: 'OK' }]);
    }
  }, [router]);

  return (
    <ErrorBoundary fallbackTitle="Fleet Tab Error">
      <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        ship={currentShip}
        location={currentShip?.location_sector || 'Unknown'}
        dockedAt={currentShip?.docked_at}
        credits={parseFloat(user?.credits || '0')}
        quickActions={[]}
      />

      <View style={styles.header}>
        <Text variant="title" weight="bold">
          Fleet
        </Text>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onPress={() => router.push('/ship-customize')}
        >
          New Ship
        </Button>
      </View>

      <FlatList
        data={ships}
        keyExtractor={(ship) => ship.id}
        renderItem={({ item: ship }) => (
          <ShipCard
            ship={ship}
            onControlsPress={() => handleControlsPress(ship)}
            onInventoryPress={() => handleInventoryPress(ship)}
            onTradingPress={() => handleTradingPress(ship)}
            onMiningPress={() => handleMiningPress(ship)}
            onSectorPress={() => handleSectorPress(ship)}
          />
        )}
        contentContainerStyle={isLoading || !ships || ships.length === 0 ? styles.contentContainerCenter : styles.shipList}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ShipCardSkeleton />
              <ShipCardSkeleton />
              <ShipCardSkeleton />
            </View>
          ) : (
            <EmptyState
              icon={Plus}
              title="No ships yet"
              description="Customize your first ship to explore the galaxy"
              action={{
                label: 'Customize Ship',
                onPress: () => router.push('/ship-customize'),
              }}
            />
          )
        }
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        showsVerticalScrollIndicator={false}
      />

      {/* Ship Controls Modal */}
      {selectedShip && (
        <BottomSheet
          visible={controlsVisible}
          height="threequarter"
          onClose={() => setControlsVisible(false)}
          showHandle
          backdrop
        >
          <Text variant="title" weight="bold" style={styles.modalTitle}>
            {selectedShip.name || 'Unnamed Ship'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ShipControlPanel ship={selectedShip} />
          </ScrollView>
        </BottomSheet>
      )}

      {/* Ship Inventory Modal */}
      {selectedShip && inventory && (
        <BottomSheet
          visible={inventoryVisible}
          height="threequarter"
          onClose={() => setInventoryVisible(false)}
          showHandle
          backdrop
        >
          <Text variant="title" weight="bold" style={styles.modalTitle}>
            {selectedShip.name || 'Unnamed Ship'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <InventoryList
              shipId={selectedShip.id}
              items={inventory.items}
              used={inventory.used}
              capacity={inventory.capacity}
            />
          </ScrollView>
        </BottomSheet>
      )}
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  content: {
    flex: 1,
  },
  contentContainerCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  shipList: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  modalTitle: {
    marginBottom: tokens.spacing[4],
  },
});
