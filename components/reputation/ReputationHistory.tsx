import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react-native';
import { ReputationHistoryEvent } from '@/types/api';
import Colors from '@/constants/colors';
import { formatReputationReason } from './utils';

interface ReputationHistoryProps {
  events: ReputationHistoryEvent[];
  isLoading?: boolean;
}

export default function ReputationHistory({
  events,
  isLoading,
}: ReputationHistoryProps) {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Clock size={48} color={Colors.textDim} />
        <Text style={styles.emptyText}>No History</Text>
        <Text style={styles.emptySubtext}>
          Reputation changes will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.timeline}>
        {events.map((event, index) => (
          <HistoryEventItem key={event.id} event={event} isFirst={index === 0} />
        ))}
      </View>
    </ScrollView>
  );
}

interface HistoryEventItemProps {
  event: ReputationHistoryEvent;
  isFirst: boolean;
}

function HistoryEventItem({ event, isFirst }: HistoryEventItemProps) {
  const isPositive = event.change_amount > 0;
  const reasonText = formatReputationReason(event.reason);

  return (
    <View style={styles.eventContainer}>
      {!isFirst && <View style={styles.timelineLine} />}
      <View
        style={[
          styles.timelineDot,
          { backgroundColor: isPositive ? Colors.success : Colors.danger },
        ]}
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleRow}>
            {isPositive ? (
              <TrendingUp size={16} color={Colors.success} />
            ) : (
              <TrendingDown size={16} color={Colors.danger} />
            )}
            <Text
              style={[
                styles.changeAmount,
                { color: isPositive ? Colors.success : Colors.danger },
              ]}
            >
              {isPositive ? '+' : ''}
              {event.change_amount}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(event.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.reason}>{reasonText}</Text>
        <View style={styles.standingRow}>
          <Text style={styles.standingLabel}>Standing:</Text>
          <Text style={styles.standingValue}>
            {event.previous_standing}
          </Text>
          <Text style={styles.standingArrow}>→</Text>
          <Text style={styles.standingValue}>
            {event.new_standing}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
  },
  timeline: {
    padding: 16,
  },
  eventContainer: {
    position: 'relative',
    paddingLeft: 32,
    paddingBottom: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.border,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  eventContent: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textDim,
  },
  reason: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standingLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  standingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  standingArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
