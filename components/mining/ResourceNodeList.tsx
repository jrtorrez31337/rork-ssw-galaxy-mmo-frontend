import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Pickaxe } from 'lucide-react-native';
import Colors from '@/constants/colors';
import QualityIndicator from './QualityIndicator';
import type { ResourceNode, Position3D } from '@/types/mining';
import { calculateDistance, getResourceColor } from '@/types/mining';

interface ResourceNodeListProps {
  nodes: ResourceNode[];
  shipPosition?: Position3D;
  selectedNodeId?: string;
  onSelectNode: (node: ResourceNode) => void;
  maxHeight?: number;
}

/**
 * List of resource nodes in current sector
 * Shows node details, distance from ship, and selection state
 */
export default function ResourceNodeList({
  nodes,
  shipPosition,
  selectedNodeId,
  onSelectNode,
  maxHeight = 400,
}: ResourceNodeListProps) {
  if (nodes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Pickaxe size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>No resource nodes found</Text>
        <Text style={styles.emptySubtext}>
          This sector has no mineable resources
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { maxHeight }]}
      showsVerticalScrollIndicator={true}
    >
      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const distance = shipPosition
          ? calculateDistance(shipPosition, node.position)
          : null;
        const inRange = distance !== null && distance <= 1000;
        const resourceColor = getResourceColor(node.resource_type);

        return (
          <TouchableOpacity
            key={node.id}
            style={[
              styles.nodeCard,
              isSelected && styles.nodeCardSelected,
            ]}
            onPress={() => onSelectNode(node)}
            activeOpacity={0.7}
          >
            {/* Header */}
            <View style={styles.nodeHeader}>
              <View style={styles.nodeTitle}>
                <View
                  style={[
                    styles.resourceDot,
                    { backgroundColor: resourceColor },
                  ]}
                />
                <Text style={styles.resourceType}>
                  {node.resource_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <QualityIndicator
                quality={node.quality_mean}
                showLabel={false}
                size="small"
              />
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>
                  {node.quantity_remaining.toLocaleString()}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Richness</Text>
                <Text style={styles.infoValue}>
                  {(node.richness * 100).toFixed(0)}%
                </Text>
              </View>

              {distance !== null && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Distance</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      !inRange && styles.outOfRange,
                    ]}
                  >
                    {distance.toFixed(0)} units
                  </Text>
                </View>
              )}
            </View>

            {/* Position */}
            <View style={styles.positionRow}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.positionText}>
                ({node.position.x.toFixed(0)}, {node.position.y.toFixed(0)},{' '}
                {node.position.z.toFixed(0)})
              </Text>
              {node.respawns && (
                <View style={styles.respawnBadge}>
                  <Text style={styles.respawnText}>Respawns</Text>
                </View>
              )}
            </View>

            {/* Range indicator */}
            {distance !== null && !inRange && (
              <View style={styles.warningBar}>
                <Text style={styles.warningText}>
                  Out of mining range (max 1,000 units)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  nodeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  nodeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nodeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  resourceType: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  outOfRange: {
    color: Colors.danger,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  positionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  respawnBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  respawnText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '600',
  },
  warningBar: {
    marginTop: 8,
    backgroundColor: Colors.danger + '20',
    padding: 8,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
    fontWeight: '600',
  },
});
