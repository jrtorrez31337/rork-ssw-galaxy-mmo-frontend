import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movementApi } from '@/api/movement';
import { Ship } from '@/types/api';
import { Station } from '@/types/movement';
import { X, Anchor, Radio } from 'lucide-react-native';
import { tokens } from '@/ui/theme';

interface DockingPanelProps {
  ship: Ship;
  isVisible: boolean;
  onClose: () => void;
  onDockSuccess?: () => void;
}

const MAX_DOCKING_RANGE = 5000;

function calculateDistance(ship: Ship, station: Station): number {
  return Math.sqrt(
    Math.pow(station.position.x - ship.position.x, 2) +
    Math.pow(station.position.y - ship.position.y, 2) +
    Math.pow(station.position.z - ship.position.z, 2)
  );
}

/**
 * Docking Panel (Inline Panel)
 * According to B1-ux-system-definition.md
 *
 * Features:
 * - Slides up from bottom (not modal)
 * - Map remains visible (dimmed)
 * - Shows stations in sector with distance, capacity, services
 * - Validates docking range (5000 units)
 * - Cancel/Confirm buttons
 */
export function DockingPanel({
  ship,
  isVisible,
  onClose,
  onDockSuccess,
}: DockingPanelProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const queryClient = useQueryClient();

  // Slide animation
  const slideAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isVisible) {
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
  }, [isVisible]);

  // Fetch stations when panel opens
  const stationsQuery = useQuery({
    queryKey: ['stations', ship.location_sector],
    queryFn: () => movementApi.getStations(ship.location_sector),
    enabled: isVisible,
  });

  const dockMutation = useMutation({
    mutationFn: (stationId: string) => movementApi.dock(ship.id, stationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      onDockSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    if (!dockMutation.isPending) {
      onClose();
      setSelectedStation(null);
      dockMutation.reset();
    }
  };

  const handleDock = () => {
    if (selectedStation) {
      dockMutation.mutate(selectedStation.id);
    }
  };

  const stations = stationsQuery.data?.stations || [];

  if (!isVisible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Anchor size={20} color={tokens.colors.primary.main} />
          <Text style={styles.headerTitle}>DOCK AT STATION</Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          disabled={dockMutation.isPending}
          style={styles.closeButton}
        >
          <X size={20} color={tokens.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {stationsQuery.isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            <Text style={styles.loadingText}>Scanning for stations...</Text>
          </View>
        )}

        {/* Empty State */}
        {!stationsQuery.isLoading && stations.length === 0 && (
          <View style={styles.centerContent}>
            <Radio size={32} color={tokens.colors.text.tertiary} />
            <Text style={styles.emptyText}>No stations detected in this sector</Text>
          </View>
        )}

        {/* Station List */}
        {!stationsQuery.isLoading && stations.length > 0 && (
          <View style={styles.stationList}>
            {stations.map((station) => {
              const distance = calculateDistance(ship, station);
              const inRange = distance <= MAX_DOCKING_RANGE;
              const hasCapacity = station.docked_ships_count < station.docking_capacity;
              const canDock = inRange && hasCapacity;

              return (
                <TouchableOpacity
                  key={station.id}
                  style={[
                    styles.stationCard,
                    selectedStation?.id === station.id && styles.stationCardSelected,
                    !canDock && styles.stationCardDisabled,
                  ]}
                  onPress={() => canDock && setSelectedStation(station)}
                  disabled={!canDock || dockMutation.isPending}
                  activeOpacity={0.7}
                >
                  {/* Station Header */}
                  <View style={styles.stationHeader}>
                    <View style={styles.stationInfo}>
                      <Text style={styles.stationName}>{station.name}</Text>
                      <Text style={styles.stationType}>
                        {station.station_type.charAt(0).toUpperCase() +
                          station.station_type.slice(1)}{' '}
                        Station
                      </Text>
                    </View>

                    <View style={styles.stationStatus}>
                      {/* Distance */}
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Distance:</Text>
                        <Text
                          style={[
                            styles.statusValue,
                            {
                              color: inRange
                                ? tokens.colors.success
                                : tokens.colors.danger,
                            },
                          ]}
                        >
                          {distance.toFixed(0)} units
                        </Text>
                      </View>
                      {!inRange && (
                        <Text style={styles.warningText}>OUT OF RANGE</Text>
                      )}

                      {/* Capacity */}
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Docked:</Text>
                        <Text
                          style={[
                            styles.statusValue,
                            {
                              color: hasCapacity
                                ? tokens.colors.text.secondary
                                : tokens.colors.danger,
                            },
                          ]}
                        >
                          {station.docked_ships_count}/{station.docking_capacity}
                        </Text>
                      </View>
                      {!hasCapacity && (
                        <Text style={styles.warningText}>FULL</Text>
                      )}
                    </View>
                  </View>

                  {/* Services */}
                  {station.services.length > 0 && (
                    <View style={styles.services}>
                      <Text style={styles.servicesLabel}>Services:</Text>
                      <View style={styles.serviceBadges}>
                        {station.services.map((service) => (
                          <View key={service} style={styles.serviceBadge}>
                            <Text style={styles.serviceBadgeText}>{service}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Error Message */}
        {(stationsQuery.isError || dockMutation.isError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>
              {stationsQuery.isError
                ? 'Failed to scan for stations. Please try again.'
                : movementApi.handleError(
                    (dockMutation.error as any)?.response?.data?.error?.code ||
                      'VALIDATION_ERROR'
                  )}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleClose}
          disabled={dockMutation.isPending}
        >
          <Text style={styles.buttonTextSecondary}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            (!selectedStation || dockMutation.isPending) && styles.buttonDisabled,
          ]}
          onPress={handleDock}
          disabled={!selectedStation || dockMutation.isPending}
        >
          {dockMutation.isPending ? (
            <ActivityIndicator color={tokens.colors.text.primary} size="small" />
          ) : (
            <Text style={styles.buttonTextPrimary}>CONFIRM DOCKING</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.colors.surface.base,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing[6],
    paddingTop: tokens.spacing[6],
    paddingBottom: tokens.spacing[8],
    borderTopWidth: 2,
    borderTopColor: tokens.colors.primary.alpha[30],
    ...tokens.elevation[4],
    maxHeight: '75%', // Don't cover entire screen
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[4],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },

  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },

  closeButton: {
    width: tokens.interaction.minTouchTarget,
    height: tokens.interaction.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: tokens.spacing[4],
  },

  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing[12],
    gap: tokens.spacing[3],
  },

  loadingText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },

  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    marginTop: tokens.spacing[2],
  },

  stationList: {
    gap: tokens.spacing[3],
  },

  stationCard: {
    backgroundColor: tokens.colors.surface.raised,
    borderWidth: 2,
    borderColor: tokens.colors.border.default,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[4],
  },

  stationCardSelected: {
    borderColor: tokens.colors.primary.main,
    backgroundColor: tokens.colors.primary.alpha[10],
  },

  stationCardDisabled: {
    opacity: 0.5,
  },

  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing[3],
  },

  stationInfo: {
    flex: 1,
  },

  stationName: {
    fontSize: tokens.typography.fontSize.md,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[1],
  },

  stationType: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },

  stationStatus: {
    alignItems: 'flex-end',
    gap: tokens.spacing[1],
  },

  statusRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
    alignItems: 'center',
  },

  statusLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },

  statusValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.mono,
  },

  warningText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.danger,
    fontWeight: tokens.typography.fontWeight.bold,
  },

  services: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
    paddingTop: tokens.spacing[3],
    gap: tokens.spacing[2],
  },

  servicesLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  serviceBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },

  serviceBadge: {
    backgroundColor: tokens.colors.surface.overlay,
    paddingVertical: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[3],
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
  },

  serviceBadgeText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.medium,
  },

  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: tokens.colors.danger,
    borderRadius: tokens.radius.base,
    padding: tokens.spacing[3],
    marginTop: tokens.spacing[4],
  },

  errorMessage: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.danger,
  },

  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    marginTop: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.light,
  },

  button: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: tokens.interaction.minTouchTarget,
  },

  buttonSecondary: {
    backgroundColor: tokens.colors.surface.raised,
    borderWidth: 2,
    borderColor: tokens.colors.border.light,
  },

  buttonPrimary: {
    backgroundColor: tokens.colors.primary.main,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonTextSecondary: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },

  buttonTextPrimary: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
});
