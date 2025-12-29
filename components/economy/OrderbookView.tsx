import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { economyApi } from '@/api/economy';
import Colors from '@/constants/colors';
import type { Orderbook } from '@/types/economy';

interface OrderbookViewProps {
  marketId: string;
  commodity: string;
}

export default function OrderbookView({ marketId, commodity }: OrderbookViewProps) {
  const { data: orderbook, isLoading, error } = useQuery({
    queryKey: ['orderbook', marketId, commodity],
    queryFn: () => economyApi.getOrderbook(marketId, commodity),
    // Real-time updates via SSE - useTradingEvents hook invalidates this query on trade events
    enabled: !!marketId && !!commodity,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading orderbook...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load orderbook</Text>
        <Text style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </View>
    );
  }

  if (!orderbook) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No orderbook data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Book - {commodity}</Text>
        <View style={styles.spreadInfo}>
          <Text style={styles.spreadLabel}>Spread:</Text>
          <Text style={styles.spreadValue}>{orderbook.spread}</Text>
          <Text style={styles.spreadLabel}>Mid:</Text>
          <Text style={styles.spreadValue}>{orderbook.midpoint}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Sell Orders (Asks) - Displayed from lowest to highest */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.askTitle]}>Sell Orders (Asks)</Text>
          </View>
          <View style={styles.ordersHeader}>
            <Text style={styles.headerLabel}>Price</Text>
            <Text style={styles.headerLabel}>Quantity</Text>
            <Text style={styles.headerLabel}>Total</Text>
          </View>
          {orderbook.asks.length > 0 ? (
            orderbook.asks.slice(0, 10).map((ask, index) => {
              const total = (parseFloat(ask.price) * ask.quantity).toFixed(2);
              return (
                <View key={index} style={styles.orderRow}>
                  <Text style={[styles.priceText, styles.askPrice]}>{ask.price}</Text>
                  <Text style={styles.quantityText}>{ask.quantity}</Text>
                  <Text style={styles.totalText}>{total}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersText}>No sell orders</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>
            {orderbook.midpoint ? `Market: ${orderbook.midpoint}` : 'No Market'}
          </Text>
        </View>

        {/* Buy Orders (Bids) - Displayed from highest to lowest */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.bidTitle]}>Buy Orders (Bids)</Text>
          </View>
          <View style={styles.ordersHeader}>
            <Text style={styles.headerLabel}>Price</Text>
            <Text style={styles.headerLabel}>Quantity</Text>
            <Text style={styles.headerLabel}>Total</Text>
          </View>
          {orderbook.bids.length > 0 ? (
            orderbook.bids.slice(0, 10).map((bid, index) => {
              const total = (parseFloat(bid.price) * bid.quantity).toFixed(2);
              return (
                <View key={index} style={styles.orderRow}>
                  <Text style={[styles.priceText, styles.bidPrice]}>{bid.price}</Text>
                  <Text style={styles.quantityText}>{bid.quantity}</Text>
                  <Text style={styles.totalText}>{total}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyOrdersText}>No buy orders</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  spreadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spreadLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  spreadValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  askTitle: {
    color: Colors.danger,
  },
  bidTitle: {
    color: Colors.success,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  headerLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  priceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  askPrice: {
    color: Colors.danger,
  },
  bidPrice: {
    color: Colors.success,
  },
  quantityText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
  },
  totalText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  divider: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  emptyOrders: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyOrdersText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
