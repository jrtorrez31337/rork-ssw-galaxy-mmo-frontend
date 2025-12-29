import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Navigation, MapPin, Fuel, Clock, AlertTriangle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Panel, Gauge, StatusChip, RailButton } from '@/ui/components';
import { useBridgeState } from '@/hooks/useBridgeState';
import { useTravelStateStore } from '@/stores/travelStateStore';
import { useLocationStore } from '@/stores/locationStore';

/**
 * NavigationPanel - NAV Rail Content
 *
 * Per UI/UX Doctrine:
 * - Destination selector
 * - Route planner
 * - Fuel calculator
 * - Hyperspace status
 */

export function NavigationPanel() {
  const { glance, navigation, situation } = useBridgeState();

  const travelMode = useTravelStateStore((s) => s.mode);
  const hyperspacePhase = useTravelStateStore((s) => s.hyperspace.phase);
  const transitProgress = useTravelStateStore((s) => s.hyperspace.transitProgress);
  const transitTimeRemaining = useTravelStateStore((s) => s.hyperspace.transitTimeRemaining);
  const sublight = useTravelStateStore((s) => s.sublight);
  const canJump = useTravelStateStore((s) => s.canInitiateJump);
  const jumpBlockReason = useTravelStateStore((s) => s.jumpBlockReason);

  const isDocked = useLocationStore((s) => s.docked.isDocked);
  const dockedStation = useLocationStore((s) => s.docked.stationName);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current Status */}
      <Panel variant="navigation" title="STATUS" style={styles.panel}>
        <View style={styles.statusRow}>
          <StatusChip
            label="MODE"
            value={isDocked ? 'DOCKED' : travelMode.toUpperCase()}
            status={isDocked ? 'info' : travelMode === 'hyperspace' ? 'warning' : 'online'}
          />
          <StatusChip
            label="FUEL"
            value={`${Math.round(glance.fuel)}%`}
            status={glance.fuelCritical ? 'danger' : glance.fuel < 20 ? 'warning' : 'online'}
          />
        </View>

        {isDocked && (
          <View style={styles.dockedInfo}>
            <MapPin size={14} color={tokens.colors.semantic.navigation} />
            <Text style={styles.dockedText}>Docked at {dockedStation}</Text>
          </View>
        )}
      </Panel>

      {/* Hyperspace Status - when in transit */}
      {situation.isInTransit && travelMode === 'hyperspace' && (
        <Panel variant="navigation" title="HYPERSPACE TRANSIT" style={styles.panel}>
          <Gauge
            label="PROGRESS"
            value={transitProgress}
            size="large"
            color={tokens.colors.semantic.navigation}
          />
          <View style={styles.etaRow}>
            <Clock size={14} color={tokens.colors.text.secondary} />
            <Text style={styles.etaText}>
              ETA: {formatTime(transitTimeRemaining)}
            </Text>
          </View>
          <RailButton
            label="DROP OUT"
            variant="combat"
            onPress={() => {
              console.log('[NAV] Emergency drop requested');
            }}
            compact
          />
        </Panel>
      )}

      {/* Sublight Status - when moving in-system */}
      {situation.isInTransit && travelMode === 'sublight' && (
        <Panel variant="navigation" title="SUBLIGHT TRAVEL" style={styles.panel}>
          <View style={styles.sublightInfo}>
            <Text style={styles.sublightLabel}>DESTINATION</Text>
            <Text style={styles.sublightValue}>
              {sublight.destination?.name || 'Unknown'}
            </Text>
          </View>
          <Gauge
            label="DISTANCE"
            value={100 - (sublight.distanceRemaining / (sublight.destination?.distance || 1)) * 100}
            size="medium"
            color={tokens.colors.semantic.navigation}
          />
          <Text style={styles.etaText}>
            {formatTime(sublight.timeToArrival)} remaining
          </Text>
        </Panel>
      )}

      {/* Jump Controls - when not in transit */}
      {!situation.isInTransit && !isDocked && (
        <Panel variant="navigation" title="HYPERSPACE" style={styles.panel}>
          {canJump ? (
            <>
              <View style={styles.jumpReady}>
                <StatusChip label="DRIVE" value="READY" status="online" />
              </View>
              <Text style={styles.jumpHint}>
                Select destination from sector map to plot course
              </Text>
            </>
          ) : (
            <View style={styles.jumpBlocked}>
              <AlertTriangle size={16} color={tokens.colors.semantic.warning} />
              <Text style={styles.jumpBlockedText}>
                {jumpBlockReason || 'Cannot initiate jump'}
              </Text>
            </View>
          )}
        </Panel>
      )}

      {/* Docked Controls */}
      {isDocked && (
        <Panel variant="navigation" title="DOCKING" style={styles.panel}>
          <RailButton
            label="UNDOCK"
            variant="navigation"
            onPress={() => {
              console.log('[NAV] Undock requested');
            }}
          />
        </Panel>
      )}

      {/* Quick Navigation */}
      <Panel variant="navigation" title="QUICK NAV" style={styles.panel}>
        <View style={styles.quickNavGrid}>
          <TouchableOpacity style={styles.quickNavButton}>
            <MapPin size={20} color={tokens.colors.semantic.navigation} />
            <Text style={styles.quickNavLabel}>SECTOR MAP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavButton}>
            <Navigation size={20} color={tokens.colors.semantic.navigation} />
            <Text style={styles.quickNavLabel}>SYSTEM MAP</Text>
          </TouchableOpacity>
        </View>
      </Panel>
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
  statusRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  dockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginTop: tokens.spacing[3],
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.sm,
  },
  dockedText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginTop: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  etaText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  sublightInfo: {
    marginBottom: tokens.spacing[3],
  },
  sublightLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  sublightValue: {
    fontSize: tokens.typography.fontSize.md,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  jumpReady: {
    marginBottom: tokens.spacing[3],
  },
  jumpHint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
  jumpBlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[3],
    backgroundColor: `${tokens.colors.semantic.warning}15`,
    borderRadius: tokens.radius.sm,
  },
  jumpBlockedText: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.semantic.warning,
  },
  quickNavGrid: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  quickNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  quickNavLabel: {
    marginTop: tokens.spacing[2],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
  },
});
