# Trading & Economy

## Overview

The trading system enables players to buy and sell commodities at station markets. It uses a limit order book model where orders can match immediately or sit pending until a counterparty arrives.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/markets/{id}/orders` | Place buy/sell order |
| GET | `/markets/{id}/orderbook` | Get orderbook for commodity |
| GET | `/markets/{id}/trades` | Get trade history |
| GET | `/markets/orders` | Get player's active orders |
| DELETE | `/markets/{id}/orders/{orderId}` | Cancel order |

## Data Types

### PlaceOrderRequest
```typescript
interface PlaceOrderRequest {
  player_id: string;
  commodity: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
}
```

### Orderbook
```typescript
interface Orderbook {
  bids: OrderLevel[];   // Buy orders (highest first)
  asks: OrderLevel[];   // Sell orders (lowest first)
  spread: number;       // Ask - Bid difference
  midpoint: number;     // (Ask + Bid) / 2
}

interface OrderLevel {
  price: number;
  quantity: number;
  order_count: number;
}
```

### TradeHistoryResponse
```typescript
interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
}

interface Trade {
  id: string;
  commodity: string;
  price: number;
  quantity: number;
  timestamp: string;
}
```

## Commodities

The game features 12 tradeable commodities:

| Commodity | Description |
|-----------|-------------|
| iron_ore | Basic metal ore |
| ice_water | Frozen water deposits |
| silicates | Silicon compounds |
| hydrogen | Fuel component |
| carbon | Organic material |
| titanium_ore | High-grade metal |
| platinum | Precious metal |
| rare_earth | Electronics components |
| xenon_gas | Rare gas |
| antimatter | High-energy fuel |
| exotic_crystals | Advanced tech material |
| ancient_artifacts | Valuable relics |

## Source Files

| File | Purpose |
|------|---------|
| `api/economy.ts` | API client methods |
| `stores/tradingStore.ts` | Trading state |
| `hooks/useTradingEvents.ts` | SSE event handlers |
| `app/trading.tsx` | Trading screen |

## Trading Flow

1. **Market Selection**
   - Player docks at station
   - Station has one or more markets
   - Each market trades specific commodities

2. **Order Placement**
   - Player selects commodity
   - Views orderbook (bids/asks)
   - Places buy or sell order with price/quantity

3. **Order Matching**
   - If matching order exists, trade executes immediately
   - Otherwise, order sits in orderbook
   - Partial fills possible

4. **Settlement**
   - Credits deducted/added
   - Cargo updated
   - Trade history updated

## Real-Time Events

Trading events received via SSE:

| Event | Description |
|-------|-------------|
| `trade_executed` | Order matched and filled |
| `inventory_update` | Cargo changed |
| `credits_update` | Balance changed |
| `order_update` | Order status changed |

## Components

### OrderForm
- Commodity selector
- Side toggle (buy/sell)
- Price input
- Quantity input
- Submit button

### OrderbookView
- Bid/ask levels
- Spread and midpoint
- Order depth visualization

### TradeHistory
- Recent market trades
- Price/quantity/time

### ActiveOrdersList
- Player's pending orders
- Cancel button per order

### MarketSelector
- Choose which market to trade at

### CreditsDisplay
- Current account balance

## Integration Points

- **Inventory**: Cargo limits trading quantity
- **Stations**: Must be docked to trade
- **Navigation**: Markets vary by sector
- **Factions**: Some markets may have faction restrictions
