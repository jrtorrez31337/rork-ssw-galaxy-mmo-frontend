import { apiClient } from './client';
import type {
  PlaceOrderRequest,
  PlaceOrderResponse,
  Orderbook,
  TradeHistoryResponse,
} from '@/types/economy';

/**
 * Economy API client for trading & market operations
 * Phase 3: Trading & Economy Integration
 */

export const economyApi = {
  /**
   * Place a buy or sell order on the market
   * If a matching order exists, trade executes immediately
   *
   * @param marketId - UUID of the market/station
   * @param playerId - Player's profile ID
   * @param request - Order details (commodity, side, price, quantity)
   * @returns Order status with any immediate fills
   */
  placeOrder: async (
    marketId: string,
    playerId: string,
    request: Omit<PlaceOrderRequest, 'player_id'>
  ): Promise<PlaceOrderResponse> => {
    return apiClient.post<PlaceOrderResponse>(
      `/markets/${marketId}/orders`,
      {
        player_id: playerId,
        ...request,
      }
    );
  },

  /**
   * Get the current orderbook for a commodity
   * Shows all pending buy and sell orders
   *
   * @param marketId - UUID of the market/station
   * @param commodity - Commodity type (e.g., 'ore', 'fuel')
   * @returns Orderbook with bids, asks, spread, and midpoint
   */
  getOrderbook: async (
    marketId: string,
    commodity: string
  ): Promise<Orderbook> => {
    return apiClient.get<Orderbook>(
      `/markets/${marketId}/orderbook?commodity=${encodeURIComponent(commodity)}`
    );
  },

  /**
   * Get recent trade history for a commodity
   * Used for price charts and market activity
   *
   * @param marketId - UUID of the market/station
   * @param commodity - Commodity type
   * @param limit - Maximum number of trades to return (default: 50)
   * @returns List of recent trades
   */
  getTradeHistory: async (
    marketId: string,
    commodity: string,
    limit: number = 50
  ): Promise<TradeHistoryResponse> => {
    return apiClient.get<TradeHistoryResponse>(
      `/markets/${marketId}/trades?commodity=${encodeURIComponent(commodity)}&limit=${limit}`
    );
  },

  /**
   * Get player's active orders (if endpoint exists)
   * Note: This endpoint may not be implemented yet in backend
   */
  getPlayerOrders: async (playerId: string): Promise<any> => {
    return apiClient.get(`/markets/orders?player_id=${playerId}`);
  },

  /**
   * Cancel an order (if endpoint exists)
   * Note: This endpoint may not be implemented yet in backend
   */
  cancelOrder: async (marketId: string, orderId: string): Promise<any> => {
    return apiClient.delete(`/markets/${marketId}/orders/${orderId}`);
  },
};
