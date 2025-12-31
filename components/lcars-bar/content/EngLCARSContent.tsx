import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wrench, Zap, Activity, AlertCircle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useShipStatus } from '@/hooks/useShipStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * EngLCARSContent - Engineering controls for the unified LCARS bar
 *
 * Layout: [System Status] | [Power Distribution] | [Reactor] | [Repair Queue]
 */

function SystemStatusSection() {
  const { profileId } = useAuth();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
    staleTime: 5000,
  });

  const currentShip = ships?.[0] || null;
  const shipStatus = useShipStatus({
    ship: currentShip,
    characterId: profileId || undefined,
  });

  const hullPct = shipStatus?.hull.percentage || 100;
  const systemsOnline = hullPct > 50 ? 'ALL' : hullPct > 25 ? 'PARTIAL' : 'CRITICAL';

  const getStatusColor = () => {
    if (hullPct > 75) return tokens.colors.status.online;
    if (hullPct > 25) return tokens.colors.alert.warning;
    return tokens.colors.alert.critical;
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>SYSTEMS</Text>
      <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
        <Activity size={14} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{systemsOnline}</Text>
      </View>
      <Text style={styles.hullText}>HULL: {Math.round(hullPct)}%</Text>
    </View>
  );
}

function PowerDistributionSection() {
  // TODO: Connect to power distribution state
  const powerLevels = {
    weapons: 33,
    shields: 33,
    engines: 34,
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>POWER</Text>
      <View style={styles.powerBars}>
        <View style={styles.powerItem}>
          <Text style={styles.powerLabel}>WPN</Text>
          <View style={styles.powerBar}>
            <View style={[styles.powerFill, styles.powerWeapons, { width: `${powerLevels.weapons}%` }]} />
          </View>
        </View>
        <View style={styles.powerItem}>
          <Text style={styles.powerLabel}>SHD</Text>
          <View style={styles.powerBar}>
            <View style={[styles.powerFill, styles.powerShields, { width: `${powerLevels.shields}%` }]} />
          </View>
        </View>
        <View style={styles.powerItem}>
          <Text style={styles.powerLabel}>ENG</Text>
          <View style={styles.powerBar}>
            <View style={[styles.powerFill, styles.powerEngines, { width: `${powerLevels.engines}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ReactorSection() {
  // TODO: Connect to reactor state
  const reactorOutput = 85;
  const reactorTemp = 'NOMINAL';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>REACTOR</Text>
      <View style={styles.reactorGauge}>
        <Zap size={24} color={tokens.colors.lcars.peach} />
        <Text style={styles.reactorValue}>{reactorOutput}%</Text>
      </View>
      <Text style={styles.reactorTemp}>{reactorTemp}</Text>
    </View>
  );
}

function RepairQueueSection() {
  // TODO: Connect to repair queue state
  const repairsNeeded = 0;
  const isRepairing = false;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>REPAIR</Text>
      {repairsNeeded > 0 || isRepairing ? (
        <View style={styles.repairInfo}>
          <AlertCircle size={16} color={tokens.colors.alert.warning} />
          <Text style={styles.repairText}>{repairsNeeded} PENDING</Text>
        </View>
      ) : (
        <Text style={styles.noRepairText}>OPTIMAL</Text>
      )}
      <TouchableOpacity style={styles.repairButton}>
        <Wrench size={16} color={tokens.colors.lcars.peach} />
        <Text style={styles.repairButtonText}>REPAIR</Text>
      </TouchableOpacity>
    </View>
  );
}

export function EngLCARSContent() {
  return (
    <>
      <View style={styles.sectionContainer}>
        <SystemStatusSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerFlex}>
        <PowerDistributionSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <ReactorSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <RepairQueueSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: 90,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: tokens.colors.background.tertiary,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hullText: {
    fontSize: 9,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 4,
  },
  powerBars: {
    gap: 8,
  },
  powerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  powerLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    width: 28,
    letterSpacing: 1,
  },
  powerBar: {
    width: 80,
    height: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  powerFill: {
    height: '100%',
    borderRadius: 6,
  },
  powerWeapons: {
    backgroundColor: tokens.colors.semantic.combat,
  },
  powerShields: {
    backgroundColor: tokens.colors.command.blue,
  },
  powerEngines: {
    backgroundColor: tokens.colors.semantic.navigation,
  },
  reactorGauge: {
    alignItems: 'center',
    gap: 4,
  },
  reactorValue: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.lcars.peach,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  reactorTemp: {
    fontSize: 9,
    color: tokens.colors.status.online,
    fontWeight: '600',
    letterSpacing: 1,
  },
  repairInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repairText: {
    fontSize: 10,
    color: tokens.colors.alert.warning,
    fontWeight: '600',
  },
  noRepairText: {
    fontSize: 11,
    color: tokens.colors.status.online,
    fontWeight: '600',
  },
  repairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.lcars.peach,
  },
  repairButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.lcars.peach,
    letterSpacing: 1,
  },
});
