import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { X, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { economyApi } from '@/api/economy';
import { useTradingStore } from '@/stores/tradingStore';
import { tokens } from '@/ui/theme';
import type { ActiveOrder } from '@/types/economy';

interface ActiveOrdersListProps {
  marketId: string;
}

export default function ActiveOrdersList({ marketId }: ActiveOrdersListProps) {
  const queryClient = useQueryClient();
  const { activeOrders, removeActiveOrder } = useTradingStore();

  const cancelMutation = useMutation({
    mutationFn: ({ marketId, orderId, commodity, side }: { marketId: string; orderId: string; commodity: string; side: string }) =>
      economyApi.cancelOrder(marketId, orderId, commodity, side),
    onSuccess: (_, variables) => {
      removeActiveOrder(variables.orderId);
      queryClient.invalidateQueries({ queryKey: ['orderbook'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Refresh credits
      Alert.alert('Order Cancelled', 'Your order has been successfully cancelled');
    },
    onError: (error: any) => {
      Alert.alert('Cancellation Failed', error.message || 'Failed to cancel order');
    },
  });

  const handleCancelOrder = (order: ActiveOrder) => {
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel this ${order.side} order for ${order.quantity} ${order.commodity} at ${parseFloat(order.price).toFixed(2)} CR?`,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelMutation.mutate({
              marketId: order.market_id,
              orderId: order.order_id,
              commodity: order.commodity,
              side: order.side,
            });
          },
        },
      ]
    );
  };

  // Filter orders for this market
  const marketOrders = activeOrders.filter((o) => o.market_id === marketId);

  if (marketOrders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active orders</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {marketOrders.map((order) => {
        const isBuy = order.side === 'buy';
        const isPending = order.status === 'pending';
        const isPartial = order.status === 'partial';

        return (
          <View key={order.order_id} style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                {isBuy ? (
                  <TrendingUp size={16} color={tokens.colors.success} />
                ) : (
                  <TrendingDown size={16} color={tokens.colors.danger} />
                )}
                <Text style={[styles.sideText, { color: isBuy ? tokens.colors.success : tokens.colors.danger }]}>
                  {isBuy ? 'BUY' : 'SELL'}
                </Text>
                <Text style={styles.commodityText}>{order.commodity.toUpperCase()}</Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.cancelButton, cancelMutation.isPending && styles.cancelButtonDisabled]}
                onPress={() => handleCancelOrder(order)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color={tokens.colors.text.secondary} />
                ) : (
                  <X size={16} color={tokens.colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>{parseFloat(order.price).toFixed(2)} CR</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{order.quantity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={styles.detailValue}>
                  {(parseFloat(order.price) * order.quantity).toFixed(2)} CR
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, isPartial && styles.statusBadgePartial]}>
                  <Text style={styles.statusText}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing[3],
  },

  emptyContainer: {
    padding: tokens.spacing[6],
    alignItems: 'center',
  },

  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },

  orderCard: {
    backgroundColor: tokens.colors.surface.raised,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },

  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  sideText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  commodityText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },

  cancelButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.base,
    backgroundColor: tokens.colors.surface.overlay,
  },

  cancelButtonDisabled: {
    opacity: 0.5,
  },

  orderDetails: {
    gap: tokens.spacing[2],
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },

  detailValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  statusBadge: {
    backgroundColor: tokens.colors.primary.alpha[20],
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },

  statusBadgePartial: {
    backgroundColor: tokens.colors.warning,
  },

  statusText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
});
