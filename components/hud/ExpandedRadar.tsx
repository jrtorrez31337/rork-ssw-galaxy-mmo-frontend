import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { X, MapPin, Orbit, Navigation, AlertTriangle } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import type { Ship } from '@/types/api';
import type { Station } from '@/types/movement';
import type { NPCEntity } from '@/types/combat';

interface ExpandedRadarProps {
  visible: boolean;
  onClose: () => void;
  ship: Ship | null;
  stations?: Station[];
  npcs?: NPCEntity[];
  onSectorTap?: (sector: string) => void;
}

/**
 * Expanded Radar Panel
 * Shows a larger view of the sector grid with more detail
 * Displayed when tapping the mini-map
 */
export function ExpandedRadar({
  visible,
  onClose,
  ship,
  stations = [],
  npcs = [],
  onSectorTap,
}: ExpandedRadarProps) {
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible || !ship) {
    return null;
  }

  // Parse current sector coordinates
  // Handle both coordinate format ("0,0,0") and named sectors ("sol")
  const sectorParts = ship.location_sector.split(',');
  const isCoordinateFormat = sectorParts.length >= 2 && !isNaN(Number(sectorParts[0]));

  let x: number, y: number, z: number;
  if (isCoordinateFormat) {
    [x, y, z] = sectorParts.map(Number);
    // Handle undefined z
    if (isNaN(z)) z = 0;
  } else {
    // Named sector - use ship position if available, otherwise default to 0,0,0
    x = ship.position?.x ?? 0;
    y = ship.position?.y ?? 0;
    z = ship.position?.z ?? 0;
  }

  // Generate 5x5 grid of nearby sectors (current sector in center)
  const nearbySectors = [];
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gridIndex = (dy + 2) * 5 + (dx + 2); // Unique index for key
      nearbySectors.push({
        x: Math.round(x) + dx,
        y: Math.round(y) + dy,
        z: Math.round(z),
        isCurrent: dx === 0 && dy === 0,
        // Use grid index as fallback for unique key when in named sector mode
        coord: isCoordinateFormat
          ? `${Math.round(x) + dx},${Math.round(y) + dy},${Math.round(z)}`
          : `grid-${gridIndex}`,
        displayCoord: `${Math.round(x) + dx},${Math.round(y) + dy}`,
      });
    }
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  // Count hostile NPCs (pirates are considered hostile)
  const hostileCount = npcs.filter((n) => n.npc_type === 'pirate').length;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MapPin size={24} color={tokens.colors.primary.main} />
            <View>
              <Text style={styles.title}>Sector Radar</Text>
              <Text style={styles.subtitle}>
                Current: {ship.location_sector}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <X size={24} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Expanded Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {nearbySectors.map((sector, index) => {
              const row = Math.floor(index / 5);
              const col = index % 5;
              const hasStation = stations.some(
                (s) => s.location_sector === sector.coord
              );
              // NPCs don't have sector info, they're in current sector
              const isCurrentSector = sector.isCurrent;
              const hasNPC = isCurrentSector && npcs.length > 0;
              const hasHostile = isCurrentSector && npcs.some(
                (n) => n.npc_type === 'pirate'
              );

              const sectorDescription = sector.isCurrent
                ? 'Your current sector'
                : hasStation
                ? 'Station present'
                : hasHostile
                ? 'Hostile ships detected'
                : hasNPC
                ? 'Ships detected'
                : 'Empty sector';

              return (
                <TouchableOpacity
                  key={sector.coord}
                  style={[
                    styles.sector,
                    {
                      top: row * 52,
                      left: col * 52,
                    },
                    sector.isCurrent && styles.currentSector,
                  ]}
                  onPress={() => onSectorTap?.(sector.coord)}
                  activeOpacity={0.7}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`Sector ${sector.x}, ${sector.y}. ${sectorDescription}`}
                  accessibilityHint={sector.isCurrent ? undefined : 'Double tap to set as jump target'}
                >
                  {/* Sector coordinates */}
                  <Text style={styles.sectorCoord}>
                    {sector.x},{sector.y}
                  </Text>

                  {/* Current position indicator */}
                  {sector.isCurrent && (
                    <View style={styles.shipIndicator}>
                      <Navigation
                        size={14}
                        color={tokens.colors.primary.main}
                      />
                    </View>
                  )}

                  {/* Station indicator */}
                  {hasStation && !sector.isCurrent && (
                    <View style={styles.stationIndicator}>
                      <Orbit size={12} color={tokens.colors.warning} />
                    </View>
                  )}

                  {/* Hostile indicator */}
                  {hasHostile && (
                    <View style={styles.hostileIndicator}>
                      <AlertTriangle size={10} color={tokens.colors.danger} />
                    </View>
                  )}

                  {/* NPC indicator (non-hostile) */}
                  {hasNPC && !hasHostile && (
                    <View style={styles.npcIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: tokens.colors.primary.main }]}
            />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: tokens.colors.warning }]}
            />
            <Text style={styles.legendText}>Station</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: tokens.colors.danger }]}
            />
            <Text style={styles.legendText}>Hostile</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: tokens.colors.text.tertiary }]}
            />
            <Text style={styles.legendText}>NPC</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stations.length}</Text>
            <Text style={styles.statLabel}>Stations Nearby</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{npcs.length}</Text>
            <Text style={styles.statLabel}>Ships Detected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, hostileCount > 0 && styles.dangerText]}>
              {hostileCount}
            </Text>
            <Text style={styles.statLabel}>Hostile</Text>
          </View>
        </View>

        {/* Tip */}
        <Text style={styles.tip}>
          Tap a sector to set it as your jump target
        </Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingBottom: tokens.spacing[6],
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },

  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  subtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gridContainer: {
    padding: tokens.spacing[4],
    alignItems: 'center',
  },

  grid: {
    position: 'relative',
    width: 260,
    height: 260,
    backgroundColor: 'rgba(0, 20, 40, 0.8)',
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
  },

  sector: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  currentSector: {
    backgroundColor: tokens.colors.primary.alpha[20],
    borderColor: tokens.colors.primary.main,
    borderWidth: 2,
  },

  sectorCoord: {
    position: 'absolute',
    bottom: 2,
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: tokens.typography.fontFamily.mono,
  },

  shipIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.primary.alpha[30],
    alignItems: 'center',
    justifyContent: 'center',
  },

  stationIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  hostileIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
  },

  npcIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.text.tertiary,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: tokens.spacing[4],
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
  },

  statItem: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },

  statValue: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  statLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: tokens.colors.border.default,
  },

  dangerText: {
    color: tokens.colors.danger,
  },

  tip: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: tokens.spacing[4],
  },
});
