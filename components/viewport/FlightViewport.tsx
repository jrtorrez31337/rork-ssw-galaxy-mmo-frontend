import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { tokens } from '@/ui/theme';
import { useFlightStore } from '@/stores/flightStore';
import { ShipVisualization3D } from '@/components/flight/ShipVisualization3D';
import { computeFlightMetrics, getSpeedStatus, getThrottleColor } from '@/lib/flight/metrics';
import { useShipStatus } from '@/hooks/useShipStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * FlightViewport - Dedicated flight mode viewport
 *
 * LCARS-style unified interface with:
 * - Ship visualization in main viewport
 * - All controls integrated into bottom LCARS bar:
 *   - Throttle (vertical slider)
 *   - Ship vitals (Hull/Shield/Fuel)
 *   - Attitude joystick (compact)
 *   - YAW control (horizontal)
 *   - Flight profile + Exit button
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTROL_BAR_HEIGHT = 240;

/**
 * Throttle + Speed section - throttle slider with SK readout below
 */
function ThrottleSpeedSection() {
  const throttle = useFlightStore((s) => s.throttle);
  const flightState = useFlightStore();
  const metrics = computeFlightMetrics(flightState);
  const sliderHeight = 130;
  const thumbSize = 14;
  const trackWidth = 28;
  const startThrottleRef = useRef(throttle.current);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onStartShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onPanResponderGrant: () => {
        startThrottleRef.current = useFlightStore.getState().throttle.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaThrottle = -gestureState.dy / sliderHeight;
        const newThrottle = Math.max(0, Math.min(1, startThrottleRef.current + deltaThrottle));
        useFlightStore.getState().setThrottle(newThrottle);
      },
    })
  ).current;

  const thumbPosition = (1 - throttle.current) * (sliderHeight - thumbSize);
  const color = getThrottleColor(throttle.current);
  const isHot = throttle.current > 0.85;

  return (
    <View style={styles.throttleSpeedSection}>
      <Text style={styles.controlLabel}>THR</Text>
      <View style={[styles.throttleTrackCompact, { height: sliderHeight, width: trackWidth }]} {...panResponder.panHandlers}>
        {/* Red "hot" zone at top */}
        <View style={styles.throttleHotZone} />
        <View style={[styles.throttleFillCompact, { height: `${throttle.current * 100}%`, backgroundColor: isHot ? tokens.colors.command.red : color }]} />
        <View style={[styles.throttleThumbCompact, { top: thumbPosition, backgroundColor: isHot ? tokens.colors.command.red : color }]} />
      </View>
      <Text style={[styles.throttleValueCompact, { color: isHot ? tokens.colors.command.red : color }]}>{Math.round(throttle.current * 100)}%</Text>
      <View style={styles.skContainer}>
        <Text style={styles.skLabel}>SK</Text>
        <Text style={styles.skValue}>{metrics.speedDisplay}</Text>
      </View>
    </View>
  );
}

/**
 * Ship vitals - bars with labels and percentage numbers
 */
