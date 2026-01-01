import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Svg, { Circle, Polygon, Text as SvgText, G, Line, Rect } from 'react-native-svg';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import type { NPCEntity } from '@/types/combat';
import { getNPCColor } from '@/types/combat';
import { useProcgenStore } from '@/stores/procgenStore';
import { useSectorControl } from '@/hooks/useSectorControl';
import { useSettingsStore } from '@/stores/settingsStore';
import { createProjector, sortByDepth, type ProjectedPoint } from '@/lib/sectorProjection';
import {
  StarMarker,
  StationMarker,
  AsteroidFieldMarker,
  HazardMarker,
  AnomalyMarker,
} from '@/components/sector/ProcgenMarkers';
import { TerritoryBorder } from '@/components/hud/TerritoryBorder';
import { ThreatIndicator } from '@/components/hud/ThreatIndicator';
import type { Station } from '@/types/movement';
import type { SectorShip } from '@/api/sectorEntities';

// Sector dimensions: 20,000 units cubed (-10k to +10k on each axis)
const SECTOR_SIZE = 20000;

interface SectorGridProps {
  npcs: NPCEntity[];
  playerPosition?: [number, number, number];
  onNPCPress?: (npc: NPCEntity) => void;
  selectedNPCId?: string;
  sectorId?: string;
  showProcgen?: boolean;
  /** Database stations (always visible without scanning) */
  dbStations?: Station[];
  /** Other ships in sector (always visible without scanning) */
  otherShips?: SectorShip[];
  /** Current player's ship ID to exclude from display */
  currentShipId?: string;
}

/**
 * SectorGrid - 2D vector display of sector space
 *
 * Pure visualization component - no chrome, no overlays.
 * Shows player ship, NPCs, stations, and other ships as vector graphics.
 * Supports pinch-to-zoom and pan gestures.
 */
