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
 * Scout - Fast recon vessel, angular stealth design
 * Single large main engine
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

  // Engine position - centered, at bottom of hull
  const engineX = 50 * s;
  const engineY = (82 + pY * 6) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="scoutHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="50%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Engine exhaust - behind ship */}
      <EngineExhaust cx={engineX} cy={engineY} throttle={throttle} scale={s * 1.2} />

      {/* Main hull - angular wedge */}
      <Polygon
        points={`
          ${50 * s},${(10 - pY * 12) * s}
          ${(80 + pY * 5) * s},${(50 + pY * 3) * s}
          ${(70 + pY * 4) * s},${(80 + pY * 6) * s}
          ${(30 - pY * 4) * s},${(80 + pY * 6) * s}
          ${(20 - pY * 5) * s},${(50 + pY * 3) * s}
        `}
        fill="url(#scoutHull)"
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Armored plates */}
      <Polygon
        points={`
          ${50 * s},${(18 - pY * 10) * s}
          ${(68 + pY * 4) * s},${(45 + pY * 2) * s}
          ${50 * s},${58 * s}
          ${(32 - pY * 4) * s},${(45 + pY * 2) * s}
        `}
        fill={colors.plate}
        stroke={colors.panel}
        strokeWidth={0.5}
      />

      {/* Panel lines */}
      <PanelLine x1={50*s} y1={(25-pY*8)*s} x2={(65+pY*3)*s} y2={(42+pY*2)*s} color={colors.panel} />
      <PanelLine x1={50*s} y1={(25-pY*8)*s} x2={(35-pY*3)*s} y2={(42+pY*2)*s} color={colors.panel} />
      <PanelLine x1={50*s} y1={55*s} x2={(60+pY*3)*s} y2={(70+pY*4)*s} color={colors.panel} />
      <PanelLine x1={50*s} y1={55*s} x2={(40-pY*3)*s} y2={(70+pY*4)*s} color={colors.panel} />

      {/* Cockpit viewport */}
      <Polygon
        points={`
          ${50 * s},${(28 - pY * 7) * s}
          ${(58 + pY * 2) * s},${(38 - pY * 4) * s}
          ${(58 + pY * 2) * s},${(45 - pY * 3) * s}
          ${50 * s},${50 * s}
          ${(42 - pY * 2) * s},${(45 - pY * 3) * s}
          ${(42 - pY * 2) * s},${(38 - pY * 4) * s}
        `}
        fill={colors.panel}
        stroke={colors.accent}
        strokeWidth={1}
      />
      {/* Viewport glass */}
      <Polygon
        points={`
          ${50 * s},${(32 - pY * 6) * s}
          ${(54 + pY * 1) * s},${(38 - pY * 4) * s}
          ${50 * s},${44 * s}
          ${(46 - pY * 1) * s},${(38 - pY * 4) * s}
        `}
        fill="#1a4455"
        stroke={colors.accent}
        strokeWidth={0.5}
        opacity={0.9}
      />

      {/* Main engine housing - large and prominent */}
      <Rect
        x={(38) * s} y={(70 + pY * 5) * s}
        width={24 * s} height={12 * s}
        fill={colors.panel}
        stroke={colors.hull}
        strokeWidth={1}
      />
      {/* Engine nozzle */}
      <EngineNozzle cx={engineX} cy={engineY} width={18} height={10} scale={s} />
    </G>
  );
}

