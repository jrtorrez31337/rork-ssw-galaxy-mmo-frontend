import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Filter } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { shipApi } from '@/api/ships';
import { inventoryApi } from '@/api/inventory';
import { miningApi } from '@/api/mining';
import { useMiningEvents } from '@/hooks/useMiningEvents';
import ResourceNodeList from '@/components/mining/ResourceNodeList';
import MiningControls from '@/components/mining/MiningControls';
import MiningProgressBar from '@/components/mining/MiningProgressBar';
import Colors from '@/constants/colors';
import type { Ship } from '@/types/api';
import type { ResourceNode, ExtractionResult } from '@/types/mining';

export default function MiningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profileId } = useAuth();
  const queryClient = useQueryClient();

  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [selectedNode, setSelectedNode] = useState<ResourceNode | null>(null);
  const [resourceFilter, setResourceFilter] = useState<string | undefined>(
    undefined
  );
  const [miningInProgress, setMiningInProgress] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);

  const shipId = params.shipId as string | undefined;

  // Fetch player's ships
  const {
    data: ships,
    isLoading: loadingShips,
    refetch: refetchShips,
  } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  // Fetch inventory for selected ship
  const { data: inventory, refetch: refetchInventory } = useQuery({
    queryKey: ['inventory', selectedShip?.id],
    queryFn: () => inventoryApi.getInventory(selectedShip!.id, 'ship'),
    enabled: !!selectedShip,
  });

  // Fetch resource nodes for current sector
  const {
    data: nodesData,
    isLoading: loadingNodes,
    refetch: refetchNodes,
  } = useQuery({
    queryKey: [
      'mining-nodes',
      selectedShip?.location_sector,
      resourceFilter,
    ],
    queryFn: () =>
      miningApi.getNodes(selectedShip!.location_sector, resourceFilter),
    enabled: !!selectedShip?.location_sector,
  });

  // Extract resources mutation
  const extractMutation = useMutation({
    mutationFn: (quantity: number) =>
      miningApi.extractResources({
        ship_id: selectedShip!.id,
        resource_node_id: selectedNode!.id,
        quantity,
      }),
    onSuccess: (result) => {
      setExtractionResult(result);
      setMiningInProgress(true);

      // Simulate extraction time
      setTimeout(() => {
        setMiningInProgress(false);
        Alert.alert(
          'Extraction Complete!',
          `Mined ${result.quantity_extracted} units of ${selectedNode?.resource_type} with quality ${result.quality}×`,
          [{ text: 'OK' }]
        );

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['mining-nodes'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        setExtractionResult(null);
      }, result.extraction_time_seconds * 1000);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || 'Failed to extract resources';
      Alert.alert('Mining Failed', errorMessage, [{ text: 'OK' }]);
    },
  });

  // Set selected ship on load
  useEffect(() => {
    if (ships && ships.length > 0) {
      const ship = shipId ? ships.find((s) => s.id === shipId) : ships[0];
      if (ship) {
        setSelectedShip(ship);
      }
    }
  }, [ships, shipId]);

  // Subscribe to mining events
  useMiningEvents(profileId || '', {
    onResourceExtracted: (event) => {
      console.log('[Mining] Resource extracted:', event);
      // Queries will be invalidated automatically by the hook
    },
    onInventoryUpdate: (event) => {
      console.log('[Mining] Inventory updated:', event);
    },
  });

  const handleExtract = (quantity: number) => {
    if (!selectedShip || !selectedNode) return;

    // Validate ship state
    if (selectedShip.docked_at) {
      Alert.alert('Cannot Mine', 'You must undock before mining');
      return;
    }

    extractMutation.mutate(quantity);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchShips(), refetchNodes(), refetchInventory()]);
  };

  if (loadingShips) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ships...</Text>
      </View>
    );
  }

  if (!selectedShip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No ships available</Text>
        <Text style={styles.errorSubtext}>
          You need a ship to access the mining interface
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cargoUsed = inventory?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cargoCapacity = selectedShip.cargo_capacity || 1000;
  const nodes = nodesData?.nodes || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mining Interface</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingNodes}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Ship Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Current Ship</Text>
          <Text style={styles.infoValue}>{selectedShip.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>
              Sector {selectedShip.location_sector}
            </Text>
          </View>
          {selectedShip.docked_at && (
            <View style={styles.warningBox}>
              <Text style={styles.warningBoxText}>
                Ship is docked - undock to mine
              </Text>
            </View>
          )}
        </View>

        {/* Resource Filter */}
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Filter size={16} color={Colors.text} />
            <Text style={styles.filterLabel}>Filter by Resource</Text>
          </View>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                !resourceFilter && styles.filterButtonActive,
              ]}
              onPress={() => setResourceFilter(undefined)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  !resourceFilter && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {['iron_ore', 'copper_ore', 'gold_ore', 'ice'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  resourceFilter === type && styles.filterButtonActive,
                ]}
                onPress={() => setResourceFilter(type)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    resourceFilter === type && styles.filterButtonTextActive,
                  ]}
                >
                  {type.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mining Progress (if active) */}
        {miningInProgress && extractionResult && selectedNode && (
          <MiningProgressBar
            durationSeconds={extractionResult.extraction_time_seconds}
            resourceType={selectedNode.resource_type}
            quantity={extractionResult.quantity_extracted}
            onComplete={() => {
              setMiningInProgress(false);
              setExtractionResult(null);
            }}
          />
        )}

        {/* Resource Nodes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Resource Nodes ({nodes.length})
          </Text>
          <ResourceNodeList
            nodes={nodes}
            shipPosition={
              selectedShip.position || { x: 0, y: 0, z: 0 }
            }
            selectedNodeId={selectedNode?.id}
            onSelectNode={setSelectedNode}
            maxHeight={300}
          />
        </View>

        {/* Mining Controls */}
        {selectedNode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extraction Controls</Text>
            <MiningControls
              node={selectedNode}
              cargoUsed={cargoUsed}
              cargoCapacity={cargoCapacity}
              onExtract={handleExtract}
              disabled={
                miningInProgress ||
                extractMutation.isPending ||
                !!selectedShip.docked_at
              }
            />
          </View>
        )}

        {!selectedNode && !miningInProgress && (
          <View style={styles.helpCard}>
            <Text style={styles.helpText}>
              Select a resource node above to begin mining
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  warningBox: {
    backgroundColor: Colors.danger + '20',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  warningBoxText: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
  filterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.border,
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  helpCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
});
