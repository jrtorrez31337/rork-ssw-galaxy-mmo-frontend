import { create } from 'zustand';
import type { TravelStatusResponse } from '@/types/travel';

/**
 * Travel state management store
 * Manages active travel, progress tracking, and UI state
 */

interface TravelState {
  // Active travel
  activeTravel: TravelStatusResponse | null;
  isInTransit: boolean;

  // Progress tracking (updated locally for smooth countdown)
  remainingSeconds: number;
  progressPercent: number;

  // UI state
  showCancelConfirmation: boolean;

  // Actions
  setActiveTravel: (travel: TravelStatusResponse | null) => void;
  updateProgress: (remainingSeconds: number, progressPercent: number) => void;
  decrementRemainingSeconds: () => void;
  clearTravel: () => void;
  setShowCancelConfirmation: (show: boolean) => void;
  reset: () => void;
}

const initialState = {
  activeTravel: null,
  isInTransit: false,
  remainingSeconds: 0,
  progressPercent: 0,
  showCancelConfirmation: false,
};

export const useTravelStore = create<TravelState>((set, get) => ({
  ...initialState,

  setActiveTravel: (travel) =>
    set({
      activeTravel: travel,
      isInTransit: travel?.status === 'in_transit',
      remainingSeconds: travel?.remaining_seconds ?? 0,
      progressPercent: travel?.progress_percent ?? 0,
    }),

  updateProgress: (remainingSeconds, progressPercent) =>
    set({
      remainingSeconds,
      progressPercent,
    }),

  decrementRemainingSeconds: () =>
    set((state) => {
      if (state.remainingSeconds <= 0) return state;

      const newRemaining = state.remainingSeconds - 1;
      const travel = state.activeTravel;

      // Calculate progress based on remaining time
      let newProgress = state.progressPercent;
      if (travel) {
        const totalTime =
          (new Date(travel.arrives_at).getTime() -
            new Date(travel.started_at).getTime()) /
          1000;
        if (totalTime > 0) {
          newProgress = Math.min(
            100,
            ((totalTime - newRemaining) / totalTime) * 100
          );
        }
      }

      return {
        remainingSeconds: newRemaining,
        progressPercent: newProgress,
      };
    }),

  clearTravel: () =>
    set({
      activeTravel: null,
      isInTransit: false,
      remainingSeconds: 0,
      progressPercent: 0,
      showCancelConfirmation: false,
    }),

  setShowCancelConfirmation: (show) =>
    set({ showCancelConfirmation: show }),

  reset: () => set(initialState),
}));
