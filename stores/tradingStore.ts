import { create } from 'zustand';
import type { OrderSide, ActiveOrder } from '@/types/economy';

/**
 * Trading state management store
 * Manages order form state, selected market/commodity, and UI state
 */

interface TradingState {
  // Market & Commodity selection
  selectedMarket: string | null;
  selectedCommodity: string | null;

  // Order form state
  orderType: OrderSide;
  orderPrice: string;
  orderQuantity: number;

  // UI state
  isPlacingOrder: boolean;
  lastOrderStatus: 'pending' | 'partial' | 'filled' | null;

  // Active orders tracking
  activeOrders: ActiveOrder[];

  // Actions
  setSelectedMarket: (marketId: string) => void;
  setSelectedCommodity: (commodity: string) => void;
  setOrderType: (type: OrderSide) => void;
  setOrderPrice: (price: string) => void;
  setOrderQuantity: (quantity: number) => void;
  setIsPlacingOrder: (isPlacing: boolean) => void;
  setLastOrderStatus: (status: 'pending' | 'partial' | 'filled' | null) => void;
  addActiveOrder: (order: ActiveOrder) => void;
  removeActiveOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: 'pending' | 'partial' | 'filled' | 'cancelled') => void;
  resetOrderForm: () => void;
  reset: () => void;
}

const initialState = {
  selectedMarket: null,
  selectedCommodity: null,
  orderType: 'buy' as OrderSide,
  orderPrice: '',
  orderQuantity: 0,
  isPlacingOrder: false,
  lastOrderStatus: null,
  activeOrders: [] as ActiveOrder[],
};

export const useTradingStore = create<TradingState>((set) => ({
  ...initialState,

  setSelectedMarket: (marketId) => set({ selectedMarket: marketId }),

  setSelectedCommodity: (commodity) => set({ selectedCommodity: commodity }),

  setOrderType: (type) => set({ orderType: type }),

  setOrderPrice: (price) => set({ orderPrice: price }),

  setOrderQuantity: (quantity) => set({ orderQuantity: quantity }),

  setIsPlacingOrder: (isPlacing) => set({ isPlacingOrder: isPlacing }),

  setLastOrderStatus: (status) => set({ lastOrderStatus: status }),

  addActiveOrder: (order) =>
    set((state) => ({
      activeOrders: [...state.activeOrders, order],
    })),

  removeActiveOrder: (orderId) =>
    set((state) => ({
      activeOrders: state.activeOrders.filter((o) => o.order_id !== orderId),
    })),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      activeOrders: state.activeOrders.map((o) =>
        o.order_id === orderId ? { ...o, status } : o
      ),
    })),

  resetOrderForm: () =>
    set({
      orderPrice: '',
      orderQuantity: 0,
      isPlacingOrder: false,
      lastOrderStatus: null,
    }),

  reset: () => set(initialState),
}));