export function SectorGrid({
  npcs,
  playerPosition,
  onNPCPress,
  selectedNPCId,
  sectorId,
  showProcgen = true,
  dbStations = [],
  otherShips = [],
  currentShipId,
}: SectorGridProps) {
  // Container dimensions - start at 0 to force measurement
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Handle container layout to get actual dimensions
  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  }, []);

  // Gesture state for pinch-to-zoom and pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 0.5), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan gesture for moving around
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  // Combine gestures - pinch and pan can work simultaneously
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // Animated style for zoom/pan transforms
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Get procgen store for sector content
  const { getSector, enterSector } = useProcgenStore();

  // Get sector control data for territory visualization
  const { controlData } = useSectorControl(sectorId);

  // Get view settings
  const { sectorViewMode, sectorGridEnabled, sectorDepthCuesEnabled } = useSettingsStore();

  // Load sector data when sectorId changes
  useEffect(() => {
    if (sectorId && showProcgen) {
      // Check if sector not already loaded
      if (!getSector(sectorId)) {
        // enterSector handles both generation and sync
        enterSector(sectorId).catch((err) => {
          console.debug('[SectorView2D] Failed to load sector:', err);
        });
      }
    }
  }, [sectorId, showProcgen, getSector, enterSector]);

  // Get current sector data
  const sector = sectorId ? getSector(sectorId) : null;

  // Use full container dimensions for the viewport
  const VIEW_WIDTH = containerSize.width;
  const VIEW_HEIGHT = containerSize.height;
  // For sector calculations, use the smaller dimension to maintain proper scale
  const VIEW_SIZE = Math.min(VIEW_WIDTH, VIEW_HEIGHT);

  // Scale factor for procgen markers (VIEW_SIZE pixels = SECTOR_SIZE units)
  const SCALE = VIEW_SIZE / SECTOR_SIZE;

  // Create projector for 3D to 2D conversion with depth cues
  const project = useMemo(() => createProjector({
    viewSize: VIEW_SIZE,
    sectorSize: SECTOR_SIZE,
    viewMode: sectorViewMode,
    depthCuesEnabled: sectorDepthCuesEnabled,
  }), [VIEW_SIZE, sectorViewMode, sectorDepthCuesEnabled]);

  // Legacy helper for backward compatibility with simple position arrays
  const to2D = (pos: [number, number, number]): ProjectedPoint => {
    return project(pos);
  };

  // Ship triangle points (pointing up)
  const getShipPoints = (x: number, y: number, size: number = 15): string => {
    return `${x},${y - size} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}`;
  };

  // Wait for container to be measured
  if (containerSize.width === 0 || containerSize.height === 0 || VIEW_SIZE <= 0) {
    return (
      <View style={styles.container} onLayout={onContainerLayout}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing sector view...</Text>
        </View>
      </View>
    );
  }

  // Calculate offset to center the square sector area within the viewport
  const offsetX = (VIEW_WIDTH - VIEW_SIZE) / 2;
  const offsetY = (VIEW_HEIGHT - VIEW_SIZE) / 2;

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* Sector Map with Territory Overlay */}
      <View style={styles.mapContainer}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[{ width: VIEW_WIDTH, height: VIEW_HEIGHT }, animatedStyle]}>
            <View style={[styles.svgContainer, { width: VIEW_WIDTH, height: VIEW_HEIGHT }]}>
              {/* Grid background */}
              <Svg
                width={VIEW_WIDTH}
                height={VIEW_HEIGHT}
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              >
        {/* Background rect - fills entire viewport */}
        <Rect
          x={0}
          y={0}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          fill={Colors.background}
        />

        {/* Sector content group - centered in viewport */}
        <G transform={`translate(${offsetX}, ${offsetY})`}>
          {/* Territory Border - faction control indicator */}
          <TerritoryBorder viewSize={VIEW_SIZE} controlData={controlData} />

          {/* Grid lines (toggleable) */}
          {sectorGridEnabled && (
            <G opacity={0.3}>
              {[...Array(11)].map((_, i) => {
                const pos = (i / 10) * VIEW_SIZE;
                return (
                  <G key={i}>
                    <Line
                      x1={pos}
                      y1={0}
                      x2={pos}
                      y2={VIEW_SIZE}
                      stroke={Colors.text}
                      strokeWidth={1}
                    />
                    <Line
                      x1={0}
                      y1={pos}
                      x2={VIEW_SIZE}
                      y2={pos}
                      stroke={Colors.text}
                      strokeWidth={1}
                    />
                  </G>
                );
              })}
            </G>
          )}

          {/* Center crosshair */}
          <G>
            <Line
              x1={VIEW_SIZE / 2 - 30}
              y1={VIEW_SIZE / 2}
              x2={VIEW_SIZE / 2 + 30}
              y2={VIEW_SIZE / 2}
              stroke={Colors.primary}
              strokeWidth={3}
              opacity={0.8}
            />
            <Line
              x1={VIEW_SIZE / 2}
              y1={VIEW_SIZE / 2 - 30}
              x2={VIEW_SIZE / 2}
              y2={VIEW_SIZE / 2 + 30}
              stroke={Colors.primary}
              strokeWidth={3}
              opacity={0.8}
            />
            {/* Center circle */}
            <Circle
              cx={VIEW_SIZE / 2}
              cy={VIEW_SIZE / 2}
              r={8}
              fill="none"
              stroke={Colors.primary}
              strokeWidth={2}
              opacity={0.8}
            />
          </G>

        {/* Procgen Content - rendered below ships for layering */}
        {showProcgen && sector && (
          <G>
            {/* Central Star */}
            {sector.star && (
              <StarMarker
                star={sector.star}
                x={VIEW_SIZE / 2}
                y={VIEW_SIZE / 2}
                scale={0.5}
              />
            )}

            {/* Stations */}
            {sector.stations?.map((station) => {
              const pos = to2D([station.positionX, station.positionY, station.positionZ]);
              return (
                <StationMarker
                  key={station.id}
                  station={station}
                  x={pos.x}
                  y={pos.y}
                  scale={1}
                />
              );
            })}

            {/* Asteroid Fields */}
            {sector.asteroidFields?.map((field) => {
              const pos = to2D([field.centerX, field.centerY, field.centerZ]);
              return (
                <AsteroidFieldMarker
                  key={field.id}
                  field={field}
                  x={pos.x}
                  y={pos.y}
                  scale={SCALE}
                />
              );
            })}

            {/* Hazards */}
            {sector.hazards?.map((hazard) => {
              const pos = to2D([hazard.positionX, hazard.positionY, hazard.positionZ]);
              return (
                <HazardMarker
                  key={hazard.id}
                  hazard={hazard}
                  x={pos.x}
                  y={pos.y}
                  scale={SCALE}
                />
              );
            })}

            {/* Anomalies */}
            {sector.anomalies?.map((anomaly) => {
              const pos = to2D([anomaly.positionX, anomaly.positionY, anomaly.positionZ]);
              return (
                <AnomalyMarker
                  key={anomaly.id}
                  anomaly={anomaly}
                  x={pos.x}
                  y={pos.y}
                  scale={SCALE}
                />
              );
            })}
          </G>
        )}

        {/* Database Stations (always visible - no scan required) - sorted by depth */}
        {sortByDepth(
          dbStations.map((station) => ({
            ...station,
            projected: to2D([station.position.x, station.position.y, station.position.z]),
          }))
        ).map((station) => {
          const pos = station.projected;
          const stationSize = 12 * pos.scale;
          return (
            <G key={station.id} opacity={pos.opacity}>
              {/* Station square */}
              <Rect
                x={pos.x - stationSize}
                y={pos.y - stationSize}
                width={stationSize * 2}
                height={stationSize * 2}
                fill="#10b981"
                stroke="#10b981"
                strokeWidth={2}
                rx={4 * pos.scale}
              />
              {/* Glow effect */}
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={25 * pos.scale}
                fill="#10b981"
                opacity={0.2}
              />
              {/* Name label */}
              <SvgText
                x={pos.x}
                y={pos.y - (20 * pos.scale)}
                fontSize={9 * pos.scale}
                fill="#10b981"
                textAnchor="middle"
                fontWeight="600"
              >
                {station.name.length > 15 ? station.name.substring(0, 12) + '...' : station.name}
              </SvgText>
            </G>
          );
        })}

        {/* Other Player Ships in Sector (always visible - no scan required) - sorted by depth */}
        {sortByDepth(
          otherShips
            .filter((ship) => ship.id !== currentShipId) // Exclude player's ship
            .map((ship) => ({
              ...ship,
              projected: to2D([ship.position.x, ship.position.y, ship.position.z]),
            }))
        ).map((ship) => {
            const pos = ship.projected;
            const diamondSize = 10 * pos.scale;

            // Purple for player ships
            const color = '#8b5cf6';

            return (
              <G key={ship.id} opacity={pos.opacity}>
                {/* Ship diamond */}
                <Polygon
                  points={`${pos.x},${pos.y - diamondSize} ${pos.x + diamondSize * 0.8},${pos.y} ${pos.x},${pos.y + diamondSize} ${pos.x - diamondSize * 0.8},${pos.y}`}
                  fill={color}
                  stroke={color}
                  strokeWidth={1.5}
                />
                {/* Glow effect */}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={15 * pos.scale}
                  fill={color}
                  opacity={0.15}
                />
                {/* Name label */}
                {ship.name && (
                  <SvgText
                    x={pos.x}
                    y={pos.y - (18 * pos.scale)}
                    fontSize={8 * pos.scale}
                    fill={color}
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {ship.name.length > 12 ? ship.name.substring(0, 10) + '..' : ship.name}
                  </SvgText>
                )}
              </G>
            );
          })}

        {/* Player ship */}
        {playerPosition && (
          <G>
            {(() => {
              const pos = to2D(playerPosition);
              const playerShipSize = 20 * pos.scale;
              return (
                <G opacity={pos.opacity}>
                  {/* Player ship triangle */}
                  <Polygon
                    points={getShipPoints(pos.x, pos.y, playerShipSize)}
                    fill={Colors.primary}
                    stroke={Colors.primary}
                    strokeWidth={2}
                  />
                  {/* Glow effect */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={30 * pos.scale}
                    fill={Colors.primary}
                    opacity={0.2}
                  />
                  {/* Label */}
                  <SvgText
                    x={pos.x}
                    y={pos.y + (40 * pos.scale)}
                    fontSize={12 * pos.scale}
                    fill={Colors.primary}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    YOU
                  </SvgText>
                </G>
              );
            })()}
          </G>
        )}

        {/* NPC ships - sorted by depth for proper z-ordering */}
        {sortByDepth(
          npcs.map((npc) => ({
            ...npc,
            projected: to2D(npc.position),
          }))
        ).map((npc) => {
          const pos = npc.projected;
          const color = getNPCColor(npc.npc_type);
          const isSelected = npc.entity_id === selectedNPCId;
          const shipSize = 15 * pos.scale;

          return (
            <G key={npc.entity_id} opacity={pos.opacity}>
              {/* Selection ring */}
              {isSelected && (
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={25 * pos.scale}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  opacity={0.8}
                />
              )}

              {/* NPC ship */}
              <Polygon
                points={getShipPoints(pos.x, pos.y, shipSize)}
                fill={color}
                stroke={color}
                strokeWidth={1.5}
              />

              {/* Glow effect */}
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={20 * pos.scale}
                fill={color}
                opacity={0.15}
              />

              {/* Name label */}
              <SvgText
                x={pos.x}
                y={pos.y - (25 * pos.scale)}
                fontSize={10 * pos.scale}
                fill={color}
                textAnchor="middle"
                fontWeight="600"
              >
                {npc.name.split('-')[0]}
              </SvgText>
            </G>
          );
              })}
        </G>
              </Svg>
            </View>
          </Animated.View>
        </GestureDetector>

          {/* View Mode Selector moved to NAV LCARS bar */}

          {/* Threat Indicator Overlay */}
          <ThreatIndicator
            controlData={controlData}
            position="top-right"
            compact={false}
          />
        </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  svgContainer: {
    backgroundColor: Colors.background,
  },
});
