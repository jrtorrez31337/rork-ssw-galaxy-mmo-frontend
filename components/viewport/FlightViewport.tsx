import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { tokens } from '@/ui/theme';
import { useFlightStore } from '@/stores/flightStore';
import { ShipVisualization3D } from '@/components/flight/ShipVisualization3D';
import { computeFlightMetrics, getSpeedStatus, getThrottleColor } from '@/lib/flight/metrics';

/**
 * FlightViewport - Dedicated flight mode viewport
 *
 * Replaces sector view when in flight mode, showing:
 * - 2D ship visualization responding to attitude
 * - Starfield background with parallax based on movement
 * - Flight control inputs (throttle slider, attitude control)
 * - HUD overlay with flight data
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Starfield background with parallax effect
 */
function Starfield({ pitch, yaw, speed }: { pitch: number; yaw: number; speed: number }) {
  // Generate static star positions (memoized)
  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < 100; i++) {
      result.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.3,
        layer: Math.floor(Math.random() * 3), // 0, 1, 2 for parallax depth
      });
    }
    return result;
  }, []);

  // Parallax offset based on attitude and speed
  const getParallaxOffset = (layer: number) => {
    const factor = (layer + 1) * 0.3;
    return {
      x: yaw * 10 * factor + speed * yaw * 2,
      y: pitch * 10 * factor + speed * 0.5,
    };
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((star, i) => {
          const offset = getParallaxOffset(star.layer);
          const x = ((star.x + offset.x) % 100 + 100) % 100;
          const y = ((star.y + offset.y) % 100 + 100) % 100;

          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={star.size}
              fill={tokens.colors.text.primary}
              opacity={star.brightness}
            />
          );
        })}
      </Svg>
    </View>
  );
}

/**
 * Throttle slider control
 */