function ShipVitalsSection() {
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

  const hullPct = shipStatus?.hull.percentage || 0;
  const shieldPct = shipStatus?.shield.percentage || 0;
  const fuelPct = shipStatus?.fuel.percentage || 0;

  const getHullColor = () => {
    if (hullPct < 25) return tokens.colors.alert.critical;
    if (hullPct < 75) return tokens.colors.alert.warning;
    return tokens.colors.status.online;
  };

  return (
    <View style={styles.vitalsSection}>
      <Text style={styles.controlLabel}>VITALS</Text>
      <View style={styles.vitalsRow}>
        <View style={styles.vitalItem}>
          <View style={styles.vitalBarVertical}>
            <View style={[styles.vitalBarFillVertical, { height: `${hullPct}%`, backgroundColor: getHullColor() }]} />
          </View>
          <Text style={[styles.vitalLabelBelow, { color: getHullColor() }]}>H</Text>
          <Text style={[styles.vitalValueBelow, { color: getHullColor() }]}>{Math.round(hullPct)}</Text>
        </View>
        <View style={styles.vitalItem}>
          <View style={styles.vitalBarVertical}>
            <View style={[styles.vitalBarFillVertical, { height: `${shieldPct}%`, backgroundColor: tokens.colors.command.blue }]} />
          </View>
          <Text style={[styles.vitalLabelBelow, { color: tokens.colors.command.blue }]}>S</Text>
          <Text style={[styles.vitalValueBelow, { color: tokens.colors.command.blue }]}>{Math.round(shieldPct)}</Text>
        </View>
        <View style={styles.vitalItem}>
          <View style={styles.vitalBarVertical}>
            <View style={[styles.vitalBarFillVertical, { height: `${fuelPct}%`, backgroundColor: tokens.colors.operations.orange }]} />
          </View>
          <Text style={[styles.vitalLabelBelow, { color: tokens.colors.operations.orange }]}>F</Text>
          <Text style={[styles.vitalValueBelow, { color: tokens.colors.operations.orange }]}>{Math.round(fuelPct)}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Compact Attitude joystick for LCARS bar - controls pitch/roll only
 */
function AttitudeCompact() {
  const attitude = useFlightStore((s) => s.attitude);
  const stickSize = 100;
  const thumbSize = 28;
  const maxOffset = (stickSize - thumbSize) / 2;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onStartShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onPanResponderMove: (_, gestureState) => {
        const store = useFlightStore.getState();
        const roll = Math.max(-1, Math.min(1, gestureState.dx / maxOffset));
        const pitch = Math.max(-1, Math.min(1, -gestureState.dy / maxOffset));
        store.setRoll(roll);
        store.setPitch(pitch);
        // Yaw is independent - controlled only by YawControl
      },
      onPanResponderRelease: () => {
        const store = useFlightStore.getState();
        store.setRoll(0);
        store.setPitch(0);
        // Don't reset yaw - it's controlled independently
      },
      onPanResponderTerminate: () => {
        const store = useFlightStore.getState();
        store.setRoll(0);
        store.setPitch(0);
        // Don't reset yaw - it's controlled independently
      },
    })
  ).current;

  const thumbX = stickSize / 2 - thumbSize / 2 + attitude.roll.smoothed * maxOffset;
  const thumbY = stickSize / 2 - thumbSize / 2 - attitude.pitch.smoothed * maxOffset;

  return (
    <View style={styles.attitudeCompact}>
      <Text style={styles.controlLabel}>ATTITUDE</Text>
      <View style={[styles.attitudeStickCompact, { width: stickSize, height: stickSize }]} {...panResponder.panHandlers}>
        <View style={styles.attitudeGridCompact}>
          <View style={styles.attitudeHLineCompact} />
          <View style={styles.attitudeVLineCompact} />
        </View>
        <View style={[styles.attitudeThumbCompact, { width: thumbSize, height: thumbSize, left: thumbX, top: thumbY }]} />
      </View>
      <Text style={styles.attitudeReadoutCompact}>
        P:{(attitude.pitch.smoothed * 100).toFixed(0).padStart(3, ' ')} R:{(attitude.roll.smoothed * 100).toFixed(0).padStart(3, ' ')}
      </Text>
    </View>
  );
}

/**
 * Horizontal YAW control
 */
function YawControl() {
  const attitude = useFlightStore((s) => s.attitude);
  const sliderWidth = 140;
  const sliderHeight = 28;
  const thumbWidth = 32;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onStartShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onPanResponderMove: (_, gestureState) => {
        const yaw = Math.max(-1, Math.min(1, gestureState.dx / (sliderWidth / 2)));
        useFlightStore.getState().setYaw(yaw);
      },
      onPanResponderRelease: () => {
        useFlightStore.getState().setYaw(0);
      },
      onPanResponderTerminate: () => {
        useFlightStore.getState().setYaw(0);
      },
    })
  ).current;

  const thumbOffset = attitude.yaw.smoothed * (sliderWidth / 2 - thumbWidth / 2);

  return (
    <View style={styles.yawContainer}>
      <Text style={styles.controlLabel}>YAW</Text>
      <View style={styles.yawRow}>
        <Text style={styles.yawArrow}>◄</Text>
        <View style={[styles.yawTrack, { width: sliderWidth, height: sliderHeight }]} {...panResponder.panHandlers}>
          <View style={styles.yawCenter} />
          <View style={[styles.yawThumb, { left: sliderWidth / 2 - thumbWidth / 2 + thumbOffset, width: thumbWidth }]} />
        </View>
        <Text style={styles.yawArrow}>►</Text>
      </View>
    </View>
  );
}

/**
 * Exit button section - compact X button
 */