/**
 * Fighter - Heavy combat vessel, brutal angular design
 * Twin engines
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
  const leftEngineX = 35 * s;
  const rightEngineX = 65 * s;
  const engineY = (86 + pY * 6) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="fighterHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="60%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Twin engine exhausts - behind ship */}
      <EngineExhaust cx={leftEngineX} cy={engineY} throttle={throttle} scale={s * 1.1} />
      <EngineExhaust cx={rightEngineX} cy={engineY} throttle={throttle} scale={s * 1.1} />

      {/* Main hull - aggressive angular */}
      <Polygon
        points={`
          ${50 * s},${(8 - pY * 12) * s}
          ${(78 + pY * 6) * s},${(40 + pY * 2) * s}
          ${(85 + pY * 7) * s},${(60 + pY * 4) * s}
          ${(72 + pY * 5) * s},${(82 + pY * 6) * s}
          ${(28 - pY * 5) * s},${(82 + pY * 6) * s}
          ${(15 - pY * 7) * s},${(60 + pY * 4) * s}
          ${(22 - pY * 6) * s},${(40 + pY * 2) * s}
        `}
        fill="url(#fighterHull)"
        stroke={colors.edge}
        strokeWidth={1.5}
      />

      {/* Wing weapon pylons */}
      <Polygon
        points={`
          ${(15 - pY * 7) * s},${(60 + pY * 4) * s}
          ${(5) * s},${(72 + pY * 5) * s}
          ${(8) * s},${(78 + pY * 6) * s}
          ${(28 - pY * 5) * s},${(75 + pY * 5) * s}
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />
      <Polygon
        points={`
          ${(85 + pY * 7) * s},${(60 + pY * 4) * s}
          ${(95) * s},${(72 + pY * 5) * s}
          ${(92) * s},${(78 + pY * 6) * s}
          ${(72 + pY * 5) * s},${(75 + pY * 5) * s}
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Weapon hardpoints */}
      <Rect x={3*s} y={(70+pY*5)*s} width={6*s} height={10*s} fill={colors.panel} stroke={colors.accent} strokeWidth={0.5} />
      <Rect x={91*s} y={(70+pY*5)*s} width={6*s} height={10*s} fill={colors.panel} stroke={colors.accent} strokeWidth={0.5} />

      {/* Center armor plate */}
      <Polygon
        points={`
          ${50 * s},${(20 - pY * 10) * s}
          ${(68 + pY * 4) * s},${(42 + pY * 2) * s}
          ${(65 + pY * 4) * s},${(65 + pY * 4) * s}
          ${(35 - pY * 4) * s},${(65 + pY * 4) * s}
          ${(32 - pY * 4) * s},${(42 + pY * 2) * s}
        `}
        fill={colors.plate}
        stroke={colors.panel}
        strokeWidth={0.5}
      />

      {/* Panel lines */}
      <PanelLine x1={50*s} y1={(30-pY*8)*s} x2={(62+pY*3)*s} y2={(50+pY*2)*s} color={colors.panel} />
      <PanelLine x1={50*s} y1={(30-pY*8)*s} x2={(38-pY*3)*s} y2={(50+pY*2)*s} color={colors.panel} />

      {/* Cockpit - armored canopy */}
      <Polygon
        points={`
          ${50 * s},${(25 - pY * 8) * s}
          ${(60 + pY * 2) * s},${(35 - pY * 5) * s}
          ${(58 + pY * 2) * s},${(48 - pY * 3) * s}
          ${(42 - pY * 2) * s},${(48 - pY * 3) * s}
          ${(40 - pY * 2) * s},${(35 - pY * 5) * s}
        `}
        fill="#1a1a22"
        stroke={colors.accent}
        strokeWidth={1}
      />

      {/* Left engine nacelle - large and prominent */}
      <Rect x={24*s} y={(70+pY*5)*s} width={22*s} height={16*s} fill={colors.panel} stroke={colors.hull} strokeWidth={1} />
      <EngineNozzle cx={leftEngineX} cy={engineY} width={16} height={10} scale={s} />

      {/* Right engine nacelle - large and prominent */}
      <Rect x={54*s} y={(70+pY*5)*s} width={22*s} height={16*s} fill={colors.panel} stroke={colors.hull} strokeWidth={1} />
      <EngineNozzle cx={rightEngineX} cy={engineY} width={16} height={10} scale={s} />
    </G>
  );
}

