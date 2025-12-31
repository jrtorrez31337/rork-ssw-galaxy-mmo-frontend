import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, TrendingUp, Pickaxe, Package } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

/**
 * OpsLCARSContent - Operations controls for the unified LCARS bar
 *
 * Layout: [Mission Status] | [Active Operation] | [Operations Grid] | [Cargo]
 */

function MissionStatusSection() {
  // TODO: Connect to missions store
  const activeMissions = 2;
  const completedToday = 1;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>MISSIONS</Text>
      <View style={styles.missionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeMissions}</Text>
          <Text style={styles.statLabel}>ACTIVE</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: tokens.colors.status.online }]}>{completedToday}</Text>
          <Text style={styles.statLabel}>TODAY</Text>
        </View>
      </View>
    </View>
  );
}

function ActiveOperationSection() {
  // TODO: Connect to operations state
  const activeOp = null; // 'mining' | 'trading' | null

  if (!activeOp) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>OPERATION</Text>
        <Text style={styles.idleText}>NONE</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>OPERATION</Text>
      <Text style={styles.activeOpText}>{activeOp.toUpperCase()}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '45%' }]} />
      </View>
    </View>
  );
}

function OperationsGridSection() {
  const { profileId } = useAuth();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
    staleTime: 5000,
  });

  const currentShip = ships?.[0] || null;
  const isDocked = !!currentShip?.docked_at;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>OPERATIONS</Text>
      <View style={styles.opsGrid}>
        <TouchableOpacity style={styles.opsButton}>
          <Target size={20} color={tokens.colors.semantic.economy} />
          <Text style={styles.opsButtonText}>MISSION</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.opsButton, !isDocked && styles.opsButtonDisabled]}
          disabled={!isDocked}
        >
          <TrendingUp size={20} color={isDocked ? tokens.colors.semantic.economy : tokens.colors.text.muted} />
          <Text style={[styles.opsButtonText, !isDocked && styles.opsButtonTextDisabled]}>TRADE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.opsButton, isDocked && styles.opsButtonDisabled]}
          disabled={isDocked}
        >
          <Pickaxe size={20} color={!isDocked ? tokens.colors.semantic.economy : tokens.colors.text.muted} />
          <Text style={[styles.opsButtonText, isDocked && styles.opsButtonTextDisabled]}>MINE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CargoSection() {
  // TODO: Connect to cargo/inventory state
  const cargoUsed = 45;
  const cargoMax = 100;
  const cargoPct = Math.round((cargoUsed / cargoMax) * 100);

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.cargoButton}>
        <Package size={20} color={tokens.colors.semantic.economy} />
        <View style={styles.cargoInfo}>
          <Text style={styles.cargoText}>{cargoUsed}/{cargoMax}</Text>
          <View style={styles.cargoBar}>
            <View style={[styles.cargoFill, { width: `${cargoPct}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export function OpsLCARSContent() {
  return (
    <>
      <View style={styles.sectionContainer}>
        <MissionStatusSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <ActiveOperationSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainerFlex}>
        <OperationsGridSection />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionContainer}>
        <CargoSection />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionContainerFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    width: 1,
    backgroundColor: tokens.colors.border.default,
    marginVertical: 8,
  },
  section: {
    alignItems: 'center',
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  missionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  statLabel: {
    fontSize: 8,
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  idleText: {
    fontSize: 12,
    color: tokens.colors.text.muted,
    fontWeight: '600',
  },
  activeOpText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    letterSpacing: 1,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.semantic.economy,
    borderRadius: 3,
  },
  opsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  opsButton: {
    alignItems: 'center',
    gap: 4,
    padding: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  opsButtonDisabled: {
    opacity: 0.5,
    borderColor: tokens.colors.text.muted,
  },
  opsButtonText: {
    fontSize: 8,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    letterSpacing: 1,
  },
  opsButtonTextDisabled: {
    color: tokens.colors.text.muted,
  },
  cargoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  cargoInfo: {
    alignItems: 'flex-start',
    gap: 2,
  },
  cargoText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  cargoBar: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.background.primary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cargoFill: {
    height: '100%',
    backgroundColor: tokens.colors.semantic.economy,
    borderRadius: 2,
  },
});
