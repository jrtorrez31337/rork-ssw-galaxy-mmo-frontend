# Frontend Integration Guide: Phase 3 - Trading & Economy

**Version**: 1.0.0
**Date**: 2025-12-26
**Status**: ✅ Backend Complete, Frontend Pending

---

## Overview

This document provides frontend developers with everything needed to integrate the **Phase 3: Trading & Economy Integration** backend implementation into the React Native app.

### What Changed in Phase 3

**BEFORE** (Broken):
- Trades only existed in Redis (in-memory)
- No credit transfers
- No inventory transfers
- No persistent trade history
- No SSE events for trades

**AFTER** (Fixed):
- ✅ Trades persist to CockroachDB
- ✅ Atomic credit transfers (buyer debited, seller credited)
- ✅ Atomic inventory transfers (seller → buyer ship cargo)
- ✅ Full trade history queryable
- ✅ Real-time SSE events (`trade_executed`, `credits_changed`, `inventory_update`)

---

## API Endpoints

### 1. Place Order

**Endpoint**: `POST /v1/markets/{market_id}/orders`

**Purpose**: Place a buy or sell order on the market. If a matching order exists, trade executes immediately.

**Request**:
```typescript
POST /v1/markets/550e8400-e29b-41d4-a716-446655440000/orders

{
  "player_id": "uuid",
  "commodity": "ore",
  "side": "buy",  // or "sell"
  "price": "50.00",
  "quantity": 100
}
```

**Response (Immediate Match)**:
```typescript
{
  "order_id": "uuid",
  "status": "filled",  // Order fully matched
  "fills": [
    {
      "fill_id": "uuid",
      "matched_order_id": "uuid",
      "price": "50.00",
      "quantity": 100,
      "timestamp": "2025-12-26T10:30:00Z"
    }
  ]
}
```

**Response (Partial Match)**:
```typescript
{
  "order_id": "uuid",
  "status": "partial",  // Partially filled
  "fills": [
    {
      "fill_id": "uuid",
      "matched_order_id": "uuid",
      "price": "50.00",
      "quantity": 60,  // Only 60 of 100 filled
      "timestamp": "2025-12-26T10:30:00Z"
    }
  ]
}
```

**Response (No Match)**:
```typescript
{
  "order_id": "uuid",
  "status": "pending",  // Added to orderbook
  "fills": []
}
```

**Frontend Implementation**:

```typescript
import { apiClient } from '@/utils/api';
import { usePlayerStore } from '@/stores/playerStore';

interface PlaceOrderRequest {
  commodity: string;
  side: 'buy' | 'sell';
  price: string;
  quantity: number;
}

interface PlaceOrderResponse {
  order_id: string;
  status: 'pending' | 'partial' | 'filled';
  fills: {
    fill_id: string;
    matched_order_id: string;
    price: string;
    quantity: number;
    timestamp: string;
  }[];
}

export async function placeOrder(
  marketId: string,
  order: PlaceOrderRequest
): Promise<PlaceOrderResponse> {
  const playerId = usePlayerStore.getState().playerId;

  const response = await apiClient.post<PlaceOrderResponse>(
    `/markets/${marketId}/orders`,
    {
      player_id: playerId,
      ...order,
    }
  );

  return response.data;
}
```

**Usage Example**:

```typescript
import { placeOrder } from '@/api/economy';
import { showToast } from '@/utils/toast';

async function handleBuyOre() {
  try {
    const result = await placeOrder(currentMarketId, {
      commodity: 'ore',
      side: 'buy',
      price: '50.00',
      quantity: 100,
    });

    if (result.status === 'filled') {
      showToast('success', `Purchased ${result.fills[0].quantity} ore!`);
      // SSE event will update credits and inventory automatically
    } else if (result.status === 'partial') {
      const filledQty = result.fills.reduce((sum, fill) => sum + fill.quantity, 0);
      showToast('info', `Purchased ${filledQty} of 100 ore. Remainder pending.`);
    } else {
      showToast('info', 'Order placed. Waiting for seller.');
    }
  } catch (error) {
    if (error.code === 'ECON_INSUFFICIENT_CREDITS') {
      showToast('error', 'Not enough credits!');
    } else {
      showToast('error', 'Failed to place order');
    }
  }
}
```

---

### 2. Get Orderbook

**Endpoint**: `GET /v1/markets/{market_id}/orderbook?commodity={commodity}`

**Purpose**: Fetch current buy/sell orders for a commodity.

**Request**:
```
GET /v1/markets/550e8400-e29b-41d4-a716-446655440000/orderbook?commodity=ore
```

