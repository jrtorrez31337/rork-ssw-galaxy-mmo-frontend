import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swords, Shield, Heart, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { NPCEntity } from '@/types/combat';
import { getNPCColor, getHealthPercentage } from '@/types/combat';

interface NPCCardProps {
  npc: NPCEntity;
  onSelect: () => void;
  onInitiateCombat: () => void;
  isSelected?: boolean;
}

/**
 * NPC info card with details and combat button
 * Shows NPC type, health, and allows combat initiation
 */
export default function NPCCard({
  npc,
  onSelect,
  onInitiateCombat,
  isSelected = false,
}: NPCCardProps) {
  const npcColor = getNPCColor(npc.npc_type);
  const hullPercent = getHealthPercentage(npc.hull, npc.hull_max);
  const shieldPercent = getHealthPercentage(npc.shield, npc.shield_max);

  const typeLabels = {
    pirate: 'Hostile Pirate',
    trader: 'Peaceful Trader',
    patrol: 'Faction Patrol',
  };

  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={[styles.typeIndicator, { backgroundColor: npcColor }]} />
        <View style={styles.headerContent}>
          <Text style={styles.name}>{npc.name}</Text>
          <Text style={[styles.type, { color: npcColor }]}>
            {typeLabels[npc.npc_type]}
          </Text>
          {npc.level && (
            <Text style={styles.level}>Level {npc.level}</Text>
          )}
        </View>
        <Info size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {isSelected && (
        <View style={styles.details}>
          {/* Health bars */}
          <View style={styles.healthSection}>
            <Text style={styles.sectionLabel}>Ship Status</Text>

            {/* Shield */}
            <View style={styles.barRow}>
              <Shield size={14} color={Colors.primary} />
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      styles.shieldBar,
                      { width: `${shieldPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barText}>
                  {Math.floor(npc.shield)} / {npc.shield_max}
                </Text>
              </View>
            </View>

            {/* Hull */}
            <View style={styles.barRow}>
              <Heart size={14} color={Colors.danger} />
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      styles.hullBar,
                      { width: `${hullPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barText}>
                  {Math.floor(npc.hull)} / {npc.hull_max}
                </Text>
              </View>
            </View>
          </View>

          {/* Faction info */}
          {npc.faction && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Faction:</Text>
              <Text style={styles.infoValue}>{npc.faction}</Text>
            </View>
          )}

          {/* Position */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position:</Text>
            <Text style={styles.infoValue}>
              ({Math.floor(npc.position[0])}, {Math.floor(npc.position[1])},{' '}
              {Math.floor(npc.position[2])})
            </Text>
          </View>

          {/* Combat button */}
          <TouchableOpacity
            style={[
              styles.combatButton,
              npc.npc_type === 'pirate' && styles.combatButtonDanger,
            ]}
            onPress={onInitiateCombat}
            activeOpacity={0.8}
          >
            <Swords size={18} color="#FFFFFF" />
            <Text style={styles.combatButtonText}>Initiate Combat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  typeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
  },
  level: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  details: {
    padding: 12,
    paddingTop: 0,
    gap: 12,
  },
  healthSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    gap: 2,
  },
  barBackground: {
    height: 16,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  shieldBar: {
    backgroundColor: Colors.primary,
  },
  hullBar: {
    backgroundColor: Colors.danger,
  },
  barText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  combatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.warning,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  combatButtonDanger: {
    backgroundColor: Colors.danger,
  },
  combatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