function ExitSection({ onExitFlight }: { onExitFlight?: () => void }) {
  return (
    <View style={styles.exitSection}>
      {onExitFlight && (
        <TouchableOpacity style={styles.exitButton} onPress={onExitFlight}>
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Combined Attitude + YAW control (stacked vertically)
 */
function AttitudeYawSection() {
  return (
    <View style={styles.attitudeYawSection}>
      <AttitudeCompact />
      <YawControl />
    </View>
  );
}

/**
 * Unified LCARS Control Bar - Contains ALL flight controls
 * Exported for rendering at CockpitShell level for full-width display
 */
export function FlightLCARSBar({ onExitFlight }: { onExitFlight?: () => void }) {
  return (
    <View style={styles.controlBar}>
      {/* Throttle + Speed */}
      <View style={styles.controlSectionThrottle}>
        <ThrottleSpeedSection />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Vitals with numbers */}
      <View style={styles.controlSectionVitals}>
        <ShipVitalsSection />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Attitude + YAW stacked */}
      <View style={styles.controlSectionWide}>
        <AttitudeYawSection />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Exit */}
      <View style={styles.controlSectionExit}>
        <ExitSection onExitFlight={onExitFlight} />
      </View>
    </View>
  );
}

/**
 * Speed HUD overlay - Shows speed at top of viewport
 */
function SpeedHUD() {
  const flightState = useFlightStore();
  const metrics = computeFlightMetrics(flightState);
  const speedStatus = getSpeedStatus(metrics.speedPercent);

  return (
    <View style={styles.speedHUD} pointerEvents="none">
      <Text style={styles.speedValue}>{metrics.speedDisplay}</Text>
      <Text style={styles.speedLabel}>{speedStatus}</Text>
      {flightState.controlsLocked && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedText}>CONTROLS LOCKED</Text>
        </View>
      )}
    </View>
  );
}

interface FlightViewportProps {
  onExitFlight?: () => void;
}

export function FlightViewport({ onExitFlight }: FlightViewportProps) {
  const profile = useFlightStore((s) => s.profile);

  // Map profile ID to ship type for visualization
  const shipType: 'scout' | 'fighter' | 'trader' | 'explorer' =
    ['scout', 'fighter', 'trader', 'explorer'].includes(profile.id)
      ? (profile.id as 'scout' | 'fighter' | 'trader' | 'explorer')
      : 'scout';

  // Calculate ship area height (full height minus control bar)
  const shipAreaHeight = SCREEN_HEIGHT - CONTROL_BAR_HEIGHT - 56; // 56 for header

  return (
    <View style={styles.container}>
      {/* Ship Visualization - Takes all space above control bar */}
      <View style={styles.shipArea}>
        <ShipVisualization3D
          shipType={shipType}
          size={{ width: SCREEN_WIDTH - 80, height: shipAreaHeight * 0.7 }}
        />
      </View>

      {/* LCARS Control Bar rendered at CockpitShell level for full width */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050810',
  },
  // Ship visualization area
  shipArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: CONTROL_BAR_HEIGHT,
  },
  // Speed HUD at top
  speedHUD: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  speedValue: {
    fontSize: 28,
    fontWeight: '700',
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  speedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockedBanner: {
    marginTop: 8,
    backgroundColor: tokens.colors.alert.red + '40',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.alert.red,
  },
  // LCARS Control Bar
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CONTROL_BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: tokens.colors.console.deepSpace,
    borderTopWidth: 3,
    borderTopColor: tokens.colors.command.blue,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  controlSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  controlSectionThrottle: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  controlSectionVitals: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSectionWide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  controlSectionNarrow: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSectionExit: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: tokens.colors.border.default,
    marginVertical: 8,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  // Throttle + Speed section
  throttleSpeedSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Throttle compact
  throttleCompact: {
    alignItems: 'center',
  },
  throttleTrackCompact: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
    overflow: 'hidden',
  },
  throttleHotZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: tokens.colors.command.red + '40',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  throttleFillCompact: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 12,
  },
  throttleThumbCompact: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 12,
    borderRadius: 6,
  },
  throttleValueCompact: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 3,
  },
  // Station Keeping (SK) compact display
  skContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  skLabel: {
    fontSize: 6,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  skValue: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  // Vitals - vertical bars with labels below
  vitalsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalsSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalBarVertical: {
    width: 14,
    height: 130,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  vitalBarFillVertical: {
    width: '100%',
    borderRadius: 6,
  },
  vitalLabelBelow: {
    fontSize: 7,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 3,
  },
  vitalValueBelow: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 1,
  },
  // Attitude compact
  attitudeCompact: {
    alignItems: 'center',
  },
  attitudeStickCompact: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
  },
  attitudeGridCompact: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attitudeHLineCompact: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.4,
  },
  attitudeVLineCompact: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.4,
  },
  attitudeThumbCompact: {
    position: 'absolute',
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.colors.text.primary,
  },
  attitudeReadoutCompact: {
    fontSize: 8,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  // YAW
  yawContainer: {
    alignItems: 'center',
  },
  yawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yawArrow: {
    fontSize: 14,
    color: tokens.colors.semantic.navigation,
    fontWeight: '700',
  },
  yawTrack: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
  },
  yawCenter: {
    position: 'absolute',
    left: '50%',
    top: 4,
    bottom: 4,
    width: 2,
    marginLeft: -1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.5,
  },
  yawThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 10,
  },
  // Attitude + YAW stacked section
  attitudeYawSection: {
    alignItems: 'center',
    gap: 8,
  },
  // Exit section
  exitSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButton: {
    width: 32,
    height: 32,
    backgroundColor: tokens.colors.command.red,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text.inverse,
  },
});
