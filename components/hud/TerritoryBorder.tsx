import React from 'react';
import { Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import type { SectorControlData } from '@/hooks/useSectorControl';

/**
 * TerritoryBorder - SVG overlay showing faction control
 *
 * Renders as a colored border around the sector view to indicate:
 * - Controlled territory (solid color)
 * - Contested territory (striped/pulsing pattern)
 * - Neutral space (gray/no border)
 *
 * Per UI/UX Doctrine: Visual feedback for strategic information
 */

interface TerritoryBorderProps {
  /** View dimensions */
  viewSize: number;
  /** Sector control data from useSectorControl hook */
  controlData: SectorControlData | null;
  /** Border width */
  borderWidth?: number;
  /** Opacity for the border */
  opacity?: number;
}

export function TerritoryBorder({
  viewSize,
  controlData,
  borderWidth = 4,
  opacity = 0.8,
}: TerritoryBorderProps) {
  if (!controlData) {
    return null;
  }

  const { status, controllingFaction, contestingFaction, isContested } = controlData;

  // Neutral sectors - subtle gray border
  if (status === 'neutral' || !controllingFaction) {
    return (
      <Rect
        x={borderWidth / 2}
        y={borderWidth / 2}
        width={viewSize - borderWidth}
        height={viewSize - borderWidth}
        fill="none"
        stroke="#6B7280"
        strokeWidth={borderWidth}
        strokeOpacity={0.3}
        rx={8}
      />
    );
  }

  const primaryColor = controllingFaction.color;

  // Contested zones - gradient border with both faction colors
  if (isContested && contestingFaction) {
    const secondaryColor = contestingFaction.color;

    return (
      <G>
        <Defs>
          {/* Gradient for contested border */}
          <LinearGradient id="contestedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity={opacity} />
            <Stop offset="25%" stopColor={primaryColor} stopOpacity={opacity} />
            <Stop offset="50%" stopColor={secondaryColor} stopOpacity={opacity} />
            <Stop offset="75%" stopColor={secondaryColor} stopOpacity={opacity} />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity={opacity} />
          </LinearGradient>
        </Defs>

        {/* Contested border with gradient */}
        <Rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={viewSize - borderWidth}
          height={viewSize - borderWidth}
          fill="none"
          stroke="url(#contestedGradient)"
          strokeWidth={borderWidth}
          strokeDasharray={`${borderWidth * 3} ${borderWidth * 2}`}
          rx={8}
        />

        {/* Inner glow for contested zones */}
        <Rect
          x={borderWidth * 2}
          y={borderWidth * 2}
          width={viewSize - borderWidth * 4}
          height={viewSize - borderWidth * 4}
          fill="none"
          stroke={primaryColor}
          strokeWidth={1}
          strokeOpacity={0.2}
          rx={6}
        />
      </G>
    );
  }

  // Controlled territory - solid faction color border
  return (
    <G>
      {/* Main border */}
      <Rect
        x={borderWidth / 2}
        y={borderWidth / 2}
        width={viewSize - borderWidth}
        height={viewSize - borderWidth}
        fill="none"
        stroke={primaryColor}
        strokeWidth={borderWidth}
        strokeOpacity={opacity}
        rx={8}
      />

      {/* Corner accents for controlled territory */}
      <CornerAccent
        x={0}
        y={0}
        color={primaryColor}
        size={20}
        rotation={0}
      />
      <CornerAccent
        x={viewSize}
        y={0}
        color={primaryColor}
        size={20}
        rotation={90}
      />
      <CornerAccent
        x={viewSize}
        y={viewSize}
        color={primaryColor}
        size={20}
        rotation={180}
      />
      <CornerAccent
        x={0}
        y={viewSize}
        color={primaryColor}
        size={20}
        rotation={270}
      />
    </G>
  );
}

/**
 * Corner accent for controlled territories
 */
interface CornerAccentProps {
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

function CornerAccent({ x, y, color, size, rotation }: CornerAccentProps) {
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <Rect
        x={2}
        y={2}
        width={size}
        height={4}
        fill={color}
        opacity={0.6}
      />
      <Rect
        x={2}
        y={2}
        width={4}
        height={size}
        fill={color}
        opacity={0.6}
      />
    </G>
  );
}

/**
 * TerritoryOverlay - Full sector overlay with control indicator
 * Use this for more prominent territory display
 */
interface TerritoryOverlayProps {
  viewSize: number;
  controlData: SectorControlData | null;
}

export function TerritoryOverlay({ viewSize, controlData }: TerritoryOverlayProps) {
  if (!controlData || controlData.status === 'neutral') {
    return null;
  }

  const { controllingFaction, isContested } = controlData;
  if (!controllingFaction) return null;

  const color = controllingFaction.color;

  return (
    <G>
      {/* Subtle background tint */}
      <Rect
        x={0}
        y={0}
        width={viewSize}
        height={viewSize}
        fill={color}
        opacity={isContested ? 0.05 : 0.03}
      />

      {/* Border */}
      <TerritoryBorder
        viewSize={viewSize}
        controlData={controlData}
      />
    </G>
  );
}

export default TerritoryBorder;
