import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Fuel, Wrench, AlertCircle } from 'lucide-react-native';
import { Ship, UserProfile } from '@/types/api';
import { Station } from '@/types/movement';
import { StationServicePricing } from '@/types/station-services';
import {
  calculateRefuelCost,
  calculateRepairCost,
  hasSufficientCredits,
} from '@/utils/cost-calculator';
import Colors from '@/constants/colors';

interface StationServicesPanelProps {
  ship: Ship;
  station: Station;
  player: UserProfile;
  playerReputation?: number; // Reputation with station's faction
  onRefuelPress: () => void;
  onRepairPress: () => void;
  isRefueling?: boolean;
  isRepairing?: boolean;
}

export default function StationServicesPanel({
  ship,
  station,
  player,
  playerReputation = 0,
  onRefuelPress,
  onRepairPress,
  isRefueling = false,
  isRepairing = false,
}: StationServicesPanelProps) {
  // Find pricing for refuel and repair services
  const refuelPricing = station.service_pricing?.find(
    (p) => p.service_type === 'refuel'
  );
  const repairPricing = station.service_pricing?.find(
    (p) => p.service_type === 'repair'
  );

  // Check if ship is actually docked at this station
  const isDocked = ship.docked_at === station.id;

  // Calculate fuel needed
  const fuelNeeded = ship.fuel_capacity - ship.fuel_current;
  const fuelPercentage = (ship.fuel_current / ship.fuel_capacity) * 100;
  const needsFuel = fuelNeeded > 0;

  // Calculate damage
  const hullDamage = ship.hull_max - ship.hull_points;
  const shieldDamage = ship.shield_max - ship.shield_points;
  const hullPercentage = (ship.hull_points / ship.hull_max) * 100;
  const shieldPercentage = (ship.shield_points / ship.shield_max) * 100;
  const needsRepair = hullDamage > 0 || shieldDamage > 0;

  // Calculate costs
  const refuelCost = refuelPricing
    ? calculateRefuelCost(fuelNeeded, refuelPricing, playerReputation)
    : null;

  const repairCost = repairPricing
    ? calculateRepairCost(ship, true, true, repairPricing, playerReputation)
    : null;

  // Check affordability
  const canAffordRefuel = refuelCost
    ? hasSufficientCredits(player.credits, refuelCost.final_cost)
    : false;

  const canAffordRepair = repairCost
    ? hasSufficientCredits(player.credits, repairCost.final_cost)
    : false;

  if (!isDocked) {
    return (
      <View style={styles.container}>
        <View style={styles.warningBox}>
          <AlertCircle size={20} color={Colors.warning} />
          <Text style={styles.warningText}>
            You must be docked at a station to access services.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stationName}>{station.name}</Text>
        <Text style={styles.subtitle}>Station Services</Text>
      </View>

      {/* Ship Status */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Your Ship Status</Text>
        <View style={styles.statusGrid}>
          {/* Fuel Status */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Fuel</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${fuelPercentage}%`,
                    backgroundColor:
                      fuelPercentage > 50
                        ? Colors.success
                        : fuelPercentage > 20
                        ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              />
            </View>
            <Text style={styles.statusValue}>
              {ship.fuel_current.toFixed(1)} / {ship.fuel_capacity}
            </Text>
          </View>

          {/* Hull Status */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Hull</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${hullPercentage}%`,
                    backgroundColor:
                      hullPercentage > 75
                        ? Colors.success
                        : hullPercentage > 25
                        ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              />
            </View>
            <Text style={styles.statusValue}>
              {ship.hull_points} / {ship.hull_max}
            </Text>
          </View>

          {/* Shield Status */}
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Shield</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${shieldPercentage}%`,
                    backgroundColor:
                      shieldPercentage > 75
                        ? Colors.primary
                        : shieldPercentage > 25
                        ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              />
            </View>
            <Text style={styles.statusValue}>
              {ship.shield_points} / {ship.shield_max}
            </Text>
          </View>
        </View>
      </View>

      {/* Refuel Service */}
      {station.services.includes('refuel') && refuelPricing && (
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceTitleRow}>
              <Fuel size={20} color={Colors.primary} />
              <Text style={styles.serviceTitle}>Refuel</Text>
            </View>
            {!needsFuel && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>FULL</Text>
              </View>
            )}
          </View>

          {needsFuel ? (
            <>
              <Text style={styles.serviceDescription}>
                Fill tank ({fuelNeeded.toFixed(1)} units)
              </Text>

              {refuelCost && (
                <View style={styles.costBreakdown}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Cost:</Text>
                    <Text style={styles.costValue}>{refuelCost.final_cost} CR</Text>
                  </View>
                  {parseFloat(refuelCost.discount_amount) > 0 && (
                    <View style={styles.discountRow}>
                      <Text style={styles.discountLabel}>
                        Discount ({refuelCost.discount_percent}%):
                      </Text>
                      <Text style={styles.discountValue}>
                        -{refuelCost.discount_amount} CR
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {!canAffordRefuel && (
                <View style={styles.warningBox}>
                  <AlertCircle size={16} color={Colors.warning} />
                  <Text style={styles.warningText}>Insufficient credits</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.serviceButton,
                  (!canAffordRefuel || isRefueling) && styles.serviceButtonDisabled,
                ]}
                onPress={onRefuelPress}
                disabled={!canAffordRefuel || isRefueling}
              >
                {isRefueling ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.serviceButtonText}>Refuel Tank</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noServiceText}>Fuel tank is full</Text>
          )}
        </View>
      )}

      {/* Repair Service */}
      {station.services.includes('repair') && repairPricing && (
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceTitleRow}>
              <Wrench size={20} color={Colors.primary} />
              <Text style={styles.serviceTitle}>Repair</Text>
            </View>
            {!needsRepair && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>FULL HP</Text>
              </View>
            )}
          </View>

          {needsRepair ? (
            <>
              <Text style={styles.serviceDescription}>
                Repair hull and shield ({repairCost?.total_damage} HP)
              </Text>

              {repairCost && (
                <View style={styles.costBreakdown}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Cost:</Text>
                    <Text style={styles.costValue}>{repairCost.final_cost} CR</Text>
                  </View>
                  {parseFloat(repairCost.discount_amount) > 0 && (
                    <View style={styles.discountRow}>
                      <Text style={styles.discountLabel}>
                        Discount ({repairCost.discount_percent}%):
                      </Text>
                      <Text style={styles.discountValue}>
                        -{repairCost.discount_amount} CR
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {!canAffordRepair && (
                <View style={styles.warningBox}>
                  <AlertCircle size={16} color={Colors.warning} />
                  <Text style={styles.warningText}>Insufficient credits</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.serviceButton,
                  (!canAffordRepair || isRepairing) && styles.serviceButtonDisabled,
                ]}
                onPress={onRepairPress}
                disabled={!canAffordRepair || isRepairing}
              >
                {isRepairing ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.serviceButtonText}>Repair Ship</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noServiceText}>Ship is at full health</Text>
          )}
        </View>
      )}

      {/* No Services Available */}
      {!station.services.includes('refuel') &&
        !station.services.includes('repair') && (
          <View style={styles.warningBox}>
            <AlertCircle size={20} color={Colors.textSecondary} />
            <Text style={styles.warningText}>
              This station does not offer refuel or repair services.
            </Text>
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  stationName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  statusGrid: {
    gap: 12,
  },
  statusItem: {
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  costBreakdown: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountLabel: {
    fontSize: 12,
    color: Colors.success,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  serviceButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  serviceButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    opacity: 0.5,
  },
  serviceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  noServiceText: {
    fontSize: 14,
    color: Colors.textDim,
    fontStyle: 'italic',
  },
});
