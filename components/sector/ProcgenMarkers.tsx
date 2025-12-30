/**
 * Procgen SVG Markers
 *
 * SVG components for rendering procedurally generated sector content
 * in the 2D sector view. These are lightweight visual markers.
 */

import { G, Circle, Polygon, Rect, Line, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import type {
  Star,
  Station,
  AsteroidField,
  NavigationHazard,
  Anomaly,
  Planet,
} from '@/lib/procgen/types';
import { STAR_COLORS } from '@/lib/procgen/types';

interface MarkerProps {
  x: number;
  y: number;
  scale?: number;
}

/**
 * Star marker - Central star with glow effect
 */
export function StarMarker({
  star,
  x,
  y,
  scale = 1,
}: MarkerProps & { star: Star }) {
  const color = STAR_COLORS[star.type] || '#FFFF66';
  const size = 25 * star.radius * scale;

  return (
    <G>
      {/* Outer glow */}
      <Circle
        cx={x}
        cy={y}
        r={size * 2}
        fill={color}
        opacity={0.1}
      />
      {/* Inner glow */}
      <Circle
        cx={x}
        cy={y}
        r={size * 1.3}
        fill={color}
        opacity={0.25}
      />
      {/* Star core */}
      <Circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        opacity={0.9}
      />
      {/* Label */}
      <SvgText
        x={x}
        y={y + size + 15}
        fontSize={10}
        fill={color}
        textAnchor="middle"
        opacity={0.8}
      >
        {star.type} Star
      </SvgText>
    </G>
  );
}

/**
 * Station marker - Square with icon
 */
export function StationMarker({
  station,
  x,
  y,
  scale = 1,
  selected = false,
}: MarkerProps & { station: Station; selected?: boolean }) {
  const size = 12 * scale;
  const color = getStationColor(station.type);

  return (
    <G>
      {/* Selection ring */}
      {selected && (
        <Rect
          x={x - size - 4}
          y={y - size - 4}
          width={(size + 4) * 2}
          height={(size + 4) * 2}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.8}
        />
      )}
      {/* Station icon (square with cross) */}
      <Rect
        x={x - size}
        y={y - size}
        width={size * 2}
        height={size * 2}
        fill={color}
        opacity={0.8}
      />
      <Line
        x1={x - size}
        y1={y}
        x2={x + size}
        y2={y}
        stroke="#000"
        strokeWidth={1}
        opacity={0.5}
      />
      <Line
        x1={x}
        y1={y - size}
        x2={x}
        y2={y + size}
        stroke="#000"
        strokeWidth={1}
        opacity={0.5}
      />
      {/* Label */}
      <SvgText
        x={x}
        y={y + size + 12}
        fontSize={9}
        fill={color}
        textAnchor="middle"
        fontWeight="600"
      >
        {station.name.length > 12 ? station.name.slice(0, 12) + '...' : station.name}
      </SvgText>
    </G>
  );
}

function getStationColor(type: string): string {
  switch (type) {
    case 'trade': return '#10b981'; // Green
    case 'military': return '#ef4444'; // Red
    case 'research': return '#8b5cf6'; // Purple
    case 'mining': return '#f59e0b'; // Amber
    case 'residential': return '#3b82f6'; // Blue
    default: return '#6b7280'; // Gray
  }
}

/**
 * Asteroid field marker - Cluster of dots
 */
export function AsteroidFieldMarker({
  field,
  x,
  y,
  scale = 1,
}: MarkerProps & { field: AsteroidField }) {
  const baseRadius = Math.min(field.radiusX, field.radiusY) * 0.01 * scale;
  const color = field.dominantColor || '#8B7355';

  // Generate a few representative asteroids
  const asteroids = [];
  const count = Math.min(8, Math.ceil(field.density * 10));
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = baseRadius * (0.3 + Math.random() * 0.7);
    asteroids.push({
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      r: 2 + Math.random() * 3,
    });
  }

  return (
    <G>
      {/* Field boundary (subtle) */}
      <Circle
        cx={x}
        cy={y}
        r={baseRadius}
        fill={color}
        opacity={0.1}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4,4"
      />
      {/* Asteroid dots */}
      {asteroids.map((a, i) => (
        <Circle
          key={i}
          cx={a.x}
          cy={a.y}
          r={a.r}
          fill={color}
          opacity={0.7}
        />
      ))}
      {/* Label */}
      <SvgText
        x={x}
        y={y + baseRadius + 12}
        fontSize={9}
        fill={color}
        textAnchor="middle"
        opacity={0.8}
      >
        Asteroids
      </SvgText>
    </G>
  );
}

