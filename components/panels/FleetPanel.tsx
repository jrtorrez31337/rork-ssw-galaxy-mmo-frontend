import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Rocket, Package, Settings, ChevronRight, Plus, Shield, Fuel, Box, Gauge } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { tokens } from '@/ui/theme';
import { Panel, StatusChip, RailButton, Spinner } from '@/ui/components';
import { useAuth } from '@/contexts/AuthContext';
import { useCockpitStore } from '@/stores/cockpitStore';
import { shipApi } from '@/api/ships';
import { inventoryApi } from '@/api/inventory';
import type { Ship } from '@/types/api';

/**
 * FleetPanel - FLT Rail Content
 *
 * Per UI/UX Doctrine:
 * - Ship list with status overview
 * - Quick ship actions (controls, inventory)
 * - Ship switching
 */

type FleetMode = 'list' | 'details' | 'inventory';

export function FleetPanel() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [mode, setMode] = useState<FleetMode>('list');
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

  const updateRailState = useCockpitStore((s) => s.updateRailState);

  const { data: ships, isLoading } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const handleSelectShip = useCallback((ship: Ship) => {
    setSelectedShip(ship);
    updateRailState('FLT', { selectedShipId: ship.id });
    setMode('details');
  }, [updateRailState]);

  const handleBack = useCallback(() => {
    setSelectedShip(null);
    setMode('list');
  }, []);

  // Render based on mode
  if (mode === 'details' && selectedShip) {
    return <ShipDetailsView ship={selectedShip} onBack={handleBack} onInventory={() => setMode('inventory')} />;
  }
  if (mode === 'inventory' && selectedShip) {
    return <ShipInventoryView ship={selectedShip} onBack={() => setMode('details')} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Fleet Overview */}
      <Panel variant="navigation" title="FLEET OVERVIEW" style={styles.panel}>
        <View style={styles.fleetSummary}>
          <View style={styles.fleetCount}>
            <Text style={styles.fleetCountNumber}>{ships?.length || 0}</Text>
            <Text style={styles.fleetCountLabel}>Ships</Text>
          </View>
          <TouchableOpacity
            style={styles.addShipButton}
            onPress={() => router.push('/ship-customize')}
          >
            <Plus size={16} color={tokens.colors.lcars.sky} />
            <Text style={styles.addShipText}>New Ship</Text>
          </TouchableOpacity>
        </View>
      </Panel>

      {/* Ship List */}
      <Panel variant="navigation" title="YOUR SHIPS" style={styles.panel}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Spinner size="small" />
            <Text style={styles.loadingText}>Loading fleet...</Text>
          </View>
        ) : ships && ships.length > 0 ? (
          ships.map((ship) => (
            <TouchableOpacity
              key={ship.id}
              style={styles.shipRow}
              onPress={() => handleSelectShip(ship)}
            >
              <View style={styles.shipIcon}>
                <Rocket size={20} color={tokens.colors.lcars.sky} />
              </View>
              <View style={styles.shipInfo}>
                <Text style={styles.shipName}>{ship.name || 'Unnamed Ship'}</Text>
                <Text style={styles.shipType}>{ship.ship_type.toUpperCase()}</Text>
              </View>
              <View style={styles.shipStatus}>
                <StatusChip
                  label=""
                  value={ship.docked_at ? 'Docked' : 'In Space'}
                  status={ship.docked_at ? 'info' : 'online'}
                  size="small"
                />
              </View>
              <ChevronRight size={16} color={tokens.colors.text.tertiary} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ships in your fleet</Text>
            <RailButton
              label="CUSTOMIZE SHIP"
              variant="navigation"
              onPress={() => router.push('/ship-customize')}
            />
          </View>
        )}
      </Panel>
    </ScrollView>
  );
}

