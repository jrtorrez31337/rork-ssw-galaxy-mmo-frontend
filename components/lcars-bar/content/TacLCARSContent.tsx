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
import { SwipeableLCARSContainer } from '../SwipeableLCARSContainer';

/**
 * TacLCARSContent - Tactical controls for the unified LCARS bar
 *
 * Pages: Scanner | Alert & Target | Weapons & Actions
 */

function ScannerPage() {
  const { profileId } = useAuth();
  const npcs = useNPCStore((s) => s.npcs);

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

  const { data: sectorData } = useQuery({
    queryKey: ['sector-entities', sectorId],
    queryFn: () => sectorEntitiesApi.getSectorEntities(sectorId!),
    enabled: !!sectorId,
    staleTime: 10000,
  });

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>LONG RANGE SCANNER</Text>
      <View style={styles.scannerContainer}>
        <LongRangeScanner
          sectorId={sectorId}
          playerPosition={playerPosition}
          npcs={npcs}
          dbStations={sectorData?.stations || []}
          otherShips={sectorData?.ships || []}
          currentShipId={currentShip?.id}
        />
      </View>
    </View>
  );
}

function AlertTargetPage() {
  const alertLevel = useCockpitStore((s) => s.alertLevel);
  const { isInCombat, combatInstance, selectedTarget } = useCombatStore();

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
      case 'yellow': return 'YELLOW ALERT';
      default: return 'GREEN';
    }
  };

  const targetName = combatInstance?.defender_ship_name || 'UNKNOWN';
  const hasTarget = selectedTarget || combatInstance;

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>TACTICAL STATUS</Text>

      <View style={styles.alertBlock}>
        <View style={[styles.alertIndicator, { backgroundColor: getAlertColor() + '30', borderColor: getAlertColor() }]}>
          <Text style={[styles.alertText, { color: getAlertColor() }]}>{getAlertText()}</Text>
        </View>
        {isInCombat && (
          <View style={styles.combatIndicator}>
            <AlertTriangle size={16} color={tokens.colors.alert.red} />
            <Text style={styles.combatText}>COMBAT ACTIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.targetBlock}>
        <Text style={styles.targetLabel}>TARGET</Text>
        {hasTarget ? (
          <>
            <Text style={styles.targetName}>{targetName}</Text>
            <View style={styles.targetStats}>
              <Text style={styles.targetStat}>RNG: 2.4 km</Text>
              <Text style={styles.targetStat}>BRG: 045°</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.noTargetText}>NO TARGET</Text>
            <TouchableOpacity style={styles.scanButton}>
              <Crosshair size={18} color={tokens.colors.semantic.combat} />
              <Text style={styles.scanButtonText}>SCAN</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function WeaponsActionsPage() {
  const { isInCombat } = useCombatStore();

  // TODO: Connect to weapons state
  const weapons = [
    { name: 'LASER', status: 'ready' as const },
    { name: 'MISSILE', status: 'charging' as const },
    { name: 'TORPEDO', status: 'ready' as const },
  ];

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>WEAPONS & ACTIONS</Text>

      <View style={styles.weaponsList}>
        {weapons.map((weapon, index) => (
          <View key={index} style={styles.weaponItem}>
            <Zap
              size={16}
              color={weapon.status === 'ready' ? tokens.colors.status.online : tokens.colors.alert.warning}
            />
            <Text style={[
              styles.weaponName,
              { color: weapon.status === 'ready' ? tokens.colors.text.primary : tokens.colors.alert.warning }
            ]}>
              {weapon.name}
            </Text>
            <Text style={[
              styles.weaponStatus,
              { color: weapon.status === 'ready' ? tokens.colors.status.online : tokens.colors.alert.warning }
            ]}>
              {weapon.status.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, styles.fireButton, !isInCombat && styles.actionButtonDisabled]}
          disabled={!isInCombat}
        >
          <Crosshair size={24} color={isInCombat ? tokens.colors.text.inverse : tokens.colors.text.muted} />
          <Text style={[styles.actionButtonText, { color: isInCombat ? tokens.colors.text.inverse : tokens.colors.text.muted }]}>
            FIRE
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Shield size={24} color={tokens.colors.semantic.combat} />
          <Text style={styles.actionButtonText}>EVADE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function TacLCARSContent() {
  const pages = [
    <ScannerPage key="scanner" />,
    <AlertTargetPage key="alert-target" />,
    <WeaponsActionsPage key="weapons-actions" />,
  ];

  return (
    <SwipeableLCARSContainer
      pages={pages}
      activeColor={tokens.colors.semantic.combat}
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
    color: tokens.colors.semantic.combat,
    letterSpacing: 2,
    marginBottom: 4,
  },
  // Scanner Page
  scannerContainer: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Alert & Target Page
  alertBlock: {
    alignItems: 'center',
    gap: 8,
  },
  alertIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 2,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  combatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  combatText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.alert.red,
    letterSpacing: 1,
  },
  targetBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    width: '60%',
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.semantic.combat,
  },
  targetStats: {
    flexDirection: 'row',
    gap: 16,
  },
  targetStat: {
    fontSize: 10,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.secondary,
  },
  noTargetText: {
    fontSize: 14,
    color: tokens.colors.text.muted,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.combat,
  },
  scanButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.semantic.combat,
    letterSpacing: 1,
  },
  // Weapons & Actions Page
  weaponsList: {
    gap: 8,
    width: '80%',
  },
  weaponItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
  },
  weaponName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  weaponStatus: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
    padding: 14,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.combat,
    minWidth: 80,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    borderColor: tokens.colors.text.muted,
  },
  fireButton: {
    backgroundColor: tokens.colors.semantic.combat,
    borderColor: tokens.colors.semantic.combat,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.combat,
    letterSpacing: 1,
  },
});
