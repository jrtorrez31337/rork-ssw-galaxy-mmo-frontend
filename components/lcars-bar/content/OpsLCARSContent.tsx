import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target, TrendingUp, Pickaxe, Package, ClipboardList } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { SwipeableLCARSContainer } from '../SwipeableLCARSContainer';

/**
 * OpsLCARSContent - Operations controls for the unified LCARS bar
 *
 * Pages: Missions | Operations | Cargo
 */

function MissionsPage() {
  // TODO: Connect to missions store
  const activeMissions = 2;
  const completedToday = 1;
  const activeOp = null; // 'mining' | 'trading' | null

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>MISSIONS</Text>

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

      <View style={styles.operationBlock}>
        <Text style={styles.operationLabel}>CURRENT OPERATION</Text>
        {activeOp ? (
          <>
            <Text style={styles.activeOpText}>{activeOp.toUpperCase()}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '45%' }]} />
            </View>
          </>
        ) : (
          <Text style={styles.idleText}>NONE</Text>
        )}
      </View>
    </View>
  );
}

function OperationsPage() {
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
    <View style={styles.page}>
      <Text style={styles.pageTitle}>OPERATIONS</Text>

      <View style={styles.opsGrid}>
        <TouchableOpacity style={styles.opsButton}>
          <ClipboardList size={28} color={tokens.colors.semantic.economy} />
          <Text style={styles.opsButtonText}>MISSION</Text>
          <Text style={styles.opsButtonHint}>Accept jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.opsButton, !isDocked && styles.opsButtonDisabled]}
          disabled={!isDocked}
        >
          <TrendingUp size={28} color={isDocked ? tokens.colors.semantic.economy : tokens.colors.text.muted} />
          <Text style={[styles.opsButtonText, !isDocked && styles.opsButtonTextDisabled]}>TRADE</Text>
          <Text style={[styles.opsButtonHint, !isDocked && styles.opsButtonHintDisabled]}>
            {isDocked ? 'Buy & sell' : 'Dock required'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.opsButton, isDocked && styles.opsButtonDisabled]}
          disabled={isDocked}
        >
          <Pickaxe size={28} color={!isDocked ? tokens.colors.semantic.economy : tokens.colors.text.muted} />
          <Text style={[styles.opsButtonText, isDocked && styles.opsButtonTextDisabled]}>MINE</Text>
          <Text style={[styles.opsButtonHint, isDocked && styles.opsButtonHintDisabled]}>
            {!isDocked ? 'Extract ore' : 'Undock first'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CargoPage() {
  // TODO: Connect to cargo/inventory state
  const cargoUsed = 45;
  const cargoMax = 100;
  const cargoPct = Math.round((cargoUsed / cargoMax) * 100);

  const getCargoColor = () => {
    if (cargoPct > 90) return tokens.colors.alert.critical;
    if (cargoPct > 70) return tokens.colors.alert.warning;
    return tokens.colors.semantic.economy;
  };

  return (
    <View style={styles.page}>
      <Text style={styles.pageTitle}>CARGO HOLD</Text>

      <View style={styles.cargoDisplay}>
        <Package size={40} color={getCargoColor()} />
        <Text style={[styles.cargoValue, { color: getCargoColor() }]}>{cargoPct}%</Text>
      </View>

      <View style={styles.cargoBarContainer}>
        <View style={styles.cargoBar}>
          <View style={[styles.cargoFill, { width: `${cargoPct}%`, backgroundColor: getCargoColor() }]} />
        </View>
        <Text style={styles.cargoText}>{cargoUsed} / {cargoMax} UNITS</Text>
      </View>

      <TouchableOpacity style={styles.inventoryButton}>
        <Target size={16} color={tokens.colors.semantic.economy} />
        <Text style={styles.inventoryButtonText}>INVENTORY</Text>
      </TouchableOpacity>
    </View>
  );
}

export function OpsLCARSContent() {
  const pages = [
    <MissionsPage key="missions" />,
    <OperationsPage key="operations" />,
    <CargoPage key="cargo" />,
  ];

  return (
    <SwipeableLCARSContainer
      pages={pages}
      activeColor={tokens.colors.semantic.economy}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  pageTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    letterSpacing: 2,
    marginBottom: 8,
  },
  // Missions Page
  missionStats: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  statLabel: {
    fontSize: 9,
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  operationBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.default,
    width: '60%',
  },
  operationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: tokens.colors.text.muted,
    letterSpacing: 1,
  },
  activeOpText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    letterSpacing: 1,
  },
  idleText: {
    fontSize: 14,
    color: tokens.colors.text.muted,
    fontWeight: '600',
  },
  progressBar: {
    width: 120,
    height: 8,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.semantic.economy,
    borderRadius: 4,
  },
  // Operations Page
  opsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  opsButton: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    minWidth: 90,
  },
  opsButtonDisabled: {
    opacity: 0.5,
    borderColor: tokens.colors.text.muted,
  },
  opsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    letterSpacing: 1,
  },
  opsButtonTextDisabled: {
    color: tokens.colors.text.muted,
  },
  opsButtonHint: {
    fontSize: 8,
    color: tokens.colors.text.muted,
  },
  opsButtonHintDisabled: {
    color: tokens.colors.text.muted,
  },
  // Cargo Page
  cargoDisplay: {
    alignItems: 'center',
    gap: 8,
  },
  cargoValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: tokens.typography.fontFamily.mono,
  },
  cargoBarContainer: {
    alignItems: 'center',
    gap: 6,
  },
  cargoBar: {
    width: 200,
    height: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cargoFill: {
    height: '100%',
    borderRadius: 6,
  },
  cargoText: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.text.secondary,
    fontFamily: tokens.typography.fontFamily.mono,
  },
  inventoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.economy,
  },
  inventoryButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.semantic.economy,
    letterSpacing: 1,
  },
});
