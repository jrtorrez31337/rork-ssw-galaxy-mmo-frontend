import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ship, ChevronLeft, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { shipApi } from '@/api/ships';
import { ShipStats, ShipType } from '@/types/api';
import Colors from '@/constants/colors';

const TOTAL_POINTS = 30;
const MIN_STAT = 1;
const MAX_STAT = 15;

const SHIP_TYPES: {
  type: ShipType;
  label: string;
  description: string;
  bonuses: string[];
}[] = [
  {
    type: 'scout',
    label: 'Scout',
    description: 'Fast and stealthy reconnaissance vessel',
    bonuses: ['Speed +2', 'Sensors +2'],
  },
  {
    type: 'fighter',
    label: 'Fighter',
    description: 'Heavy combat ship with strong defenses',
    bonuses: ['Hull +300 HP', 'Shield +100'],
  },
  {
    type: 'trader',
    label: 'Trader',
    description: 'Cargo hauler for commerce and transport',
    bonuses: ['Hull +100 HP', 'Cargo +40 units'],
  },
  {
    type: 'explorer',
    label: 'Explorer',
    description: 'Long-range vessel for discovery missions',
    bonuses: ['Speed +1', 'Cargo +10', 'Sensors +2'],
  },
];

const STATS = [
  {
    key: 'hull_strength' as keyof ShipStats,
    label: 'Hull Strength',
    description: 'Ship durability (×100 HP)',
  },
  {
    key: 'shield_capacity' as keyof ShipStats,
    label: 'Shield Capacity',
    description: 'Energy shields (×50 points)',
  },
  {
    key: 'speed' as keyof ShipStats,
    label: 'Speed',
    description: 'Engine velocity and agility',
  },
  {
    key: 'cargo_space' as keyof ShipStats,
    label: 'Cargo Space',
    description: 'Storage capacity (×10 units)',
  },
  {
    key: 'sensors' as keyof ShipStats,
    label: 'Sensors',
    description: 'Detection and scanning range',
  },
];

export default function ShipCustomizeScreen() {
  const router = useRouter();
  const { profileId } = useAuth();
  const [name, setName] = useState('');
  const [shipType, setShipType] = useState<ShipType>('scout');
  const [stats, setStats] = useState<ShipStats>({
    hull_strength: 6,
    shield_capacity: 6,
    speed: 6,
    cargo_space: 6,
    sensors: 6,
  });

  const totalAllocated = useMemo(() => {
    return Object.values(stats).reduce((sum, val) => sum + val, 0);
  }, [stats]);

  const remaining = TOTAL_POINTS - totalAllocated;

  const increment = (key: keyof ShipStats) => {
    if (remaining > 0 && stats[key] < MAX_STAT) {
      setStats({ ...stats, [key]: stats[key] + 1 });
    }
  };

  const decrement = (key: keyof ShipStats) => {
    if (stats[key] > MIN_STAT) {
      setStats({ ...stats, [key]: stats[key] - 1 });
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      shipApi.create({
        owner_id: profileId!,
        ship_type: shipType,
        name: name || undefined,
        stat_allocation: stats,
      }),
    onSuccess: () => {
      router.back();
    },
  });

  const canSubmit = remaining === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ship size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>Customize Ship</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ship Name (Optional)</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter ship name"
            placeholderTextColor={Colors.textDim}
            value={name}
            onChangeText={setName}
            maxLength={32}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ship Type</Text>
          <View style={styles.typeGrid}>
            {SHIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.typeCard,
                  shipType === type.type && styles.typeCardActive,
                ]}
                onPress={() => setShipType(type.type)}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    shipType === type.type && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
                <View style={styles.bonusList}>
                  {type.bonuses.map((bonus, index) => (
                    <View key={index} style={styles.bonusBadge}>
                      <Text style={styles.bonusText}>{bonus}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.pointsHeader}>
            <Text style={styles.sectionTitle}>Stat Points</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>
                {remaining} / {TOTAL_POINTS}
              </Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            Allocate {TOTAL_POINTS} points across your ship stats
          </Text>

          <View style={styles.statList}>
            {STATS.map((stat) => {
              const value = stats[stat.key];
              const percentage = (value / MAX_STAT) * 100;

              return (
                <View key={stat.key} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={styles.statInfo}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={styles.statDescription}>
                        {stat.description}
                      </Text>
                    </View>
                    <View style={styles.statValue}>
                      <Text style={styles.valueText}>{value}</Text>
                    </View>
                  </View>

                  <View style={styles.statControls}>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${percentage}%` }]}
                      />
                    </View>
                    <View style={styles.buttons}>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          value <= MIN_STAT && styles.controlButtonDisabled,
                        ]}
                        onPress={() => decrement(stat.key)}
                        disabled={value <= MIN_STAT}
                      >
                        <Text
                          style={[
                            styles.controlButtonText,
                            value <= MIN_STAT &&
                              styles.controlButtonTextDisabled,
                          ]}
                        >
                          −
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          (value >= MAX_STAT || remaining <= 0) &&
                            styles.controlButtonDisabled,
                        ]}
                        onPress={() => increment(stat.key)}
                        disabled={value >= MAX_STAT || remaining <= 0}
                      >
                        <Text
                          style={[
                            styles.controlButtonText,
                            (value >= MAX_STAT || remaining <= 0) &&
                              styles.controlButtonTextDisabled,
                          ]}
                        >
                          +
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {createMutation.isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {createMutation.error?.message || 'Failed to create ship'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            (!canSubmit || createMutation.isPending) &&
              styles.createButtonDisabled,
          ]}
          onPress={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Text style={styles.createButtonText}>Creating...</Text>
          ) : (
            <>
              <Check size={20} color={Colors.background} />
              <Text style={styles.createButtonText}>Create Ship</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 8,
  },
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  typeLabelActive: {
    color: Colors.primary,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  bonusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bonusBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bonusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  statList: {
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statInfo: {
    flex: 1,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  statValue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statControls: {
    gap: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  controlButtonText: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  controlButtonTextDisabled: {
    color: Colors.textDim,
  },
  errorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: `${Colors.danger}20`,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    height: 56,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
