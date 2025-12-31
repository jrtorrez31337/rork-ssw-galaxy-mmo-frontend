import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation, Map, Compass, Rocket } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useTravelStore } from '@/stores/travelStore';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * NavLCARSContent - Navigation controls for the unified LCARS bar
 *
 * Layout: [Status] | [Travel Progress] | [Quick Nav] | [Flight Mode]
 */

function StatusSection() {
  const { profileId } = useAuth();
  const { isInTransit, currentJourney } = useTravelStore();

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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>STATUS</Text>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
      <Text style={styles.sectorText}>{currentSector}</Text>
    </View>
  );
}

function TravelProgressSection() {
  const { isInTransit, currentJourney, progress } = useTravelStore();

  if (!isInTransit || !currentJourney) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TRANSIT</Text>
        <Text style={styles.idleText}>IDLE</Text>
      </View>
    );
  }

  const progressPct = Math.round(progress * 100);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>TRANSIT</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressText}>{progressPct}%</Text>
      </View>
      <Text style={styles.destinationText}>→ {currentJourney.to_sector}</Text>
    </View>
  );
}

function QuickNavSection() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>QUICK NAV</Text>
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveViewport('sector')}
        >
          <Compass size={20} color={tokens.colors.semantic.navigation} />
          <Text style={styles.navButtonText}>SECTOR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveViewport('system-map')}
        >
          <Map size={20} color={tokens.colors.semantic.navigation} />
          <Text style={styles.navButtonText}>SYSTEM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveViewport('galaxy-map')}
        >
          <Navigation size={20} color={tokens.colors.semantic.navigation} />
          <Text style={styles.navButtonText}>GALAXY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FlightModeSection() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);
  const setActiveRail = useCockpitStore((s) => s.setActiveRail);

  const handleEnterFlight = () => {
    setActiveViewport('flight');
    setActiveRail('FLT');
  };

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.flightButton} onPress={handleEnterFlight}>
        <Rocket size={24} color={tokens.colors.lcars.sky} />
        <Text style={styles.flightButtonText}>FLT</Text>
      </TouchableOpacity>
    </View>
  );
}

export function NavLCARSContent() {
  return (
    <>
      <View style={styles.sectionContainer}>
        <StatusSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerWide}>
        <TravelProgressSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerFlex}>
        <QuickNavSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <FlightModeSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainerWide: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainerFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    backgroundColor: tokens.colors.border.default,
    marginVertical: 8,
  },
  section: {
    alignItems: 'center',
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectorText: {
    fontSize: 10,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.secondary,
  },
  idleText: {
    fontSize: 12,
    color: tokens.colors.text.muted,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: 80,
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
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  destinationText: {
    fontSize: 9,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  navButtonText: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
    letterSpacing: 1,
  },
  flightButton: {
    alignItems: 'center',
    gap: 4,
    padding: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.lcars.sky,
  },
  flightButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.lcars.sky,
    letterSpacing: 1,
  },
});
