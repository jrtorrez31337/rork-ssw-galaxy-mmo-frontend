import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Cockpit Shell State Management
 * Controls the persistent bridge UI - rail navigation, panel states, alerts
 * Per LCARS UI/UX Doctrine and Implementation Architecture
 */

export type RailSystem = 'NAV' | 'OPS' | 'TAC' | 'ENG' | 'COM';
export type PanelState = 'hidden' | 'peek' | 'expanded';
export type AlertLevel = 'green' | 'yellow' | 'red';
export type ViewportType = 'sector' | 'station' | 'system-map' | 'galaxy-map' | 'hyperspace';

interface RailStateData {
  NAV: {
    selectedDestination: string | null;
    routePlanned: boolean;
    mapZoom: 'local' | 'system' | 'galaxy';
  };
  OPS: {
    activeOperation: 'missions' | 'mining' | 'trading' | null;
    selectedMission: string | null;
  };
  TAC: {
    selectedTarget: string | null;
    weaponGroup: number;
  };
  ENG: {
    selectedSystem: string | null;
    viewMode: 'status' | 'modules';
  };
  COM: {
    activeChannel: string;
    unreadCount: number;
  };
}

interface CockpitState {
  // Shell mounted flag - prevents remount
  shellMounted: boolean;

  // Rail navigation
  activeRail: RailSystem;
  previousRail: RailSystem | null;

  // Panel state
  panelState: PanelState;

  // Alert status
  alertLevel: AlertLevel;
  alertReason: string | null;
  alertTimestamp: number | null;

  // Viewport
  activeViewport: ViewportType;

  // Per-rail state preservation
  railState: RailStateData;

  // Command bar context
  primaryAction: {
    label: string;
    action: string;
    color: 'navigation' | 'combat' | 'economy';
  } | null;
  secondaryActions: Array<{
    label: string;
    action: string;
  }>;
  tickerMessage: string | null;

  // Actions
  markShellMounted: () => void;
  setActiveRail: (rail: RailSystem) => void;
  setPanelState: (state: PanelState) => void;
  togglePanel: () => void;
  setActiveViewport: (viewport: ViewportType) => void;

  // Alert actions
  triggerAlert: (level: AlertLevel, reason: string) => void;
  clearAlert: () => void;
  acknowledgeAlert: () => void;

  // Rail state actions
  updateRailState: <K extends RailSystem>(
    rail: K,
    updates: Partial<RailStateData[K]>
  ) => void;

  // Command bar actions
  setPrimaryAction: (action: CockpitState['primaryAction']) => void;
  setSecondaryActions: (actions: CockpitState['secondaryActions']) => void;
  setTickerMessage: (message: string | null) => void;

  // Combat mode helpers
  enterCombatMode: (reason: string) => void;
  exitCombatMode: () => void;
}

const initialRailState: RailStateData = {
  NAV: {
    selectedDestination: null,
    routePlanned: false,
    mapZoom: 'local',
  },
  OPS: {
    activeOperation: null,
    selectedMission: null,
  },
  TAC: {
    selectedTarget: null,
    weaponGroup: 1,
  },
  ENG: {
    selectedSystem: null,
    viewMode: 'status',
  },
  COM: {
    activeChannel: 'local',
    unreadCount: 0,
  },
};

export const useCockpitStore = create<CockpitState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    shellMounted: false,
    activeRail: 'NAV',
    previousRail: null,
    panelState: 'hidden',
    alertLevel: 'green',
    alertReason: null,
    alertTimestamp: null,
    activeViewport: 'sector',
    railState: initialRailState,
    primaryAction: null,
    secondaryActions: [],
    tickerMessage: null,

    // Mark shell as mounted (called once on initial render)
    markShellMounted: () => set({ shellMounted: true }),

    // Rail navigation - preserves state when switching
    setActiveRail: (rail) => {
      const current = get();
      if (current.activeRail === rail) {
        // Same rail tapped - toggle panel
        set({
          panelState: current.panelState === 'expanded' ? 'peek' : 'expanded',
        });
      } else {
        // Different rail - switch and show panel
        set({
          previousRail: current.activeRail,
          activeRail: rail,
          panelState: 'expanded',
        });
      }
    },

    // Panel state management
    setPanelState: (state) => set({ panelState: state }),

    togglePanel: () => {
      const current = get();
      const nextState: PanelState =
        current.panelState === 'hidden' ? 'peek' :
        current.panelState === 'peek' ? 'expanded' : 'hidden';
      set({ panelState: nextState });
    },

    // Viewport control
    setActiveViewport: (viewport) => set({ activeViewport: viewport }),

    // Alert system - higher priority always wins
    triggerAlert: (level, reason) => {
      const current = get();
      const priority = { green: 0, yellow: 1, red: 2 };

      // Only upgrade alerts, never downgrade automatically
      if (priority[level] >= priority[current.alertLevel]) {
        set({
          alertLevel: level,
          alertReason: reason,
          alertTimestamp: Date.now(),
        });

        // Red alert auto-behaviors per doctrine
        if (level === 'red') {
          set({
            activeRail: 'TAC',
            panelState: 'peek', // Auto-minimize to preserve viewport
          });
        }
      }
    },

    clearAlert: () => set({
      alertLevel: 'green',
      alertReason: null,
      alertTimestamp: null,
    }),

    acknowledgeAlert: () => {
      const current = get();
      // Yellow can be acknowledged, red cannot while threat persists
      if (current.alertLevel === 'yellow') {
        set({ alertLevel: 'green', alertReason: null, alertTimestamp: null });
      }
    },

    // Rail state updates (preserves other rail states)
    updateRailState: (rail, updates) => {
      set((state) => ({
        railState: {
          ...state.railState,
          [rail]: {
            ...state.railState[rail],
            ...updates,
          },
        },
      }));
    },

    // Command bar
    setPrimaryAction: (action) => set({ primaryAction: action }),
    setSecondaryActions: (actions) => set({ secondaryActions: actions }),
    setTickerMessage: (message) => set({ tickerMessage: message }),

    // Combat mode - bundles all combat behaviors
    enterCombatMode: (reason) => {
      set({
        alertLevel: 'red',
        alertReason: reason,
        alertTimestamp: Date.now(),
        activeRail: 'TAC',
        panelState: 'peek',
        primaryAction: {
          label: 'FIRE',
          action: 'combat:fire',
          color: 'combat',
        },
      });
    },

    exitCombatMode: () => {
      set({
        alertLevel: 'green',
        alertReason: null,
        alertTimestamp: null,
        primaryAction: null,
      });
    },
  }))
);

// Selectors for optimized subscriptions
export const selectActiveRail = (state: CockpitState) => state.activeRail;
export const selectPanelState = (state: CockpitState) => state.panelState;
export const selectAlertLevel = (state: CockpitState) => state.alertLevel;
export const selectActiveViewport = (state: CockpitState) => state.activeViewport;
export const selectIsInCombat = (state: CockpitState) => state.alertLevel === 'red';
