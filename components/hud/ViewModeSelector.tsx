import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, Grid3X3, Layers } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useSettingsStore, SectorViewMode, VIEW_MODE_LABELS } from '@/stores/settingsStore';
import { getAxisLabels } from '@/lib/sectorProjection';

/**
 * ViewModeSelector
 *
 * Floating HUD overlay for selecting sector view mode and toggling grid/depth cues.
 * Positioned top-left of the sector view for easy access.
 *
 * View Modes:
 * - Top Down (XY): Looking down from above
 * - Side Left (ZY): Looking from the left
 * - Side Right (ZY): Looking from the right
 * - Front (XZ): Looking from the front
 * - Back (XZ): Looking from behind
 */

const VIEW_MODES: SectorViewMode[] = ['top-down', 'side-left', 'side-right', 'front', 'back'];

interface ViewModeSelectorProps {
  compact?: boolean;
}

export function ViewModeSelector({ compact = false }: ViewModeSelectorProps) {
  const {
    sectorViewMode,
    sectorGridEnabled,
    sectorDepthCuesEnabled,
    setSectorViewMode,
    setSectorGridEnabled,
    setSectorDepthCuesEnabled,
  } = useSettingsStore();

  const axisLabels = getAxisLabels(sectorViewMode);

  if (compact) {
    // Compact mode: just show current view with dropdown trigger
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactLabel}>{VIEW_MODE_LABELS[sectorViewMode]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Mode Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Eye size={14} color={tokens.colors.text.secondary} />
          <Text style={styles.sectionTitle}>VIEW</Text>
        </View>
        <View style={styles.modeButtons}>
          {VIEW_MODES.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                sectorViewMode === mode && styles.modeButtonActive,
              ]}
              onPress={() => setSectorViewMode(mode)}
              accessibilityRole="button"
              accessibilityLabel={VIEW_MODE_LABELS[mode]}
              accessibilityState={{ selected: sectorViewMode === mode }}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  sectorViewMode === mode && styles.modeButtonTextActive,
                ]}
              >
                {mode === 'top-down' ? 'TOP' :
                 mode === 'side-left' ? 'L' :
                 mode === 'side-right' ? 'R' :
                 mode === 'front' ? 'F' :
                 'B'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Current axis labels */}
        <Text style={styles.axisInfo}>
          {axisLabels.horizontal}/{axisLabels.vertical} • Depth: {axisLabels.depth}
        </Text>
      </View>

      {/* Toggles */}
      <View style={styles.toggles}>
        {/* Grid Toggle */}
        <TouchableOpacity
          style={[styles.toggle, sectorGridEnabled && styles.toggleActive]}
          onPress={() => setSectorGridEnabled(!sectorGridEnabled)}
          accessibilityRole="switch"
          accessibilityLabel="Toggle grid"
          accessibilityState={{ checked: sectorGridEnabled }}
        >
          <Grid3X3 size={16} color={sectorGridEnabled ? tokens.colors.primary.main : tokens.colors.text.tertiary} />
        </TouchableOpacity>

        {/* Depth Cues Toggle */}
        <TouchableOpacity
          style={[styles.toggle, sectorDepthCuesEnabled && styles.toggleActive]}
          onPress={() => setSectorDepthCuesEnabled(!sectorDepthCuesEnabled)}
          accessibilityRole="switch"
          accessibilityLabel="Toggle depth cues"
          accessibilityState={{ checked: sectorDepthCuesEnabled }}
        >
          <Layers size={16} color={sectorDepthCuesEnabled ? tokens.colors.primary.main : tokens.colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: tokens.spacing[2],
    left: tokens.spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    padding: tokens.spacing[2],
    gap: tokens.spacing[2],
    zIndex: 10,
  },

  compactContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
  },

  compactLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  section: {
    gap: tokens.spacing[1],
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  sectionTitle: {
    fontSize: 9,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    letterSpacing: 1,
  },

  modeButtons: {
    flexDirection: 'row',
    gap: 4,
  },

  modeButton: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  modeButtonActive: {
    backgroundColor: tokens.colors.primary.alpha[20],
    borderColor: tokens.colors.primary.main,
  },

  modeButtonText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
  },

  modeButtonTextActive: {
    color: tokens.colors.primary.main,
  },

  axisInfo: {
    fontSize: 8,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  toggles: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: tokens.spacing[2],
  },

  toggle: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  toggleActive: {
    backgroundColor: tokens.colors.primary.alpha[10],
    borderColor: tokens.colors.primary.alpha[30],
  },
});
