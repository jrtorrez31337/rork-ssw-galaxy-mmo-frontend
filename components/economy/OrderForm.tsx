import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';
import { economyApi } from '@/api/economy';
import { useTradingStore } from '@/stores/tradingStore';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import type { OrderSide } from '@/types/economy';

interface OrderFormProps {
  marketId: string;
  commodity: string;
  playerCredits: number;
  playerInventory?: number;
}

export default function OrderForm({
  marketId,
  commodity,
  playerCredits,
  playerInventory = 0,
}: OrderFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    orderType,
    orderPrice,
    orderQuantity,
    setOrderType,
    setOrderPrice,
    setOrderQuantity,
    resetOrderForm,
    addActiveOrder,
  } = useTradingStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  const placeOrderMutation = useMutation({
    mutationFn: () => {
      if (!user?.profile_id) throw new Error('Not authenticated');

      return economyApi.placeOrder(marketId, user.profile_id, {
        commodity,
        side: orderType,
        price: orderPrice,
        quantity: orderQuantity,
      });
    },
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['orderbook', marketId, commodity] });
      queryClient.invalidateQueries({ queryKey: ['trades', marketId, commodity] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      // Add to active orders if pending or partial
      if (response.status === 'pending' || response.status === 'partial') {
        addActiveOrder({
          order_id: response.order_id,
          market_id: marketId,
          commodity,
          side: orderType,
          price: orderPrice,
          quantity: orderQuantity,
          status: response.status,
          created_at: new Date().toISOString(),
        });
      }

      // Show success message
      if (response.status === 'filled') {
        const filledQty = response.fills.reduce((sum, fill) => sum + fill.quantity, 0);
        Alert.alert(
          'Trade Executed',
          `${orderType === 'buy' ? 'Purchased' : 'Sold'} ${filledQty} ${commodity}!`,
          [{ text: 'OK' }]
        );
      } else if (response.status === 'partial') {
        const filledQty = response.fills.reduce((sum, fill) => sum + fill.quantity, 0);
        Alert.alert(
          'Partial Fill',
          `${orderType === 'buy' ? 'Purchased' : 'Sold'} ${filledQty} of ${orderQuantity} ${commodity}. Remainder pending.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Order Placed',
          `Order for ${orderQuantity} ${commodity} placed. Waiting for match.`,
          [{ text: 'OK' }]
        );
      }

      // Reset form
      resetOrderForm();
      setValidationError(null);
    },
    onError: (error: any) => {
      const errorCode = error?.response?.data?.error_code;
      let errorMessage = 'Failed to place order. Please try again.';

      switch (errorCode) {
        case 'ECON_INSUFFICIENT_CREDITS':
          errorMessage = 'Not enough credits! Earn more by completing missions or selling goods.';
          break;
        case 'ECON_INSUFFICIENT_INVENTORY':
          errorMessage = "You don't have enough inventory for this trade.";
          break;
        case 'ECON_CARGO_FULL':
          errorMessage = 'Your ship cargo is full! Sell or offload items first.';
          break;
        case 'ECON_ORDER_INVALID_STATE':
          errorMessage = 'This order is no longer valid. Please refresh and try again.';
          break;
      }

      Alert.alert('Order Failed', errorMessage, [{ text: 'OK' }]);
    },
  });

  const validateOrder = (): boolean => {
    const priceNum = parseFloat(orderPrice);

    if (isNaN(priceNum) || priceNum <= 0) {
      setValidationError('Price must be greater than 0');
      return false;
    }

    if (orderQuantity <= 0 || !Number.isInteger(orderQuantity)) {
      setValidationError('Quantity must be a positive integer');
      return false;
    }

    const total = priceNum * orderQuantity;

    if (orderType === 'buy' && total > playerCredits) {
      setValidationError(
        `Insufficient credits. Need ${total.toFixed(2)}, have ${playerCredits.toFixed(2)}`
      );
      return false;
    }

    if (orderType === 'sell' && orderQuantity > playerInventory) {
      setValidationError(
        `Insufficient inventory. Need ${orderQuantity}, have ${playerInventory}`
      );
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handlePlaceOrder = () => {
    if (validateOrder()) {
      placeOrderMutation.mutate();
    }
  };

  const total = parseFloat(orderPrice) * orderQuantity;
  const isValidTotal = !isNaN(total) && total > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Place Order</Text>
      </View>

      {/* Order Type Selector */}
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            orderType === 'buy' && styles.typeBuyActive,
          ]}
          onPress={() => setOrderType('buy')}
        >
          <ArrowUpCircle
            size={20}
            color={orderType === 'buy' ? Colors.success : Colors.textSecondary}
          />
          <Text
            style={[
              styles.typeButtonText,
              orderType === 'buy' && styles.typeButtonTextActive,
            ]}
          >
            Buy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            orderType === 'sell' && styles.typeSellActive,
          ]}
          onPress={() => setOrderType('sell')}
        >
          <ArrowDownCircle
            size={20}
            color={orderType === 'sell' ? Colors.danger : Colors.textSecondary}
          />
          <Text
            style={[
              styles.typeButtonText,
              orderType === 'sell' && styles.typeButtonTextActive,
            ]}
          >
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      {/* Price Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Price per Unit</Text>
        <TextInput
          style={styles.input}
          value={orderPrice}
          onChangeText={setOrderPrice}
          placeholder="0.00"
          placeholderTextColor={Colors.textDim}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Quantity Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={orderQuantity > 0 ? orderQuantity.toString() : ''}
          onChangeText={(text) => setOrderQuantity(parseInt(text) || 0)}
          placeholder="0"
          placeholderTextColor={Colors.textDim}
          keyboardType="number-pad"
        />
      </View>

      {/* Total Display */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Cost:</Text>
        <Text style={styles.totalValue}>
          {isValidTotal ? total.toFixed(2) : '0.00'} CR
        </Text>
      </View>

      {/* Available Balance */}
      <View style={styles.balanceContainer}>
        {orderType === 'buy' ? (
          <>
            <Text style={styles.balanceLabel}>Available Credits:</Text>
            <Text style={styles.balanceValue}>{playerCredits.toFixed(2)} CR</Text>
          </>
        ) : (
          <>
            <Text style={styles.balanceLabel}>Available Inventory:</Text>
            <Text style={styles.balanceValue}>{playerInventory} units</Text>
          </>
        )}
      </View>

      {/* Validation Error */}
      {validationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      )}

      {/* Place Order Button */}
      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          orderType === 'buy' ? styles.buyButton : styles.sellButton,
          placeOrderMutation.isPending && styles.buttonDisabled,
        ]}
        onPress={handlePlaceOrder}
        disabled={placeOrderMutation.isPending}
      >
        {placeOrderMutation.isPending ? (
          <ActivityIndicator size="small" color={Colors.text} />
        ) : (
          <Text style={styles.placeOrderButtonText}>
            Place {orderType === 'buy' ? 'Buy' : 'Sell'} Order
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeBuyActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '20',
  },
  typeSellActive: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger + '20',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  errorContainer: {
    backgroundColor: Colors.danger + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
  placeOrderButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: Colors.success,
  },
  sellButton: {
    backgroundColor: Colors.danger,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
