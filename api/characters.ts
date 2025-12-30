import { apiClient } from './client';
import { Character, CharacterAttributes } from '@/types/api';

export interface CreateCharacterRequest {
  profile_id: string;
  name: string;
  faction_id: string;
  home_sector: string;
  attributes: CharacterAttributes;
}

export const characterApi = {
  create: (data: CreateCharacterRequest) =>
    apiClient.post<Character>('/characters', data),

  getById: (id: string) => apiClient.get<Character>(`/characters/${id}`),

  getByProfile: (profileId: string) =>
    apiClient.get<Character[]>(`/characters/by-profile/${profileId}`),

  update: (id: string, name: string) =>
    apiClient.patch<{ message: string }>(`/characters/${id}`, { name }),
};
