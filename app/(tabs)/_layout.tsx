import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/ui/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CockpitShell } from '@/components/shell';

/**
 * Tab Layout - LCARS Cockpit Shell
 *
 * Per UI/UX Doctrine and Implementation Architecture:
 * - CockpitShell wraps all game content
 * - Shell MUST NEVER remount during session
 * - HeaderBar, LeftRail are persistent
 * - Tab router hidden; LeftRail handles navigation state
 * - Content renders inside shell viewport via Slot
 *
 * Navigation is now state-based (via cockpitStore), not route-based.
 * The Slot renders whichever tab content is currently active.
 */

export default function TabLayout() {
  return (
    <ErrorBoundary fallbackTitle="Bridge System Error">
      <SafeAreaView
        style={{ flex: 1, backgroundColor: tokens.colors.background.primary }}
        edges={['top', 'bottom']}
      >
        <CockpitShell>
          {/* Tab content renders here inside the viewport */}
          <Slot />
        </CockpitShell>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
