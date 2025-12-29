import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Wrench, Cpu, Shield, Zap, Gauge as GaugeIcon, Package, Rocket, Plus, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { tokens } from '@/ui/theme';
import { Panel, Gauge, StatusChip, RailButton } from '@/ui/components';
import { useBridgeState } from '@/hooks/useBridgeState';
import { useShipSystemsStore, SystemId } from '@/stores/shipSystemsStore';
import { useAuth } from '@/contexts/AuthContext';
import { shipApi } from '@/api/ships';
import { characterApi } from '@/api/characters';

/**
 * EngineeringPanel - ENG Rail Content
 *
 * Per UI/UX Doctrine:
 * - Ship systems status
 * - Repair queue
 * - Module management
 *
 * Per Space Mechanics Doctrine:
 * - Power distribution
 * - System damage indicators
 * - Reactor output
 */

type EngMode = 'systems' | 'modules' | 'power' | 'fleet';

export function EngineeringPanel() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [mode, setMode] = useState<EngMode>('systems');
  const { glance, situation } = useBridgeState();

  // Fetch ships and characters for fleet mode
  const { data: ships, isLoading: shipsLoading } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId && mode === 'fleet',
  });

  const { data: characters, isLoading: charsLoading } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId && mode === 'fleet',
  });

  const systems = useShipSystemsStore((s) => s.systems);
  const powerDistribution = useShipSystemsStore((s) => s.powerDistribution);
  const reactorOutput = useShipSystemsStore((s) => s.reactorOutput);
  const reactorCapacity = useShipSystemsStore((s) => s.reactorCapacity);
  const repairQueue = useShipSystemsStore((s) => s.repairQueue);
  const isRepairing = useShipSystemsStore((s) => s.isRepairing);
  const hasDamage = useShipSystemsStore((s) => s.hasDamage);

  const systemsList = Object.values(systems);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'systems' && styles.modeTabActive]}
          onPress={() => setMode('systems')}
        >
          <Cpu size={16} color={mode === 'systems' ? tokens.colors.lcars.peach : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'systems' && styles.modeTabTextActive]}>
            SYSTEMS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'power' && styles.modeTabActive]}
          onPress={() => setMode('power')}
        >
          <Zap size={16} color={mode === 'power' ? tokens.colors.lcars.peach : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'power' && styles.modeTabTextActive]}>
            POWER
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'modules' && styles.modeTabActive]}
          onPress={() => setMode('modules')}
        >
          <Package size={16} color={mode === 'modules' ? tokens.colors.lcars.peach : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'modules' && styles.modeTabTextActive]}>
            MODULES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'fleet' && styles.modeTabActive]}
          onPress={() => setMode('fleet')}
        >
          <Rocket size={16} color={mode === 'fleet' ? tokens.colors.lcars.peach : tokens.colors.text.tertiary} />
          <Text style={[styles.modeTabText, mode === 'fleet' && styles.modeTabTextActive]}>
            FLEET
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'systems' && (
        <>
          {/* Damage Alert */}
          {hasDamage && (
            <Panel variant="engineering" title="DAMAGE REPORT" style={styles.panel}>
              <View style={styles.damageAlert}>
                <Wrench size={16} color={tokens.colors.semantic.warning} />
                <Text style={styles.damageText}>Systems damaged - repairs recommended</Text>
              </View>
            </Panel>
          )}

          {/* Systems Status */}
          <Panel variant="engineering" title="SHIP SYSTEMS" style={styles.panel}>
            {systemsList.map((system) => (
              <View key={system.id} style={styles.systemRow}>
                <View style={styles.systemInfo}>
                  <Text style={styles.systemName}>{system.name}</Text>
                  <StatusChip
                    label=""
                    value={
                      system.isCritical ? 'CRITICAL' :
                      system.isDamaged ? 'DAMAGED' : 'ONLINE'
                    }
                    status={
                      system.isCritical ? 'danger' :
                      system.isDamaged ? 'warning' : 'online'
                    }
                    size="small"
                  />
                </View>
                <Gauge
                  value={system.health}
                  size="small"
                  showValue={false}
                  thresholds={{ warning: 50, critical: 25 }}
                />
              </View>
            ))}
          </Panel>

          {/* Repair Queue */}
          {repairQueue.length > 0 && (
            <Panel variant="engineering" title="REPAIR QUEUE" style={styles.panel}>
              {repairQueue.map((job) => (
                <View key={job.systemId} style={styles.repairRow}>
                  <Text style={styles.repairSystem}>
                    {systems[job.systemId]?.name || job.systemId}
                  </Text>
                  <Gauge
                    value={job.progress}
                    size="small"
                    color={tokens.colors.lcars.peach}
                    showValue
                  />
                  <Text style={styles.repairTime}>
                    {Math.ceil(job.timeRemaining)}s
                  </Text>
                </View>
              ))}
            </Panel>
          )}

          {/* Repair Actions */}
          {hasDamage && !isRepairing && (
            <Panel variant="engineering" title="REPAIRS" style={styles.panel}>
              <RailButton
                label="START REPAIRS"
                variant="default"
                onPress={() => console.log('[ENG] Start repairs')}
              />
              <Text style={styles.repairNote}>
                Emergency repairs take time and energy. Full repairs require station services.
              </Text>
            </Panel>
          )}
        </>
      )}

      {mode === 'power' && (
        <>
          {/* Reactor Status */}
          <Panel variant="engineering" title="REACTOR" style={styles.panel}>
            <View style={styles.reactorStatus}>
              <GaugeIcon size={24} color={tokens.colors.lcars.peach} />
              <View style={styles.reactorInfo}>
                <Text style={styles.reactorOutput}>
                  {reactorOutput} / {reactorCapacity} MW
                </Text>
                <Text style={styles.reactorLabel}>Power Output</Text>
              </View>
            </View>
            <Gauge
              value={(reactorOutput / reactorCapacity) * 100}
              size="large"
              color={tokens.colors.lcars.peach}
            />
          </Panel>

          {/* Power Distribution */}
          <Panel variant="engineering" title="POWER DISTRIBUTION" style={styles.panel}>
            <View style={styles.powerGrid}>
              <PowerSlider
                label="WEAPONS"
                value={powerDistribution.weapons}
                color={tokens.colors.semantic.combat}
                icon={<Zap size={16} color={tokens.colors.semantic.combat} />}
              />
              <PowerSlider
                label="SHIELDS"
                value={powerDistribution.shields}
                color={tokens.colors.lcars.sky}
                icon={<Shield size={16} color={tokens.colors.lcars.sky} />}
              />
              <PowerSlider
                label="ENGINES"
                value={powerDistribution.engines}
                color={tokens.colors.semantic.navigation}
                icon={<GaugeIcon size={16} color={tokens.colors.semantic.navigation} />}
              />
              <PowerSlider
                label="SYSTEMS"
                value={powerDistribution.systems}
                color={tokens.colors.lcars.peach}
                icon={<Cpu size={16} color={tokens.colors.lcars.peach} />}
              />
            </View>

            {/* Presets */}
            <View style={styles.presets}>
              <Text style={styles.presetsLabel}>PRESETS</Text>
              <View style={styles.presetButtons}>
                <RailButton label="ATTACK" variant="combat" compact onPress={() => {}} />
                <RailButton label="DEFENSE" variant="navigation" compact onPress={() => {}} />
                <RailButton label="BALANCED" variant="default" compact onPress={() => {}} />
              </View>
            </View>
          </Panel>
        </>
      )}

      {mode === 'modules' && (
        <Panel variant="engineering" title="EQUIPPED MODULES" style={styles.panel}>
          <Text style={styles.placeholderText}>
            Module loadout and equipment management will appear here.
            Modules can only be changed while docked.
          </Text>
        </Panel>
      )}

      {mode === 'fleet' && (
        <>
          {/* Ships Section */}
          <Panel variant="engineering" title="YOUR SHIPS" style={styles.panel}>
            <View style={styles.fleetHeader}>
              <Text style={styles.fleetCount}>
                {ships?.length || 0} ship{(ships?.length || 0) !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/ship-customize')}
              >
                <Plus size={14} color={tokens.colors.lcars.peach} />
                <Text style={styles.createButtonText}>NEW SHIP</Text>
              </TouchableOpacity>
            </View>

            {shipsLoading ? (
              <Text style={styles.loadingText}>Loading ships...</Text>
            ) : ships && ships.length > 0 ? (
              ships.map((ship) => (
                <TouchableOpacity
                  key={ship.id}
                  style={styles.fleetItem}
                  onPress={() => router.push({ pathname: '/ship-inventory' as any, params: { shipId: ship.id } })}
                >
                  <Rocket size={16} color={tokens.colors.lcars.peach} />
                  <View style={styles.fleetItemInfo}>
                    <Text style={styles.fleetItemName}>
                      {ship.name || `${ship.ship_type.toUpperCase()} CLASS`}
                    </Text>
                    <Text style={styles.fleetItemDetails}>
                      {ship.location_sector} • {ship.docked_at ? `Docked at ${ship.docked_at}` : 'In space'}
                    </Text>
                  </View>
                  <StatusChip
                    label=""
                    value={ship.ship_type.toUpperCase()}
                    status="info"
                    size="small"
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No ships yet</Text>
                <RailButton
                  label="CREATE FIRST SHIP"
                  variant="default"
                  onPress={() => router.push('/ship-customize')}
                />
              </View>
            )}
          </Panel>

          {/* Characters Section */}
          <Panel variant="engineering" title="YOUR CHARACTERS" style={styles.panel}>
            <View style={styles.fleetHeader}>
              <Text style={styles.fleetCount}>
                {characters?.length || 0} character{(characters?.length || 0) !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/character-create')}
              >
                <Plus size={14} color={tokens.colors.lcars.peach} />
                <Text style={styles.createButtonText}>NEW CHARACTER</Text>
              </TouchableOpacity>
            </View>

            {charsLoading ? (
              <Text style={styles.loadingText}>Loading characters...</Text>
            ) : characters && characters.length > 0 ? (
              characters.map((character) => (
                <View key={character.id} style={styles.fleetItem}>
                  <User size={16} color={tokens.colors.lcars.peach} />
                  <View style={styles.fleetItemInfo}>
                    <Text style={styles.fleetItemName}>{character.name}</Text>
                    <Text style={styles.fleetItemDetails}>
                      Home: {character.home_sector}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No characters yet</Text>
                <RailButton
                  label="CREATE FIRST CHARACTER"
                  variant="default"
                  onPress={() => router.push('/character-create')}
                />
              </View>
            )}
          </Panel>
        </>
      )}
    </ScrollView>
  );
}

// Power distribution slider component
function PowerSlider({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.powerSlider}>
      <View style={styles.powerSliderHeader}>
        {icon}
        <Text style={styles.powerSliderLabel}>{label}</Text>
        <Text style={[styles.powerSliderValue, { color }]}>{value}%</Text>
      </View>
      <View style={styles.powerSliderTrack}>
        <View
          style={[styles.powerSliderFill, { width: `${value}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    marginBottom: tokens.spacing[3],
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: tokens.spacing[3],
    gap: tokens.spacing[2],
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[1],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.sm,
  },
  modeTabActive: {
    backgroundColor: tokens.colors.lcars.peach,
  },
  modeTabText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  modeTabTextActive: {
    color: tokens.colors.text.inverse,
  },
  damageAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
    backgroundColor: `${tokens.colors.semantic.warning}15`,
    borderRadius: tokens.radius.sm,
  },
  damageText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.semantic.warning,
  },
  systemRow: {
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  systemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
  },
  systemName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: 'uppercase',
  },
  repairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
  },
  repairSystem: {
    width: 80,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  repairTime: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontFamily: tokens.typography.fontFamily.mono,
    width: 40,
    textAlign: 'right',
  },
  repairNote: {
    marginTop: tokens.spacing[3],
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
  reactorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  reactorInfo: {
    flex: 1,
  },
  reactorOutput: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.peach,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  reactorLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  powerGrid: {
    gap: tokens.spacing[3],
  },
  powerSlider: {
    marginBottom: tokens.spacing[2],
  },
  powerSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
  },
  powerSliderLabel: {
    flex: 1,
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
  },
  powerSliderValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  powerSliderTrack: {
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  powerSliderFill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  presets: {
    marginTop: tokens.spacing[4],
  },
  presetsLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: tokens.spacing[2],
  },
  presetButtons: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  placeholderText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: tokens.spacing[6],
  },
  // Fleet mode styles
  fleetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  fleetCount: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.lcars.peach,
  },
  createButtonText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.lcars.peach,
  },
  fleetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  fleetItemInfo: {
    flex: 1,
  },
  fleetItemName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  fleetItemDetails: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: tokens.spacing[4],
  },
});
