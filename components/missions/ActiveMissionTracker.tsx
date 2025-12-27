import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import React, { useEffect, useRef, useMemo } from 'react';
import { Clock, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import type { Mission } from '@/types/missions';

interface ActiveMissionTrackerProps {
  missions: Mission[];
  onMissionPress: (mission: Mission) => void;
  compact?: boolean;
}

/**
 * Active mission tracker HUD
 * Compact overlay showing mission progress
 */
const ActiveMissionTracker = React.memo(function ActiveMissionTracker({
  missions,
  onMissionPress,
  compact = false,
}: ActiveMissionTrackerProps) {
  if (missions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Active Missions ({missions.length})</Text>
      </View>
      <View style={styles.missionsList}>
        {missions.map((mission) => (
          <MissionTrackerItem
            key={mission.id}
            mission={mission}
            onPress={() => onMissionPress(mission)}
            compact={compact}
          />
        ))}
      </View>
    </View>
  );
});

export default ActiveMissionTracker;

interface MissionTrackerItemProps {
  mission: Mission;
  onPress: () => void;
  compact?: boolean;
}

const MissionTrackerItem = React.memo(function MissionTrackerItem({ mission, onPress, compact }: MissionTrackerItemProps) {
  const progressAnim = useRef(new Animated.Value(mission.progress_percentage)).current;

  // Animate progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: mission.progress_percentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [mission.progress_percentage]);

  const timeRemaining = useMemo(() => {
    if (!mission.expires_at) return null;

    const now = new Date();
    const expiry = new Date(mission.expires_at);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'EXPIRED';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [mission.expires_at]);

  const isExpiringSoon = useMemo(() => {
    return mission.expires_at && timeRemaining && timeRemaining !== 'EXPIRED' &&
      new Date(mission.expires_at).getTime() - new Date().getTime() < 30 * 60 * 1000; // 30 minutes
  }, [mission.expires_at, timeRemaining]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity
      style={[
        styles.missionItem,
        compact && styles.missionItemCompact,
        isExpiringSoon && styles.missionItemExpiring,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.missionContent}>
        <View style={styles.missionHeader}>
          <Text
            style={[styles.missionName, compact && styles.missionNameCompact]}
            numberOfLines={1}
          >
            {mission.template_name}
          </Text>
          <ChevronRight size={16} color={Colors.primary} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: isExpiringSoon ? Colors.danger : Colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.missionFooter}>
          <Text style={styles.progressText}>{mission.progress_percentage}%</Text>
          {timeRemaining && (
            <View style={styles.timeContainer}>
              <Clock
                size={12}
                color={isExpiringSoon ? Colors.danger : Colors.textDim}
              />
              <Text
                style={[
                  styles.timeText,
                  isExpiringSoon && styles.timeTextExpiring,
                ]}
              >
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>

        {/* Objectives summary (non-compact) */}
        {!compact && (
          <View style={styles.objectivesSummary}>
            {mission.objectives.slice(0, 2).map((obj) => (
              <View key={obj.id} style={styles.objectiveRow}>
                <View
                  style={[
                    styles.objectiveCheckbox,
                    obj.status === 'completed' && styles.objectiveCheckboxCompleted,
                  ]}
                >
                  {obj.status === 'completed' && (
                    <Text style={styles.objectiveCheckmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.objectiveText} numberOfLines={1}>
                  {obj.description}
                </Text>
                <Text style={styles.objectiveProgress}>
                  {obj.current_progress}/{obj.target_quantity}
                </Text>
              </View>
            ))}
            {mission.objectives.length > 2 && (
              <Text style={styles.moreObjectivesText}>
                +{mission.objectives.length - 2} more
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  containerCompact: {
    borderRadius: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  missionsList: {
    gap: 1,
  },
  missionItem: {
    backgroundColor: Colors.background,
    padding: 12,
  },
  missionItemCompact: {
    padding: 10,
  },
  missionItemExpiring: {
    backgroundColor: `${Colors.danger}10`,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  missionContent: {
    gap: 8,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  missionNameCompact: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textDim,
    fontWeight: '500',
  },
  timeTextExpiring: {
    color: Colors.danger,
    fontWeight: '700',
  },
  objectivesSummary: {
    gap: 4,
    marginTop: 4,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  objectiveCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveCheckboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  objectiveCheckmark: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
  },
  objectiveText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  objectiveProgress: {
    fontSize: 10,
    color: Colors.textDim,
    fontWeight: '600',
  },
  moreObjectivesText: {
    fontSize: 10,
    color: Colors.textDim,
    fontStyle: 'italic',
    marginLeft: 20,
  },
});
