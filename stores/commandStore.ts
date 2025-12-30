import { create } from 'zustand';

/**
 * CommandStore - Bridge Command Action System
 *
 * Handles action dispatch from CommandBar to game systems.
 * Components subscribe to pending actions and execute them.
 *
 * Flow:
 * 1. User presses ENGAGE in CommandBar
 * 2. CommandBar calls dispatchAction('nav:engage')
 * 3. NavigationPanel or map.tsx picks up the action and executes it
 * 4. Execution clears the pending action
 */

export type CommandAction =
  | 'nav:engage'      // Initiate jump to selected destination
  | 'nav:undock'      // Undock from current station
  | 'nav:dock'        // Dock at selected station
  | 'nav:abort'       // Abort current travel
  | 'tac:fire'        // Fire at selected target
  | 'tac:target'      // Cycle targets
  | 'ops:execute'     // Execute selected operation
  | 'com:hail'        // Hail selected target
  | 'flt:launch';     // Enter flight mode

interface PendingAction {
  action: CommandAction;
  timestamp: number;
  context?: Record<string, unknown>;
}

interface CommandState {
  // Pending action waiting to be executed
  pendingAction: PendingAction | null;

  // Last executed action (for UI feedback)
  lastAction: PendingAction | null;

  // Action result/feedback
  actionFeedback: {
    success: boolean;
    message: string;
    timestamp: number;
  } | null;

  // Actions
  dispatchAction: (action: CommandAction, context?: Record<string, unknown>) => void;
  consumeAction: () => PendingAction | null;
  setActionFeedback: (success: boolean, message: string) => void;
  clearFeedback: () => void;
}

export const useCommandStore = create<CommandState>((set, get) => ({
  pendingAction: null,
  lastAction: null,
  actionFeedback: null,

  // Dispatch an action from CommandBar
  dispatchAction: (action, context) => {
    const pendingAction: PendingAction = {
      action,
      timestamp: Date.now(),
      context,
    };

    console.log('[CommandStore] Dispatching action:', action, context);

    set({
      pendingAction,
      actionFeedback: null, // Clear previous feedback
    });
  },

  // Consume the pending action (called by handler)
  // Returns the action and clears it from pending
  consumeAction: () => {
    const { pendingAction } = get();
    if (pendingAction) {
      set({
        pendingAction: null,
        lastAction: pendingAction,
      });
    }
    return pendingAction;
  },

  // Set feedback after action execution
  setActionFeedback: (success, message) => {
    set({
      actionFeedback: {
        success,
        message,
        timestamp: Date.now(),
      },
    });

    // Auto-clear feedback after 3 seconds
    setTimeout(() => {
      const current = get().actionFeedback;
      if (current && Date.now() - current.timestamp >= 2900) {
        set({ actionFeedback: null });
      }
    }, 3000);
  },

  clearFeedback: () => set({ actionFeedback: null }),
}));

// Hook to listen for a specific action type
export function useCommandAction(
  actionType: CommandAction,
  handler: (context?: Record<string, unknown>) => void
) {
  const pendingAction = useCommandStore((s) => s.pendingAction);
  const consumeAction = useCommandStore((s) => s.consumeAction);

  // Check if there's a matching pending action
  if (pendingAction?.action === actionType) {
    // Consume it and call handler
    const action = consumeAction();
    if (action) {
      handler(action.context);
    }
  }
}
