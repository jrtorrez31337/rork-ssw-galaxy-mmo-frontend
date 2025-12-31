import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { tokens } from '@/ui/theme';
import { useFlightStore } from '@/stores/flightStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { computeFlightMetrics, getThrottleColor } from '@/lib/flight/metrics';
import { useShipStatus } from '@/hooks/useShipStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { Rocket } from 'lucide-react-native';

/**
 * FlightLCARSContent - Flight controls for the unified LCARS bar
 *
 * Shows different content based on activeViewport:
 * - In flight mode: Full flight controls (throttle, vitals, attitude, yaw)
 * - Not in flight mode: "Enter Flight Mode" button
 */

/**
 * Throttle + Speed section
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
 * Ship vitals section
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
 * Attitude joystick
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
      },
      onPanResponderRelease: () => {
        const store = useFlightStore.getState();
        store.setRoll(0);
        store.setPitch(0);
      },
      onPanResponderTerminate: () => {
        const store = useFlightStore.getState();
        store.setRoll(0);
        store.setPitch(0);
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
 * YAW control
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
 * Attitude + YAW stacked
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
 * Exit flight mode button
 */
function ExitFlightSection() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);

  const handleExit = () => {
    setActiveViewport('sector');
  };

  return (
    <View style={styles.exitSection}>
      <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
        <Text style={styles.exitButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Enter flight mode button (shown when not in flight mode)
 */
function EnterFlightSection() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);

  const handleEnter = () => {
    setActiveViewport('flight');
  };

  return (
    <View style={styles.enterFlightContainer}>
      <TouchableOpacity style={styles.enterFlightButton} onPress={handleEnter}>
        <Rocket size={32} color={tokens.colors.lcars.sky} />
        <Text style={styles.enterFlightText}>ENTER FLIGHT MODE</Text>
      </TouchableOpacity>
      <Text style={styles.enterFlightHint}>Take manual control of your ship</Text>
    </View>
  );
}

/**
 * Main FlightLCARSContent component
 */
export function FlightLCARSContent() {
  const activeViewport = useCockpitStore((s) => s.activeViewport);
  const isInFlightMode = activeViewport === 'flight';

  if (!isInFlightMode) {
    return <EnterFlightSection />;
  }

  return (
    <>
      {/* Throttle + Speed */}
      <View style={styles.controlSectionThrottle}>
        <ThrottleSpeedSection />
      </View>

      <View style={styles.divider} />

      {/* Vitals */}
      <View style={styles.controlSectionVitals}>
        <ShipVitalsSection />
      </View>

      <View style={styles.divider} />

      {/* Attitude + YAW */}
      <View style={styles.controlSectionWide}>
        <AttitudeYawSection />
      </View>

      <View style={styles.divider} />

      {/* Exit */}
      <View style={styles.controlSectionExit}>
        <ExitFlightSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Section containers
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
  // Throttle
  throttleSpeedSection: {
    alignItems: 'center',
    justifyContent: 'center',
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
  // Vitals
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
  // Attitude
  attitudeCompact: {
    alignItems: 'center',
  },
  attitudeStickCompact: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 50,
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
    borderRadius: 14,
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
  attitudeYawSection: {
    alignItems: 'center',
    gap: 8,
  },
  // Exit
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
  // Enter flight mode
  enterFlightContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterFlightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.colors.background.tertiary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.lcars.sky,
  },
  enterFlightText: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.lcars.sky,
    letterSpacing: 1,
  },
  enterFlightHint: {
    fontSize: 11,
    color: tokens.colors.text.muted,
    marginTop: 8,
  },
});