/**
 * Trader - Industrial cargo hauler, blocky utilitarian
 * Triple engine array
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
  const leftEngineX = 28 * s;
  const centerEngineX = 50 * s;
  const rightEngineX = 72 * s;
  const engineY = (90 + pY * 5) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="traderHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="50%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Triple engine exhausts - behind ship */}
      <EngineExhaust cx={leftEngineX} cy={engineY} throttle={throttle} scale={s * 0.9} wide />
      <EngineExhaust cx={centerEngineX} cy={engineY} throttle={throttle} scale={s * 1.1} wide />
      <EngineExhaust cx={rightEngineX} cy={engineY} throttle={throttle} scale={s * 0.9} wide />

      {/* Main cargo hull - blocky industrial */}
      <Polygon
        points={`
          ${(18 - pY * 4) * s},${(18 - pY * 8) * s}
          ${(82 + pY * 4) * s},${(18 - pY * 8) * s}
          ${(85 + pY * 5) * s},${(75 + pY * 6) * s}
          ${(80 + pY * 4) * s},${(85 + pY * 6) * s}
          ${(20 - pY * 4) * s},${(85 + pY * 6) * s}
          ${(15 - pY * 5) * s},${(75 + pY * 6) * s}
        `}
        fill="url(#traderHull)"
        stroke={colors.edge}
        strokeWidth={1.5}
      />

      {/* Cargo container segments */}
      <Rect x={(22-pY*3)*s} y={(28-pY*6)*s} width={(56+pY*6)*s} height={18*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} />
      <Rect x={(22-pY*2)*s} y={(50-pY*3)*s} width={(56+pY*4)*s} height={18*s} fill={colors.plate} stroke={colors.panel} strokeWidth={0.5} />

      {/* Container dividers */}
      <Line x1={40*s} y1={(28-pY*6)*s} x2={40*s} y2={(46-pY*4)*s} stroke={colors.panel} strokeWidth={1} />
      <Line x1={60*s} y1={(28-pY*6)*s} x2={60*s} y2={(46-pY*4)*s} stroke={colors.panel} strokeWidth={1} />
      <Line x1={40*s} y1={(50-pY*3)*s} x2={40*s} y2={(68-pY*1)*s} stroke={colors.panel} strokeWidth={1} />
      <Line x1={60*s} y1={(50-pY*3)*s} x2={60*s} y2={(68-pY*1)*s} stroke={colors.panel} strokeWidth={1} />

      {/* Bridge module */}
      <Polygon
        points={`
          ${(35 - pY * 2) * s},${(8 - pY * 10) * s}
          ${(65 + pY * 2) * s},${(8 - pY * 10) * s}
          ${(68 + pY * 3) * s},${(22 - pY * 7) * s}
          ${(32 - pY * 3) * s},${(22 - pY * 7) * s}
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Bridge viewport */}
      <Rect x={(40-pY)*s} y={(10-pY*9)*s} width={(20+pY*2)*s} height={8*s} fill="#1a2a22" stroke={colors.accent} strokeWidth={0.5} />

      {/* Hull reinforcement struts */}
      <Line x1={(18-pY*4)*s} y1={(35-pY*5)*s} x2={(18-pY*4)*s} y2={(70+pY*4)*s} stroke={colors.plate} strokeWidth={2} />
      <Line x1={(82+pY*4)*s} y1={(35-pY*5)*s} x2={(82+pY*4)*s} y2={(70+pY*4)*s} stroke={colors.plate} strokeWidth={2} />

      {/* Engine housing - large triple-engine bay */}
      <Rect x={(16-pY*3)*s} y={(75+pY*5)*s} width={(68+pY*6)*s} height={15*s} fill={colors.panel} stroke={colors.hull} strokeWidth={1} />

      {/* Engine nozzles */}
      <EngineNozzle cx={leftEngineX} cy={engineY} width={14} height={10} scale={s} />
      <EngineNozzle cx={centerEngineX} cy={engineY} width={18} height={12} scale={s} />
      <EngineNozzle cx={rightEngineX} cy={engineY} width={14} height={10} scale={s} />

      {/* Engine dividers */}
      <Line x1={38*s} y1={(76+pY*5)*s} x2={38*s} y2={(89+pY*5)*s} stroke={colors.hull} strokeWidth={2} />
      <Line x1={62*s} y1={(76+pY*5)*s} x2={62*s} y2={(89+pY*5)*s} stroke={colors.hull} strokeWidth={2} />
    </G>
  );
}

/**
 * Explorer - Long-range science vessel, functional asymmetric
 * Single large main engine + maneuvering thrusters
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
  const engineY = (88 + pY * 6) * s;

  return (
    <G rotation={rollAngle} origin={`${cx}, ${50 * s}`}>
      <Defs>
        <LinearGradient id="explorerHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.plate} />
          <Stop offset="50%" stopColor={colors.hull} />
          <Stop offset="100%" stopColor={colors.panel} />
        </LinearGradient>
      </Defs>

      {/* Main engine exhaust - behind ship */}
      <EngineExhaust cx={engineX} cy={engineY} throttle={throttle} scale={s * 1.3} />

      {/* Main hull - elongated */}
      <Polygon
        points={`
          ${50 * s},${(5 - pY * 12) * s}
          ${(72 + pY * 5) * s},${(40 + pY * 2) * s}
          ${(68 + pY * 5) * s},${(82 + pY * 6) * s}
          ${(32 - pY * 5) * s},${(82 + pY * 6) * s}
          ${(28 - pY * 5) * s},${(40 + pY * 2) * s}
        `}
        fill="url(#explorerHull)"
        stroke={colors.edge}
        strokeWidth={1}
      />

      {/* Sensor dish assembly */}
      <Circle
        cx={(78 + pY * 6) * s}
        cy={(25 - pY * 8) * s}
        r={14 * s}
        fill={colors.plate}
        stroke={colors.accent}
        strokeWidth={1}
      />
      <Circle
        cx={(78 + pY * 6) * s}
        cy={(25 - pY * 8) * s}
        r={10 * s}
        fill={colors.hull}
        stroke={colors.panel}
        strokeWidth={0.5}
      />
      <Circle
        cx={(78 + pY * 6) * s}
        cy={(25 - pY * 8) * s}
        r={4 * s}
        fill={colors.accent}
        opacity={0.8}
      />
      {/* Dish arm */}
      <Rect
        x={(62 + pY * 4) * s}
        y={(32 - pY * 5) * s}
        width={14 * s}
        height={4 * s}
        fill={colors.hull}
        stroke={colors.panel}
        strokeWidth={0.5}
      />

      {/* Science module */}
      <Rect
        x={(38 - pY * 2) * s}
        y={(22 - pY * 9) * s}
        width={(24 + pY * 4) * s}
        height={20 * s}
        fill={colors.plate}
        stroke={colors.panel}
        strokeWidth={0.5}
      />

      {/* Sensor arrays */}
      {[0, 1, 2, 3].map(i => (
        <Rect
          key={i}
          x={(42 + i * 5) * s}
          y={(15 - pY * 10) * s}
          width={3 * s}
          height={6 * s}
          fill={colors.accent}
          opacity={0.8}
        />
      ))}

      {/* Wing struts */}
      <Polygon
        points={`
          ${(28 - pY * 5) * s},${(45 + pY * 2) * s}
          ${(10) * s},${(65 + pY * 4) * s}
          ${(15) * s},${(70 + pY * 4) * s}
          ${(32 - pY * 4) * s},${(55 + pY * 3) * s}
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />
      <Polygon
        points={`
          ${(72 + pY * 5) * s},${(45 + pY * 2) * s}
          ${(90) * s},${(65 + pY * 4) * s}
          ${(85) * s},${(70 + pY * 4) * s}
          ${(68 + pY * 4) * s},${(55 + pY * 3) * s}
        `}
        fill={colors.hull}
        stroke={colors.plate}
        strokeWidth={0.5}
      />

      {/* Cockpit */}
      <Polygon
        points={`
          ${50 * s},${(18 - pY * 10) * s}
          ${(58 + pY * 2) * s},${(28 - pY * 7) * s}
          ${(55 + pY * 1) * s},${(40 - pY * 4) * s}
          ${(45 - pY * 1) * s},${(40 - pY * 4) * s}
          ${(42 - pY * 2) * s},${(28 - pY * 7) * s}
        `}
        fill="#1a1a2a"
        stroke={colors.accent}
        strokeWidth={0.5}
      />

      {/* Panel lines */}
      <PanelLine x1={50*s} y1={(35-pY*5)*s} x2={(65+pY*4)*s} y2={(60+pY*3)*s} color={colors.panel} />
      <PanelLine x1={50*s} y1={(35-pY*5)*s} x2={(35-pY*4)*s} y2={(60+pY*3)*s} color={colors.panel} />

      {/* Main engine housing - large and prominent */}
      <Rect x={(34-pY*3)*s} y={(73+pY*5)*s} width={(32+pY*6)*s} height={15*s} fill={colors.panel} stroke={colors.hull} strokeWidth={1} />

      {/* Engine nozzle */}
      <EngineNozzle cx={engineX} cy={engineY} width={22} height={12} scale={s} />

      {/* Maneuvering thruster pods on wings */}
      <Circle cx={12*s} cy={(67+pY*4)*s} r={4*s} fill={colors.panel} stroke={colors.hull} strokeWidth={0.5} />
      <Circle cx={88*s} cy={(67+pY*4)*s} r={4*s} fill={colors.panel} stroke={colors.hull} strokeWidth={0.5} />
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
