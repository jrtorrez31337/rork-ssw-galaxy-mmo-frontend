import { View, Text, StyleSheet, LayoutChangeEvent, Dimensions } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
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
import {
  StarMarker,
  StationMarker,
  AsteroidFieldMarker,
  HazardMarker,
  AnomalyMarker,
  PlanetMarker,
} from '@/components/sector/ProcgenMarkers';
import { TerritoryBorder } from '@/components/hud/TerritoryBorder';
import { ThreatIndicator } from '@/components/hud/ThreatIndicator';
import type { Station } from '@/types/movement';
import type { SectorShip } from '@/api/sectorEntities';

interface SectorView2DProps {
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
 * 2D vector display of sector
 * Shows player ship and NPCs as vector graphics
 */
export default function SectorView2D({
  npcs,
  playerPosition,
  onNPCPress,
  selectedNPCId,
  sectorId,
  showProcgen = true,
  dbStations = [],
  otherShips = [],
  currentShipId,
}: SectorView2DProps) {
  // Get initial screen width, then update from layout
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth - 32);

  // Handle container layout to get actual width
  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  }, [containerWidth]);

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

  // Calculate view size based on container width (with padding)
  // Use 300 as minimum/fallback until layout is measured
  const VIEW_SIZE = containerWidth > 32 ? containerWidth - 32 : 300;
  const SCALE = VIEW_SIZE / 10000; // 10000 units = full view


  // Convert 3D position to 2D screen coordinates (using x, y, ignoring z for now)
  const to2D = (pos: [number, number, number]): { x: number; y: number } => {
    // Center the view and scale
    const x = (pos[0] * SCALE) + (VIEW_SIZE / 2);
    const y = (pos[1] * SCALE) + (VIEW_SIZE / 2);
    return { x, y };
  };

  // Ship triangle points (pointing up)
  const getShipPoints = (x: number, y: number, size: number = 15): string => {
    return `${x},${y - size} ${x - size/2},${y + size/2} ${x + size/2},${y + size/2}`;
  };

  // Ensure we have valid dimensions
  if (VIEW_SIZE <= 0 || !Number.isFinite(VIEW_SIZE)) {
    return (
      <View style={styles.container} onLayout={onContainerLayout}>
        <View style={[styles.loadingContainer, { height: 300 }]}>
          <Text style={styles.loadingText}>Loading sector view...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {/* Sector Map with Territory Overlay */}
      <View style={[styles.mapContainer, { width: VIEW_SIZE, height: VIEW_SIZE, overflow: 'hidden' }]}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[{ width: VIEW_SIZE, height: VIEW_SIZE }, animatedStyle]}>
            <View style={[styles.svgContainer, { width: VIEW_SIZE, height: VIEW_SIZE }]}>
              {/* Grid background */}
              <Svg
                width={VIEW_SIZE}
                height={VIEW_SIZE}
                viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
              >
        {/* Background rect */}
        <Rect
          x={0}
          y={0}
          width={VIEW_SIZE}
          height={VIEW_SIZE}
          fill={Colors.background}
        />

        {/* Territory Border - faction control indicator */}
        <TerritoryBorder viewSize={VIEW_SIZE} controlData={controlData} />

        {/* Grid lines */}
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

            {/* Planets */}
            {sector.planets?.map((planet, index) => {
              // Position planets around the star using orbit radius and index for angle
              const angle = (index / (sector.planets?.length || 1)) * Math.PI * 2;
              const distance = planet.orbitRadius * 500; // Scale AU to display units
              const planetX = Math.cos(angle) * distance;
              const planetY = Math.sin(angle) * distance;
              const pos = to2D([planetX, planetY, 0]);
              return (
                <PlanetMarker
                  key={planet.id}
                  planet={planet}
                  x={pos.x}
                  y={pos.y}
                  scale={0.8}
                />
              );
            })}

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

        {/* Database Stations (always visible - no scan required) */}
        {dbStations.map((station) => {
          const pos = to2D([station.position.x, station.position.y, station.position.z]);
          return (
            <G key={station.id}>
              {/* Station square */}
              <Rect
                x={pos.x - 12}
                y={pos.y - 12}
                width={24}
                height={24}
                fill="#10b981"
                stroke="#10b981"
                strokeWidth={2}
                rx={4}
              />
              {/* Glow effect */}
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={25}
                fill="#10b981"
                opacity={0.2}
              />
              {/* Name label */}
              <SvgText
                x={pos.x}
                y={pos.y - 20}
                fontSize={9}
                fill="#10b981"
                textAnchor="middle"
                fontWeight="600"
              >
                {station.name.length > 15 ? station.name.substring(0, 12) + '...' : station.name}
              </SvgText>
            </G>
          );
        })}

        {/* Other Player Ships in Sector (always visible - no scan required) */}
        {otherShips
          .filter((ship) => ship.id !== currentShipId) // Exclude player's ship
          .map((ship, index, filteredShips) => {
            // Calculate position - spread ships in a circle if at same location
            // This prevents stacking when all ships are at (0,0,0)
            const basePos = to2D([ship.position.x, ship.position.y, ship.position.z]);
            const spreadRadius = 60; // pixels to spread ships apart
            const angle = (index / Math.max(filteredShips.length, 1)) * Math.PI * 2;
            const offsetX = filteredShips.length > 1 ? Math.cos(angle) * spreadRadius : 0;
            const offsetY = filteredShips.length > 1 ? Math.sin(angle) * spreadRadius : 0;
            const pos = { x: basePos.x + offsetX, y: basePos.y + offsetY };

            // Purple for player ships
            const color = '#8b5cf6';

            return (
              <G key={ship.id}>
                {/* Ship diamond */}
                <Polygon
                  points={`${pos.x},${pos.y - 10} ${pos.x + 8},${pos.y} ${pos.x},${pos.y + 10} ${pos.x - 8},${pos.y}`}
                  fill={color}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.85}
                />
                {/* Glow effect */}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={15}
                  fill={color}
                  opacity={0.15}
                />
                {/* Name label */}
                {ship.name && (
                  <SvgText
                    x={pos.x}
                    y={pos.y - 18}
                    fontSize={8}
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
              return (
                <>
                  {/* Player ship triangle */}
                  <Polygon
                    points={getShipPoints(pos.x, pos.y, 20)}
                    fill={Colors.primary}
                    stroke={Colors.primary}
                    strokeWidth={2}
                  />
                  {/* Glow effect */}
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={30}
                    fill={Colors.primary}
                    opacity={0.2}
                  />
                  {/* Label */}
                  <SvgText
                    x={pos.x}
                    y={pos.y + 40}
                    fontSize={12}
                    fill={Colors.primary}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    YOU
                  </SvgText>
                </>
              );
            })()}
          </G>
        )}

        {/* NPC ships */}
        {npcs.map((npc) => {
          const pos = to2D(npc.position);
          const color = getNPCColor(npc.npc_type);
          const isSelected = npc.entity_id === selectedNPCId;

          return (
            <G key={npc.entity_id}>
              {/* Selection ring */}
              {isSelected && (
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={25}
                  fill="none"
                  stroke={color}
                  strokeWidth={3}
                  opacity={0.8}
                />
              )}

              {/* NPC ship */}
              <Polygon
                points={getShipPoints(pos.x, pos.y)}
                fill={color}
                stroke={color}
                strokeWidth={1.5}
                opacity={0.9}
              />

              {/* Glow effect */}
              <Circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={color}
                opacity={0.15}
              />

              {/* Name label */}
              <SvgText
                x={pos.x}
                y={pos.y - 25}
                fontSize={10}
                fill={color}
                textAnchor="middle"
                fontWeight="600"
              >
                {npc.name.split('-')[0]}
              </SvgText>
            </G>
          );
              })}
              </Svg>
            </View>
          </Animated.View>
        </GestureDetector>

          {/* Threat Indicator Overlay */}
          <ThreatIndicator
            controlData={controlData}
            position="top-right"
            compact={false}
          />
        </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        {dbStations.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Station</Text>
          </View>
        )}
        {otherShips.length > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDiamond, { backgroundColor: '#8b5cf6' }]} />
            <Text style={styles.legendText}>Player</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Pirate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Trader</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Patrol</Text>
        </View>
        {showProcgen && sector && (
          <>
            {sector.star && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFFF66' }]} />
                <Text style={styles.legendText}>Star</Text>
              </View>
            )}
            {sector.asteroidFields && sector.asteroidFields.length > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B7355' }]} />
                <Text style={styles.legendText}>Asteroids</Text>
              </View>
            )}
          </>
        )}
        {/* Territory Control Legend */}
        {controlData?.controllingFaction && (
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: controlData.controllingFaction.color,
                  borderWidth: controlData.isContested ? 1 : 0,
                  borderColor: controlData.contestingFaction?.color || 'transparent',
                },
              ]}
            />
            <Text style={styles.legendText}>
              {controlData.isContested ? 'Contested' : controlData.controllingFaction.name.split(' ')[0]}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.infoText}>
          Pinch to zoom • Double-tap to reset • Tap NPC to select
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  mapContainer: {
    position: 'relative',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  svgContainer: {
    backgroundColor: Colors.background,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendDiamond: {
    width: 10,
    height: 10,
    transform: [{ rotate: '45deg' }],
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  info: {
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
