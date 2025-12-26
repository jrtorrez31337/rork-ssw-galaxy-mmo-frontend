import { create } from 'zustand';
import type { OrderSide } from '@/types/economy';

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

  // Actions
  setSelectedMarket: (marketId: string) => void;
  setSelectedCommodity: (commodity: string) => void;
  setOrderType: (type: OrderSide) => void;
  setOrderPrice: (price: string) => void;
  setOrderQuantity: (quantity: number) => void;
  setIsPlacingOrder: (isPlacing: boolean) => void;
  setLastOrderStatus: (status: 'pending' | 'partial' | 'filled' | null) => void;
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

  resetOrderForm: () =>
    set({
      orderPrice: '',
      orderQuantity: 0,
      isPlacingOrder: false,
      lastOrderStatus: null,
    }),

  reset: () => set(initialState),
}));
