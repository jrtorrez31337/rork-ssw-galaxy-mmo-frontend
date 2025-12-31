import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  G,
  Path,
  Polygon,
  Ellipse,
  Circle,
  Line,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  ClipPath,
} from 'react-native-svg';
import { useFlightStore } from '@/stores/flightStore';

/**
 * ShipVisualization3D - Rugged pseudo-3D ship visualization
 *
 * Industrial/military aesthetic with:
 * - Hard angles and panel lines
 * - Weathered metallic surfaces
 * - Prominent engine housings with visible thrusters
 * - Throttle-responsive engine flames
 */

interface ShipVisualization3DProps {
  shipType?: 'scout' | 'fighter' | 'trader' | 'explorer';
  size?: { width: number; height: number };
}

// Brightened military color palette - better visibility
const SHIP_COLORS = {
  scout: {
    hull: '#2a5a70',
    plate: '#4a8aa0',
    accent: '#00d0ff',
    highlight: '#7de8ff',
    panel: '#1a4050',
    edge: '#00e8ff',
  },
  fighter: {
    hull: '#5a2a2a',
    plate: '#8a4a4a',
    accent: '#ff4040',
    highlight: '#ff7070',
    panel: '#3a1a1a',
    edge: '#ff5555',
  },
  trader: {
    hull: '#5a4a2a',
    plate: '#8a7a4a',
    accent: '#ffaa00',
    highlight: '#ffcc50',
    panel: '#3a3020',
    edge: '#ffbb22',
  },
  explorer: {
    hull: '#4a2a5a',
    plate: '#7a4a8a',
    accent: '#aa55ee',
    highlight: '#cc88ff',
    panel: '#2a1a3a',
    edge: '#bb66ff',
  },
};

const ENGINE_COLORS = {
  core: '#ffffff',
  hot: '#ffcc00',
  plasma: '#ff6600',
  exhaust: '#ff330066',
  nozzle: '#222233',
  nozzleRim: '#444466',
};

// Light source position (normalized 0-1, from top-right)
const LIGHT_SOURCE = { x: 0.8, y: 0.15 };

/**
 * Starfield with depth layers
 */
function Starfield({ width, height, pitch, yaw }: {
  width: number;
  height: number;
  pitch: number;
  yaw: number;
}) {
  const stars = useMemo(() => {
    const result = [];
    for (let layer = 0; layer < 3; layer++) {
      const count = 50 - layer * 12;
      for (let i = 0; i < count; i++) {
        result.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.3 + Math.random() * (1.2 - layer * 0.3),
          opacity: 0.15 + Math.random() * 0.35 + layer * 0.08,
          layer,
        });
      }
    }
    return result;
  }, [width, height]);

  return (
    <G>
      {stars.map((star, i) => {
        const parallaxFactor = (3 - star.layer) * 0.35;
        const offsetX = yaw * 25 * parallaxFactor;
        const offsetY = pitch * 25 * parallaxFactor;
        const x = ((star.x + offsetX) % width + width) % width;
        const y = ((star.y + offsetY) % height + height) % height;

        return (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={star.size}
            fill="#aabbcc"
            opacity={star.opacity}
          />
        );
      })}
    </G>
  );
}

/**
 * Sun/Star light source - visible in scene
 */
function SunLight({ width, height, pitch, yaw }: {
  width: number;
  height: number;
  pitch: number;
  yaw: number;
}) {
  // Sun position with parallax (moves slower than close stars)
  const baseX = LIGHT_SOURCE.x * width;
  const baseY = LIGHT_SOURCE.y * height;
  const offsetX = yaw * 8;
  const offsetY = pitch * 8;
  const sunX = baseX + offsetX;
  const sunY = baseY + offsetY;

  return (
    <G>
      <Defs>
        <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <Stop offset="20%" stopColor="#ffffcc" stopOpacity={0.8} />
          <Stop offset="50%" stopColor="#ffdd66" stopOpacity={0.3} />
          <Stop offset="100%" stopColor="#ff8800" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <Stop offset="60%" stopColor="#ffffee" stopOpacity={0.9} />
          <Stop offset="100%" stopColor="#ffeeaa" stopOpacity={0.7} />
        </RadialGradient>
      </Defs>

      {/* Outer glow */}
      <Circle cx={sunX} cy={sunY} r={60} fill="url(#sunGlow)" />
      {/* Lens flare rays */}
      <Line x1={sunX - 40} y1={sunY} x2={sunX + 40} y2={sunY} stroke="#ffffff" strokeWidth={1} opacity={0.4} />
      <Line x1={sunX} y1={sunY - 40} x2={sunX} y2={sunY + 40} stroke="#ffffff" strokeWidth={1} opacity={0.4} />
      <Line x1={sunX - 28} y1={sunY - 28} x2={sunX + 28} y2={sunY + 28} stroke="#ffffff" strokeWidth={0.5} opacity={0.3} />
      <Line x1={sunX + 28} y1={sunY - 28} x2={sunX - 28} y2={sunY + 28} stroke="#ffffff" strokeWidth={0.5} opacity={0.3} />
      {/* Core */}
      <Circle cx={sunX} cy={sunY} r={8} fill="url(#sunCore)" />
      {/* Bright center */}
      <Circle cx={sunX} cy={sunY} r={3} fill="#ffffff" />
    </G>
  );
}