function ThrottleControl() {
  const throttle = useFlightStore((s) => s.throttle);
  const setThrottle = useFlightStore((s) => s.setThrottle);
  const controlsLocked = useFlightStore((s) => s.controlsLocked);

  const sliderHeight = 200;
  const thumbSize = 24;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !controlsLocked,
      onMoveShouldSetPanResponder: () => !controlsLocked,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        // Convert Y position to throttle (inverted - top is 100%)
        const newThrottle = 1 - Math.max(0, Math.min(1, (gestureState.moveY - 100) / sliderHeight));
        setThrottle(newThrottle);
      },
    })
  ).current;

  const thumbPosition = (1 - throttle.current) * (sliderHeight - thumbSize);
  const color = getThrottleColor(throttle.current);

  return (
    <View style={styles.throttleContainer}>
      <Text style={styles.throttleLabel}>THR</Text>
      <View style={[styles.throttleTrack, { height: sliderHeight }]} {...panResponder.panHandlers}>
        {/* Fill bar */}
        <View
          style={[
            styles.throttleFill,
            {
              height: `${throttle.current * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
        {/* Thumb */}
        <View
          style={[
            styles.throttleThumb,
            {
              top: thumbPosition,
              backgroundColor: color,
            },
          ]}
        />
        {/* Tick marks */}
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
  const setPitch = useFlightStore((s) => s.setPitch);
  const setRoll = useFlightStore((s) => s.setRoll);
  const setYaw = useFlightStore((s) => s.setYaw);
  const attitude = useFlightStore((s) => s.attitude);
  const controlsLocked = useFlightStore((s) => s.controlsLocked);
  const axisCouplingEnabled = useFlightStore((s) => s.axisCouplingEnabled);

  const stickSize = 150;
  const thumbSize = 40;
  const maxOffset = (stickSize - thumbSize) / 2;

  const centerRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !controlsLocked,
      onMoveShouldSetPanResponder: () => !controlsLocked,
      onPanResponderGrant: (evt) => {
        centerRef.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate offset from center
        const offsetX = gestureState.dx;
        const offsetY = gestureState.dy;

        // Normalize to -1 to 1
        const roll = Math.max(-1, Math.min(1, offsetX / maxOffset));
        const pitch = Math.max(-1, Math.min(1, -offsetY / maxOffset)); // Inverted Y

        setRoll(roll);
        setPitch(pitch);

        // If axis coupling is off, horizontal also affects yaw slightly
        if (!axisCouplingEnabled) {
          setYaw(roll * 0.5);
        }
      },
      onPanResponderRelease: () => {
        // Return to center
        setRoll(0);
        setPitch(0);
        setYaw(0);
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
        <Svg width={stickSize} height={stickSize} style={StyleSheet.absoluteFill}>
          <Line
            x1={stickSize / 2}
            y1={0}
            x2={stickSize / 2}
            y2={stickSize}
            stroke={tokens.colors.text.tertiary}
            strokeWidth={1}
            opacity={0.3}
          />
          <Line
            x1={0}
            y1={stickSize / 2}
            x2={stickSize}
            y2={stickSize / 2}
            stroke={tokens.colors.text.tertiary}
            strokeWidth={1}
            opacity={0.3}
          />
          <Circle
            cx={stickSize / 2}
            cy={stickSize / 2}
            r={maxOffset}
            fill="none"
            stroke={tokens.colors.text.tertiary}
            strokeWidth={1}
            opacity={0.3}
          />
        </Svg>

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
 * Yaw pedal control (for direct yaw when not using coupling)
 */
function YawControl() {
  const setYaw = useFlightStore((s) => s.setYaw);
  const attitude = useFlightStore((s) => s.attitude);
  const controlsLocked = useFlightStore((s) => s.controlsLocked);
  const axisCouplingEnabled = useFlightStore((s) => s.axisCouplingEnabled);

  // Hide if axis coupling is enabled (yaw derived from roll)
  if (axisCouplingEnabled) return null;

  const sliderWidth = 120;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !controlsLocked,
      onMoveShouldSetPanResponder: () => !controlsLocked,
      onPanResponderMove: (_, gestureState) => {
        const yaw = Math.max(-1, Math.min(1, gestureState.dx / (sliderWidth / 2)));
        setYaw(yaw);
      },
      onPanResponderRelease: () => {
        setYaw(0);
      },
    })
  ).current;

  const thumbOffset = attitude.yaw.smoothed * (sliderWidth / 2 - 15);

  return (
    <View style={styles.yawContainer}>
      <Text style={styles.yawLabel}>YAW</Text>
      <View style={[styles.yawTrack, { width: sliderWidth }]} {...panResponder.panHandlers}>
        <View style={styles.yawCenter} />
        <View
          style={[
            styles.yawThumb,
            { left: sliderWidth / 2 - 15 + thumbOffset },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Flight HUD overlay
 */
function FlightHUD() {
  const flightState = useFlightStore();
  const metrics = computeFlightMetrics(flightState);
  const speedStatus = getSpeedStatus(metrics.speedPercent);

  return (
    <View style={styles.hud} pointerEvents="none">
      {/* Top center - speed */}
      <View style={styles.hudTop}>
        <Text style={styles.hudSpeedValue}>{metrics.speedDisplay}</Text>
        <Text style={styles.hudSpeedLabel}>{speedStatus}</Text>
      </View>

      {/* Bottom center - profile */}
      <View style={styles.hudBottom}>
        <Text style={styles.hudProfileLabel}>
          {flightState.profile.name.toUpperCase()}
        </Text>
        {flightState.axisCouplingEnabled && (
          <Text style={styles.hudCouplingBadge}>ROLL→YAW</Text>
        )}
      </View>

      {/* Controls locked indicator */}
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
  const attitude = useFlightStore((s) => s.attitude);
  const throttle = useFlightStore((s) => s.throttle);
  const profile = useFlightStore((s) => s.profile);
  const metrics = computeFlightMetrics(useFlightStore());

  // Map profile ID to ship type
  const getShipType = (): 'scout' | 'fighter' | 'trader' | 'explorer' => {
    switch (profile.id) {
      case 'scout': return 'scout';
      case 'fighter': return 'fighter';
      case 'trader': return 'trader';
      case 'explorer': return 'explorer';
      default: return 'scout';
    }
  };

  return (
    <View style={styles.container}>
      {/* 3D Ship visualization with integrated starfield */}
      <View style={styles.shipContainer3D}>
        <ShipVisualization3D
          shipType={getShipType()}
          size={{ width: SCREEN_WIDTH - 140, height: SCREEN_HEIGHT * 0.5 }}
        />
      </View>

      {/* Flight HUD overlay */}
      <FlightHUD />

      {/* Left side - Throttle */}
      <View style={styles.leftControls}>
        <ThrottleControl />
      </View>

      {/* Right side - Attitude */}
      <View style={styles.rightControls}>
        <AttitudeControl />
        <YawControl />
      </View>

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
    backgroundColor: tokens.colors.background.space,
  },
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
    height: 24,
    borderRadius: 12,
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
    height: 30,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 15,
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
    top: 3,
    width: 30,
    height: 24,
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: 12,
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
  hudBottom: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hudProfileLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.semantic.navigation,
  },
  hudCouplingBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.lcars.orange,
    marginTop: 4,
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
});
