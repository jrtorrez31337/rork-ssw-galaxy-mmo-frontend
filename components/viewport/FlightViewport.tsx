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
 * Shows:
 * - Animated ship silhouette responding to attitude (pitch/roll/yaw)
 * - Parallax starfield background
 * - Flight control inputs (throttle slider, attitude joystick)
 * - HUD overlay with flight data
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Throttle slider control
 */
function ThrottleControl() {
  const throttle = useFlightStore((s) => s.throttle);
  const setThrottle = useFlightStore((s) => s.setThrottle);

  const sliderHeight = 240;
  const thumbSize = 32;
  const trackWidth = 56;

  // Track starting throttle on touch
  const startThrottleRef = useRef(throttle.current);

  // Use getState() inside callbacks to avoid stale closures on iOS
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
        // Use relative movement (dy) instead of absolute position
        const deltaThrottle = -gestureState.dy / sliderHeight;
        const newThrottle = Math.max(0, Math.min(1, startThrottleRef.current + deltaThrottle));
        useFlightStore.getState().setThrottle(newThrottle);
      },
      onPanResponderRelease: () => {
        // Throttle maintains position on release (no reset)
      },
      onPanResponderTerminate: () => {
        // Throttle maintains position on terminate (no reset)
      },
    })
  ).current;

  const thumbPosition = (1 - throttle.current) * (sliderHeight - thumbSize);
  const color = getThrottleColor(throttle.current);

  return (
    <View style={styles.throttleContainer}>
      <Text style={styles.throttleLabel}>THR</Text>
      <View style={[styles.throttleTrack, { height: sliderHeight, width: trackWidth }]} {...panResponder.panHandlers}>
        <View
          style={[
            styles.throttleFill,
            {
              height: `${throttle.current * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
        <View
          style={[
            styles.throttleThumb,
            {
              top: thumbPosition,
              height: thumbSize,
              backgroundColor: color,
            },
          ]}
        />
        {[0, 25, 50, 75, 100].map((tick) => (
          <View
            key={tick}
            style={[
              styles.throttleTick,
              { bottom: `${tick}%` },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.throttleValue, { color }]}>
        {Math.round(throttle.current * 100)}%
      </Text>
    </View>
  );
}

/**
 * Attitude control stick (virtual joystick)
 */
function AttitudeControl() {
  const attitude = useFlightStore((s) => s.attitude);
  const axisCouplingEnabled = useFlightStore((s) => s.axisCouplingEnabled);

  const stickSize = 180;
  const thumbSize = 50;
  const maxOffset = (stickSize - thumbSize) / 2;

  // Use getState() inside callbacks to avoid stale closures on iOS
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onStartShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponder: () => !useFlightStore.getState().controlsLocked,
      onMoveShouldSetPanResponderCapture: () => !useFlightStore.getState().controlsLocked,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const store = useFlightStore.getState();
        const offsetX = gestureState.dx;
        const offsetY = gestureState.dy;

        const roll = Math.max(-1, Math.min(1, offsetX / maxOffset));
        const pitch = Math.max(-1, Math.min(1, -offsetY / maxOffset));

        store.setRoll(roll);
        store.setPitch(pitch);

        if (!store.axisCouplingEnabled) {
          store.setYaw(roll * 0.5);
        }
      },
      onPanResponderRelease: () => {
        const store = useFlightStore.getState();
        store.setRoll(0);
        store.setPitch(0);
        store.setYaw(0);
      },
      onPanResponderTerminate: () => {
        // Also reset on terminate (iOS can terminate gestures)
        const store = useFlightStore.getState();
        store.setRoll(0);
        store.setPitch(0);
        store.setYaw(0);
      },
    })
  ).current;

  const thumbX = stickSize / 2 - thumbSize / 2 + attitude.roll.smoothed * maxOffset;
  const thumbY = stickSize / 2 - thumbSize / 2 - attitude.pitch.smoothed * maxOffset;

  return (
    <View style={styles.attitudeContainer}>
      <Text style={styles.attitudeLabel}>ATTITUDE</Text>
      <View
        style={[styles.attitudeStick, { width: stickSize, height: stickSize }]}
        {...panResponder.panHandlers}
      >
        {/* Grid lines */}
        <View style={styles.attitudeGrid}>
          <View style={styles.attitudeHLine} />
          <View style={styles.attitudeVLine} />
          <View style={styles.attitudeCircle} />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.attitudeThumb,
            {
              width: thumbSize,
              height: thumbSize,
              left: thumbX,
              top: thumbY,
            },
          ]}
        />
      </View>
      <View style={styles.attitudeReadout}>
        <Text style={styles.attitudeReadoutText}>
          P:{(attitude.pitch.smoothed * 100).toFixed(0).padStart(4, ' ')}
        </Text>
        <Text style={styles.attitudeReadoutText}>
          R:{(attitude.roll.smoothed * 100).toFixed(0).padStart(4, ' ')}
        </Text>
      </View>
    </View>
  );
}

/**
 * Yaw pedal control - Horizontal version for bottom control bar
 */
function YawControlHorizontal() {
  const attitude = useFlightStore((s) => s.attitude);
  const axisCouplingEnabled = useFlightStore((s) => s.axisCouplingEnabled);

  const sliderWidth = 200;
  const sliderHeight = 32;

  // Use getState() inside callbacks to avoid stale closures on iOS
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

  const thumbWidth = 36;
  const thumbOffset = attitude.yaw.smoothed * (sliderWidth / 2 - thumbWidth / 2);

  return (
    <View style={styles.yawHorizontalContainer}>
      <Text style={styles.yawHorizontalLabel}>◄</Text>
      <View style={[styles.yawHorizontalTrack, { width: sliderWidth, height: sliderHeight }]} {...panResponder.panHandlers}>
        <View style={styles.yawHorizontalCenter} />
        {/* Tick marks */}
        <View style={[styles.yawTick, { left: '25%' }]} />
        <View style={[styles.yawTick, { left: '75%' }]} />
        <View
          style={[
            styles.yawHorizontalThumb,
            {
              left: sliderWidth / 2 - thumbWidth / 2 + thumbOffset,
              width: thumbWidth,
            },
          ]}
        />
      </View>
      <Text style={styles.yawHorizontalLabel}>►</Text>
      {axisCouplingEnabled && (
        <Text style={styles.yawCoupledBadge}>COUPLED</Text>
      )}
    </View>
  );
}

/**
 * Ship vitals mini-gauges for flight control bar
 */
function ShipVitalsCompact() {
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
    <View style={styles.vitalsContainer}>
      <View style={styles.vitalRow}>
        <Text style={styles.vitalLabel}>HUL</Text>
        <View style={styles.vitalBarContainer}>
          <View style={[styles.vitalBarFill, { width: `${hullPct}%`, backgroundColor: getHullColor() }]} />
        </View>
        <Text style={[styles.vitalValue, { color: getHullColor() }]}>{Math.floor(hullPct)}</Text>
      </View>
      <View style={styles.vitalRow}>
        <Text style={styles.vitalLabel}>SHD</Text>
        <View style={styles.vitalBarContainer}>
          <View style={[styles.vitalBarFill, { width: `${shieldPct}%`, backgroundColor: tokens.colors.command.blue }]} />
        </View>
        <Text style={[styles.vitalValue, { color: tokens.colors.command.blue }]}>{Math.floor(shieldPct)}</Text>
      </View>
      <View style={styles.vitalRow}>
        <Text style={styles.vitalLabel}>FUL</Text>
        <View style={styles.vitalBarContainer}>
          <View style={[styles.vitalBarFill, { width: `${fuelPct}%`, backgroundColor: tokens.colors.operations.orange }]} />
        </View>
        <Text style={[styles.vitalValue, { color: tokens.colors.operations.orange }]}>{Math.floor(fuelPct)}</Text>
      </View>
    </View>
  );
}

/**
 * Flight profile and readout display
 */
function FlightProfileDisplay() {
  const profile = useFlightStore((s) => s.profile);
  const attitude = useFlightStore((s) => s.attitude);
  const axisCouplingEnabled = useFlightStore((s) => s.axisCouplingEnabled);

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.profileName}>{profile.name.toUpperCase()}</Text>
      {axisCouplingEnabled && (
        <Text style={styles.profileCoupling}>ROLL→YAW</Text>
      )}
      <View style={styles.attitudeReadoutCompact}>
        <Text style={styles.readoutText}>
          P:{(attitude.pitch.smoothed * 100).toFixed(0).padStart(4, ' ')}
        </Text>
        <Text style={styles.readoutText}>
          R:{(attitude.roll.smoothed * 100).toFixed(0).padStart(4, ' ')}
        </Text>
      </View>
    </View>
  );
}

/**
 * Integrated LCARS-style flight control bar
 */
function FlightControlBar() {
  return (
    <View style={styles.controlBar}>
      {/* Left: Ship Vitals */}
      <View style={styles.controlBarLeft}>
        <ShipVitalsCompact />
      </View>

      {/* Center: YAW Control */}
      <View style={styles.controlBarCenter}>
        <Text style={styles.controlBarLabel}>YAW</Text>
        <YawControlHorizontal />
      </View>

      {/* Right: Flight Profile */}
      <View style={styles.controlBarRight}>
        <FlightProfileDisplay />
      </View>
    </View>
  );
}

/**
 * Flight HUD overlay - Speed display at top only
 */
function FlightHUD() {
  const flightState = useFlightStore();
  const metrics = computeFlightMetrics(flightState);
  const speedStatus = getSpeedStatus(metrics.speedPercent);

  return (
    <View style={styles.hud} pointerEvents="none">
      <View style={styles.hudTop}>
        <Text style={styles.hudSpeedValue}>{metrics.speedDisplay}</Text>
        <Text style={styles.hudSpeedLabel}>{speedStatus}</Text>
      </View>

      {flightState.controlsLocked && (
        <View style={styles.hudLocked}>
          <Text style={styles.hudLockedText}>CONTROLS LOCKED</Text>
          <Text style={styles.hudLockedReason}>{flightState.controlsLockReason}</Text>
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
  const activeShipId = useFlightStore((s) => s.activeShipId);

  // Map profile ID to ship type for visualization
  const shipType: 'scout' | 'fighter' | 'trader' | 'explorer' =
    ['scout', 'fighter', 'trader', 'explorer'].includes(profile.id)
      ? profile.id as 'scout' | 'fighter' | 'trader' | 'explorer'
      : 'scout';

  return (
    <View style={styles.container}>
      {/* Ship visualization with integrated starfield */}
      <View style={styles.shipContainer3D}>
        <ShipVisualization3D
          shipType={shipType}
          size={{ width: SCREEN_WIDTH - 140, height: SCREEN_HEIGHT * 0.55 }}
        />
      </View>

      {/* Flight HUD overlay */}
      <FlightHUD />

      {/* Left side - Throttle */}
      <View style={styles.leftControls}>
        <ThrottleControl />
      </View>

      {/* Right side - Attitude only (YAW moved to bottom bar) */}
      <View style={styles.rightControls}>
        <AttitudeControl />
      </View>

      {/* Bottom - Integrated LCARS Control Bar */}
      <FlightControlBar />

      {/* Exit button */}
      {onExitFlight && (
        <TouchableOpacity style={styles.exitButton} onPress={onExitFlight}>
          <Text style={styles.exitButtonText}>EXIT FLIGHT</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050810',
  },
  // 3D Ship container
  shipContainer3D: {
    position: 'absolute',
    top: 60,
    left: 70,
    right: 70,
    alignItems: 'center',
  },
  // Left controls (throttle)
  leftControls: {
    position: 'absolute',
    left: 16,
    top: '30%',
    alignItems: 'center',
  },
  throttleContainer: {
    alignItems: 'center',
  },
  throttleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text.tertiary,
    marginBottom: 8,
  },
  throttleTrack: {
    width: 40,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
    overflow: 'hidden',
  },
  throttleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
  },
  throttleThumb: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 16,
  },
  throttleTick: {
    position: 'absolute',
    left: 0,
    width: 8,
    height: 1,
    backgroundColor: tokens.colors.text.tertiary,
  },
  throttleValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
    marginTop: 8,
  },
  // Right controls (attitude)
  rightControls: {
    position: 'absolute',
    right: 16,
    top: '30%',
    alignItems: 'center',
    gap: 16,
  },
  attitudeContainer: {
    alignItems: 'center',
  },
  attitudeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text.tertiary,
    marginBottom: 8,
  },
  attitudeStick: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 75,
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
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.3,
  },
  attitudeVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.3,
  },
  attitudeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: tokens.colors.text.tertiary,
    opacity: 0.3,
  },
  attitudeThumb: {
    position: 'absolute',
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: tokens.colors.text.primary,
  },
  attitudeReadout: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  attitudeReadoutText: {
    fontSize: 10,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.tertiary,
  },
  // Yaw control
  yawContainer: {
    alignItems: 'center',
  },
  yawLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.text.tertiary,
    marginBottom: 4,
  },
  yawTrack: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
  },
  yawCenter: {
    position: 'absolute',
    left: '50%',
    top: 5,
    bottom: 5,
    width: 2,
    marginLeft: -1,
    backgroundColor: tokens.colors.text.tertiary,
  },
  yawThumb: {
    position: 'absolute',
    top: 4,
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 16,
  },
  // HUD
  hud: {
    ...StyleSheet.absoluteFillObject,
  },
  hudTop: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hudSpeedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  hudSpeedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
  },
  hudLocked: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: tokens.colors.alert.red + '40',
    paddingVertical: 12,
  },
  hudLockedText: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.alert.red,
  },
  hudLockedReason: {
    fontSize: 12,
    color: tokens.colors.text.secondary,
    marginTop: 4,
  },
  // Exit button
  exitButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: tokens.colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  exitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
  },
  // LCARS-style Flight Control Bar
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    backgroundColor: tokens.colors.console.deepSpace,
    borderTopWidth: 2,
    borderTopColor: tokens.colors.command.blue,
  },
  controlBarLeft: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: tokens.colors.border.default,
  },
  controlBarCenter: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  controlBarRight: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: tokens.colors.border.default,
  },
  controlBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.text.tertiary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  // Horizontal YAW control
  yawHorizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yawHorizontalLabel: {
    fontSize: 14,
    color: tokens.colors.semantic.navigation,
    fontWeight: '700',
  },
  yawHorizontalTrack: {
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    position: 'relative',
  },
  yawHorizontalCenter: {
    position: 'absolute',
    left: '50%',
    top: 4,
    bottom: 4,
    width: 2,
    marginLeft: -1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.5,
  },
  yawTick: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 1,
    backgroundColor: tokens.colors.text.tertiary,
    opacity: 0.3,
  },
  yawHorizontalThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 12,
  },
  yawCoupledBadge: {
    position: 'absolute',
    top: -12,
    right: 0,
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.lcars.orange,
    backgroundColor: tokens.colors.console.deepSpace,
    paddingHorizontal: 4,
  },
  // Ship Vitals Compact
  vitalsContainer: {
    gap: 4,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    width: 24,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  vitalBarContainer: {
    width: 50,
    height: 6,
    backgroundColor: tokens.colors.console.hull,
    borderRadius: 3,
    overflow: 'hidden',
  },
  vitalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  vitalValue: {
    fontSize: 10,
    fontWeight: '700',
    width: 20,
    textAlign: 'right',
    fontFamily: tokens.typography.fontFamily.mono,
  },
  // Flight Profile Display
  profileContainer: {
    alignItems: 'flex-end',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  profileCoupling: {
    fontSize: 9,
    fontWeight: '600',
    color: tokens.colors.lcars.orange,
    marginTop: 2,
  },
  attitudeReadoutCompact: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  readoutText: {
    fontSize: 9,
    fontFamily: tokens.typography.fontFamily.mono,
    color: tokens.colors.text.tertiary,
  },
});
