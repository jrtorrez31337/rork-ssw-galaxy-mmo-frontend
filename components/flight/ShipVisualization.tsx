import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle, Ellipse, Line } from 'react-native-svg';
import { tokens } from '@/ui/theme';
import { useFlightStore } from '@/stores/flightStore';

/**
 * ShipVisualization - 2D SVG ship that responds to flight controls
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - Visual representation of ship attitude (pitch/roll/yaw)
 * - Responds to smoothed flight state values
 * - Provides immediate visual feedback for control inputs
 */

interface ShipVisualizationProps {
  size?: number;
  showGrid?: boolean;
  shipColor?: string;
  accentColor?: string;
}

/**
 * Simple spaceship SVG path
 * Top-down view, pointing up (forward)
 */
function ShipSVG({ color, accentColor, size }: { color: string; accentColor: string; size: number }) {
  const scale = size / 100;

  return (
    <G>
      {/* Main hull */}
      <Path
        d="M50 10 L70 45 L65 85 L50 75 L35 85 L30 45 Z"
        fill={color}
        stroke={accentColor}
        strokeWidth={1.5}
        transform={`scale(${scale})`}
      />
      {/* Cockpit */}
      <Ellipse
        cx={50 * scale}
        cy={35 * scale}
        rx={8 * scale}
        ry={12 * scale}
        fill={accentColor}
        opacity={0.8}
      />
      {/* Left wing */}
      <Path
        d="M30 45 L10 65 L15 70 L35 55 Z"
        fill={color}
        stroke={accentColor}
        strokeWidth={1}
        transform={`scale(${scale})`}
      />
      {/* Right wing */}
      <Path
        d="M70 45 L90 65 L85 70 L65 55 Z"
        fill={color}
        stroke={accentColor}
        strokeWidth={1}
        transform={`scale(${scale})`}
      />
      {/* Left engine */}
      <Path
        d="M35 75 L38 95 L42 95 L40 75 Z"
        fill={accentColor}
        transform={`scale(${scale})`}
      />
      {/* Right engine */}
      <Path
        d="M60 75 L58 95 L62 95 L65 75 Z"
        fill={accentColor}
        transform={`scale(${scale})`}
      />
      {/* Center engine glow based on throttle - rendered by parent */}
    </G>
  );
}

/**
 * Engine thrust visualization
 */
function EngineThrustSVG({ throttle, size }: { throttle: number; size: number }) {
  const scale = size / 100;
  const thrustLength = 10 + throttle * 25; // 10-35 units based on throttle
  const thrustOpacity = 0.3 + throttle * 0.7;

  if (throttle < 0.05) return null;

  return (
    <G>
      {/* Left engine thrust */}
      <Path
        d={`M${38 * scale} ${95 * scale} L${36 * scale} ${(95 + thrustLength) * scale} L${42 * scale} ${(95 + thrustLength) * scale} L${42 * scale} ${95 * scale} Z`}
        fill={tokens.colors.lcars.orange}
        opacity={thrustOpacity}
      />
      {/* Right engine thrust */}
      <Path
        d={`M${58 * scale} ${95 * scale} L${56 * scale} ${(95 + thrustLength) * scale} L${62 * scale} ${(95 + thrustLength) * scale} L${62 * scale} ${95 * scale} Z`}
        fill={tokens.colors.lcars.orange}
        opacity={thrustOpacity}
      />
      {/* Center engine thrust */}
      <Path
        d={`M${46 * scale} ${85 * scale} L${44 * scale} ${(85 + thrustLength * 0.8) * scale} L${56 * scale} ${(85 + thrustLength * 0.8) * scale} L${54 * scale} ${85 * scale} Z`}
        fill={tokens.colors.lcars.gold}
        opacity={thrustOpacity * 0.8}
      />
    </G>
  );
}

/**
 * Attitude indicator rings showing pitch/roll reference
 */