/**
 * Engine Nozzle - visible thruster component
 */
function EngineNozzle({ cx, cy, width, height, scale = 1 }: {
  cx: number;
  cy: number;
  width: number;
  height: number;
  scale?: number;
}) {
  const w = width * scale;
  const h = height * scale;

  return (
    <G>
      {/* Nozzle outer rim */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={w / 2}
        ry={h / 2 * 0.4}
        fill={ENGINE_COLORS.nozzleRim}
        stroke={ENGINE_COLORS.nozzle}
        strokeWidth={1}
      />
      {/* Nozzle inner */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={w / 2 * 0.7}
        ry={h / 2 * 0.25}
        fill={ENGINE_COLORS.nozzle}
      />
      {/* Nozzle glow ring (always slightly visible) */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={w / 2 * 0.5}
        ry={h / 2 * 0.15}
        fill={ENGINE_COLORS.plasma}
        opacity={0.3}
      />
    </G>
  );
}

/**
 * Engine exhaust - industrial plasma burn
 * Positioned to emit FROM the nozzle center
 */
function EngineExhaust({ cx, cy, throttle, scale = 1, wide = false }: {
  cx: number;
  cy: number;
  throttle: number;
  scale?: number;
  wide?: boolean;
}) {
  if (throttle < 0.03) return null;

  const len = (15 + throttle * 40) * scale;
  const w = wide ? (10 + throttle * 14) * scale : (5 + throttle * 8) * scale;

  return (
    <G>
      {/* Exhaust plume - outer glow */}
      <Polygon
        points={`
          ${cx - w},${cy}
          ${cx + w},${cy}
          ${cx + w * 0.2},${cy + len}
          ${cx - w * 0.2},${cy + len}
        `}
        fill={ENGINE_COLORS.exhaust}
      />
      {/* Plasma core */}
      <Polygon
        points={`
          ${cx - w * 0.65},${cy}
          ${cx + w * 0.65},${cy}
          ${cx + w * 0.1},${cy + len * 0.75}
          ${cx - w * 0.1},${cy + len * 0.75}
        `}
        fill={ENGINE_COLORS.plasma}
        opacity={0.5 + throttle * 0.5}
      />
      {/* Hot center */}
      <Polygon
        points={`
          ${cx - w * 0.35},${cy}
          ${cx + w * 0.35},${cy}
          ${cx},${cy + len * 0.5}
        `}
        fill={ENGINE_COLORS.hot}
        opacity={0.7 + throttle * 0.3}
      />
      {/* White hot core */}
      <Ellipse
        cx={cx}
        cy={cy + 3 * scale}
        rx={w * 0.25}
        ry={len * 0.08}
        fill={ENGINE_COLORS.core}
        opacity={0.85}
      />
    </G>
  );
}

/**
 * Panel line detail
 */
function PanelLine({ x1, y1, x2, y2, color }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
}) {
  return (
    <Line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={0.5}
      opacity={0.6}
    />
  );
}

/**
 * Scout - Sleek interceptor/recon craft
 * Pointed nose, swept wings, single rear engine
 */
function ScoutShip({ colors, roll, pitch, throttle, size }: {
  colors: typeof SHIP_COLORS.scout;
  roll: number;
  pitch: number;
  throttle: number;
  size: number;
}) {
  const s = size / 100;
  const pY = pitch * 0.35;
  const rollAngle = roll * 35;
  const cx = 50 * s;

  // Engine position
  const engineX = 50 * s;
  const engineY = (85 + pY * 6) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="scoutHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="50%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Engine exhaust */}
      <EngineExhaust cx={engineX} cy={engineY} throttle={throttle} scale={s * 1.2} />

      {/* Main fuselage - sleek pointed body */}
      <Path
        d={`
          M ${50 * s} ${(5 - pY * 12) * s}
          C ${55 * s} ${(15 - pY * 10) * s}, ${60 * s} ${(25 - pY * 8) * s}, ${62 * s} ${(40 + pY * 2) * s}
          L ${65 * s} ${(70 + pY * 5) * s}
          C ${63 * s} ${(78 + pY * 6) * s}, ${55 * s} ${(82 + pY * 6) * s}, ${50 * s} ${(82 + pY * 6) * s}
          C ${45 * s} ${(82 + pY * 6) * s}, ${37 * s} ${(78 + pY * 6) * s}, ${35 * s} ${(70 + pY * 5) * s}
          L ${38 * s} ${(40 + pY * 2) * s}
          C ${40 * s} ${(25 - pY * 8) * s}, ${45 * s} ${(15 - pY * 10) * s}, ${50 * s} ${(5 - pY * 12) * s}
          Z
        `}
        fill="url(#scoutHull)"
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Left swept wing */}
      <Path
        d={`
          M ${38 * s} ${(45 + pY * 2) * s}
          L ${10 * s} ${(60 + pY * 4) * s}
          L ${8 * s} ${(68 + pY * 5) * s}
          L ${15 * s} ${(72 + pY * 5) * s}
          L ${35 * s} ${(65 + pY * 4) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Right swept wing */}
      <Path
        d={`
          M ${62 * s} ${(45 + pY * 2) * s}
          L ${90 * s} ${(60 + pY * 4) * s}
          L ${92 * s} ${(68 + pY * 5) * s}
          L ${85 * s} ${(72 + pY * 5) * s}
          L ${65 * s} ${(65 + pY * 4) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Cockpit canopy */}
      <Path
        d={`
          M ${50 * s} ${(15 - pY * 10) * s}
          C ${56 * s} ${(20 - pY * 8) * s}, ${58 * s} ${(30 - pY * 6) * s}, ${57 * s} ${(42 + pY) * s}
          L ${50 * s} ${(48 + pY * 2) * s}
          L ${43 * s} ${(42 + pY) * s}
          C ${42 * s} ${(30 - pY * 6) * s}, ${44 * s} ${(20 - pY * 8) * s}, ${50 * s} ${(15 - pY * 10) * s}
          Z
        `}
        fill="#1a3a4a"
        stroke={colors.accent}
        strokeWidth={1}
        opacity={0.9}
      />

      {/* Cockpit frame */}
      <Line x1={50*s} y1={(18-pY*9)*s} x2={50*s} y2={(45+pY)*s} stroke={colors.accent} strokeWidth={0.5} opacity={0.6} />

      {/* Panel lines */}
      <PanelLine x1={42*s} y1={(35-pY*5)*s} x2={38*s} y2={(60+pY*3)*s} color={colors.panel} />
      <PanelLine x1={58*s} y1={(35-pY*5)*s} x2={62*s} y2={(60+pY*3)*s} color={colors.panel} />

      {/* Engine housing - conical thruster mount */}
      <Path
        d={`
          M ${40 * s} ${(68 + pY * 5) * s}
          L ${38 * s} ${(82 + pY * 6) * s}
          L ${62 * s} ${(82 + pY * 6) * s}
          L ${60 * s} ${(68 + pY * 5) * s}
          Z
        `}
        fill={colors.panel}
        stroke={colors.hull}
        strokeWidth={1}
      />

      {/* Engine nozzle cone */}
      <Ellipse
        cx={engineX}
        cy={(80 + pY * 6) * s}
        rx={10 * s}
        ry={4 * s}
        fill={colors.panel}
        stroke={colors.hull}
        strokeWidth={0.5}
      />
      <EngineNozzle cx={engineX} cy={engineY} width={16} height={10} scale={s} />

      {/* Wingtip lights */}
      <Circle cx={9*s} cy={(64+pY*4)*s} r={2*s} fill={colors.accent} opacity={0.8} />
      <Circle cx={91*s} cy={(64+pY*4)*s} r={2*s} fill={colors.accent} opacity={0.8} />
    </G>
  );
}

