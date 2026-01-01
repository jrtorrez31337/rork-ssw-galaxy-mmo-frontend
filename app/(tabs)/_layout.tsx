import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/ui/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CockpitShell } from '@/components/shell';

/**
 * Tab Layout - LCARS Cockpit Shell
 *
 * Per UI/UX Doctrine and Viewscreen Architecture:
 * - CockpitShell wraps all game content
 * - Shell MUST NEVER remount during session
 * - HeaderBar, LeftRail are persistent
 * - Viewscreen handles all content routing based on activeViewport state
 *
 * Navigation is state-based (via cockpitStore), not route-based.
 */

export default function TabLayout() {
  return (
    <ErrorBoundary fallbackTitle="Bridge System Error">
      <SafeAreaView
        style={{ flex: 1, backgroundColor: tokens.colors.background.primary }}
        edges={['top', 'bottom']}
      >
        <CockpitShell />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
