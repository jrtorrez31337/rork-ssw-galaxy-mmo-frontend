import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Filter, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import MissionCard from './MissionCard';
import type { MissionTemplate, MissionType } from '@/types/missions';

interface MissionListProps {
  missions: MissionTemplate[];
  onAccept: (templateId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
}

/**
 * Mission list component with filtering and sorting
 * Displays available missions in a scrollable grid
 */
export default function MissionList({
  missions,
  onAccept,
  onRefresh,
  loading = false,
}: MissionListProps) {
  const [filterType, setFilterType] = useState<MissionType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'rewards' | 'level' | 'type'>('type');
  const [refreshing, setRefreshing] = useState(false);

  const missionTypes: Array<MissionType | 'all'> = [
    'all',
    'combat',
    'mining',
    'trade',
    'exploration',
    'delivery',
    'escort',
    'patrol',
  ];

  // Filter and sort missions
  const filteredMissions = useMemo(() => {
    let filtered = missions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.mission_type === filterType);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rewards':
          return b.reward_credits - a.reward_credits;
        case 'level':
          return a.required_level - b.required_level;
        case 'type':
          return a.mission_type.localeCompare(b.mission_type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [missions, filterType, sortBy]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const getTypeColor = (type: MissionType | 'all') => {
    switch (type) {
      case 'combat':
        return Colors.danger;
      case 'mining':
        return Colors.info;
      case 'trade':
        return Colors.success;
      case 'exploration':
        return Colors.warning;
      case 'delivery':
        return Colors.primary;
      case 'escort':
        return Colors.secondary;
      case 'patrol':
        return Colors.primary;
      default:
        return Colors.border;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with filter toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            Available Missions ({filteredMissions.length})
          </Text>
          {filterType !== 'all' && (
            <View
              style={[
                styles.activeFilterBadge,
                { backgroundColor: getTypeColor(filterType) },
              ]}
            >
              <Text style={styles.activeFilterText}>
                {filterType.toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={() => setFilterType('all')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={14} color={Colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Type filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Mission Type:</Text>
            <View style={styles.filterChips}>
              {missionTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filterType === type && {
                      backgroundColor: getTypeColor(type),
                      borderColor: getTypeColor(type),
                    },
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterType === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By:</Text>
            <View style={styles.filterChips}>
              {(['type', 'level', 'rewards'] as const).map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterChip,
                    sortBy === sort && {
                      backgroundColor: Colors.primary,
                      borderColor: Colors.primary,
                    },
                  ]}
                  onPress={() => setSortBy(sort)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === sort && styles.filterChipTextActive,
                    ]}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Mission cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          ) : undefined
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading missions...</Text>
          </View>
        ) : filteredMissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Missions Available</Text>
            <Text style={styles.emptyText}>
              {filterType === 'all'
                ? 'Check back later for new missions or increase your level and reputation.'
                : `No ${filterType} missions available right now.`}
            </Text>
            {filterType !== 'all' && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setFilterType('all')}
              >
                <Text style={styles.clearFilterText}>View All Missions</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.missionGrid}>
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.template_id}
                mission={mission}
                onAccept={onAccept}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  filterButton: {
    padding: 8,
  },
  filtersPanel: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  clearFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  missionGrid: {
    gap: 16,
  },
});
