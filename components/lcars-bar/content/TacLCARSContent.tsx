import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crosshair, Shield, Zap, AlertTriangle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useCombatStore } from '@/stores/combatStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { sectorEntitiesApi } from '@/api/sectorEntities';
import { useNPCStore } from '@/stores/npcStore';
import { LongRangeScanner } from './LongRangeScanner';

/**
 * TacLCARSContent - Tactical controls for the unified LCARS bar
 *
 * Layout: [Alert Status] | [Target Info] | [Weapons] | [Combat Actions]
 */

function AlertStatusSection() {
  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const { isInCombat } = useCombatStore();

  const getAlertColor = () => {
    switch (alertLevel) {
      case 'red': return tokens.colors.alert.red;
      case 'yellow': return tokens.colors.alert.warning;
      default: return tokens.colors.status.online;
    }
  };

  const getAlertText = () => {
    if (isInCombat) return 'COMBAT';
    switch (alertLevel) {
      case 'red': return 'RED ALERT';
      case 'yellow': return 'YELLOW';
      default: return 'GREEN';
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>ALERT</Text>
      <View style={[styles.alertIndicator, { backgroundColor: getAlertColor() + '30', borderColor: getAlertColor() }]}>
        <Text style={[styles.alertText, { color: getAlertColor() }]}>{getAlertText()}</Text>
      </View>
      {isInCombat && (
        <View style={styles.combatIndicator}>
          <AlertTriangle size={12} color={tokens.colors.alert.red} />
        </View>
      )}
    </View>
  );
}

function TargetInfoSection() {
  const { combatInstance, selectedTarget } = useCombatStore();

  if (!selectedTarget && !combatInstance) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TARGET</Text>
        <Text style={styles.noTargetText}>NO TARGET</Text>
        <TouchableOpacity style={styles.scanButton}>
          <Crosshair size={16} color={tokens.colors.semantic.combat} />
          <Text style={styles.scanButtonText}>SCAN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show target info when in combat
  const targetName = combatInstance?.defender_ship_name || 'UNKNOWN';
  const targetRange = '2.4 km';
  const targetBearing = '045°';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>TARGET</Text>
      <Text style={styles.targetName}>{targetName}</Text>
      <View style={styles.targetStats}>
        <Text style={styles.targetStat}>{targetRange}</Text>
        <Text style={styles.targetStat}>{targetBearing}</Text>
      </View>
    </View>
  );
}

function WeaponsSection() {
  // TODO: Connect to weapons state
  const weapons = [
    { name: 'LASER', status: 'ready' },
    { name: 'MISSILE', status: 'charging' },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>WEAPONS</Text>
      <View style={styles.weaponsList}>
        {weapons.map((weapon, index) => (
          <View key={index} style={styles.weaponItem}>
            <Zap
              size={14}
              color={weapon.status === 'ready' ? tokens.colors.status.online : tokens.colors.alert.warning}
            />
            <Text style={[
              styles.weaponName,
              { color: weapon.status === 'ready' ? tokens.colors.text.primary : tokens.colors.alert.warning }
            ]}>
              {weapon.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CombatActionsSection() {
  const { isInCombat } = useCombatStore();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>ACTIONS</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, styles.fireButton]}
          disabled={!isInCombat}
        >
          <Crosshair size={20} color={isInCombat ? tokens.colors.text.inverse : tokens.colors.text.muted} />
          <Text style={[styles.actionButtonText, { color: isInCombat ? tokens.colors.text.inverse : tokens.colors.text.muted }]}>
            FIRE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Shield size={20} color={tokens.colors.semantic.combat} />
          <Text style={styles.actionButtonText}>EVADE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScannerSection() {
  const { profileId } = useAuth();
  const npcs = useNPCStore((s) => s.npcs);

  // Get player's ship data
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
    staleTime: 5000,
  });

  const currentShip = ships?.[0] || null;
  const sectorId = currentShip?.location_sector || undefined;
  const playerPosition: [number, number, number] | undefined = currentShip
    ? [currentShip.position_x, currentShip.position_y, currentShip.position_z]
    : undefined;

  // Get sector entities (stations and other ships)
  const { data: sectorData } = useQuery({
    queryKey: ['sector-entities', sectorId],
    queryFn: () => sectorEntitiesApi.getSectorEntities(sectorId!),
    enabled: !!sectorId,
    staleTime: 10000,
  });

  return (
    <LongRangeScanner
      sectorId={sectorId}
      playerPosition={playerPosition}
      npcs={npcs}
      dbStations={sectorData?.stations || []}
      otherShips={sectorData?.ships || []}
      currentShipId={currentShip?.id}
    />
  );
}

export function TacLCARSContent() {
  return (
    <>
      <View style={styles.sectionContainerScanner}>
        <ScannerSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <AlertStatusSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerWide}>
        <TargetInfoSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <WeaponsSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerFlex}>
        <CombatActionsSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainerScanner: {
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainerWide: {
    width: 100,
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
  alertIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  combatIndicator: {
    marginTop: 4,
  },
  noTargetText: {
    fontSize: 11,
    color: tokens.colors.text.muted,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.combat,
  },
  scanButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.semantic.combat,
    letterSpacing: 1,
  },
  targetName: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.semantic.combat,
  },
  targetStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  targetStat: {
    fontSize: 9,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.secondary,
  },
  weaponsList: {
    gap: 6,
  },
  weaponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weaponName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.combat,
  },
  fireButton: {
    backgroundColor: tokens.colors.semantic.combat,
    borderColor: tokens.colors.semantic.combat,
  },
  actionButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.semantic.combat,
    letterSpacing: 1,
  },
});
