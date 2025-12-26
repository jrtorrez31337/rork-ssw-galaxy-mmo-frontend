// Trading & Economy Types (Phase 3)

export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled';

export interface PlaceOrderRequest {
  player_id: string;
  commodity: string;
  side: OrderSide;
  price: string; // Decimal string for precision
  quantity: number;
}

export interface OrderFill {
  fill_id: string;
  matched_order_id: string;
  price: string;
  quantity: number;
  timestamp: string;
}

export interface PlaceOrderResponse {
  order_id: string;
  status: OrderStatus;
  fills: OrderFill[];
}

export interface OrderbookLevel {
  price: string;
  quantity: number;
}

export interface Orderbook {
  bids: OrderbookLevel[]; // Buy orders (descending by price)
  asks: OrderbookLevel[]; // Sell orders (ascending by price)
  spread: string;
  midpoint: string;
}

export interface Trade {
  trade_id: string;
  commodity: string;
  quantity: number;
  price: string;
  total: string;
  executed_at: string;
}

export interface TradeHistoryResponse {
  trades: Trade[];
}

// SSE Event Types

export interface TradeExecutedEvent {
  type: 'trade_executed';
  payload: {
    trade_id: string;
    order_id: string;
    commodity: string;
    quantity: number;
    price: number;
    total: number;
    role: 'buyer' | 'seller';
  };
}

export interface CreditsChangedEvent {
  type: 'credits_changed';
  payload: {
    player_id: string;
    old_balance: number;
    new_balance: number;
    amount_changed: number;
    reason: string;
    transaction_id: string;
  };
}

export interface InventoryUpdateEvent {
  type: 'inventory_update';
  payload: {
    player_id: string;
    ship_id: string;
    reason: string;
  };
}

export type TradingEvent =
  | TradeExecutedEvent
  | CreditsChangedEvent
  | InventoryUpdateEvent;

// Error Codes

export type EconomyErrorCode =
  | 'ECON_ORDER_NOT_FOUND'
  | 'ECON_INSUFFICIENT_CREDITS'
  | 'ECON_INSUFFICIENT_INVENTORY'
  | 'ECON_CARGO_FULL'
  | 'ECON_COMMODITY_MISMATCH'
  | 'ECON_ORDER_INVALID_STATE';

export interface EconomyError {
  code: EconomyErrorCode;
  message: string;
}

// Common commodities (can be extended)
export const COMMODITIES = [
  'ore',
  'fuel',
  'water',
  'food',
  'electronics',
  'weapons',
  'medicine',
  'luxury_goods',
] as const;

export type Commodity = (typeof COMMODITIES)[number];
