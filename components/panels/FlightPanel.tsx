import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '@/ui/theme';
import { useFlightStore } from '@/stores/flightStore';
import {
  computeFlightMetrics,
  getActivityColor,
  getThrottleColor,
} from '@/lib/flight/metrics';

/**
 * FlightPanel - Contextual Flight Controls
 *
 * Per Cinematic Arcade Flight Model Doctrine §4.2:
 * - Pitch / Roll / Yaw activity meters
 * - Input Response ("Inertia") gauge
 * - Axis Coupling mode indicator (toggle only if permitted)
 *
 * This panel appears in NAV or TAC rail contexts.
 */

interface ActivityMeterProps {
  label: string;
  value: number; // -1 to 1 for directional, 0-1 for absolute
  showDirection?: boolean;
}

/**
 * Activity meter showing axis input level
 * Per doctrine: Pitch/Roll/Yaw activity meters
 */
function ActivityMeter({ label, value, showDirection = true }: ActivityMeterProps) {
  const absValue = Math.abs(value);
  const color = getActivityColor(absValue);
  const isPositive = value >= 0;

  if (showDirection) {
    // Bidirectional meter (centered, extends left or right)
    const leftWidth = isPositive ? 0 : absValue * 50;
    const rightWidth = isPositive ? absValue * 50 : 0;

    return (
      <View style={styles.meterContainer}>
        <Text style={styles.meterLabel}>{label}</Text>
        <View style={styles.bidirectionalMeterOuter}>
          {/* Left side (negative) */}
          <View style={styles.bidirectionalMeterHalf}>
            <View style={styles.bidirectionalMeterTrack}>
              <View
                style={[
                  styles.bidirectionalMeterFillLeft,
                  { width: `${leftWidth}%`, backgroundColor: color },
                ]}
              />
            </View>
          </View>
          {/* Center marker */}
          <View style={styles.bidirectionalMeterCenter} />
          {/* Right side (positive) */}
          <View style={styles.bidirectionalMeterHalf}>
            <View style={styles.bidirectionalMeterTrack}>
              <View
                style={[
                  styles.bidirectionalMeterFillRight,
                  { width: `${rightWidth}%`, backgroundColor: color },
                ]}
              />
            </View>
          </View>
        </View>
        <Text style={[styles.meterValue, { color }]}>
          {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}
        </Text>
      </View>
    );
  }

  // Unidirectional meter (left to right)
  return (
    <View style={styles.meterContainer}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterOuter}>
        <View
          style={[
            styles.meterInner,
            { width: `${absValue * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.meterValue, { color }]}>
        {(absValue * 100).toFixed(0)}%
      </Text>
    </View>
  );
}

/**
 * Inertia gauge showing input response level
 * Per doctrine §4.2: Input Response ("Inertia") gauge
 */
function InertiaGauge() {
  const profile = useFlightStore((s) => s.profile);

  // Inertia level is inverse of input response
  // Low inputResponse = high inertia = sluggish feel
  // High inputResponse = low inertia = responsive feel
  const inertiaLevel = 1 - profile.inputResponse;
  const responseLevel = profile.inputResponse;

  // Color coding: blue for responsive, gold for sluggish
  const color = responseLevel > 0.2
    ? tokens.colors.semantic.navigation
    : tokens.colors.lcars.gold;

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <Text style={styles.gaugeLabel}>INERTIA</Text>
        <Text style={styles.gaugeProfileName}>{profile.name}</Text>
      </View>
      <View style={styles.gaugeBarContainer}>
        <View style={styles.gaugeBarOuter}>
          <View
            style={[
              styles.gaugeBarInner,
              { width: `${inertiaLevel * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabelSmall}>RESP</Text>
          <Text style={styles.gaugeLabelSmall}>SLUG</Text>
        </View>
      </View>
      <Text style={styles.gaugeValue}>
        {inertiaLevel < 0.3 ? 'RESPONSIVE' : inertiaLevel < 0.7 ? 'MODERATE' : 'SLUGGISH'}
      </Text>
    </View>
  );
}

/**
 * Axis coupling toggle
 * Per doctrine P5 & §4.2: Axis Coupling mode indicator
 */
function AxisCouplingToggle() {
  const profile = useFlightStore((s) => s.profile);
  const axisCouplingEnabled = useFlightStore((s) => s.axisCouplingEnabled);
  const toggleAxisCoupling = useFlightStore((s) => s.toggleAxisCoupling);

  // Only show if profile supports coupling
  const supportsCouplng = profile.axisCouplingMode !== 'none';

  if (!supportsCouplng) {
    return (
      <View style={styles.couplingContainer}>
        <Text style={styles.couplingLabel}>AXIS COUPLING</Text>
        <View style={styles.couplingBadgeDisabled}>
          <Text style={styles.couplingBadgeText}>N/A</Text>
        </View>
        <Text style={styles.couplingHint}>Not available for this ship</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.couplingContainer}
      onPress={toggleAxisCoupling}
      activeOpacity={0.7}
    >
      <Text style={styles.couplingLabel}>AXIS COUPLING</Text>
      <View
        style={[
          styles.couplingBadge,
          axisCouplingEnabled
            ? styles.couplingBadgeActive
            : styles.couplingBadgeInactive,
        ]}
      >
        <Text style={styles.couplingBadgeText}>
          {axisCouplingEnabled ? 'ROLL→YAW' : 'OFF'}
        </Text>
      </View>
      <Text style={styles.couplingHint}>
        {axisCouplingEnabled
          ? 'Roll input generates yaw'
          : 'Tap to enable roll-to-yaw'}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Controls lock indicator
 */
function ControlsLockIndicator() {
  const controlsLocked = useFlightStore((s) => s.controlsLocked);
  const lockReason = useFlightStore((s) => s.controlsLockReason);

  if (!controlsLocked) return null;

  return (
    <View style={styles.lockContainer}>
      <View style={styles.lockBadge}>
        <Text style={styles.lockText}>CONTROLS LOCKED</Text>
      </View>
      {lockReason && (
        <Text style={styles.lockReason}>{lockReason}</Text>
      )}
    </View>
  );
}

export function FlightPanel() {
  const flightState = useFlightStore();
  const metrics = computeFlightMetrics(flightState);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FLIGHT CONTROL</Text>
        <Text style={styles.headerProfile}>{flightState.profile.name}</Text>
      </View>

      {/* Controls Lock Warning */}
      <ControlsLockIndicator />

      {/* Attitude Activity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ATTITUDE</Text>
        <View style={styles.metersRow}>
          <ActivityMeter
            label="PITCH"
            value={flightState.attitude.pitch.smoothed}
          />
          <ActivityMeter
            label="ROLL"
            value={flightState.attitude.roll.smoothed}
          />
          <ActivityMeter
            label="YAW"
            value={flightState.attitude.yaw.smoothed}
          />
        </View>
        <View style={styles.activitySummary}>
          <Text style={styles.activityLabel}>ACTIVITY</Text>
          <View style={styles.activityBarOuter}>
            <View
              style={[
                styles.activityBarInner,
                {
                  width: `${metrics.attitudeActivity * 100}%`,
                  backgroundColor: getActivityColor(metrics.attitudeActivity),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Handling Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HANDLING</Text>
        <InertiaGauge />
        <AxisCouplingToggle />
      </View>

      {/* Ship Profile Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFILE: {flightState.profile.name.toUpperCase()}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>MAX SPEED</Text>
            <Text style={styles.statValue}>{flightState.profile.maxSpeed}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ACCEL</Text>
            <Text style={styles.statValue}>{(flightState.profile.acceleration * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>PITCH SPD</Text>
            <Text style={styles.statValue}>{flightState.profile.pitchSpeed}°/s</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ROLL SPD</Text>
            <Text style={styles.statValue}>{flightState.profile.rollSpeed}°/s</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>YAW SPD</Text>
            <Text style={styles.statValue}>{flightState.profile.yawSpeed}°/s</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>RESPONSE</Text>
            <Text style={styles.statValue}>{(flightState.profile.inputResponse * 100).toFixed(0)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.panel,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.navigation,
    textTransform: 'uppercase',
  },
  headerProfile: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    marginBottom: tokens.spacing[2],
    textTransform: 'uppercase',
  },
  // Activity meters
  metersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing[3],
  },
  meterContainer: {
    flex: 1,
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    marginBottom: 4,
  },
  meterOuter: {
    width: '100%',
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterInner: {
    height: '100%',
    borderRadius: 4,
  },
  meterValue: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 4,
  },
  // Bidirectional meter
  bidirectionalMeterOuter: {
    width: '100%',
    height: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidirectionalMeterHalf: {
    flex: 1,
    height: '100%',
  },
  bidirectionalMeterTrack: {
    flex: 1,
    height: '100%',
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bidirectionalMeterFillLeft: {
    position: 'absolute',
    right: 0,
    height: '100%',
    borderRadius: 4,
  },
  bidirectionalMeterFillRight: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: 4,
  },
  bidirectionalMeterCenter: {
    width: 2,
    height: 12,
    backgroundColor: tokens.colors.text.tertiary,
    marginHorizontal: 2,
  },
  // Activity summary
  activitySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing[3],
    gap: tokens.spacing[2],
  },
  activityLabel: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    width: 60,
  },
  activityBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  activityBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  // Inertia gauge
  gaugeContainer: {
    marginBottom: tokens.spacing[3],
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
  },
  gaugeProfileName: {
    fontSize: 10,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  gaugeBarContainer: {
    gap: 4,
  },
  gaugeBarOuter: {
    width: '100%',
    height: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  gaugeBarInner: {
    height: '100%',
    borderRadius: 5,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeLabelSmall: {
    fontSize: 8,
    color: tokens.colors.text.tertiary,
  },
  gaugeValue: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: tokens.spacing[1],
  },
  // Axis coupling
  couplingContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
  },
  couplingLabel: {
    fontSize: 11,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[2],
  },
  couplingBadge: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  couplingBadgeActive: {
    backgroundColor: tokens.colors.semantic.navigation,
  },
  couplingBadgeInactive: {
    backgroundColor: tokens.colors.background.tertiary,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  couplingBadgeDisabled: {
    backgroundColor: tokens.colors.background.tertiary,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.md,
  },
  couplingBadgeText: {
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
  },
  couplingHint: {
    fontSize: 9,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[1],
  },
  // Controls lock
  lockContainer: {
    backgroundColor: tokens.colors.alert.red + '20',
    padding: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.alert.red,
    alignItems: 'center',
  },
  lockBadge: {
    backgroundColor: tokens.colors.alert.red,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },
  lockText: {
    fontSize: 11,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.inverse,
    textTransform: 'uppercase',
  },
  lockReason: {
    fontSize: 10,
    color: tokens.colors.alert.red,
    marginTop: tokens.spacing[1],
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  statItem: {
    width: '30%',
    backgroundColor: tokens.colors.background.tertiary,
    padding: tokens.spacing[2],
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
