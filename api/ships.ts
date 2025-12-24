import { apiClient } from './client';
import { Ship, ShipStats, ShipType } from '@/types/api';

export interface CreateShipRequest {
  owner_id: string;
  ship_type: ShipType;
  name?: string;
  stat_allocation: ShipStats;
}

export const shipApi = {
  create: (data: CreateShipRequest) => apiClient.post<Ship>('/ships', data),

  getById: (id: string) => apiClient.get<Ship>(`/ships/${id}`),

  getByOwner: (ownerId: string) =>
    apiClient.get<Ship[]>(`/ships/by-owner/${ownerId}`),

  update: (id: string, name: string) =>
    apiClient.patch<{ message: string }>(`/ships/${id}`, { name }),
};
