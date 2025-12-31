import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MapPin, ZoomIn, ZoomOut, Crosshair, Info } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Text, Spinner } from '@/ui';
import { tokens } from '@/ui/theme';
import { factionsApi } from '@/api/factions';
import type { GalaxyInfluenceMap, SectorInfluence } from '@/types/factions';
import { FACTION_COLORS, FactionId } from '@/types/factions';

/**
 * Galaxy Map Component
 *
 * Per Gap Analysis Sprint 3:
 * - Displays galaxy-wide faction territory visualization
 * - Color-coded sectors by controlling faction
 * - Interactive zoom and pan
 * - Sector details on tap
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_CELL_SIZE = 20;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

interface ParsedSector {
  x: number;
  y: number;
  z: number;
  controllingFaction: string | null;
  influences: SectorInfluence['influences'];
  isContested: boolean;
}

interface GalaxyMapProps {
  onSectorPress?: (sector: ParsedSector) => void;
  currentSectorId?: string;
  showLegend?: boolean;
}

// Parse sector ID to coordinates
function parseSectorId(sectorId: string): { x: number; y: number; z: number } | null {
  const parts = sectorId.split('.');
  if (parts.length !== 3) return null;
  return {
    x: parseInt(parts[0], 10),
    y: parseInt(parts[1], 10),
    z: parseInt(parts[2], 10),
  };
}

// Get faction color by ID
function getFactionColor(factionId: string | null | undefined): string {
  if (!factionId) return FACTION_COLORS.neutral;

  // Check if it's a known faction ID
  const normalizedId = factionId.toLowerCase().replace(/-/g, '_') as FactionId;
  if (FACTION_COLORS[normalizedId]) {
    return FACTION_COLORS[normalizedId];
  }

  // Generate consistent color from UUID/string
  let hash = 0;
  for (let i = 0; i < factionId.length; i++) {
    hash = factionId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

// Get faction name from ID
function getFactionName(factionId: string | null | undefined): string {
  if (!factionId) return 'Unclaimed';

  const names: Record<string, string> = {
    terran_federation: 'Terran Federation',
    void_consortium: 'Void Consortium',
    stellar_imperium: 'Stellar Imperium',
    free_traders: 'Free Traders',
    shadow_syndicate: 'Shadow Syndicate',
    tech_collective: 'Tech Collective',
    outer_rim_alliance: 'Outer Rim Alliance',
    merchant_guild: 'Merchant Guild',
    pirate_clans: 'Pirate Clans',
    neutral: 'Neutral',
  };

  const normalizedId = factionId.toLowerCase().replace(/-/g, '_');
  return names[normalizedId] || factionId;
}

export function GalaxyMap({
  onSectorPress,
  currentSectorId,
  showLegend = true,
}: GalaxyMapProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedSector, setSelectedSector] = useState<ParsedSector | null>(null);

  // Fetch galaxy influence map
  const {
    data: influenceMap,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['galaxyInfluenceMap'],
    queryFn: () => factionsApi.getGalaxyInfluenceMap(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Parse sectors into coordinate-indexed map
  const { sectors, bounds, factionLegend } = useMemo(() => {
    if (!influenceMap?.sectors) {
      return { sectors: new Map<string, ParsedSector>(), bounds: null, factionLegend: [] };
    }

    const sectorMap = new Map<string, ParsedSector>();
    const factionSet = new Set<string>();
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const sector of influenceMap.sectors) {
      const coords = parseSectorId(sector.sector);
      if (!coords) continue;

      // Use X-Y projection (top-down view)
      minX = Math.min(minX, coords.x);
      maxX = Math.max(maxX, coords.x);
      minY = Math.min(minY, coords.y);
      maxY = Math.max(maxY, coords.y);

      const controlling = sector.influences.find(i => i.is_controlling);
      const controllingFaction = controlling?.faction_id || sector.controlling_faction || null;

      if (controllingFaction) {
        factionSet.add(controllingFaction);
      }

      // Check if contested (multiple high influences)
      const highInfluences = sector.influences.filter(i => i.influence > 30);
      const isContested = highInfluences.length > 1;

      sectorMap.set(`${coords.x}.${coords.y}`, {
        x: coords.x,
        y: coords.y,
        z: coords.z,
        controllingFaction,
        influences: sector.influences,
        isContested,
      });
    }

    // Build legend
    const legend = Array.from(factionSet).map(factionId => ({
      id: factionId,
      name: getFactionName(factionId),
      color: getFactionColor(factionId),
    }));
    legend.push({ id: 'neutral', name: 'Unclaimed', color: FACTION_COLORS.neutral });

    return {
      sectors: sectorMap,
      bounds: sectorMap.size > 0 ? { minX, maxX, minY, maxY } : null,
      factionLegend: legend,
    };
  }, [influenceMap]);

  // Calculate grid dimensions
  const gridWidth = bounds ? (bounds.maxX - bounds.minX + 1) : 0;
  const gridHeight = bounds ? (bounds.maxY - bounds.minY + 1) : 0;

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 0.5, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 0.5, MIN_ZOOM));
  }, []);

  const handleSectorPress = useCallback((sector: ParsedSector) => {
    setSelectedSector(sector);
    onSectorPress?.(sector);
  }, [onSectorPress]);

  // Parse current sector coordinates
  const currentCoords = currentSectorId ? parseSectorId(currentSectorId) : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" />
        <Text variant="body" color={tokens.colors.text.secondary}>
          Loading galaxy map...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="body" color={tokens.colors.danger}>
          Failed to load galaxy map
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text variant="caption" color={tokens.colors.primary.main}>
            Tap to retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!bounds || sectors.size === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MapPin size={48} color={tokens.colors.text.tertiary} />
        <Text variant="body" color={tokens.colors.text.secondary}>
          No galaxy data available
        </Text>
      </View>
    );
  }

  const cellSize = BASE_CELL_SIZE * zoom;
  const contentWidth = gridWidth * cellSize;
  const contentHeight = gridHeight * cellSize;

  return (
    <View style={styles.container}>
      {/* Map Header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MapPin size={20} color={tokens.colors.primary.main} />
          <Text variant="heading" weight="semibold">
            Galaxy Influence Map
          </Text>
        </View>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            onPress={handleZoomOut}
            style={styles.zoomButton}
            disabled={zoom <= MIN_ZOOM}
          >
            <ZoomOut
              size={20}
              color={zoom <= MIN_ZOOM ? tokens.colors.text.disabled : tokens.colors.text.primary}
            />
          </TouchableOpacity>
          <Text variant="caption" style={styles.zoomText}>
            {Math.round(zoom * 100)}%
          </Text>
          <TouchableOpacity
            onPress={handleZoomIn}
            style={styles.zoomButton}
            disabled={zoom >= MAX_ZOOM}
          >
            <ZoomIn
              size={20}
              color={zoom >= MAX_ZOOM ? tokens.colors.text.disabled : tokens.colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Grid */}
      <ScrollView
        style={styles.mapContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.grid,
              { width: contentWidth, height: contentHeight },
            ]}
          >
            {Array.from({ length: gridHeight }).map((_, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {Array.from({ length: gridWidth }).map((_, colIdx) => {
                  const x = bounds.minX + colIdx;
                  const y = bounds.maxY - rowIdx; // Invert Y for top-down view
                  const key = `${x}.${y}`;
                  const sector = sectors.get(key);

                  const isCurrent =
                    currentCoords &&
                    currentCoords.x === x &&
                    currentCoords.y === y;

                  const backgroundColor = sector
                    ? getFactionColor(sector.controllingFaction)
                    : 'transparent';

                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor,
                          opacity: sector ? (sector.isContested ? 0.6 : 0.85) : 0.1,
                        },
                        isCurrent && styles.currentCell,
                        selectedSector?.x === x && selectedSector?.y === y && styles.selectedCell,
                      ]}
                      onPress={() => sector && handleSectorPress(sector)}
                      disabled={!sector}
                    >
                      {isCurrent && (
                        <Crosshair size={cellSize * 0.6} color="#FFFFFF" />
                      )}
                      {sector?.isContested && !isCurrent && cellSize > 15 && (
                        <View style={styles.contestedMarker} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Selected Sector Info */}
      {selectedSector && (
        <View style={styles.sectorInfo}>
          <View style={styles.sectorInfoHeader}>
            <Info size={16} color={tokens.colors.primary.main} />
            <Text variant="body" weight="semibold">
              Sector {selectedSector.x}.{selectedSector.y}.{selectedSector.z}
            </Text>
          </View>
          <Text variant="caption" color={tokens.colors.text.secondary}>
            Controlled by: {getFactionName(selectedSector.controllingFaction)}
          </Text>
          {selectedSector.isContested && (
            <Text variant="caption" color={tokens.colors.warning}>
              Contested territory
            </Text>
          )}
          {selectedSector.influences.length > 0 && (
            <View style={styles.influenceList}>
              {selectedSector.influences.slice(0, 3).map((inf, idx) => (
                <View key={idx} style={styles.influenceRow}>
                  <View
                    style={[
                      styles.influenceDot,
                      { backgroundColor: getFactionColor(inf.faction_id) },
                    ]}
                  />
                  <Text variant="caption" color={tokens.colors.text.tertiary}>
                    {inf.faction_name || getFactionName(inf.faction_id)}: {inf.influence}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Legend */}
      {showLegend && factionLegend.length > 0 && (
        <View style={styles.legend}>
          <Text variant="caption" weight="semibold" style={styles.legendTitle}>
            Factions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.legendItems}>
              {factionLegend.map((faction) => (
                <View key={faction.id} style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: faction.color }]}
                  />
                  <Text variant="caption" color={tokens.colors.text.secondary}>
                    {faction.name}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  zoomButton: {
    padding: tokens.spacing[2],
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radius.sm,
  },
  zoomText: {
    minWidth: 40,
    textAlign: 'center',
    fontFamily: tokens.typography.fontFamily.mono,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background.secondary,
  },
  grid: {
    flexDirection: 'column',
    padding: tokens.spacing[2],
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCell: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: tokens.colors.primary.main,
  },
  contestedMarker: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.warning,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[4],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
  },
  retryButton: {
    padding: tokens.spacing[2],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[4],
  },
  sectorInfo: {
    position: 'absolute',
    bottom: 80,
    left: tokens.spacing[4],
    right: tokens.spacing[4],
    backgroundColor: tokens.colors.surface.base,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    gap: tokens.spacing[2],
  },
  sectorInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  influenceList: {
    marginTop: tokens.spacing[2],
    gap: tokens.spacing[1],
  },
  influenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  influenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.surface.base,
  },
  legendTitle: {
    marginBottom: tokens.spacing[2],
  },
  legendItems: {
    flexDirection: 'row',
    gap: tokens.spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

export default GalaxyMap;