/**
 * Fighter - Heavy combat spacecraft with twin engines
 * Aggressive nose, weapon pylons, armored cockpit
 */
function FighterShip({ colors, roll, pitch, throttle, size }: {
  colors: typeof SHIP_COLORS.fighter;
  roll: number;
  pitch: number;
  throttle: number;
  size: number;
}) {
  const s = size / 100;
  const pY = pitch * 0.35;
  const rollAngle = roll * 38;
  const cx = 50 * s;

  // Twin engine positions
  const leftEngineX = 30 * s;
  const rightEngineX = 70 * s;
  const engineY = (88 + pY * 6) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="fighterHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="60%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Twin engine exhausts */}
      <EngineExhaust cx={leftEngineX} cy={engineY} throttle={throttle} scale={s * 1.1} />
      <EngineExhaust cx={rightEngineX} cy={engineY} throttle={throttle} scale={s * 1.1} />

      {/* Main fuselage - aggressive pointed nose */}
      <Path
        d={`
          M ${50 * s} ${(5 - pY * 12) * s}
          L ${58 * s} ${(20 - pY * 9) * s}
          L ${60 * s} ${(35 + pY) * s}
          L ${55 * s} ${(55 + pY * 3) * s}
          L ${45 * s} ${(55 + pY * 3) * s}
          L ${40 * s} ${(35 + pY) * s}
          L ${42 * s} ${(20 - pY * 9) * s}
          Z
        `}
        fill="url(#fighterHull)"
        stroke={colors.edge}
        strokeWidth={1.5}
      />

      {/* Left engine nacelle - cylindrical pod */}
      <Path
        d={`
          M ${22 * s} ${(40 + pY * 2) * s}
          C ${18 * s} ${(42 + pY * 2) * s}, ${18 * s} ${(80 + pY * 6) * s}, ${22 * s} ${(85 + pY * 6) * s}
          L ${38 * s} ${(85 + pY * 6) * s}
          C ${42 * s} ${(80 + pY * 6) * s}, ${42 * s} ${(42 + pY * 2) * s}, ${38 * s} ${(40 + pY * 2) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Right engine nacelle - cylindrical pod */}
      <Path
        d={`
          M ${62 * s} ${(40 + pY * 2) * s}
          C ${58 * s} ${(42 + pY * 2) * s}, ${58 * s} ${(80 + pY * 6) * s}, ${62 * s} ${(85 + pY * 6) * s}
          L ${78 * s} ${(85 + pY * 6) * s}
          C ${82 * s} ${(80 + pY * 6) * s}, ${82 * s} ${(42 + pY * 2) * s}, ${78 * s} ${(40 + pY * 2) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Wing struts connecting nacelles to fuselage */}
      <Rect x={38*s} y={(45+pY*2)*s} width={7*s} height={8*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} />
      <Rect x={55*s} y={(45+pY*2)*s} width={7*s} height={8*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} />

      {/* Weapon pylons under nacelles */}
      <Path
        d={`
          M ${20 * s} ${(55 + pY * 3) * s}
          L ${12 * s} ${(62 + pY * 4) * s}
          L ${12 * s} ${(75 + pY * 5) * s}
          L ${18 * s} ${(75 + pY * 5) * s}
          L ${22 * s} ${(60 + pY * 4) * s}
          Z
        `}
        fill={colors.panel}
        stroke={colors.accent}
        strokeWidth={0.5}
      />
      <Path
        d={`
          M ${80 * s} ${(55 + pY * 3) * s}
          L ${88 * s} ${(62 + pY * 4) * s}
          L ${88 * s} ${(75 + pY * 5) * s}
          L ${82 * s} ${(75 + pY * 5) * s}
          L ${78 * s} ${(60 + pY * 4) * s}
          Z
        `}
        fill={colors.panel}
        stroke={colors.accent}
        strokeWidth={0.5}
      />

      {/* Missile hardpoints */}
      <Rect x={10*s} y={(68+pY*5)*s} width={4*s} height={8*s} fill={colors.accent} stroke={colors.panel} strokeWidth={0.5} rx={1*s} />
      <Rect x={86*s} y={(68+pY*5)*s} width={4*s} height={8*s} fill={colors.accent} stroke={colors.panel} strokeWidth={0.5} rx={1*s} />

      {/* Cockpit - armored bubble canopy */}
      <Path
        d={`
          M ${50 * s} ${(12 - pY * 10) * s}
          C ${56 * s} ${(14 - pY * 9) * s}, ${58 * s} ${(22 - pY * 7) * s}, ${57 * s} ${(32 + pY) * s}
          C ${56 * s} ${(38 + pY * 2) * s}, ${54 * s} ${(42 + pY * 2) * s}, ${50 * s} ${(44 + pY * 2) * s}
          C ${46 * s} ${(42 + pY * 2) * s}, ${44 * s} ${(38 + pY * 2) * s}, ${43 * s} ${(32 + pY) * s}
          C ${42 * s} ${(22 - pY * 7) * s}, ${44 * s} ${(14 - pY * 9) * s}, ${50 * s} ${(12 - pY * 10) * s}
          Z
        `}
        fill="#1a1a22"
        stroke={colors.accent}
        strokeWidth={1}
      />

      {/* Cockpit HUD frame */}
      <Line x1={50*s} y1={(15-pY*9)*s} x2={50*s} y2={(42+pY*2)*s} stroke={colors.accent} strokeWidth={0.5} opacity={0.5} />
      <Line x1={44*s} y1={(28-pY*6)*s} x2={56*s} y2={(28-pY*6)*s} stroke={colors.accent} strokeWidth={0.5} opacity={0.5} />

      {/* Panel lines on fuselage */}
      <PanelLine x1={45*s} y1={(25-pY*7)*s} x2={42*s} y2={(50+pY*2)*s} color={colors.panel} />
      <PanelLine x1={55*s} y1={(25-pY*7)*s} x2={58*s} y2={(50+pY*2)*s} color={colors.panel} />

      {/* Engine nozzle cones */}
      <Ellipse cx={leftEngineX} cy={(82+pY*6)*s} rx={8*s} ry={3*s} fill={colors.panel} stroke={colors.hull} strokeWidth={0.5} />
      <EngineNozzle cx={leftEngineX} cy={engineY} width={14} height={10} scale={s} />

      <Ellipse cx={rightEngineX} cy={(82+pY*6)*s} rx={8*s} ry={3*s} fill={colors.panel} stroke={colors.hull} strokeWidth={0.5} />
      <EngineNozzle cx={rightEngineX} cy={engineY} width={14} height={10} scale={s} />

      {/* Running lights */}
      <Circle cx={22*s} cy={(42+pY*2)*s} r={2*s} fill={colors.accent} opacity={0.9} />
      <Circle cx={78*s} cy={(42+pY*2)*s} r={2*s} fill={colors.accent} opacity={0.9} />
    </G>
  );
}