// Ship Details Sub-view
function ShipDetailsView({
  ship,
  onBack,
  onInventory
}: {
  ship: Ship;
  onBack: () => void;
  onInventory: () => void;
}) {
  const router = useRouter();

  const handleTrading = useCallback(() => {
    if (ship.docked_at) {
      router.push({ pathname: '/trading' as any, params: { shipId: ship.id } });
    } else {
      Alert.alert('Not Docked', 'You must be docked at a station to access trading');
    }
  }, [router, ship]);

  const handleMining = useCallback(() => {
    if (!ship.docked_at) {
      router.push({ pathname: '/mining' as any, params: { shipId: ship.id } });
    } else {
      Alert.alert('Cannot Mine', 'You must undock before mining');
    }
  }, [router, ship]);

  // Calculate percentages for status bars
  const hullPercent = (ship.hull_points / ship.hull_max) * 100;
  const shieldPercent = (ship.shield_points / ship.shield_max) * 100;
  const fuelPercent = (ship.fuel_current / ship.fuel_capacity) * 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Fleet</Text>
      </TouchableOpacity>

      {/* Ship Header */}
      <Panel variant="navigation" title={ship.name || 'UNNAMED SHIP'} style={styles.panel}>
        <View style={styles.shipHeader}>
          <View style={styles.shipTypeContainer}>
            <Rocket size={32} color={tokens.colors.lcars.sky} />
            <Text style={styles.shipTypeLarge}>{ship.ship_type.toUpperCase()}</Text>
          </View>
          <StatusChip
            label=""
            value={ship.docked_at ? `Docked: ${ship.docked_at}` : ship.location_sector || 'Unknown'}
            status={ship.docked_at ? 'info' : 'online'}
            size="small"
          />
        </View>
      </Panel>

      {/* Ship Status */}
      <Panel variant="navigation" title="STATUS" style={styles.panel}>
        <View style={styles.statusGrid}>
          {/* Hull */}
          <View style={styles.statusItem}>
            <View style={styles.statusHeader}>
              <Shield size={14} color={tokens.colors.semantic.combat} />
              <Text style={styles.statusLabel}>HULL</Text>
            </View>
            <View style={styles.statusBarContainer}>
              <View style={[styles.statusBar, styles.statusBarHull, { width: `${hullPercent}%` }]} />
            </View>
            <Text style={styles.statusValue}>{ship.hull_points}/{ship.hull_max}</Text>
          </View>

          {/* Shields */}
          <View style={styles.statusItem}>
            <View style={styles.statusHeader}>
              <Gauge size={14} color={tokens.colors.semantic.navigation} />
              <Text style={styles.statusLabel}>SHIELDS</Text>
            </View>
            <View style={styles.statusBarContainer}>
              <View style={[styles.statusBar, styles.statusBarShield, { width: `${shieldPercent}%` }]} />
            </View>
            <Text style={styles.statusValue}>{ship.shield_points}/{ship.shield_max}</Text>
          </View>

          {/* Fuel */}
          <View style={styles.statusItem}>
            <View style={styles.statusHeader}>
              <Fuel size={14} color={tokens.colors.semantic.economy} />
              <Text style={styles.statusLabel}>FUEL</Text>
            </View>
            <View style={styles.statusBarContainer}>
              <View style={[styles.statusBar, styles.statusBarFuel, { width: `${fuelPercent}%` }]} />
            </View>
            <Text style={styles.statusValue}>{ship.fuel_current}/{ship.fuel_capacity}</Text>
          </View>

          {/* Cargo */}
          <View style={styles.statusItem}>
            <View style={styles.statusHeader}>
              <Box size={14} color={tokens.colors.lcars.peach} />
              <Text style={styles.statusLabel}>CARGO</Text>
            </View>
            <View style={styles.statusBarContainer}>
              <View style={[styles.statusBar, styles.statusBarCargo, { width: '0%' }]} />
            </View>
            <Text style={styles.statusValue}>0/{ship.cargo_capacity}</Text>
          </View>
        </View>
      </Panel>

      {/* Quick Actions */}
      <Panel variant="navigation" title="ACTIONS" style={styles.panel}>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={onInventory}>
            <Package size={24} color={tokens.colors.lcars.sky} />
            <Text style={styles.actionCardTitle}>INVENTORY</Text>
            <Text style={styles.actionCardSubtitle}>Manage cargo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, !ship.docked_at && styles.actionCardDisabled]}
            onPress={handleTrading}
            disabled={!ship.docked_at}
          >
            <Settings size={24} color={ship.docked_at ? tokens.colors.lcars.sky : tokens.colors.text.disabled} />
            <Text style={[styles.actionCardTitle, !ship.docked_at && styles.actionCardTitleDisabled]}>
              TRADING
            </Text>
            <Text style={styles.actionCardSubtitle}>
              {ship.docked_at ? 'Access market' : 'Dock required'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, ship.docked_at && styles.actionCardDisabled]}
            onPress={handleMining}
            disabled={!!ship.docked_at}
          >
            <Settings size={24} color={!ship.docked_at ? tokens.colors.lcars.sky : tokens.colors.text.disabled} />
            <Text style={[styles.actionCardTitle, ship.docked_at && styles.actionCardTitleDisabled]}>
              MINING
            </Text>
            <Text style={styles.actionCardSubtitle}>
              {ship.docked_at ? 'Undock first' : 'Scan nodes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Settings size={24} color={tokens.colors.lcars.sky} />
            <Text style={styles.actionCardTitle}>CONTROLS</Text>
            <Text style={styles.actionCardSubtitle}>Ship systems</Text>
          </TouchableOpacity>
        </View>
      </Panel>
    </ScrollView>
  );
}

