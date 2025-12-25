import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movementApi } from '@/api/movement';
import { Ship } from '@/types/api';
import { Station } from '@/types/movement';
import Colors from '@/constants/colors';

interface DockingDialogProps {
  visible: boolean;
  ship: Ship;
  onClose: () => void;
}

const MAX_DOCKING_RANGE = 5000;

function calculateDistance(ship: Ship, station: Station): number {
  return Math.sqrt(
    Math.pow(station.position.x - ship.position.x, 2) +
    Math.pow(station.position.y - ship.position.y, 2) +
    Math.pow(station.position.z - ship.position.z, 2)
  );
}

export default function DockingDialog({
  visible,
  ship,
  onClose,
}: DockingDialogProps) {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const queryClient = useQueryClient();

  // Fetch stations when dialog opens
  const stationsQuery = useQuery({
    queryKey: ['stations', ship.location_sector],
    queryFn: () => movementApi.getStations(ship.location_sector),
    enabled: visible,
  });

  const dockMutation = useMutation({
    mutationFn: (stationId: string) => movementApi.dock(ship.id, stationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Select Station to Dock</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={dockMutation.isPending}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Loading State */}
            {stationsQuery.isLoading && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading stations...</Text>
              </View>
            )}

            {/* Empty State */}
            {!stationsQuery.isLoading && stations.length === 0 && (
              <View style={styles.centerContent}>
                <Text style={styles.emptyText}>No stations in this sector</Text>
              </View>
            )}

            {/* Station List */}
            {!stationsQuery.isLoading && stations.length > 0 && (
              <View style={styles.stationList}>
                {stations.map((station) => {
                  const distance = calculateDistance(ship, station);
                  const inRange = distance <= MAX_DOCKING_RANGE;
                  const hasCapacity =
                    station.docked_ships_count < station.docking_capacity;
                  const canDock = inRange && hasCapacity;

                  return (
                    <TouchableOpacity
                      key={station.id}
                      style={[
                        styles.stationCard,
                        selectedStation?.id === station.id &&
                          styles.stationCardSelected,
                        !canDock && styles.stationCardDisabled,
                      ]}
                      onPress={() => canDock && setSelectedStation(station)}
                      disabled={!canDock || dockMutation.isPending}
                    >
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
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: inRange ? Colors.success : Colors.danger,
                              },
                            ]}
                          >
                            {distance.toFixed(0)} units
                          </Text>
                          {!inRange && (
                            <Text style={styles.statusLabel}>(out of range)</Text>
                          )}

                          {/* Capacity */}
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color: hasCapacity
                                  ? Colors.textSecondary
                                  : Colors.danger,
                              },
                            ]}
                          >
                            {station.docked_ships_count}/
                            {station.docking_capacity} docked
                          </Text>
                          {!hasCapacity && (
                            <Text style={styles.statusLabel}>(FULL)</Text>
                          )}
                        </View>
                      </View>

                      {/* Services */}
                      <View style={styles.services}>
                        {station.services.map((service) => (
                          <View key={service} style={styles.serviceBadge}>
                            <Text style={styles.serviceBadgeText}>{service}</Text>
                          </View>
                        ))}
                      </View>
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
                    ? 'Failed to load stations'
                    : movementApi.handleError(
                        (dockMutation.error as any)?.response?.data?.error
                          ?.code || 'VALIDATION_ERROR'
                      )}
                </Text>
              </View>
            )}

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
                  (!selectedStation || dockMutation.isPending) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleDock}
                disabled={!selectedStation || dockMutation.isPending}
              >
                {dockMutation.isPending ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Dock</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  stationList: {
    gap: 12,
    marginBottom: 20,
  },
  stationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 16,
  },
  stationCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  stationCardDisabled: {
    opacity: 0.5,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  stationType: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stationStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textDim,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