function AttitudeRings({ roll, size }: { roll: number; size: number }) {
  const centerX = size / 2;
  const centerY = size / 2;
  const ringRadius = size * 0.4;

  return (
    <G rotation={roll * 30} origin={`${centerX}, ${centerY}`}>
      {/* Outer reference ring */}
      <Circle
        cx={centerX}
        cy={centerY}
        r={ringRadius}
        fill="none"
        stroke={tokens.colors.semantic.navigation}
        strokeWidth={1}
        opacity={0.3}
        strokeDasharray="4,4"
      />
      {/* Horizon line */}
      <Line
        x1={centerX - ringRadius}
        y1={centerY}
        x2={centerX + ringRadius}
        y2={centerY}
        stroke={tokens.colors.semantic.navigation}
        strokeWidth={1}
        opacity={0.5}
      />
      {/* Roll indicator marks */}
      {[-30, -15, 0, 15, 30].map((angle) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = centerX + Math.cos(rad) * (ringRadius - 5);
        const y1 = centerY + Math.sin(rad) * (ringRadius - 5);
        const x2 = centerX + Math.cos(rad) * ringRadius;
        const y2 = centerY + Math.sin(rad) * ringRadius;
        return (
          <Line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={tokens.colors.text.tertiary}
            strokeWidth={angle === 0 ? 2 : 1}
          />
        );
      })}
    </G>
  );
}

export function ShipVisualization({
  size = 200,
  showGrid = true,
  shipColor = tokens.colors.lcars.sky,
  accentColor = tokens.colors.lcars.orange,
}: ShipVisualizationProps) {
  const attitude = useFlightStore((s) => s.attitude);
  const throttle = useFlightStore((s) => s.throttle);

  // Convert attitude values to visual rotations
  // Roll: full range rotation (-1 to 1 maps to -30 to 30 degrees visual)
  // Pitch: affects Y position offset (nose up/down illusion)
  // Yaw: affects X position offset (turning illusion)
  const rollDegrees = attitude.roll.smoothed * 30;
  const pitchOffset = attitude.pitch.smoothed * -20; // Negative because pitch up moves ship "forward" visually
  const yawOffset = attitude.yaw.smoothed * 15;

  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background grid for spatial reference */}
        {showGrid && (
          <G opacity={0.2}>
            {/* Radial circles */}
            {[0.2, 0.4, 0.6, 0.8].map((r) => (
              <Circle
                key={r}
                cx={centerX}
                cy={centerY}
                r={size * r / 2}
                fill="none"
                stroke={tokens.colors.text.tertiary}
                strokeWidth={0.5}
              />
            ))}
            {/* Cross lines */}
            <Line
              x1={0}
              y1={centerY}
              x2={size}
              y2={centerY}
              stroke={tokens.colors.text.tertiary}
              strokeWidth={0.5}
            />
            <Line
              x1={centerX}
              y1={0}
              x2={centerX}
              y2={size}
              stroke={tokens.colors.text.tertiary}
              strokeWidth={0.5}
            />
          </G>
        )}

        {/* Attitude reference rings */}
        <AttitudeRings roll={attitude.roll.smoothed} size={size} />

        {/* Ship group - transformed based on attitude */}
        <G
          rotation={rollDegrees}
          origin={`${centerX}, ${centerY}`}
          translateX={yawOffset}
          translateY={pitchOffset}
        >
          {/* Engine thrust (behind ship) */}
          <G translateX={centerX - size / 2} translateY={centerY - size / 2}>
            <EngineThrustSVG throttle={throttle.current} size={size} />
          </G>

          {/* Ship body */}
          <G translateX={centerX - size / 2} translateY={centerY - size / 2}>
            <ShipSVG color={shipColor} accentColor={accentColor} size={size} />
          </G>
        </G>

        {/* Fixed center reference point */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill={tokens.colors.semantic.navigation}
          opacity={0.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
