import { apiClient } from './client';

export type OwnerType = 'ship' | 'station' | 'planet';

export type ResourceType =
  | 'iron_ore'
  | 'ice_water'
  | 'silicates'
  | 'hydrogen'
  | 'carbon'
  | 'titanium_ore'
  | 'platinum'
  | 'rare_earth'
  | 'xenon_gas'
  | 'antimatter'
  | 'exotic_crystals'
  | 'ancient_artifacts';

export type ResourceRarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';

export interface InventoryItem {
  id: string;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
  unit_volume: number;
  total_volume: number;
}

export interface Inventory {
  owner_id: string;
  owner_type: OwnerType;
  capacity: number;
  used: number;
  items: InventoryItem[];
}

export interface TransferRequest {
  source_id: string;
  source_type: OwnerType;
  target_id: string;
  target_type: OwnerType;
  resource_type: ResourceType;
  quantity: number;
  quality: number;
}

export interface TransferResponse {
  transfer_id: string;
  source_remaining: number;
  target_new_total: number;
  timestamp: string;
}

interface InventoryApiResponse {
  data: Inventory;
}

interface TransferApiResponse {
  data: TransferResponse;
}

export const inventoryApi = {
  getInventory: async (
    ownerId: string,
    ownerType: OwnerType,
    resourceType?: ResourceType
  ): Promise<Inventory> => {
    const params = new URLSearchParams({ owner_type: ownerType });
    if (resourceType) {
      params.append('resource_type', resourceType);
    }

    const response = await apiClient.get<InventoryApiResponse>(
      `/inventory/${ownerId}?${params.toString()}`
    );
    return response.data;
  },

  transfer: async (request: TransferRequest): Promise<TransferResponse> => {
    const response = await apiClient.post<TransferApiResponse>(
      '/inventory/transfer',
      request
    );
    return response.data;
  },
};
