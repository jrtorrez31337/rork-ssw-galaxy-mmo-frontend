import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { shipApi } from '@/api/ships';
import { inventoryApi } from '@/api/inventory';
import { useTradingStore } from '@/stores/tradingStore';
import { useTradingEvents } from '@/hooks/useTradingEvents';
import MarketSelector from '@/components/economy/MarketSelector';
import OrderbookView from '@/components/economy/OrderbookView';
import OrderForm from '@/components/economy/OrderForm';
import TradeHistory from '@/components/economy/TradeHistory';
import CreditsDisplay from '@/components/credits/CreditsDisplay';
import Colors from '@/constants/colors';
import type { Ship } from '@/types/api';
import type { TradeExecutedEvent } from '@/types/economy';

export default function TradingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, profileId } = useAuth();
  const { selectedCommodity, setSelectedMarket } = useTradingStore();
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

  // Get ship ID from params or use first ship
  const shipId = params.shipId as string | undefined;

  // Fetch player's ships
  const { data: ships, isLoading: loadingShips } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  // Fetch inventory for selected ship
  const { data: inventory } = useQuery({
    queryKey: ['inventory', selectedShip?.id],
    queryFn: () => inventoryApi.getInventory(selectedShip!.id, 'ship'),
    enabled: !!selectedShip,
  });

  // Set selected ship on load
  useEffect(() => {
    if (ships && ships.length > 0) {
      const ship = shipId ? ships.find((s) => s.id === shipId) : ships[0];
      if (ship) {
        setSelectedShip(ship);
        if (ship.docked_at) {
          setSelectedMarket(ship.docked_at);
        }
      }
    }
  }, [ships, shipId, setSelectedMarket]);

  // Subscribe to trading events
  useTradingEvents(profileId || '', {
    onTradeExecuted: (event: TradeExecutedEvent['payload']) => {
      const action = event.role === 'buyer' ? 'Purchased' : 'Sold';
      Alert.alert(
        'Trade Executed',
        `${action} ${event.quantity} ${event.commodity} at ${event.price.toFixed(2)} CR each`,
        [{ text: 'OK' }]
      );
    },
    onCreditsChanged: (event) => {
      console.log('[Trading] Credits changed:', event);
    },
    onInventoryUpdate: (event) => {
      console.log('[Trading] Inventory updated:', event);
    },
  });

  if (loadingShips) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ships...</Text>
      </View>
    );
  }

  if (!selectedShip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No ships available</Text>
        <Text style={styles.errorSubtext}>
          You need a ship to access the trading terminal
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedShip.docked_at) {
    return (
      <View style={styles.centerContainer}>
        <TrendingUp size={64} color={Colors.textDim} />
        <Text style={styles.errorText}>Ship Not Docked</Text>
        <Text style={styles.errorSubtext}>
          You must be docked at a station to access trading
        </Text>
        <Text style={styles.infoText}>
          Current location: {selectedShip.location_sector}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const marketId = selectedShip.docked_at;
  const playerCredits = parseFloat(user?.credits || '0');

  // Get commodity inventory quantity
  const commodityInventory =
    selectedCommodity && inventory
      ? inventory.items.find(
          (item) => item.resource_type === selectedCommodity
        )?.quantity || 0
      : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Trading Terminal</Text>
          <Text style={styles.headerSubtitle}>
            {selectedShip.name || 'Unnamed Ship'}
          </Text>
        </View>
        {user?.credits && (
          <CreditsDisplay credits={user.credits} size="small" animated />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Market & Commodity Selector */}
        <View style={styles.section}>
          <MarketSelector
            marketId={marketId}
            marketName={`Station ${marketId.slice(0, 8)}...`}
          />
        </View>

        {selectedCommodity ? (
          <>
            {/* Orderbook */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Book</Text>
              <View style={styles.orderbookContainer}>
                <OrderbookView marketId={marketId} commodity={selectedCommodity} />
              </View>
            </View>

            {/* Order Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Place Order</Text>
              <OrderForm
                marketId={marketId}
                commodity={selectedCommodity}
                playerCredits={playerCredits}
                playerInventory={commodityInventory}
              />
            </View>

            {/* Trade History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Trades</Text>
              <View style={styles.tradeHistoryContainer}>
                <TradeHistory marketId={marketId} commodity={selectedCommodity} />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.promptContainer}>
            <TrendingUp size={48} color={Colors.textDim} />
            <Text style={styles.promptText}>Select a commodity to start trading</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  errorSubtext: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: Colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  orderbookContainer: {
    height: 400,
  },
  tradeHistoryContainer: {
    height: 300,
  },
  promptContainer: {
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  promptText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
