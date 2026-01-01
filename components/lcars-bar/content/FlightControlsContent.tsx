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
import { X } from 'lucide-react-native';

/**
 * FlightControlsContent - Flight controls shown when in flight mode
 *
 * Displays: Throttle, Ship Vitals, Attitude Joystick, Yaw Control, Exit Button
 * This overrides normal LCARS bar content when activeViewport === 'flight'
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
      <View style={[styles.throttleTrack, { height: sliderHeight, width: trackWidth }]} {...panResponder.panHandlers}>
        <View style={styles.throttleHotZone} />
        <View style={[styles.throttleFill, { height: `${throttle.current * 100}%`, backgroundColor: isHot ? tokens.colors.command.red : color }]} />
        <View style={[styles.throttleThumb, { top: thumbPosition, backgroundColor: isHot ? tokens.colors.command.red : color }]} />
      </View>
      <Text style={[styles.throttleValue, { color: isHot ? tokens.colors.command.red : color }]}>{Math.round(throttle.current * 100)}%</Text>
      <View style={styles.skContainer}>
        <Text style={styles.skLabel}>SK</Text>
        <Text style={styles.skValue}>{metrics.speedDisplay}</Text>
      </View>
    </View>
  );
}

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
          <View style={styles.vitalBar}>
            <View style={[styles.vitalFill, { height: `${hullPct}%`, backgroundColor: getHullColor() }]} />
          </View>
          <Text style={[styles.vitalLabel, { color: getHullColor() }]}>H</Text>
          <Text style={[styles.vitalValue, { color: getHullColor() }]}>{Math.round(hullPct)}</Text>
        </View>
        <View style={styles.vitalItem}>
          <View style={styles.vitalBar}>
            <View style={[styles.vitalFill, { height: `${shieldPct}%`, backgroundColor: tokens.colors.command.blue }]} />
          </View>
          <Text style={[styles.vitalLabel, { color: tokens.colors.command.blue }]}>S</Text>
          <Text style={[styles.vitalValue, { color: tokens.colors.command.blue }]}>{Math.round(shieldPct)}</Text>
        </View>
        <View style={styles.vitalItem}>
          <View style={styles.vitalBar}>
            <View style={[styles.vitalFill, { height: `${fuelPct}%`, backgroundColor: tokens.colors.operations.orange }]} />
          </View>
          <Text style={[styles.vitalLabel, { color: tokens.colors.operations.orange }]}>F</Text>
          <Text style={[styles.vitalValue, { color: tokens.colors.operations.orange }]}>{Math.round(fuelPct)}</Text>
        </View>
      </View>
    </View>
  );
}

function AttitudeSection() {
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
    <View style={styles.attitudeSection}>
      <Text style={styles.controlLabel}>ATTITUDE</Text>
      <View style={[styles.attitudeStick, { width: stickSize, height: stickSize }]} {...panResponder.panHandlers}>
        <View style={styles.attitudeGrid}>
          <View style={styles.attitudeHLine} />
          <View style={styles.attitudeVLine} />
        </View>
        <View style={[styles.attitudeThumb, { width: thumbSize, height: thumbSize, left: thumbX, top: thumbY }]} />
      </View>
      <Text style={styles.attitudeReadout}>
        P:{(attitude.pitch.smoothed * 100).toFixed(0).padStart(3, ' ')} R:{(attitude.roll.smoothed * 100).toFixed(0).padStart(3, ' ')}
      </Text>
    </View>
  );
}

function YawSection() {
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
    <View style={styles.yawSection}>
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

function ExitFlightSection() {
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);
  const setActiveRail = useCockpitStore((s) => s.setActiveRail);

  const handleExit = () => {
    setActiveViewport('sector');
    setActiveRail('NAV');
  };

  return (
    <View style={styles.exitSection}>
      <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
        <X size={20} color={tokens.colors.text.inverse} />
      </TouchableOpacity>
      <Text style={styles.exitLabel}>EXIT</Text>
    </View>
  );
}

export function FlightControlsContent() {
  return (
    <>
      <View style={styles.controlSection}>
        <ThrottleSpeedSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.controlSection}>
        <ShipVitalsSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.controlSectionWide}>
        <AttitudeSection />
        <YawSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.controlSection}>
        <ExitFlightSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  controlSection: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  controlSectionWide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  },
  throttleTrack: {
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
  throttleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 12,
  },
  throttleThumb: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 12,
    borderRadius: 6,
  },
  throttleValue: {
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
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalBar: {
    width: 14,
    height: 130,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  vitalFill: {
    width: '100%',
    borderRadius: 6,
  },
  vitalLabel: {
    fontSize: 7,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 3,
  },
  vitalValue: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 1,
  },
  // Attitude
  attitudeSection: {
    alignItems: 'center',
  },
  attitudeStick: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
  },
  attitudeGrid: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attitudeHLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.4,
  },
  attitudeVLine: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.4,
  },
  attitudeThumb: {
    position: 'absolute',
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: tokens.colors.text.primary,
  },
  attitudeReadout: {
    fontSize: 8,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.tertiary,
    marginTop: 4,
  },
  // YAW
  yawSection: {
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
  // Exit
  exitSection: {
    alignItems: 'center',
    gap: 4,
  },
  exitButton: {
    width: 40,
    height: 40,
    backgroundColor: tokens.colors.command.red,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.command.red,
    letterSpacing: 1,
  },
});
