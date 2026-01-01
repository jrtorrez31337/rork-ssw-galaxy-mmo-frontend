import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation, Map, Compass, Rocket, Grid3X3, Layers } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useTravelStore } from '@/stores/travelStore';
import { useSettingsStore, SectorViewMode } from '@/stores/settingsStore';
import { getAxisLabels } from '@/lib/sectorProjection';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { SwipeableLCARSContainer } from '../SwipeableLCARSContainer';

/**
 * NavLCARSContent - Navigation controls for the unified LCARS bar
 *
 * Pages: Status & Transit | View Controls | Quick Nav | Flight Mode
 */

function StatusTransitPage() {
  const { profileId } = useAuth();
  const { isInTransit, currentJourney, progress } = useTravelStore();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
    staleTime: 5000,
  });

  const currentShip = ships?.[0] || null;
  const isDocked = !!currentShip?.docked_at;
  const currentSector = currentShip?.location_sector || '0.0.0';

  const getStatusText = () => {
    if (isDocked) return 'DOCKED';
    if (isInTransit) return 'IN TRANSIT';
    return 'IN SPACE';
  };

  const getStatusColor = () => {
    if (isDocked) return tokens.colors.status.online;
    if (isInTransit) return tokens.colors.semantic.navigation;
    return tokens.colors.text.secondary;
  };

  const progressPct = Math.round(progress * 100);

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>NAVIGATION STATUS</Text>

      <View style={styles.statusBlock}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        <Text style={styles.sectorText}>{currentSector}</Text>
      </View>

      {isInTransit && currentJourney ? (
        <View style={styles.transitBlock}>
          <Text style={styles.transitLabel}>TRANSIT TO</Text>
          <Text style={styles.destinationText}>{currentJourney.to_sector}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressPct}%</Text>
          </View>
        </View>
      ) : (
        <View style={styles.transitBlock}>
          <Text style={styles.transitLabel}>TRANSIT</Text>
          <Text style={styles.idleText}>IDLE</Text>
        </View>
      )}
    </View>
  );
}

const VIEW_MODES: SectorViewMode[] = ['top-down', 'bottom', 'side-left', 'side-right', 'front', 'back'];
const VIEW_MODE_LABELS: Record<SectorViewMode, string> = {
  'top-down': 'TOP',
  'bottom': 'BOTTOM',
  'side-left': 'LEFT',
  'side-right': 'RIGHT',
  'front': 'FRONT',
  'back': 'BACK',
};

function ViewControlsPage() {
  const {
    sectorViewMode,
    sectorGridEnabled,
    sectorDepthCuesEnabled,
    setSectorViewMode,
    setSectorGridEnabled,
    setSectorDepthCuesEnabled,
  } = useSettingsStore();

  const axisLabels = getAxisLabels(sectorViewMode);

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>VIEW CONTROLS</Text>

      <View style={styles.viewModeGrid}>
        {VIEW_MODES.map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewModeButton,
              sectorViewMode === mode && styles.viewModeButtonActive,
            ]}
            onPress={() => setSectorViewMode(mode)}
          >
            <Text
              style={[
                styles.viewModeButtonText,
                sectorViewMode === mode && styles.viewModeButtonTextActive,
              ]}
            >
              {VIEW_MODE_LABELS[mode]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.axisInfo}>
        Axes: {axisLabels.horizontal}/{axisLabels.vertical} | Depth: {axisLabels.depth}
      </Text>

      <View style={styles.togglesRow}>
        <TouchableOpacity
          style={[styles.toggleButton, sectorGridEnabled && styles.toggleButtonActive]}
          onPress={() => setSectorGridEnabled(!sectorGridEnabled)}
        >
          <Grid3X3 size={20} color={sectorGridEnabled ? tokens.colors.semantic.navigation : tokens.colors.text.muted} />
          <Text style={[styles.toggleLabel, sectorGridEnabled && styles.toggleLabelActive]}>GRID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, sectorDepthCuesEnabled && styles.toggleButtonActive]}
          onPress={() => setSectorDepthCuesEnabled(!sectorDepthCuesEnabled)}
        >
          <Layers size={20} color={sectorDepthCuesEnabled ? tokens.colors.semantic.navigation : tokens.colors.text.muted} />
          <Text style={[styles.toggleLabel, sectorDepthCuesEnabled && styles.toggleLabelActive]}>DEPTH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function QuickNavPage() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>QUICK NAVIGATION</Text>

      <View style={styles.navButtonsGrid}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveViewport('sector')}
        >
          <Compass size={28} color={tokens.colors.semantic.navigation} />
          <Text style={styles.navButtonText}>SECTOR</Text>
          <Text style={styles.navButtonHint}>Local space view</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveViewport('system-map')}
        >
          <Map size={28} color={tokens.colors.semantic.navigation} />
          <Text style={styles.navButtonText}>SYSTEM</Text>
          <Text style={styles.navButtonHint}>Star system map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveViewport('galaxy-map')}
        >
          <Navigation size={28} color={tokens.colors.semantic.navigation} />
          <Text style={styles.navButtonText}>GALAXY</Text>
          <Text style={styles.navButtonHint}>Full galaxy view</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FlightModePage() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);

  const handleEnterFlight = () => {
    setActiveViewport('flight');
  };

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>FLIGHT MODE</Text>

      <TouchableOpacity style={styles.flightButton} onPress={handleEnterFlight}>
        <Rocket size={40} color={tokens.colors.lcars.sky} />
        <Text style={styles.flightButtonText}>ENGAGE</Text>
        <Text style={styles.flightButtonHint}>Manual ship control</Text>
      </TouchableOpacity>
    </View>
  );
}

export function NavLCARSContent() {
  const pages = [
    <StatusTransitPage key="status" />,
    <ViewControlsPage key="view" />,
    <QuickNavPage key="quicknav" />,
    <FlightModePage key="flight" />,
  ];

  return (
    <SwipeableLCARSContainer
      pages={pages}
      activeColor={tokens.colors.semantic.navigation}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  pageTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
    letterSpacing: 2,
    marginBottom: 8,
  },
  // Status & Transit
  statusBlock: {
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sectorText: {
    fontSize: 14,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.secondary,
  },
  transitBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  transitLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  destinationText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.semantic.navigation,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  idleText: {
    fontSize: 14,
    color: tokens.colors.text.muted,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 120,
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  // View Controls
  viewModeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewModeButtonActive: {
    backgroundColor: tokens.colors.semantic.navigation + '30',
    borderColor: tokens.colors.semantic.navigation,
  },
  viewModeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  viewModeButtonTextActive: {
    color: tokens.colors.semantic.navigation,
  },
  axisInfo: {
    fontSize: 10,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  toggleButton: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: tokens.colors.semantic.navigation + '20',
    borderColor: tokens.colors.semantic.navigation + '50',
  },
  toggleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  toggleLabelActive: {
    color: tokens.colors.semantic.navigation,
  },
  // Quick Nav
  navButtonsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  navButton: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    minWidth: 90,
  },
  navButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
    letterSpacing: 1,
  },
  navButtonHint: {
    fontSize: 8,
    color: tokens.colors.text.muted,
  },
  // Flight Mode
  flightButton: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: tokens.colors.lcars.sky,
  },
  flightButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.lcars.sky,
    letterSpacing: 2,
  },
  flightButtonHint: {
    fontSize: 10,
    color: tokens.colors.text.muted,
  },
});
