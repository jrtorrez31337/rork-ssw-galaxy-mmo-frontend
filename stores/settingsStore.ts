import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User settings store with persistence
 * Manages user preferences that persist across sessions
 */

/**
 * View modes for SectorView2D
 * Each mode projects the 3D sector onto a 2D plane from a different angle
 */
export type SectorViewMode = 'top-down' | 'bottom' | 'side-left' | 'side-right' | 'front' | 'back';

export const VIEW_MODE_LABELS: Record<SectorViewMode, string> = {
  'top-down': 'Top Down (XY)',
  'bottom': 'Bottom Up (XY)',
  'side-left': 'Side Left (ZY)',
  'side-right': 'Side Right (ZY)',
  'front': 'Front (XZ)',
  'back': 'Back (XZ)',
};

interface SettingsState {
  // Chat settings
  profanityFilterEnabled: boolean;
  chatNotificationsEnabled: boolean;

  // Display settings
  showCoordinates: boolean;
  compactMode: boolean;

  // Sector view settings
  sectorViewMode: SectorViewMode;
  sectorGridEnabled: boolean;
  sectorDepthCuesEnabled: boolean;

  // Actions
  setProfanityFilter: (enabled: boolean) => void;
  setChatNotifications: (enabled: boolean) => void;
  setShowCoordinates: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setSectorViewMode: (mode: SectorViewMode) => void;
  setSectorGridEnabled: (enabled: boolean) => void;
  setSectorDepthCuesEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  profanityFilterEnabled: true, // Defaults to ON
  chatNotificationsEnabled: true,
  showCoordinates: true,
  compactMode: false,
  sectorViewMode: 'top-down' as SectorViewMode,
  sectorGridEnabled: true,
  sectorDepthCuesEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setProfanityFilter: (enabled) => set({ profanityFilterEnabled: enabled }),

      setChatNotifications: (enabled) => set({ chatNotificationsEnabled: enabled }),

      setShowCoordinates: (enabled) => set({ showCoordinates: enabled }),

      setCompactMode: (enabled) => set({ compactMode: enabled }),

      setSectorViewMode: (mode) => set({ sectorViewMode: mode }),

      setSectorGridEnabled: (enabled) => set({ sectorGridEnabled: enabled }),

      setSectorDepthCuesEnabled: (enabled) => set({ sectorDepthCuesEnabled: enabled }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'ssw-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
