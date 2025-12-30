import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User settings store with persistence
 * Manages user preferences that persist across sessions
 */

interface SettingsState {
  // Chat settings
  profanityFilterEnabled: boolean;
  chatNotificationsEnabled: boolean;

  // Display settings
  showCoordinates: boolean;
  compactMode: boolean;

  // Actions
  setProfanityFilter: (enabled: boolean) => void;
  setChatNotifications: (enabled: boolean) => void;
  setShowCoordinates: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  profanityFilterEnabled: true, // Defaults to ON
  chatNotificationsEnabled: true,
  showCoordinates: true,
  compactMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setProfanityFilter: (enabled) => set({ profanityFilterEnabled: enabled }),

      setChatNotifications: (enabled) => set({ chatNotificationsEnabled: enabled }),

      setShowCoordinates: (enabled) => set({ showCoordinates: enabled }),

      setCompactMode: (enabled) => set({ compactMode: enabled }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'ssw-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
