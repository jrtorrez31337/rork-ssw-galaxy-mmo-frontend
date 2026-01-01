import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { tokens } from '@/ui/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { createProjector, sortByDepth, type ProjectedPoint } from '@/lib/sectorProjection';
import { useProcgenStore } from '@/stores/procgenStore';
import type { NPCEntity } from '@/types/combat';
import { getNPCColor } from '@/types/combat';
import type { Station } from '@/types/movement';
import type { SectorShip } from '@/api/sectorEntities';

const SECTOR_SIZE = 20000;
const SCANNER_SIZE = 180;

// Helper to check if a projected point has valid coordinates
const isValidProjection = (pos: ProjectedPoint): boolean => {
  return (
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y) &&
    Number.isFinite(pos.scale) &&
    Number.isFinite(pos.opacity)
  );
};

// Helper to check if a position array is valid
const isValidPosition = (pos: [number, number, number] | undefined): pos is [number, number, number] => {
  return (
    pos !== undefined &&
    Array.isArray(pos) &&
    pos.length === 3 &&
    pos.every((v) => Number.isFinite(v))
  );
};

interface LongRangeScannerProps {
  sectorId?: string;
  playerPosition?: [number, number, number];
  npcs?: NPCEntity[];
  dbStations?: Station[];
  otherShips?: SectorShip[];
  currentShipId?: string;
}

/**
 * LongRangeScanner - Compact radar display for tactical LCARS bar
 *
 * Shows a simplified sector view with:
 * - Grid background
 * - Player position
 * - NPC contacts
 * - Stations
 * - Other ships
 */