/**
 * Hazard marker - Warning triangle or zone
 */
export function HazardMarker({
  hazard,
  x,
  y,
  scale = 1,
}: MarkerProps & { hazard: NavigationHazard }) {
  const radius = Math.max(15, hazard.radius * 0.005 * scale);
  const color = hazard.warningColor || '#FF6600';

  return (
    <G>
      {/* Hazard zone */}
      <Circle
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        opacity={0.15}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="6,3"
      />
      {/* Warning icon (triangle) */}
      <Polygon
        points={`${x},${y - 8} ${x - 7},${y + 5} ${x + 7},${y + 5}`}
        fill={color}
        opacity={0.9}
      />
      {/* Exclamation mark */}
      <Line
        x1={x}
        y1={y - 4}
        x2={x}
        y2={y + 1}
        stroke="#000"
        strokeWidth={2}
      />
      <Circle
        cx={x}
        cy={y + 3}
        r={1}
        fill="#000"
      />
    </G>
  );
}

/**
 * Anomaly marker - Pulsing effect
 */
export function AnomalyMarker({
  anomaly,
  x,
  y,
  scale = 1,
}: MarkerProps & { anomaly: Anomaly }) {
  const radius = Math.max(12, anomaly.radius * 0.003 * scale);
  const color = anomaly.particleColor || '#9900FF';

  return (
    <G>
      {/* Outer pulse ring */}
      <Circle
        cx={x}
        cy={y}
        r={radius * 1.5}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.3}
        strokeDasharray="3,3"
      />
      {/* Inner glow */}
      <Circle
        cx={x}
        cy={y}
        r={radius}
        fill={color}
        opacity={0.2}
      />
      {/* Core */}
      <Circle
        cx={x}
        cy={y}
        r={radius * 0.4}
        fill={color}
        opacity={0.8}
      />
      {/* Label */}
      <SvgText
        x={x}
        y={y + radius + 12}
        fontSize={9}
        fill={color}
        textAnchor="middle"
        opacity={0.8}
      >
        {getAnomalyLabel(anomaly.type)}
      </SvgText>
    </G>
  );
}

function getAnomalyLabel(type: string): string {
  switch (type) {
    case 'wormhole': return 'Wormhole';
    case 'rift': return 'Rift';
    case 'radiation_zone': return 'Radiation';
    case 'gravity_well': return 'Gravity Well';
    case 'temporal_distortion': return 'Temporal';
    default: return 'Anomaly';
  }
}

/**
 * Planet marker - Circle with optional rings
 */
export function PlanetMarker({
  planet,
  x,
  y,
  scale = 1,
}: MarkerProps & { planet: Planet }) {
  const size = Math.max(6, planet.radius * 2 * scale);
  const color = planet.surfaceColor || '#4A90D9';

  return (
    <G>
      {/* Rings (if present) */}
      {planet.rings && (
        <G>
          <Circle
            cx={x}
            cy={y}
            r={size * 1.8}
            fill="none"
            stroke={planet.rings.color}
            strokeWidth={3}
            opacity={0.4}
          />
        </G>
      )}
      {/* Planet body */}
      <Circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        opacity={0.9}
      />
      {/* Atmosphere glow */}
      {planet.hasAtmosphere && (
        <Circle
          cx={x}
          cy={y}
          r={size * 1.15}
          fill="none"
          stroke={planet.atmosphereColor || '#88CCFF'}
          strokeWidth={2}
          opacity={0.5}
        />
      )}
      {/* Label */}
      <SvgText
        x={x}
        y={y + size + 12}
        fontSize={8}
        fill={color}
        textAnchor="middle"
        opacity={0.8}
      >
        {planet.name.length > 10 ? planet.name.slice(0, 10) : planet.name}
      </SvgText>
    </G>
  );
}
