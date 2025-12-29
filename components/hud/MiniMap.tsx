import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import type { Ship } from '@/types/api';
import type { Station } from '@/types/movement';

interface MiniMapProps {
  ship: Ship | null;
  stations?: Station[];
  npcCount?: number;
  onTap?: () => void;
}

/**
 * Mini-Map / Radar Component
 * According to B1-ux-system-definition.md (lines 154-181)
 *
 * Features:
 * - Top-right corner, 120x120px
 * - Persistent spatial awareness
 * - Shows current sector (center), nearby sectors, stations, NPCs
 * - Dark background with grid overlay
 * - Tap to expand (optional enhancement)
 */
export function MiniMap({ ship, stations = [], npcCount = 0, onTap }: MiniMapProps) {
  if (!ship) {
    return null;
  }

  // Parse current sector coordinates with defensive fallback
  const locationParts = (ship.location_sector || '0,0,0').split(',');
  const x = parseInt(locationParts[0], 10) || 0;
  const y = parseInt(locationParts[1], 10) || 0;
  const z = parseInt(locationParts[2], 10) || 0;

  // Generate 3x3 grid of nearby sectors (current sector in center)
  const nearbySectors = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      nearbySectors.push({
        x: x + dx,
        y: y + dy,
        isCurrent: dx === 0 && dy === 0,
      });
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onTap}
      activeOpacity={onTap ? 0.7 : 1}
      disabled={!onTap}
    >
      {/* Header */}
      <View style={styles.header}>
        <MapPin size={12} color={tokens.colors.primary.main} />
        <Text style={styles.title}>RADAR</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {nearbySectors.map((sector, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;

          return (
            <View
              key={`${sector.x},${sector.y}`}
              style={[
                styles.sector,
                {
                  top: row * 28,
                  left: col * 28,
                },
                sector.isCurrent && styles.currentSector,
              ]}
            >
              {/* Show current position indicator */}
              {sector.isCurrent && (
                <View style={styles.shipIndicator} />
              )}
            </View>
          );
        })}

        {/* Station indicators */}
        {stations.map((station, index) => (
          <View
            key={station.id}
            style={[
              styles.stationIndicator,
              {
                top: 40 + (index % 2) * 6,
                left: 40 + (index % 3) * 6,
              },
            ]}
          />
        ))}

        {/* NPC count badge */}
        {npcCount > 0 && (
          <View style={styles.npcBadge}>
            <Text style={styles.npcCount}>{npcCount}</Text>
          </View>
        )}
      </View>

      {/* Footer - Current Sector */}
      <View style={styles.footer}>
        <Text style={styles.coordinates}>{ship.location_sector}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: tokens.spacing[4],
    right: tokens.spacing[4],
    width: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
    ...tokens.elevation[2],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[1],
    paddingVertical: tokens.spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },

  title: {
    fontSize: 9,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
    letterSpacing: 0.5,
  },

  grid: {
    position: 'relative',
    width: 84,
    height: 84,
    margin: tokens.spacing[2],
    backgroundColor: 'rgba(0, 20, 40, 0.6)',
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },

  sector: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
  },

  currentSector: {
    backgroundColor: tokens.colors.primary.alpha[20],
    borderColor: tokens.colors.primary.main,
    borderWidth: 1,
  },

  shipIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary.main,
    transform: [{ translateX: -3 }, { translateY: -3 }],
  },

  stationIndicator: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.warning,
  },

  npcBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: tokens.colors.danger,
    borderRadius: tokens.radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[1],
  },

  npcCount: {
    fontSize: 8,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  footer: {
    paddingVertical: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
    alignItems: 'center',
  },

  coordinates: {
    fontSize: 8,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
});
