import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movementApi } from '@/api/movement';
import { travelApi } from '@/api/travel';
import { stationServicesApi } from '@/api/station-services';
import { Ship, UserProfile } from '@/types/api';
import { Station } from '@/types/movement';
import FuelGauge from './FuelGauge';
import JumpCooldownTimer from './JumpCooldownTimer';
import TravelProgressBar from './TravelProgressBar';
import { JumpPanel } from './JumpPanel';
import { DockingPanel } from './DockingPanel';
import StationServicesPanel from '@/components/station-services/StationServicesPanel';
import { useAuth } from '@/contexts/AuthContext';
import { reputationApi } from '@/api/reputation';
import { useTravelStore } from '@/stores/travelStore';
import Colors from '@/constants/colors';

interface ShipControlPanelProps {
  ship: Ship;
}

export default function ShipControlPanel({ ship }: ShipControlPanelProps) {
  const [jumpDialogOpen, setJumpDialogOpen] = useState(false);
  const [dockDialogOpen, setDockDialogOpen] = useState(false);
  const [jumpOnCooldown, setJumpOnCooldown] = useState(false);
  const queryClient = useQueryClient();
  const { user, profileId } = useAuth();
  const { isInTransit, activeTravel, clearTravel } = useTravelStore();

  const isDocked = !!ship.docked_at;

  // Cancel travel mutation
  const cancelTravelMutation = useMutation({
    mutationFn: (travelId: string) => travelApi.cancel(travelId),
    onSuccess: (data) => {
      clearTravel();
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      Alert.alert(
        'Travel Cancelled',
        `Returned to ${activeTravel?.from_sector}. Refunded ${data.fuel_refund.toFixed(1)} fuel units.`
      );
    },
    onError: (error: any) => {
      Alert.alert('Cancel Failed', 'Could not cancel travel. Please try again.');
    },
  });

  const handleCancelTravel = () => {
    if (!activeTravel) return;

    Alert.alert(
      'Cancel Travel',
      'Are you sure you want to cancel travel? You will receive a partial fuel refund.',
      [
        { text: 'Continue Travel', style: 'cancel' },
        {
          text: 'Cancel Travel',
          style: 'destructive',
          onPress: () => cancelTravelMutation.mutate(activeTravel.travel_id),
        },
      ]
    );
  };

  // Fetch station data if docked
  const { data: stations } = useQuery({
    queryKey: ['stations', ship.location_sector],
    queryFn: () => movementApi.getStations(ship.location_sector),
    enabled: isDocked,
  });

  const currentStation = stations?.stations.find((s) => s.id === ship.docked_at);

  // Fetch reputation with station's faction
  const { data: reputations } = useQuery({
    queryKey: ['reputations', profileId],
    queryFn: () => reputationApi.getAllReputations(profileId!),
    enabled: !!profileId && isDocked && !!currentStation?.faction_id,
  });

  const stationReputation = currentStation?.faction_id
    ? reputations?.reputations.find((r) => r.faction_id === currentStation.faction_id)
    : null;

  const undockMutation = useMutation({
    mutationFn: () => movementApi.undock(ship.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ship'] });
      queryClient.invalidateQueries({ queryKey: ['ships'] });
    },
    onError: (error: any) => {
      const errorMessage = movementApi.handleError(
        error?.response?.data?.error?.code || 'VALIDATION_ERROR'
      );
      Alert.alert('Undock Failed', errorMessage);
    },
  });

  const refuelMutation = useMutation({
    mutationFn: () => stationServicesApi.refuel(ship.id, 0), // 0 = fill tank
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      Alert.alert(
        'Refuel Successful',
        `Refueled ${data.amount_added.toFixed(1)} units for ${data.cost_paid} CR`,
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      const errorMessage = stationServicesApi.handleError(
        error?.response?.data?.error?.code || 'VALIDATION_ERROR',
        error?.message
      );
      Alert.alert('Refuel Failed', errorMessage);
    },
  });

  const repairMutation = useMutation({
    mutationFn: () => stationServicesApi.repair(ship.id, true, true),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ships'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      Alert.alert(
        'Repair Successful',
        `Repaired ${data.hull_repaired} hull + ${data.shield_repaired} shield for ${data.cost_paid} CR`,
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      const errorMessage = stationServicesApi.handleError(
        error?.response?.data?.error?.code || 'VALIDATION_ERROR',
        error?.message
      );
      Alert.alert('Repair Failed', errorMessage);
    },
  });

  const handleUndock = () => {
    Alert.alert(
      'Undock from Station',
      'Are you sure you want to undock?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Undock',
          style: 'default',
          onPress: () => undockMutation.mutate(),
        },
      ]
    );
  };

  const handleRefuel = () => {
    Alert.alert(
      'Refuel Ship',
      'Fill your fuel tank?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Refuel',
          style: 'default',
          onPress: () => refuelMutation.mutate(),
        },
      ]
    );
  };

  const handleRepair = () => {
    Alert.alert(
      'Repair Ship',
      'Repair hull and shield to full?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Repair',
          style: 'default',
          onPress: () => repairMutation.mutate(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ship Controls</Text>

      {/* Ship Status */}
      <View style={styles.statusSection}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Location:</Text>
          <Text style={styles.statusValue}>
            {isInTransit && activeTravel
              ? `${activeTravel.from_sector} → ${activeTravel.to_sector}`
              : ship.location_sector}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text
            style={[
              styles.statusValue,
              {
                color: isInTransit
                  ? Colors.accent
                  : isDocked
                  ? Colors.success
                  : Colors.primary,
              },
            ]}
          >
            {isInTransit ? 'In Transit' : isDocked ? 'Docked' : 'Free Flight'}
          </Text>
        </View>
      </View>

      {/* Travel Progress Bar */}
      {isInTransit && (
        <TravelProgressBar onCancel={handleCancelTravel} />
      )}

      {/* Fuel Gauge */}
      <FuelGauge current={ship.fuel_current} capacity={ship.fuel_capacity} />

      {/* Jump Cooldown */}
      {ship.last_jump_at && (
        <JumpCooldownTimer
          lastJumpAt={ship.last_jump_at}
          onCooldownComplete={() => setJumpOnCooldown(false)}
        />
      )}

      {/* Combat Warning */}
      {ship.in_combat && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚔️ In Combat - Movement Disabled</Text>
        </View>
      )}

      {/* Station Services (when docked) */}
      {isDocked && currentStation && user && (
        <StationServicesPanel
          ship={ship}
          station={currentStation}
          player={user}
          playerReputation={stationReputation?.score || 0}
          onRefuelPress={handleRefuel}
          onRepairPress={handleRepair}
          isRefueling={refuelMutation.isPending}
          isRepairing={repairMutation.isPending}
        />
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isDocked ? (
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSecondary,
              undockMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleUndock}
            disabled={undockMutation.isPending}
          >
            {undockMutation.isPending ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <Text style={styles.buttonTextSecondary}>Undock from Station</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                (jumpOnCooldown || ship.in_combat || isInTransit) && styles.buttonDisabled,
              ]}
              onPress={() => setJumpDialogOpen(true)}
              disabled={jumpOnCooldown || ship.in_combat || isInTransit}
            >
              <Text style={styles.buttonTextPrimary}>Travel to Sector</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSecondary,
                (ship.in_combat || isInTransit) && styles.buttonDisabled,
              ]}
              onPress={() => setDockDialogOpen(true)}
              disabled={ship.in_combat || isInTransit}
            >
              <Text style={styles.buttonTextSecondary}>Dock at Station</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Jump Panel (Inline) */}
      {jumpDialogOpen && (
        <JumpPanel
          ship={ship}
          isVisible={jumpDialogOpen}
          onClose={() => setJumpDialogOpen(false)}
          onJumpSuccess={() => {
            setJumpOnCooldown(true);
            setJumpDialogOpen(false);
          }}
        />
      )}

      {/* Docking Panel (Inline) */}
      {dockDialogOpen && (
        <DockingPanel
          ship={ship}
          isVisible={dockDialogOpen}
          onClose={() => setDockDialogOpen(false)}
          onDockSuccess={() => setDockDialogOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  statusSection: {
    marginBottom: 20,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