export function LongRangeScanner({
  sectorId,
  playerPosition,
  npcs = [],
  dbStations = [],
  otherShips = [],
  currentShipId,
}: LongRangeScannerProps) {
  const { sectorViewMode, sectorGridEnabled, sectorDepthCuesEnabled } = useSettingsStore();
  const { getSector } = useProcgenStore();

  // Create projector for 3D to 2D conversion
  const project = useMemo(() => createProjector({
    viewSize: SCANNER_SIZE,
    sectorSize: SECTOR_SIZE,
    viewMode: sectorViewMode,
    depthCuesEnabled: sectorDepthCuesEnabled,
  }), [sectorViewMode, sectorDepthCuesEnabled]);

  const to2D = (pos: [number, number, number]): ProjectedPoint => project(pos);

  // Get ship triangle points
  const getShipPoints = (x: number, y: number, size: number = 8): string => {
    return `${x},${y - size} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}`;
  };

  // Count contacts for display
  const totalContacts = npcs.length + dbStations.length + otherShips.filter(s => s.id !== currentShipId).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LONG RANGE</Text>
        <Text style={styles.contactCount}>{totalContacts} CONTACTS</Text>
      </View>

      <View style={styles.scannerContainer}>
        <Svg
          width={SCANNER_SIZE}
          height={SCANNER_SIZE}
          viewBox={`0 0 ${SCANNER_SIZE} ${SCANNER_SIZE}`}
        >
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={SCANNER_SIZE}
            height={SCANNER_SIZE}
            fill={tokens.colors.console.void}
          />

          {/* Grid lines */}
          {sectorGridEnabled && (
            <G opacity={0.2}>
              {[...Array(5)].map((_, i) => {
                const pos = (i / 4) * SCANNER_SIZE;
                return (
                  <G key={i}>
                    <Line
                      x1={pos}
                      y1={0}
                      x2={pos}
                      y2={SCANNER_SIZE}
                      stroke={tokens.colors.semantic.combat}
                      strokeWidth={0.5}
                    />
                    <Line
                      x1={0}
                      y1={pos}
                      x2={SCANNER_SIZE}
                      y2={pos}
                      stroke={tokens.colors.semantic.combat}
                      strokeWidth={0.5}
                    />
                  </G>
                );
              })}
            </G>
          )}

          {/* Range rings */}
          <G opacity={0.3}>
            <Circle
              cx={SCANNER_SIZE / 2}
              cy={SCANNER_SIZE / 2}
              r={SCANNER_SIZE * 0.25}
              fill="none"
              stroke={tokens.colors.semantic.combat}
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
            <Circle
              cx={SCANNER_SIZE / 2}
              cy={SCANNER_SIZE / 2}
              r={SCANNER_SIZE * 0.45}
              fill="none"
              stroke={tokens.colors.semantic.combat}
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          </G>

          {/* Center crosshair */}
          <G opacity={0.6}>
            <Line
              x1={SCANNER_SIZE / 2 - 10}
              y1={SCANNER_SIZE / 2}
              x2={SCANNER_SIZE / 2 + 10}
              y2={SCANNER_SIZE / 2}
              stroke={tokens.colors.semantic.combat}
              strokeWidth={1}
            />
            <Line
              x1={SCANNER_SIZE / 2}
              y1={SCANNER_SIZE / 2 - 10}
              x2={SCANNER_SIZE / 2}
              y2={SCANNER_SIZE / 2 + 10}
              stroke={tokens.colors.semantic.combat}
              strokeWidth={1}
            />
          </G>

          {/* Database Stations */}
          {sortByDepth(
            dbStations
              .filter((station) =>
                station.position &&
                Number.isFinite(station.position.x) &&
                Number.isFinite(station.position.y) &&
                Number.isFinite(station.position.z)
              )
              .map((station) => ({
                ...station,
                projected: to2D([station.position.x, station.position.y, station.position.z]),
              }))
              .filter((station) => isValidProjection(station.projected))
          ).map((station) => {
            const pos = station.projected;
            const size = 4 * pos.scale;
            return (
              <G key={station.id} opacity={pos.opacity}>
                <Rect
                  x={pos.x - size}
                  y={pos.y - size}
                  width={size * 2}
                  height={size * 2}
                  fill="#10b981"
                  rx={2}
                />
              </G>
            );
          })}

          {/* Other Player Ships */}
          {sortByDepth(
            otherShips
              .filter((ship) =>
                ship.id !== currentShipId &&
                ship.position &&
                Number.isFinite(ship.position.x) &&
                Number.isFinite(ship.position.y) &&
                Number.isFinite(ship.position.z)
              )
              .map((ship) => ({
                ...ship,
                projected: to2D([ship.position.x, ship.position.y, ship.position.z]),
              }))
              .filter((ship) => isValidProjection(ship.projected))
          ).map((ship) => {
            const pos = ship.projected;
            const size = 5 * pos.scale;
            return (
              <G key={ship.id} opacity={pos.opacity}>
                <Polygon
                  points={`${pos.x},${pos.y - size} ${pos.x + size * 0.8},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size * 0.8},${pos.y}`}
                  fill="#8b5cf6"
                />
              </G>
            );
          })}

          {/* Player ship */}
          {isValidPosition(playerPosition) && (() => {
            const pos = to2D(playerPosition);
            if (!isValidProjection(pos)) return null;
            const size = 8 * pos.scale;
            return (
              <G opacity={pos.opacity}>
                <Polygon
                  points={getShipPoints(pos.x, pos.y, size)}
                  fill={tokens.colors.primary.main}
                  stroke={tokens.colors.primary.main}
                  strokeWidth={1}
                />
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={12 * pos.scale}
                  fill={tokens.colors.primary.main}
                  opacity={0.2}
                />
              </G>
            );
          })()}

          {/* NPC ships */}
          {sortByDepth(
            npcs
              .filter((npc) => isValidPosition(npc.position))
              .map((npc) => ({
                ...npc,
                projected: to2D(npc.position),
              }))
              .filter((npc) => isValidProjection(npc.projected))
          ).map((npc) => {
            const pos = npc.projected;
            const color = getNPCColor(npc.npc_type);
            const size = 6 * pos.scale;
            return (
              <G key={npc.entity_id} opacity={pos.opacity}>
                <Polygon
                  points={getShipPoints(pos.x, pos.y, size)}
                  fill={color}
                />
                {/* Hostile indicator */}
                {npc.npc_type === 'pirate' && (
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={10 * pos.scale}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.5}
                  />
                )}
              </G>
            );
          })}

          {/* Sweep line animation effect */}
          <Line
            x1={SCANNER_SIZE / 2}
            y1={SCANNER_SIZE / 2}
            x2={SCANNER_SIZE}
            y2={SCANNER_SIZE / 2}
            stroke={tokens.colors.semantic.combat}
            strokeWidth={1}
            opacity={0.4}
          />
        </Svg>

        {/* Corner markers */}
        <View style={[styles.cornerMarker, styles.cornerTL]} />
        <View style={[styles.cornerMarker, styles.cornerTR]} />
        <View style={[styles.cornerMarker, styles.cornerBL]} />
        <View style={[styles.cornerMarker, styles.cornerBR]} />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: tokens.colors.primary.main }]} />
          <Text style={styles.legendText}>YOU</Text>
        </View>
        {npcs.some(n => n.npc_type === 'pirate') && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>HOSTILE</Text>
          </View>
        )}
        {dbStations.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>STN</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  header: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  contactCount: {
    fontSize: 8,
    fontWeight: '600',
    color: tokens.colors.semantic.combat,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  scannerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: tokens.colors.semantic.combat + '60',
    borderRadius: 4,
  },
  cornerMarker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: tokens.colors.semantic.combat,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendSquare: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 7,
    fontWeight: '600',
    color: tokens.colors.text.muted,
  },
});
