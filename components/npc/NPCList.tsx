import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Radar, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useNPCStore } from '@/stores/npcStore';
import NPCCard from './NPCCard';

interface NPCListProps {
  onSelectNPC: (npcId: string) => void;
  onInitiateCombat: (npcId: string) => void;
}

/**
 * List of NPCs in the current sector
 * Displays all NPCs with filtering and selection
 */
export default function NPCList({
  onSelectNPC,
  onInitiateCombat,
}: NPCListProps) {
  const { npcs, selectedNPC, isLoading, error } = useNPCStore();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Radar size={20} color={Colors.primary} />
          <Text style={styles.title}>Scanner</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Scanning sector...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Radar size={20} color={Colors.primary} />
          <Text style={styles.title}>Scanner</Text>
        </View>
        <View style={styles.errorState}>
          <AlertCircle size={24} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (npcs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Radar size={20} color={Colors.primary} />
          <Text style={styles.title}>Scanner</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No ships detected in this sector</Text>
        </View>
      </View>
    );
  }

  // Count NPCs by type
  const pirates = npcs.filter((n) => n.npc_type === 'pirate').length;
  const traders = npcs.filter((n) => n.npc_type === 'trader').length;
  const patrols = npcs.filter((n) => n.npc_type === 'patrol').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Radar size={20} color={Colors.primary} />
          <Text style={styles.title}>Scanner</Text>
        </View>
        <Text style={styles.subtitle}>
          {npcs.length} ship{npcs.length !== 1 ? 's' : ''} detected
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {pirates > 0 && (
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.statText}>{pirates} Pirate{pirates !== 1 ? 's' : ''}</Text>
          </View>
        )}
        {traders > 0 && (
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.statText}>{traders} Trader{traders !== 1 ? 's' : ''}</Text>
          </View>
        )}
        {patrols > 0 && (
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.statText}>{patrols} Patrol{patrols !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* NPC List */}
      <FlatList
        data={npcs}
        keyExtractor={(npc) => npc.entity_id}
        renderItem={({ item }) => (
          <NPCCard
            npc={item}
            onSelect={() => onSelectNPC(item.entity_id)}
            onInitiateCombat={() => onInitiateCombat(item.entity_id)}
            isSelected={selectedNPC?.entity_id === item.entity_id}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  list: {
    padding: 12,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorState: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
});
