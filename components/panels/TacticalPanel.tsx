import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Crosshair, Shield, Zap, AlertTriangle, Target } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Panel, Gauge, StatusChip, RailButton, SegmentedGauge } from '@/ui/components';
import { useBridgeState } from '@/hooks/useBridgeState';
import { useTargetStore } from '@/stores/targetStore';
import { useCombatReadinessStore } from '@/stores/combatReadinessStore';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { ScannerDisplay } from '@/components/hud/ScannerDisplay';

/**
 * TacticalPanel - TAC Rail Content
 *
 * Per UI/UX Doctrine:
 * - Target selection and info
 * - Weapons status
 * - Engagement options
 * - Range/bearing display
 *
 * Per Space Mechanics Doctrine Section 3:
 * - All combat information immediately visible
 * - Energy distribution controls
 * - Escape vector indication
 */

export function TacticalPanel() {
  const { glance, target: targetState, situation } = useBridgeState();
  const { profileId } = useAuth();

  // Fetch current ship for scanner
  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });
  const currentShip = ships?.[0] || null;

  const target = useTargetStore((s) => s.target);
  const contacts = useTargetStore((s) => s.contacts);
  const hostileCount = useTargetStore((s) => s.hostileCount);
  const isLocked = useTargetStore((s) => s.isLocked);
  const lockProgress = useTargetStore((s) => s.lockProgress);
  const incomingMissiles = useTargetStore((s) => s.incomingMissiles);
  const isBeingTargeted = useTargetStore((s) => s.isBeingTargeted);

  const weapons = useCombatReadinessStore((s) => s.weapons);
  const weaponsReady = useCombatReadinessStore((s) => s.weaponsReady);
  const alertLevel = useCombatReadinessStore((s) => s.alertLevel);
  const engagement = useCombatReadinessStore((s) => s.engagement);
  const defensivePosture = useCombatReadinessStore((s) => s.defensivePosture);

  const isInCombat = situation.isInCombat;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Threat Warnings */}
      {(incomingMissiles > 0 || isBeingTargeted) && (
        <Panel variant="combat" title="THREAT WARNING" style={styles.panel}>
          {incomingMissiles > 0 && (
            <View style={styles.warningRow}>
              <AlertTriangle size={16} color={tokens.colors.semantic.danger} />
              <Text style={styles.warningText}>
                INCOMING: {incomingMissiles} missile{incomingMissiles > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {isBeingTargeted && (
            <View style={styles.warningRow}>
              <Crosshair size={16} color={tokens.colors.semantic.warning} />
              <Text style={styles.warningText}>TARGET LOCK DETECTED</Text>
            </View>
          )}
        </Panel>
      )}

      {/* Target Information */}
      <Panel variant="combat" title="TARGET" style={styles.panel}>
        {target ? (
          <>
            <View style={styles.targetHeader}>
              <Text style={styles.targetName}>{target.name}</Text>
              <StatusChip
                label=""
                value={target.isHostile ? 'HOSTILE' : 'NEUTRAL'}
                status={target.isHostile ? 'danger' : 'info'}
                size="small"
              />
            </View>

            <View style={styles.targetStats}>
              <View style={styles.targetStat}>
                <Text style={styles.targetStatLabel}>RANGE</Text>
                <Text style={styles.targetStatValue}>
                  {target.range?.toFixed(1) || '?'} ls
                </Text>
              </View>
              <View style={styles.targetStat}>
                <Text style={styles.targetStatLabel}>BEARING</Text>
                <Text style={styles.targetStatValue}>
                  {target.bearingClock || '?'}
                </Text>
              </View>
              <View style={styles.targetStat}>
                <Text style={styles.targetStatLabel}>CLOSING</Text>
                <Text style={[
                  styles.targetStatValue,
                  target.closingRate === 'closing' && styles.closingText,
                  target.closingRate === 'extending' && styles.extendingText,
                ]}>
                  {target.closingRate?.toUpperCase() || '?'}
                </Text>
              </View>
            </View>

            {(target.hull !== null || target.shields !== null) && (
              <View style={styles.targetVitals}>
                {target.shields !== null && (
                  <Gauge
                    label="SHLD"
                    value={target.shields}
                    size="small"
                    color={tokens.colors.lcars.sky}
                  />
                )}
                {target.hull !== null && (
                  <Gauge
                    label="HULL"
                    value={target.hull}
                    size="small"
                  />
                )}
              </View>
            )}

            {/* Lock status */}
            {!isLocked && (
              <View style={styles.lockProgress}>
                <Gauge
                  label="LOCKING"
                  value={lockProgress}
                  color={tokens.colors.semantic.combat}
                  size="medium"
                />
              </View>
            )}

            {isLocked && (
              <View style={styles.lockedIndicator}>
                <Target size={16} color={tokens.colors.semantic.combat} />
                <Text style={styles.lockedText}>TARGET LOCKED</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noTargetText}>No target selected</Text>
        )}
      </Panel>

      {/* Weapons Status */}
      <Panel variant="combat" title="WEAPONS" style={styles.panel}>
        <View style={styles.weaponsSummary}>
          <Text style={styles.weaponsReady}>
            {weaponsReady}/{weapons.length} READY
          </Text>
        </View>

        {weapons.length > 0 ? (
          <View style={styles.weaponsList}>
            {weapons.map((weapon) => (
              <View key={weapon.id} style={styles.weaponRow}>
                <Zap
                  size={14}
                  color={weapon.state === 'ready'
                    ? tokens.colors.semantic.combat
                    : tokens.colors.text.disabled}
                />
                <Text style={styles.weaponName}>{weapon.name}</Text>
                <StatusChip
                  label=""
                  value={weapon.state.toUpperCase()}
                  status={
                    weapon.state === 'ready' ? 'online' :
                    weapon.state === 'damaged' ? 'danger' : 'warning'
                  }
                  size="small"
                />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noWeaponsText}>No weapons equipped</Text>
        )}
      </Panel>

      {/* Combat Actions */}
      {isInCombat && (
        <Panel variant="combat" title="COMBAT" style={styles.panel}>
          <View style={styles.combatActions}>
            <RailButton
              label="FIRE"
              variant="combat"
              onPress={() => console.log('[TAC] Fire!')}
              disabled={!isLocked || weaponsReady === 0}
            />
            <RailButton
              label="EVADE"
              variant="navigation"
              onPress={() => console.log('[TAC] Evade!')}
            />
          </View>

          <View style={styles.postureRow}>
            <Text style={styles.postureLabel}>POSTURE:</Text>
            <Text style={styles.postureValue}>{defensivePosture.toUpperCase()}</Text>
          </View>

          {engagement.canEscape && (
            <View style={styles.escapeInfo}>
              <Text style={styles.escapeLabel}>Escape vector: {engagement.escapeDistance.toFixed(1)} ls</Text>
            </View>
          )}
        </Panel>
      )}

      {/* Scanner - Contacts Detection */}
      {currentShip && (
        <ScannerDisplay
          shipId={currentShip.id}
          sensorRange={currentShip.sensor_range || 8000}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    marginBottom: tokens.spacing[3],
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
    backgroundColor: `${tokens.colors.semantic.danger}20`,
    borderRadius: tokens.radius.sm,
    marginBottom: tokens.spacing[2],
  },
  warningText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.danger,
    textTransform: 'uppercase',
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  targetName: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  targetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[3],
  },
  targetStat: {
    alignItems: 'center',
  },
  targetStatLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  targetStatValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  closingText: {
    color: tokens.colors.semantic.danger,
  },
  extendingText: {
    color: tokens.colors.semantic.success,
  },
  targetVitals: {
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[3],
  },
  lockProgress: {
    marginTop: tokens.spacing[3],
  },
  lockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
    backgroundColor: `${tokens.colors.semantic.combat}20`,
    borderRadius: tokens.radius.sm,
    marginTop: tokens.spacing[3],
  },
  lockedText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.combat,
  },
  noTargetText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: tokens.spacing[4],
  },
  weaponsSummary: {
    marginBottom: tokens.spacing[3],
  },
  weaponsReady: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.combat,
  },
  weaponsList: {
    gap: tokens.spacing[2],
  },
  weaponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  weaponName: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  noWeaponsText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
  combatActions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  postureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
  },
  postureLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  postureValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
  },
  escapeInfo: {
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.sm,
  },
  escapeLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
});
