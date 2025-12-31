import { create } from 'zustand';
import { respawnApi, RespawnLocation, RespawnResult } from '@/api/respawn';

/**
 * Respawn State Store
 *
 * Manages the death and respawn flow for players.
 * Triggered when ship hull reaches 0 (destroyed).
 *
 * Flow:
 * 1. Combat ends with player ship destroyed (hull=0)
 * 2. isDestroyed becomes true
 * 3. Respawn overlay appears
 * 4. Player sees respawn location and confirms
 * 5. executeRespawn is called
 * 6. Ship is reset and moved to respawn location
 */

interface RespawnState {
  // Death state
  isDestroyed: boolean;
  destroyedAt: string | null;
  destroyedInSector: string | null;
  destroyedByEntity: string | null;

  // Respawn options
  respawnLocation: RespawnLocation | null;
  isLoadingLocation: boolean;
  locationError: string | null;

  // Respawn execution
  isRespawning: boolean;
  respawnError: string | null;
  lastRespawnResult: RespawnResult | null;

  // Actions
  setDestroyed: (sector: string, killedBy?: string) => void;
  fetchRespawnLocation: (playerId: string) => Promise<void>;
  executeRespawn: (playerId: string) => Promise<RespawnResult | null>;
  clearDestroyedState: () => void;
  reset: () => void;
}

const initialState = {
  isDestroyed: false,
  destroyedAt: null,
  destroyedInSector: null,
  destroyedByEntity: null,
  respawnLocation: null,
  isLoadingLocation: false,
  locationError: null,
  isRespawning: false,
  respawnError: null,
  lastRespawnResult: null,
};

export const useRespawnStore = create<RespawnState>((set, get) => ({
  ...initialState,

  setDestroyed: (sector, killedBy) => {
    set({
      isDestroyed: true,
      destroyedAt: new Date().toISOString(),
      destroyedInSector: sector,
      destroyedByEntity: killedBy || null,
    });
  },

  fetchRespawnLocation: async (playerId: string) => {
    set({ isLoadingLocation: true, locationError: null });

    try {
      const location = await respawnApi.getRespawnLocation(playerId);
      set({
        respawnLocation: location,
        isLoadingLocation: false,
      });
    } catch (error) {
      set({
        locationError: error instanceof Error ? error.message : 'Failed to get respawn location',
        isLoadingLocation: false,
      });
    }
  },

  executeRespawn: async (playerId: string) => {
    set({ isRespawning: true, respawnError: null });

    try {
      const result = await respawnApi.executeRespawn(playerId);
      set({
        isRespawning: false,
        lastRespawnResult: result,
        // Clear destroyed state after successful respawn
        isDestroyed: false,
        destroyedAt: null,
        destroyedInSector: null,
        destroyedByEntity: null,
        respawnLocation: null,
      });
      return result;
    } catch (error) {
      set({
        respawnError: error instanceof Error ? error.message : 'Failed to respawn',
        isRespawning: false,
      });
      return null;
    }
  },

  clearDestroyedState: () => {
    set({
      isDestroyed: false,
      destroyedAt: null,
      destroyedInSector: null,
      destroyedByEntity: null,
      respawnLocation: null,
      locationError: null,
      respawnError: null,
    });
  },

  reset: () => set(initialState),
}));

// Selectors
export const selectIsDestroyed = (state: RespawnState) => state.isDestroyed;
export const selectRespawnLocation = (state: RespawnState) => state.respawnLocation;
export const selectIsRespawning = (state: RespawnState) => state.isRespawning;
