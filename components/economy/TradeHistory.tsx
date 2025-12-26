import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { economyApi } from '@/api/economy';
import Colors from '@/constants/colors';
import type { Trade } from '@/types/economy';

interface TradeHistoryProps {
  marketId: string;
  commodity: string;
  limit?: number;
}

export default function TradeHistory({
  marketId,
  commodity,
  limit = 50,
}: TradeHistoryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trades', marketId, commodity],
    queryFn: () => economyApi.getTradeHistory(marketId, commodity, limit),
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: !!marketId && !!commodity,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading trade history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load trade history</Text>
        <Text style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </View>
    );
  }

  const trades = data?.trades || [];

  if (trades.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No recent trades</Text>
        <Text style={styles.emptySubtext}>
          Be the first to trade {commodity}!
        </Text>
      </View>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Trades - {commodity}</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.tradesHeader}>
          <Text style={[styles.headerLabel, { flex: 1.5 }]}>Time</Text>
          <Text style={[styles.headerLabel, { flex: 1 }]}>Price</Text>
          <Text style={[styles.headerLabel, { flex: 1 }]}>Qty</Text>
          <Text style={[styles.headerLabel, { flex: 1.2 }]}>Total</Text>
        </View>

        {trades.map((trade, index) => {
          const showDate =
            index === 0 ||
            formatDate(trade.executed_at) !== formatDate(trades[index - 1].executed_at);

          return (
            <View key={trade.trade_id}>
              {showDate && (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>
                    {formatDate(trade.executed_at)}
                  </Text>
                </View>
              )}
              <View style={styles.tradeRow}>
                <Text style={[styles.tradeTime, { flex: 1.5 }]}>
                  {formatTime(trade.executed_at)}
                </Text>
                <Text style={[styles.tradePrice, { flex: 1 }]}>{trade.price}</Text>
                <Text style={[styles.tradeQuantity, { flex: 1 }]}>{trade.quantity}</Text>
                <Text style={[styles.tradeTotal, { flex: 1.2 }]}>{trade.total}</Text>
              </View>
            </View>
          );
        })}
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
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    color: Colors.textDim,
    fontSize: 14,
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
  },
  scrollContainer: {
    flex: 1,
  },
  tradesHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  dateSeparator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tradeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  tradeTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  tradePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'right',
  },
  tradeQuantity: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
  },
  tradeTotal: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});
