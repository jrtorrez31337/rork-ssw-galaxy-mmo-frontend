import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Briefcase, TrendingUp, Pickaxe, Package, ChevronRight } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { Panel, StatusChip, RailButton } from '@/ui/components';
import { useBridgeState } from '@/hooks/useBridgeState';
import { useLocationStore } from '@/stores/locationStore';
import { useMissionStore } from '@/stores/missionStore';

/**
 * OperationsPanel - OPS Rail Content
 *
 * Per UI/UX Doctrine:
 * - Mission list
 * - Mining controls (when at node)
 * - Market interface (when docked)
 * - Active operations status
 */

type OpsMode = 'overview' | 'missions' | 'trading' | 'mining';

export function OperationsPanel() {
  const [mode, setMode] = useState<OpsMode>('overview');
  const { glance } = useBridgeState();

  const isDocked = useLocationStore((s) => s.docked.isDocked);
  const stationServices = useLocationStore((s) => s.docked.servicesAvailable);

  const activeMissions = useMissionStore((s) => s.activeMissions);
  const availableMissions = useMissionStore((s) => s.availableMissions);

  // Render based on mode
  if (mode === 'missions') {
    return <MissionsView onBack={() => setMode('overview')} />;
  }
  if (mode === 'trading') {
    return <TradingView onBack={() => setMode('overview')} />;
  }
  if (mode === 'mining') {
    return <MiningView onBack={() => setMode('overview')} />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Active Missions Summary */}
      <Panel variant="economy" title="ACTIVE MISSIONS" style={styles.panel}>
        <View style={styles.missionSummary}>
          <View style={styles.missionCount}>
            <Text style={styles.missionCountNumber}>{activeMissions.length}</Text>
            <Text style={styles.missionCountLabel}>Active</Text>
          </View>
          <TouchableOpacity
            style={styles.missionViewAll}
            onPress={() => setMode('missions')}
          >
            <Text style={styles.missionViewAllText}>View All</Text>
            <ChevronRight size={16} color={tokens.colors.semantic.economy} />
          </TouchableOpacity>
        </View>
        {activeMissions.slice(0, 2).map((mission) => (
          <View key={mission.id} style={styles.missionItem}>
            <Briefcase size={14} color={tokens.colors.text.tertiary} />
            <Text style={styles.missionName} numberOfLines={1}>
              {mission.template_name}
            </Text>
            <StatusChip
              label=""
              value={`${mission.progress_percentage || 0}%`}
              status="info"
              size="small"
            />
          </View>
        ))}
        {activeMissions.length === 0 && (
          <Text style={styles.emptyText}>No active missions</Text>
        )}
      </Panel>

      {/* Operations Grid */}
      <Panel variant="economy" title="OPERATIONS" style={styles.panel}>
        <View style={styles.opsGrid}>
          {/* Missions */}
          <TouchableOpacity
            style={styles.opsCard}
            onPress={() => setMode('missions')}
          >
            <Briefcase size={24} color={tokens.colors.semantic.economy} />
            <Text style={styles.opsCardTitle}>MISSIONS</Text>
            <Text style={styles.opsCardSubtitle}>
              {availableMissions.length} available
            </Text>
          </TouchableOpacity>

          {/* Trading - only when docked */}
          <TouchableOpacity
            style={[styles.opsCard, !isDocked && styles.opsCardDisabled]}
            onPress={() => isDocked && setMode('trading')}
            disabled={!isDocked}
          >
            <TrendingUp
              size={24}
              color={isDocked ? tokens.colors.semantic.economy : tokens.colors.text.disabled}
            />
            <Text style={[styles.opsCardTitle, !isDocked && styles.opsCardTitleDisabled]}>
              TRADING
            </Text>
            <Text style={styles.opsCardSubtitle}>
              {isDocked ? 'Market access' : 'Dock required'}
            </Text>
          </TouchableOpacity>

          {/* Mining - only in space */}
          <TouchableOpacity
            style={[styles.opsCard, isDocked && styles.opsCardDisabled]}
            onPress={() => !isDocked && setMode('mining')}
            disabled={isDocked}
          >
            <Pickaxe
              size={24}
              color={!isDocked ? tokens.colors.semantic.economy : tokens.colors.text.disabled}
            />
            <Text style={[styles.opsCardTitle, isDocked && styles.opsCardTitleDisabled]}>
              MINING
            </Text>
            <Text style={styles.opsCardSubtitle}>
              {isDocked ? 'Undock first' : 'Scan for nodes'}
            </Text>
          </TouchableOpacity>

          {/* Cargo */}
          <TouchableOpacity style={styles.opsCard}>
            <Package size={24} color={tokens.colors.semantic.economy} />
            <Text style={styles.opsCardTitle}>CARGO</Text>
            <Text style={styles.opsCardSubtitle}>Manage inventory</Text>
          </TouchableOpacity>
        </View>
      </Panel>

      {/* Station Services - when docked */}
      {isDocked && stationServices.length > 0 && (
        <Panel variant="economy" title="STATION SERVICES" style={styles.panel}>
          <View style={styles.servicesList}>
            {stationServices.map((service) => (
              <TouchableOpacity key={service} style={styles.serviceItem}>
                <Text style={styles.serviceName}>{service}</Text>
                <ChevronRight size={16} color={tokens.colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </Panel>
      )}
    </ScrollView>
  );
}

// Sub-views
function MissionsView({ onBack }: { onBack: () => void }) {
  const activeMissions = useMissionStore((s) => s.activeMissions);
  const availableMissions = useMissionStore((s) => s.availableMissions);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Operations</Text>
      </TouchableOpacity>

      <Panel variant="economy" title="ACTIVE MISSIONS" style={styles.panel}>
        {activeMissions.map((mission) => (
          <TouchableOpacity key={mission.id} style={styles.missionRow}>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>{mission.template_name}</Text>
              <Text style={styles.missionDesc} numberOfLines={1}>
                {mission.description}
              </Text>
            </View>
            <StatusChip
              label=""
              value={`${mission.progress_percentage || 0}%`}
              status="info"
              size="small"
            />
          </TouchableOpacity>
        ))}
        {activeMissions.length === 0 && (
          <Text style={styles.emptyText}>No active missions</Text>
        )}
      </Panel>

      <Panel variant="economy" title="AVAILABLE MISSIONS" style={styles.panel}>
        {availableMissions.slice(0, 5).map((template) => (
          <TouchableOpacity key={template.template_id} style={styles.missionRow}>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>{template.name}</Text>
              <Text style={styles.missionReward}>
                {template.reward_credits || 0} credits
              </Text>
            </View>
            <RailButton
              label="ACCEPT"
              variant="economy"
              compact
              onPress={() => console.log('Accept mission', template.template_id)}
            />
          </TouchableOpacity>
        ))}
        {availableMissions.length === 0 && (
          <Text style={styles.emptyText}>No missions available at this location</Text>
        )}
      </Panel>
    </ScrollView>
  );
}

function TradingView({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Operations</Text>
      </TouchableOpacity>

      <Panel variant="economy" title="MARKET" style={styles.panel}>
        <Text style={styles.placeholderText}>
          Trading interface will render OrderForm and OrderbookView components here.
        </Text>
      </Panel>
    </ScrollView>
  );
}

function MiningView({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back to Operations</Text>
      </TouchableOpacity>

      <Panel variant="economy" title="MINING" style={styles.panel}>
        <Text style={styles.placeholderText}>
          Mining controls will render here when near a resource node.
        </Text>
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
  missionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[3],
  },
  missionCount: {
    alignItems: 'center',
  },
  missionCountNumber: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.semantic.economy,
  },
  missionCountLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  missionViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missionViewAllText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.semantic.economy,
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
  },
  missionName: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: tokens.spacing[4],
  },
  opsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
  },
  opsCard: {
    width: '47%',
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  opsCardDisabled: {
    opacity: 0.5,
  },
  opsCardTitle: {
    marginTop: tokens.spacing[2],
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
  },
  opsCardTitleDisabled: {
    color: tokens.colors.text.disabled,
  },
  opsCardSubtitle: {
    marginTop: tokens.spacing[1],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
  servicesList: {
    gap: tokens.spacing[2],
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  serviceName: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textTransform: 'capitalize',
  },
  backButton: {
    paddingVertical: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
  },
  backText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.semantic.economy,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  missionDesc: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: 2,
  },
  missionReward: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.semantic.economy,
    marginTop: 2,
  },
  placeholderText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: tokens.spacing[6],
  },
});
