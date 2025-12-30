import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import Svg, { Circle, Polygon, Text as SvgText, G, Line } from 'react-native-svg';
import Colors from '@/constants/colors';
import type { NPCEntity } from '@/types/combat';
import { getNPCColor } from '@/types/combat';
import { useProcgenStore } from '@/stores/procgenStore';
import {
  StarMarker,
  StationMarker,
  AsteroidFieldMarker,
  HazardMarker,
  AnomalyMarker,
  PlanetMarker,
} from '@/components/sector/ProcgenMarkers';

interface SectorView2DProps {
  npcs: NPCEntity[];
  playerPosition?: [number, number, number];
  onNPCPress?: (npc: NPCEntity) => void;
  selectedNPCId?: string;
  sectorId?: string;
  showProcgen?: boolean;
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
}: SectorView2DProps) {
  // Use hook for dynamic window dimensions (fixes iOS Expo Go rendering issue)
  const { width: screenWidth } = useWindowDimensions();

  // Get procgen store for sector content
  const { getSector, enterSector } = useProcgenStore();

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

  // Calculate view size based on current screen width
  // Fallback to 300 if width is not yet available
  const VIEW_SIZE = screenWidth > 32 ? screenWidth - 32 : 300;
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

  // Ensure we have valid dimensions for iOS
  if (VIEW_SIZE <= 0 || !Number.isFinite(VIEW_SIZE)) {
    return (
      <View style={[styles.container, { height: 300, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Loading sector view...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Grid background */}
      <Svg
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        style={styles.svg}
      >
        {/* Grid lines */}
        <G opacity={0.1}>
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
            x1={VIEW_SIZE / 2 - 20}
            y1={VIEW_SIZE / 2}
            x2={VIEW_SIZE / 2 + 20}
            y2={VIEW_SIZE / 2}
            stroke={Colors.primary}
            strokeWidth={2}
            opacity={0.5}
          />
          <Line
            x1={VIEW_SIZE / 2}
            y1={VIEW_SIZE / 2 - 20}
            x2={VIEW_SIZE / 2}
            y2={VIEW_SIZE / 2 + 20}
            stroke={Colors.primary}
            strokeWidth={2}
            opacity={0.5}
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

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
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
            {sector.stations && sector.stations.length > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Station</Text>
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
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.infoText}>
          Tap NPC in list below to select • View shows 10km range
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  svg: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
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
