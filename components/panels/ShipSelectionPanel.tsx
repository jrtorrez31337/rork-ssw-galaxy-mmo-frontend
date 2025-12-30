import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Rocket, Shield, Gauge, Package, Compass } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useFlightStore, SHIP_PROFILES } from '@/stores/flightStore';
import type { Ship, ShipType } from '@/types/api';

/**
 * ShipSelectionPanel - Select a ship and enter flight mode
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - Each ship type has distinct flight characteristics
 * - Player selects which ship to fly
 * - Entering flight mode loads that ship's profile
 */

// Ship type display info
const SHIP_TYPE_INFO: Record<ShipType, { icon: typeof Rocket; color: string; description: string }> = {
  scout: {
    icon: Compass,
    color: '#4a90e2',
    description: 'Fast & agile reconnaissance vessel',
  },
  fighter: {
    icon: Shield,
    color: '#e74c3c',
    description: 'Combat-focused attack craft',
  },
  trader: {
    icon: Package,
    color: '#f39c12',
    description: 'High-capacity cargo hauler',
  },
  explorer: {
    icon: Gauge,
    color: '#2ecc71',
    description: 'Long-range exploration ship',
  },
};

interface ShipCardProps {
  ship: Ship;
  onEnterFlight: () => void;
}

function ShipFlightCard({ ship, onEnterFlight }: ShipCardProps) {
  const typeInfo = SHIP_TYPE_INFO[ship.ship_type] || SHIP_TYPE_INFO.scout;
  const profile = SHIP_PROFILES[ship.ship_type] || SHIP_PROFILES.scout;
  const Icon = typeInfo.icon;

  const isDocked = !!ship.docked_at;

  return (
    <View style={styles.shipCard}>
      {/* Ship header */}
      <View style={styles.shipHeader}>
        <View style={[styles.shipIcon, { backgroundColor: typeInfo.color + '20' }]}>
          <Icon size={24} color={typeInfo.color} />
        </View>
        <View style={styles.shipInfo}>
          <Text style={styles.shipName}>{ship.name || 'Unnamed Ship'}</Text>
          <Text style={styles.shipType}>{ship.ship_type.toUpperCase()}</Text>
        </View>
        {isDocked && (
          <View style={styles.dockedBadge}>
            <Text style={styles.dockedText}>DOCKED</Text>
          </View>
        )}
      </View>

      {/* Flight characteristics */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MAX SPEED</Text>
          <Text style={styles.statValue}>{profile.maxSpeed}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ACCEL</Text>
          <Text style={styles.statValue}>{(profile.acceleration * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PITCH</Text>
          <Text style={styles.statValue}>{profile.pitchSpeed}°/s</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ROLL</Text>
          <Text style={styles.statValue}>{profile.rollSpeed}°/s</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>YAW</Text>
          <Text style={styles.statValue}>{profile.yawSpeed}°/s</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>RESPONSE</Text>
          <Text style={styles.statValue}>{(profile.inputResponse * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.shipDescription}>{typeInfo.description}</Text>

      {/* Enter Flight Mode button */}
      <TouchableOpacity
        style={[
          styles.enterFlightButton,
          isDocked && styles.enterFlightButtonDisabled,
        ]}
        onPress={onEnterFlight}
        disabled={isDocked}
        activeOpacity={0.7}
      >
        <Rocket size={18} color={isDocked ? tokens.colors.text.tertiary : tokens.colors.text.primary} />
        <Text style={[
          styles.enterFlightText,
          isDocked && styles.enterFlightTextDisabled,
        ]}>
          {isDocked ? 'UNDOCK TO FLY' : 'ENTER FLIGHT MODE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function ShipSelectionPanel() {
  const { profileId } = useAuth();
  const setActiveViewport = useCockpitStore((s) => s.setActiveViewport);
  const setPanelState = useCockpitStore((s) => s.setPanelState);
  const setProfileById = useFlightStore((s) => s.setProfileById);
  const setActiveShipId = useFlightStore((s) => s.setActiveShipId);

  const { data: ships, isLoading, error } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const handleEnterFlight = (ship: Ship) => {
    // Set the active ship in the flight store
    setActiveShipId(ship.id);

    // Load the ship's flight profile based on type
    setProfileById(ship.ship_type);

    // Hide the panel and switch to flight viewport
    setPanelState('hidden');
    setActiveViewport('flight');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Rocket size={20} color={tokens.colors.semantic.navigation} />
          <Text style={styles.headerTitle}>FLIGHT MODE</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.colors.semantic.navigation} />
          <Text style={styles.loadingText}>Loading ships...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Rocket size={20} color={tokens.colors.semantic.navigation} />
          <Text style={styles.headerTitle}>FLIGHT MODE</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load ships</Text>
        </View>
      </View>
    );
  }

  if (!ships || ships.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Rocket size={20} color={tokens.colors.semantic.navigation} />
          <Text style={styles.headerTitle}>FLIGHT MODE</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ships available</Text>
          <Text style={styles.emptyHint}>Create a ship from the Fleet tab to start flying</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Rocket size={20} color={tokens.colors.semantic.navigation} />
        <Text style={styles.headerTitle}>FLIGHT MODE</Text>
      </View>
      <Text style={styles.subtitle}>Select a ship to enter flight mode</Text>

      {ships.map((ship) => (
        <ShipFlightCard
          key={ship.id}
          ship={ship}
          onEnterFlight={() => handleEnterFlight(ship)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.navigation,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginBottom: tokens.spacing[4],
  },
  // Loading state
  loadingContainer: {
    alignItems: 'center',
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  // Error state
  errorContainer: {
    alignItems: 'center',
    padding: tokens.spacing[6],
  },
  errorText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.semantic.danger,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    padding: tokens.spacing[6],
    gap: tokens.spacing[2],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },
  emptyHint: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
  },
  // Ship card
  shipCard: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  shipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  shipIcon: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipInfo: {
    flex: 1,
    marginLeft: tokens.spacing[3],
  },
  shipName: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  shipType: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  dockedBadge: {
    backgroundColor: tokens.colors.semantic.navigation + '20',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.sm,
  },
  dockedText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.navigation,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[3],
  },
  statItem: {
    width: '30%',
    backgroundColor: tokens.colors.background.tertiary,
    padding: tokens.spacing[2],
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  shipDescription: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[3],
    fontStyle: 'italic',
  },
  // Enter flight button
  enterFlightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.semantic.navigation,
    borderRadius: tokens.radius.md,
  },
  enterFlightButtonDisabled: {
    backgroundColor: tokens.colors.background.tertiary,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  enterFlightText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
  },
  enterFlightTextDisabled: {
    color: tokens.colors.text.tertiary,
  },
});