/**
 * Trader - Heavy cargo freighter
 * Bulky hull, cargo pods, triple engine array
 */
function TraderShip({ colors, roll, pitch, throttle, size }: {
  colors: typeof SHIP_COLORS.trader;
  roll: number;
  pitch: number;
  throttle: number;
  size: number;
}) {
  const s = size / 100;
  const pY = pitch * 0.3;
  const rollAngle = roll * 25;
  const cx = 50 * s;

  // Triple engine positions
  const leftEngineX = 25 * s;
  const centerEngineX = 50 * s;
  const rightEngineX = 75 * s;
  const engineY = (92 + pY * 5) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="traderHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="50%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Triple engine exhausts */}
      <EngineExhaust cx={leftEngineX} cy={engineY} throttle={throttle} scale={s * 0.9} wide />
      <EngineExhaust cx={centerEngineX} cy={engineY} throttle={throttle} scale={s * 1.1} wide />
      <EngineExhaust cx={rightEngineX} cy={engineY} throttle={throttle} scale={s * 0.9} wide />

      {/* Main hull - rounded freighter body */}
      <Path
        d={`
          M ${30 * s} ${(15 - pY * 9) * s}
          L ${70 * s} ${(15 - pY * 9) * s}
          C ${85 * s} ${(18 - pY * 8) * s}, ${88 * s} ${(35 + pY) * s}, ${88 * s} ${(50 + pY * 3) * s}
          L ${88 * s} ${(75 + pY * 5) * s}
          C ${88 * s} ${(82 + pY * 6) * s}, ${82 * s} ${(88 + pY * 6) * s}, ${75 * s} ${(88 + pY * 6) * s}
          L ${25 * s} ${(88 + pY * 6) * s}
          C ${18 * s} ${(88 + pY * 6) * s}, ${12 * s} ${(82 + pY * 6) * s}, ${12 * s} ${(75 + pY * 5) * s}
          L ${12 * s} ${(50 + pY * 3) * s}
          C ${12 * s} ${(35 + pY) * s}, ${15 * s} ${(18 - pY * 8) * s}, ${30 * s} ${(15 - pY * 9) * s}
          Z
        `}
        fill="url(#traderHull)"
        stroke={colors.edge}
        strokeWidth={1.5}
      />

      {/* Cockpit/bridge module - raised section at front */}
      <Path
        d={`
          M ${35 * s} ${(8 - pY * 11) * s}
          L ${65 * s} ${(8 - pY * 11) * s}
          C ${72 * s} ${(10 - pY * 10) * s}, ${75 * s} ${(15 - pY * 9) * s}, ${72 * s} ${(22 - pY * 7) * s}
          L ${28 * s} ${(22 - pY * 7) * s}
          C ${25 * s} ${(15 - pY * 9) * s}, ${28 * s} ${(10 - pY * 10) * s}, ${35 * s} ${(8 - pY * 11) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Bridge windows - wraparound viewport */}
      <Path
        d={`
          M ${38 * s} ${(10 - pY * 10) * s}
          L ${62 * s} ${(10 - pY * 10) * s}
          C ${66 * s} ${(11 - pY * 10) * s}, ${68 * s} ${(14 - pY * 9) * s}, ${66 * s} ${(18 - pY * 8) * s}
          L ${34 * s} ${(18 - pY * 8) * s}
          C ${32 * s} ${(14 - pY * 9) * s}, ${34 * s} ${(11 - pY * 10) * s}, ${38 * s} ${(10 - pY * 10) * s}
          Z
        `}
        fill="#1a2a22"
        stroke={colors.accent}
        strokeWidth={0.5}
      />

      {/* Cargo bay doors - upper */}
      <Rect x={20*s} y={(28-pY*6)*s} width={26*s} height={20*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} rx={2*s} />
      <Rect x={54*s} y={(28-pY*6)*s} width={26*s} height={20*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} rx={2*s} />

      {/* Cargo bay doors - lower */}
      <Rect x={20*s} y={(52-pY*3)*s} width={26*s} height={18*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} rx={2*s} />
      <Rect x={54*s} y={(52-pY*3)*s} width={26*s} height={18*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} rx={2*s} />

      {/* Cargo door handles/latches */}
      <Line x1={33*s} y1={(32-pY*5)*s} x2={33*s} y2={(44-pY*4)*s} stroke={colors.accent} strokeWidth={1} />
      <Line x1={67*s} y1={(32-pY*5)*s} x2={67*s} y2={(44-pY*4)*s} stroke={colors.accent} strokeWidth={1} />
      <Line x1={33*s} y1={(55-pY*2)*s} x2={33*s} y2={(66-pY*1)*s} stroke={colors.accent} strokeWidth={1} />
      <Line x1={67*s} y1={(55-pY*2)*s} x2={67*s} y2={(66-pY*1)*s} stroke={colors.accent} strokeWidth={1} />

      {/* Side hull details */}
      <PanelLine x1={15*s} y1={(35+pY)*s} x2={15*s} y2={(70+pY*4)*s} color={colors.panel} />
      <PanelLine x1={85*s} y1={(35+pY)*s} x2={85*s} y2={(70+pY*4)*s} color={colors.panel} />

      {/* Engine section - industrial thruster array */}
      <Path
        d={`
          M ${15 * s} ${(75 + pY * 5) * s}
          L ${85 * s} ${(75 + pY * 5) * s}
          L ${85 * s} ${(88 + pY * 6) * s}
          L ${15 * s} ${(88 + pY * 6) * s}
          Z
        `}
        fill={colors.panel}
        stroke={colors.hull}
        strokeWidth={1}
      />

      {/* Engine cones/bells */}
      <Ellipse cx={leftEngineX} cy={(85+pY*5)*s} rx={10*s} ry={4*s} fill={colors.hull} stroke={colors.panel} strokeWidth={0.5} />
      <Ellipse cx={centerEngineX} cy={(85+pY*5)*s} rx={12*s} ry={5*s} fill={colors.hull} stroke={colors.panel} strokeWidth={0.5} />
      <Ellipse cx={rightEngineX} cy={(85+pY*5)*s} rx={10*s} ry={4*s} fill={colors.hull} stroke={colors.panel} strokeWidth={0.5} />

      {/* Engine nozzles */}
      <EngineNozzle cx={leftEngineX} cy={engineY} width={14} height={10} scale={s} />
      <EngineNozzle cx={centerEngineX} cy={engineY} width={18} height={12} scale={s} />
      <EngineNozzle cx={rightEngineX} cy={engineY} width={14} height={10} scale={s} />

      {/* Running lights */}
      <Circle cx={12*s} cy={(50+pY*3)*s} r={2*s} fill={colors.accent} opacity={0.8} />
      <Circle cx={88*s} cy={(50+pY*3)*s} r={2*s} fill={colors.accent} opacity={0.8} />
    </G>
  );
}

/**
 * Explorer - Long-range science/exploration vessel
 * Sensor dish, elongated hull, large main engine
 */
function ExplorerShip({ colors, roll, pitch, throttle, size }: {
  colors: typeof SHIP_COLORS.explorer;
  roll: number;
  pitch: number;
  throttle: number;
  size: number;
}) {
  const s = size / 100;
  const pY = pitch * 0.35;
  const rollAngle = roll * 32;
  const cx = 50 * s;

  // Main engine position
  const engineX = 50 * s;
  const engineY = (90 + pY * 6) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="explorerHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="50%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Main engine exhaust */}
      <EngineExhaust cx={engineX} cy={engineY} throttle={throttle} scale={s * 1.3} />

      {/* Main hull - elongated saucer-like forward section */}
      <Path
        d={`
          M ${50 * s} ${(8 - pY * 12) * s}
          C ${70 * s} ${(10 - pY * 11) * s}, ${78 * s} ${(20 - pY * 8) * s}, ${75 * s} ${(35 + pY) * s}
          L ${70 * s} ${(50 + pY * 3) * s}
          L ${65 * s} ${(55 + pY * 3) * s}
          L ${35 * s} ${(55 + pY * 3) * s}
          L ${30 * s} ${(50 + pY * 3) * s}
          L ${25 * s} ${(35 + pY) * s}
          C ${22 * s} ${(20 - pY * 8) * s}, ${30 * s} ${(10 - pY * 11) * s}, ${50 * s} ${(8 - pY * 12) * s}
          Z
        `}
        fill="url(#explorerHull)"
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Engineering section - rear hull with engines */}
      <Path
        d={`
          M ${38 * s} ${(52 + pY * 3) * s}
          L ${62 * s} ${(52 + pY * 3) * s}
          L ${60 * s} ${(85 + pY * 6) * s}
          L ${40 * s} ${(85 + pY * 6) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Sensor dish on boom - starboard side */}
      <Line x1={70*s} y1={(28+pY)*s} x2={88*s} y2={(20-pY*8)*s} stroke={colors.plate} strokeWidth={2} />
      <Circle cx={(90)*s} cy={(18-pY*9)*s} r={12*s} fill={colors.plate} stroke={colors.accent} strokeWidth={1} />
      <Circle cx={(90)*s} cy={(18-pY*9)*s} r={8*s} fill={colors.hull} stroke={colors.panel} strokeWidth={0.5} />
      <Circle cx={(90)*s} cy={(18-pY*9)*s} r={3*s} fill={colors.accent} opacity={0.9} />

      {/* Science pod - port side */}
      <Path
        d={`
          M ${25 * s} ${(25 + pY) * s}
          L ${10 * s} ${(30 + pY) * s}
          C ${5 * s} ${(32 + pY) * s}, ${5 * s} ${(45 + pY * 2) * s}, ${10 * s} ${(48 + pY * 2) * s}
          L ${28 * s} ${(42 + pY * 2) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />
      {/* Science pod window */}
      <Ellipse cx={12*s} cy={(38+pY)*s} rx={4*s} ry={6*s} fill="#1a1a2a" stroke={colors.accent} strokeWidth={0.5} />

      {/* Cockpit - dome canopy */}
      <Path
        d={`
          M ${50 * s} ${(12 - pY * 11) * s}
          C ${60 * s} ${(14 - pY * 10) * s}, ${65 * s} ${(22 - pY * 8) * s}, ${62 * s} ${(32 + pY) * s}
          C ${60 * s} ${(38 + pY * 2) * s}, ${55 * s} ${(42 + pY * 2) * s}, ${50 * s} ${(42 + pY * 2) * s}
          C ${45 * s} ${(42 + pY * 2) * s}, ${40 * s} ${(38 + pY * 2) * s}, ${38 * s} ${(32 + pY) * s}
          C ${35 * s} ${(22 - pY * 8) * s}, ${40 * s} ${(14 - pY * 10) * s}, ${50 * s} ${(12 - pY * 11) * s}
          Z
        `}
        fill="#1a1a2a"
        stroke={colors.accent}
        strokeWidth={1}
      />

      {/* Cockpit frame lines */}
      <Line x1={50*s} y1={(14-pY*10)*s} x2={50*s} y2={(40+pY*2)*s} stroke={colors.accent} strokeWidth={0.5} opacity={0.5} />
      <Path
        d={`M ${42*s} ${(25-pY*6)*s} Q ${50*s} ${(22-pY*7)*s} ${58*s} ${(25-pY*6)*s}`}
        stroke={colors.accent}
        strokeWidth={0.5}
        fill="none"
        opacity={0.5}
      />

      {/* Sensor arrays on top of saucer */}
      {[0, 1, 2].map(i => (
        <Rect
          key={i}
          x={(44 + i * 6) * s}
          y={(18 - pY * 9) * s}
          width={3 * s}
          height={5 * s}
          fill={colors.accent}
          opacity={0.8}
          rx={1 * s}
        />
      ))}

      {/* Warp nacelle pylons */}
      <Path
        d={`
          M ${35 * s} ${(58 + pY * 3) * s}
          L ${20 * s} ${(65 + pY * 4) * s}
          L ${18 * s} ${(82 + pY * 6) * s}
          L ${25 * s} ${(82 + pY * 6) * s}
          L ${38 * s} ${(70 + pY * 5) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />
      <Path
        d={`
          M ${65 * s} ${(58 + pY * 3) * s}
          L ${80 * s} ${(65 + pY * 4) * s}
          L ${82 * s} ${(82 + pY * 6) * s}
          L ${75 * s} ${(82 + pY * 6) * s}
          L ${62 * s} ${(70 + pY * 5) * s}
          Z
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Maneuvering thruster pods on nacelles */}
      <Ellipse cx={20*s} cy={(78+pY*5)*s} rx={5*s} ry={3*s} fill={colors.panel} stroke={colors.hull} strokeWidth={0.5} />
      <Ellipse cx={80*s} cy={(78+pY*5)*s} rx={5*s} ry={3*s} fill={colors.panel} stroke={colors.hull} strokeWidth={0.5} />

      {/* Panel lines */}
      <PanelLine x1={40*s} y1={(30+pY)*s} x2={35*s} y2={(50+pY*3)*s} color={colors.panel} />
      <PanelLine x1={60*s} y1={(30+pY)*s} x2={65*s} y2={(50+pY*3)*s} color={colors.panel} />

      {/* Main engine housing - conical */}
      <Path
        d={`
          M ${42 * s} ${(72 + pY * 5) * s}
          L ${38 * s} ${(86 + pY * 6) * s}
          L ${62 * s} ${(86 + pY * 6) * s}
          L ${58 * s} ${(72 + pY * 5) * s}
          Z
        `}
        fill={colors.panel}
        stroke={colors.hull}
        strokeWidth={1}
      />

      {/* Engine bell */}
      <Ellipse cx={engineX} cy={(85+pY*6)*s} rx={10*s} ry={4*s} fill={colors.hull} stroke={colors.panel} strokeWidth={0.5} />

      {/* Engine nozzle */}
      <EngineNozzle cx={engineX} cy={engineY} width={18} height={12} scale={s} />

      {/* Running lights */}
      <Circle cx={25*s} cy={(35+pY)*s} r={2*s} fill={colors.accent} opacity={0.9} />
      <Circle cx={75*s} cy={(35+pY)*s} r={2*s} fill={colors.accent} opacity={0.9} />
    </G>
  );
}

export function ShipVisualization3D({
  shipType = 'scout',
  size = { width: 300, height: 400 },
}: ShipVisualization3DProps) {
  const attitude = useFlightStore((s) => s.attitude);
  const throttle = useFlightStore((s) => s.throttle);

  const colors = SHIP_COLORS[shipType] || SHIP_COLORS.scout;
  // Zoom out - ship takes up less of viewport for better perspective
  const shipSize = Math.min(size.width, size.height) * 0.45;

  const shipProps = {
    colors,
    roll: attitude.roll.smoothed,
    pitch: attitude.pitch.smoothed,
    throttle: throttle.current,
    size: shipSize,
  };

  const renderShip = () => {
    switch (shipType) {
      case 'scout': return <ScoutShip {...shipProps} />;
      case 'fighter': return <FighterShip {...shipProps} />;
      case 'trader': return <TraderShip {...shipProps} />;
      case 'explorer': return <ExplorerShip {...shipProps} />;
      default: return <ScoutShip {...shipProps} />;
    }
  };

  return (
    <View style={[styles.container, { width: size.width, height: size.height }]}>
      <Svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        {/* Space background */}
        <Rect x="0" y="0" width={size.width} height={size.height} fill="#030308" />

        {/* Starfield */}
        <Starfield
          width={size.width}
          height={size.height}
          pitch={attitude.pitch.smoothed}
          yaw={attitude.yaw.smoothed}
        />

        {/* Sun/Star light source */}
        <SunLight
          width={size.width}
          height={size.height}
          pitch={attitude.pitch.smoothed}
          yaw={attitude.yaw.smoothed}
        />

        {/* Ship */}
        <G transform={`translate(${(size.width - shipSize) / 2}, ${(size.height - shipSize) / 2})`}>
          {renderShip()}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 4,
  },
});
