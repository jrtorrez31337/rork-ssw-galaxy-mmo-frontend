import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wrench, Zap, Activity, AlertCircle, Gauge, Settings } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useShipStatus } from '@/hooks/useShipStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { SwipeableLCARSContainer } from '../SwipeableLCARSContainer';

/**
 * EngLCARSContent - Engineering controls for the unified LCARS bar
 *
 * Pages: Systems | Power Distribution | Reactor & Repair
 */

function SystemsPage() {
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
  const shieldPct = shipStatus?.shield.percentage || 100;
  const systemsOnline = hullPct > 50 ? 'ALL SYSTEMS ONLINE' : hullPct > 25 ? 'PARTIAL SYSTEMS' : 'CRITICAL';

  const getStatusColor = () => {
    if (hullPct > 75) return tokens.colors.status.online;
    if (hullPct > 25) return tokens.colors.alert.warning;
    return tokens.colors.alert.critical;
  };

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>SYSTEMS STATUS</Text>

      <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
        <Activity size={18} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>{systemsOnline}</Text>
      </View>

      <View style={styles.vitalBars}>
        <View style={styles.vitalItem}>
          <Text style={styles.vitalLabel}>HULL</Text>
          <View style={styles.vitalBar}>
            <View style={[styles.vitalFill, { width: `${hullPct}%`, backgroundColor: getStatusColor() }]} />
          </View>
          <Text style={[styles.vitalValue, { color: getStatusColor() }]}>{Math.round(hullPct)}%</Text>
        </View>
        <View style={styles.vitalItem}>
          <Text style={styles.vitalLabel}>SHIELD</Text>
          <View style={styles.vitalBar}>
            <View style={[styles.vitalFill, { width: `${shieldPct}%`, backgroundColor: tokens.colors.command.blue }]} />
          </View>
          <Text style={[styles.vitalValue, { color: tokens.colors.command.blue }]}>{Math.round(shieldPct)}%</Text>
        </View>
      </View>
    </View>
  );
}

function PowerPage() {
  // TODO: Connect to power distribution state
  const powerLevels = {
    weapons: 33,
    shields: 33,
    engines: 34,
  };

  const total = powerLevels.weapons + powerLevels.shields + powerLevels.engines;

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>POWER DISTRIBUTION</Text>

      <View style={styles.powerGrid}>
        <View style={styles.powerSection}>
          <Zap size={24} color={tokens.colors.semantic.combat} />
          <Text style={styles.powerLabel}>WEAPONS</Text>
          <View style={styles.powerBarContainer}>
            <View style={styles.powerBar}>
              <View style={[styles.powerFill, styles.powerWeapons, { width: `${powerLevels.weapons}%` }]} />
            </View>
          </View>
          <Text style={[styles.powerValue, { color: tokens.colors.semantic.combat }]}>{powerLevels.weapons}%</Text>
        </View>

        <View style={styles.powerSection}>
          <Settings size={24} color={tokens.colors.command.blue} />
          <Text style={styles.powerLabel}>SHIELDS</Text>
          <View style={styles.powerBarContainer}>
            <View style={styles.powerBar}>
              <View style={[styles.powerFill, styles.powerShields, { width: `${powerLevels.shields}%` }]} />
            </View>
          </View>
          <Text style={[styles.powerValue, { color: tokens.colors.command.blue }]}>{powerLevels.shields}%</Text>
        </View>

        <View style={styles.powerSection}>
          <Gauge size={24} color={tokens.colors.semantic.navigation} />
          <Text style={styles.powerLabel}>ENGINES</Text>
          <View style={styles.powerBarContainer}>
            <View style={styles.powerBar}>
              <View style={[styles.powerFill, styles.powerEngines, { width: `${powerLevels.engines}%` }]} />
            </View>
          </View>
          <Text style={[styles.powerValue, { color: tokens.colors.semantic.navigation }]}>{powerLevels.engines}%</Text>
        </View>
      </View>

      <Text style={styles.totalPower}>TOTAL: {total}%</Text>
    </View>
  );
}

function ReactorRepairPage() {
  // TODO: Connect to reactor state
  const reactorOutput = 85;
  const reactorTemp = 'NOMINAL';
  const repairsNeeded = 0;
  const isRepairing = false;

  const getTempColor = () => {
    if (reactorTemp === 'NOMINAL') return tokens.colors.status.online;
    if (reactorTemp === 'ELEVATED') return tokens.colors.alert.warning;
    return tokens.colors.alert.critical;
  };

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>REACTOR & REPAIR</Text>

      <View style={styles.reactorBlock}>
        <View style={styles.reactorGauge}>
          <Zap size={32} color={tokens.colors.lcars.peach} />
          <Text style={styles.reactorValue}>{reactorOutput}%</Text>
        </View>
        <Text style={[styles.reactorTemp, { color: getTempColor() }]}>{reactorTemp}</Text>
      </View>

      <View style={styles.repairBlock}>
        <Text style={styles.repairLabel}>REPAIR STATUS</Text>
        {repairsNeeded > 0 || isRepairing ? (
          <View style={styles.repairInfo}>
            <AlertCircle size={18} color={tokens.colors.alert.warning} />
            <Text style={styles.repairText}>{repairsNeeded} SYSTEMS NEED REPAIR</Text>
          </View>
        ) : (
          <Text style={styles.optimalText}>ALL SYSTEMS OPTIMAL</Text>
        )}
        <TouchableOpacity style={styles.repairButton}>
          <Wrench size={18} color={tokens.colors.lcars.peach} />
          <Text style={styles.repairButtonText}>REPAIR BAY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function EngLCARSContent() {
  const pages = [
    <SystemsPage key="systems" />,
    <PowerPage key="power" />,
    <ReactorRepairPage key="reactor-repair" />,
  ];

  return (
    <SwipeableLCARSContainer
      pages={pages}
      activeColor={tokens.colors.lcars.peach}
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
    color: tokens.colors.lcars.peach,
    letterSpacing: 2,
    marginBottom: 8,
  },
  // Systems Page
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: tokens.colors.background.tertiary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  vitalBars: {
    width: '80%',
    gap: 10,
    marginTop: 8,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    width: 50,
    letterSpacing: 1,
  },
  vitalBar: {
    flex: 1,
    height: 14,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 7,
    overflow: 'hidden',
  },
  vitalFill: {
    height: '100%',
    borderRadius: 7,
  },
  vitalValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    width: 40,
    textAlign: 'right',
  },
  // Power Page
  powerGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  powerSection: {
    alignItems: 'center',
    gap: 6,
  },
  powerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  powerBarContainer: {
    width: 60,
    alignItems: 'center',
  },
  powerBar: {
    width: 16,
    height: 60,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  powerFill: {
    width: '100%',
    borderRadius: 8,
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
  powerValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
  },
  totalPower: {
    fontSize: 10,
    color: tokens.colors.text.muted,
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 4,
  },
  // Reactor & Repair Page
  reactorBlock: {
    alignItems: 'center',
    gap: 6,
  },
  reactorGauge: {
    alignItems: 'center',
    gap: 4,
  },
  reactorValue: {
    fontSize: 24,
    fontWeight: '700',
    color: tokens.colors.lcars.peach,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  reactorTemp: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  repairBlock: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    width: '70%',
  },
  repairLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  repairInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repairText: {
    fontSize: 11,
    color: tokens.colors.alert.warning,
    fontWeight: '600',
  },
  optimalText: {
    fontSize: 12,
    color: tokens.colors.status.online,
    fontWeight: '600',
  },
  repairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.lcars.peach,
  },
  repairButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.lcars.peach,
    letterSpacing: 1,
  },
});