**Response**:
```typescript
{
  "bids": [  // Buy orders (descending by price)
    { "price": "50.00", "quantity": 100 },
    { "price": "49.50", "quantity": 75 },
    { "price": "49.00", "quantity": 200 }
  ],
  "asks": [  // Sell orders (ascending by price)
    { "price": "51.00", "quantity": 50 },
    { "price": "52.00", "quantity": 125 },
    { "price": "53.00", "quantity": 300 }
  ],
  "spread": "1.00",  // ask - bid
  "midpoint": "50.50"  // (best_bid + best_ask) / 2
}
```

**Frontend Implementation**:

```typescript
interface OrderbookLevel {
  price: string;
  quantity: number;
}

interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  spread: string;
  midpoint: string;
}

export async function getOrderbook(
  marketId: string,
  commodity: string
): Promise<Orderbook> {
  const response = await apiClient.get<Orderbook>(
    `/markets/${marketId}/orderbook`,
    { params: { commodity } }
  );
  return response.data;
}
```

**UI Component Example**:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getOrderbook } from '@/api/economy';

export function OrderbookView({ marketId, commodity }: { marketId: string; commodity: string }) {
  const { data: orderbook, isLoading } = useQuery({
    queryKey: ['orderbook', marketId, commodity],
    queryFn: () => getOrderbook(marketId, commodity),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) return <Spinner />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order Book - {commodity}</Text>

      <View style={styles.asks}>
        <Text style={styles.label}>Sell Orders (Asks)</Text>
        {orderbook.asks.map((ask, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.price}>{ask.price}</Text>
            <Text style={styles.quantity}>{ask.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spread}>
        <Text>Spread: {orderbook.spread} | Midpoint: {orderbook.midpoint}</Text>
      </View>

      <View style={styles.bids}>
        <Text style={styles.label}>Buy Orders (Bids)</Text>
        {orderbook.bids.map((bid, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.price}>{bid.price}</Text>
            <Text style={styles.quantity}>{bid.quantity}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

---

### 3. Get Trade History

**Endpoint**: `GET /v1/markets/{market_id}/trades?commodity={commodity}&limit={limit}`

**Purpose**: Fetch recent trades for a commodity (for price charts, market activity).

**Request**:
```
GET /v1/markets/550e8400-e29b-41d4-a716-446655440000/trades?commodity=ore&limit=50
```

**Response**:
```typescript
{
  "trades": [
    {
      "trade_id": "uuid",
      "commodity": "ore",
      "quantity": 50,
      "price": "50.00",
      "total": "2500.00",
      "executed_at": "2025-12-26T10:30:00Z"
    },
    {
      "trade_id": "uuid",
      "commodity": "ore",
      "quantity": 25,
      "price": "49.75",
      "total": "1243.75",
      "executed_at": "2025-12-26T10:25:00Z"
    }
  ]
}
```

**Frontend Implementation**:

```typescript
interface Trade {
  trade_id: string;
  commodity: string;
  quantity: number;
  price: string;
  total: string;
  executed_at: string;
}

export async function getTradeHistory(
  marketId: string,
  commodity: string,
  limit: number = 50
): Promise<Trade[]> {
  const response = await apiClient.get<{ trades: Trade[] }>(
    `/markets/${marketId}/trades`,
    { params: { commodity, limit } }
  );
  return response.data.trades;
}
```

**Price Chart Example**:

```typescript
import { useQuery } from '@tanstack/react-query';
import { LineChart } from 'react-native-chart-kit';
import { getTradeHistory } from '@/api/economy';

export function PriceChart({ marketId, commodity }: { marketId: string; commodity: string }) {
  const { data: trades } = useQuery({
    queryKey: ['trades', marketId, commodity],
    queryFn: () => getTradeHistory(marketId, commodity, 100),
  });

  if (!trades) return null;

  const prices = trades.reverse().map(t => parseFloat(t.price));
  const labels = trades.map(t => new Date(t.executed_at).toLocaleTimeString());

  return (
    <View>
      <Text>Price History - {commodity}</Text>
      <LineChart
        data={{
          labels: labels.filter((_, i) => i % 10 === 0), // Show every 10th label
          datasets: [{ data: prices }],
        }}
        width={350}
        height={220}
        chartConfig={{
          backgroundColor: '#1E2923',
          backgroundGradientFrom: '#08130D',
          backgroundGradientTo: '#1E3A2C',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        }}
      />
    </View>
  );
}
```

---

## SSE Events

The backend publishes real-time events via NATS → Fanout → SSE. Frontend should subscribe to these events to update UI automatically.

### Event Types

#### 1. `trade_executed`

**When**: A trade completes (buyer's or seller's perspective)

**Channels**:
- `player.<player_id>` - Personal trade notifications
- `game.economy` - Global market activity (optional)

**Payload**:
```typescript
{
  type: 'trade_executed',
  payload: {
    trade_id: 'uuid',
    order_id: 'uuid',
    commodity: 'ore',
    quantity: 50,
    price: 50.00,
    total: 2500.00,
    role: 'buyer'  // or 'seller'
  }
}
```

**Frontend Handling**:

```typescript
import { useSSE } from '@/hooks/useSSE';
import { usePlayerStore } from '@/stores/playerStore';
import { showToast } from '@/utils/toast';

export function useTradingEvents() {
  const playerId = usePlayerStore(state => state.playerId);

  useSSE(playerId, (event) => {
    if (event.type === 'trade_executed') {
      const { commodity, quantity, price, role } = event.payload;

      if (role === 'buyer') {
        showToast('success', `Bought ${quantity} ${commodity} at ${price} each`);
      } else {
        showToast('success', `Sold ${quantity} ${commodity} at ${price} each`);
      }

      // Refetch inventory and credits
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    }
  });
}
```

#### 2. `credits_changed`

**When**: Player's credit balance changes (from trade, refuel, repair, etc.)

**Channel**: `player.<player_id>`

**Payload**:
```typescript
{
  type: 'credits_changed',
  payload: {
    player_id: 'uuid',
    old_balance: 10000.00,
    new_balance: 7500.00,
    amount_changed: -2500.00,
    reason: 'trade_purchase',
    transaction_id: 'uuid'
  }
}
```

**Frontend Handling**:

```typescript
useSSE(playerId, (event) => {
  if (event.type === 'credits_changed') {
    const { new_balance, amount_changed, reason } = event.payload;

    // Update local state
    usePlayerStore.getState().setCredits(new_balance);

    // Show notification
    if (reason === 'trade_purchase') {
      showToast('info', `Credits: ${new_balance.toLocaleString()}`);
    }
  }
});
```

#### 3. `inventory_update`

**When**: Player's ship cargo changes (from trade, mining, loot, etc.)

**Channel**: `player.<player_id>`

**Payload**:
```typescript
{
  type: 'inventory_update',
  payload: {
    player_id: 'uuid',
    ship_id: 'uuid',
    reason: 'trade'
  }
}
```

**Frontend Handling**:

```typescript
useSSE(playerId, (event) => {
  if (event.type === 'inventory_update') {
    // Refetch inventory from API
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }
});
```

---

## Error Handling

### Error Codes

| Error Code | Meaning | User Action |
|------------|---------|-------------|
| `ECON_ORDER_NOT_FOUND` | Order doesn't exist | Refresh and retry |
| `ECON_INSUFFICIENT_CREDITS` | Not enough money | Earn more credits or reduce order |
| `ECON_INSUFFICIENT_INVENTORY` | Seller lacks commodities | Wait or find another seller |
| `ECON_CARGO_FULL` | Buyer's ship is full | Sell/offload cargo |
| `ECON_COMMODITY_MISMATCH` | Internal error | Report bug |
| `ECON_ORDER_INVALID_STATE` | Order already filled | Refresh orderbook |

### Example Error Handler

```typescript
import { AxiosError } from 'axios';
import { showToast } from '@/utils/toast';

export function handleTradingError(error: AxiosError) {
  const errorCode = error.response?.data?.error_code;

  switch (errorCode) {
    case 'ECON_INSUFFICIENT_CREDITS':
      showToast('error', 'Not enough credits! Earn more by completing missions or selling goods.');
      break;
    case 'ECON_INSUFFICIENT_INVENTORY':
      showToast('error', 'Seller doesn\'t have enough inventory for this trade.');
      break;
    case 'ECON_CARGO_FULL':
      showToast('error', 'Your ship cargo is full! Sell or offload items first.');
      break;
    default:
      showToast('error', 'Trade failed. Please try again.');
  }
}
```

---

## State Management

### Recommended Zustand Store

```typescript
import { create } from 'zustand';

interface TradingState {
  selectedCommodity: string | null;
  selectedMarket: string | null;
  orderType: 'buy' | 'sell';
  orderPrice: string;
  orderQuantity: number;

  setSelectedCommodity: (commodity: string) => void;
  setSelectedMarket: (marketId: string) => void;
  setOrderType: (type: 'buy' | 'sell') => void;
  setOrderPrice: (price: string) => void;
  setOrderQuantity: (quantity: number) => void;
  resetOrderForm: () => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  selectedCommodity: null,
  selectedMarket: null,
  orderType: 'buy',
  orderPrice: '',
  orderQuantity: 0,

  setSelectedCommodity: (commodity) => set({ selectedCommodity: commodity }),
  setSelectedMarket: (marketId) => set({ selectedMarket: marketId }),
  setOrderType: (type) => set({ orderType: type }),
  setOrderPrice: (price) => set({ orderPrice: price }),
  setOrderQuantity: (quantity) => set({ orderQuantity: quantity }),
  resetOrderForm: () => set({
    orderPrice: '',
    orderQuantity: 0,
  }),
}));
```

---

## UI/UX Recommendations

### 1. Trading Screen Layout

```
┌─────────────────────────────────────┐
│  Market: Sol Station                │
│  Commodity: [Ore ▼]                 │
├─────────────────────────────────────┤
│  Order Book                         │
│  ┌────────────┬────────────┐        │
│  │ Sell (Asks)│ Buy (Bids) │        │
│  ├────────────┼────────────┤        │
│  │ 51.00  50  │ 50.00  100 │        │
│  │ 52.00 125  │ 49.50   75 │        │
│  │ 53.00 300  │ 49.00  200 │        │
│  └────────────┴────────────┘        │
│  Spread: 1.00 | Mid: 50.50          │
├─────────────────────────────────────┤
│  Place Order                        │
│  [ Buy ] [ Sell ]                   │
│  Price: [______] Qty: [______]      │
│  Total: 0.00 credits                │
│  [Place Order Button]               │
├─────────────────────────────────────┤
│  Recent Trades                      │
│  50.00 x 50  @ 10:30                │
│  49.75 x 25  @ 10:25                │
└─────────────────────────────────────┘
```

### 2. Visual Feedback

**Order Placement**:
- Show loading spinner while API request in progress
- Animate credits deduction when trade executes
- Animate inventory quantity update
- Confetti/success animation on filled orders

**Price Chart**:
- Line chart showing last 100 trades
- Green line for uptrend, red for downtrend
- Tooltip showing exact price on tap

**Orderbook Depth**:
- Bar chart visualization for bid/ask quantities
- Color-code: Green for bids, Red for asks
- Highlight best bid/ask prices

### 3. Validation Rules

- **Price**: Must be > 0, max 8 decimal places
- **Quantity**: Must be integer > 0
- **Buy orders**: Check player has enough credits (price * quantity)
- **Sell orders**: Check player has enough inventory

```typescript
function validateOrder(
  type: 'buy' | 'sell',
  price: string,
  quantity: number,
  playerCredits: number,
  playerInventory: number
): string | null {
  const priceNum = parseFloat(price);

  if (isNaN(priceNum) || priceNum <= 0) {
    return 'Price must be greater than 0';
  }

  if (quantity <= 0 || !Number.isInteger(quantity)) {
    return 'Quantity must be a positive integer';
  }

  const total = priceNum * quantity;

  if (type === 'buy' && total > playerCredits) {
    return `Insufficient credits. Need ${total}, have ${playerCredits}`;
  }

  if (type === 'sell' && quantity > playerInventory) {
    return `Insufficient inventory. Need ${quantity}, have ${playerInventory}`;
  }

  return null; // Valid
}
```

---

## Testing Checklist

### Unit Tests

- [ ] `placeOrder` API function
- [ ] `getOrderbook` API function
- [ ] `getTradeHistory` API function
- [ ] Order validation logic
- [ ] SSE event handlers
- [ ] Error handling for each error code

### Integration Tests

- [ ] Place buy order → verify credits debited
- [ ] Place sell order → verify inventory reduced
- [ ] Order matches → verify SSE events received
- [ ] Partial fill → verify remaining order in orderbook
- [ ] Failed order (insufficient credits) → verify error toast shown
- [ ] Orderbook updates on new order placement

### E2E Tests

- [ ] Complete buy flow: Select commodity → Enter order → Place → Verify success
- [ ] Complete sell flow: Select commodity → Enter order → Place → Verify success
- [ ] View orderbook → Place order → See orderbook update
- [ ] View trade history → See recent trades
- [ ] Receive SSE event → See credits/inventory update in UI

---

## Migration Notes

### Breaking Changes

None. This is a net-new feature (trading was non-functional before).

### New Dependencies

- Existing SSE infrastructure (already implemented)
- No additional npm packages required

### Configuration

Update `config.ts` to ensure correct economy service URL:

```typescript
export const config = {
  API_BASE_URL: 'http://192.168.122.76:8080',  // Gateway
  ECONOMY_SERVICE_URL: 'http://192.168.122.76:8080/markets',  // Via Gateway
};
```

---

## Support & Questions

**Backend Implementation**: Complete (Phase 3)
**Backend Tests**: ✅ 7 unit tests, 3 integration tests
**Frontend Status**: Pending implementation

For backend questions, refer to:
- `AI_AGENT_GUIDE.md` - Architecture patterns
- `API_BLUEPRINT.md` - Full API documentation
- `/services/economy/internal/trade/executor.go` - Trade execution logic
- `/services/economy/test/trade_integration_test.go` - Integration test examples

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-26
**Author**: SSW Galaxy Backend Team