// Ship Inventory Sub-view
function ShipInventoryView({ ship, onBack }: { ship: Ship; onBack: () => void }) {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', ship.id],
    queryFn: () => inventoryApi.getInventory(ship.id, 'ship'),
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to {ship.name || 'Ship'}</Text>
      </TouchableOpacity>

      <Panel variant="navigation" title="CARGO HOLD" style={styles.panel}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Spinner size="small" />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : inventory && inventory.items && inventory.items.length > 0 ? (
          <>
            <View style={styles.inventoryHeader}>
              <Text style={styles.inventoryCapacity}>
                {inventory.used || 0} / {inventory.capacity || ship.cargo_capacity} units
              </Text>
            </View>
            {inventory.items.map((item: any, index: number) => (
              <View key={index} style={styles.inventoryItem}>
                <Package size={16} color={tokens.colors.text.tertiary} />
                <Text style={styles.inventoryItemName}>{item.item_type || item.name}</Text>
                <Text style={styles.inventoryItemQty}>x{item.quantity}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.emptyText}>No items in cargo hold</Text>
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    marginBottom: tokens.spacing[3],
  },
  fleetSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fleetCount: {
    alignItems: 'center',
  },
  fleetCountNumber: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.sky,
  },
  fleetCountLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  addShipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  addShipText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.lcars.sky,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[6],
    gap: tokens.spacing[2],
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  shipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  shipIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing[3],
  },
  shipInfo: {
    flex: 1,
  },
  shipName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  shipType: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: 2,
  },
  shipStatus: {
    marginRight: tokens.spacing[2],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[6],
    gap: tokens.spacing[4],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
  },
  backText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.lcars.sky,
  },
  shipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shipTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  shipTypeLarge: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  statusGrid: {
    gap: tokens.spacing[3],
  },
  statusItem: {
    gap: tokens.spacing[1],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  statusLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  statusBarContainer: {
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusBar: {
    height: '100%',
    borderRadius: 4,
  },
  statusBarHull: {
    backgroundColor: tokens.colors.semantic.combat,
  },
  statusBarShield: {
    backgroundColor: tokens.colors.semantic.navigation,
  },
  statusBarFuel: {
    backgroundColor: tokens.colors.semantic.economy,
  },
  statusBarCargo: {
    backgroundColor: tokens.colors.lcars.peach,
  },
  statusValue: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    textAlign: 'right',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
  },
  actionCard: {
    width: '47%',
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionCardTitle: {
    marginTop: tokens.spacing[2],
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
  },
  actionCardTitleDisabled: {
    color: tokens.colors.text.disabled,
  },
  actionCardSubtitle: {
    marginTop: tokens.spacing[1],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
  inventoryHeader: {
    marginBottom: tokens.spacing[3],
  },
  inventoryCapacity: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  inventoryItemName: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
  },
  inventoryItemQty: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
});
