import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { X, Activity } from 'lucide-react-native';
import { performanceMonitor } from '@/utils/performance';
import { tokens } from '@/ui/theme';

/**
 * Performance Overlay Component
 * Displays real-time performance metrics during development
 * Toggle visibility with floating button
 */
export function PerformanceOverlay() {
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<{
    apiSummary: ReturnType<typeof performanceMonitor.getAPIMetricsSummary>;
  }>({
    apiSummary: performanceMonitor.getAPIMetricsSummary(),
  });

  useEffect(() => {
    if (!visible) return;

    // Update metrics every 2 seconds
    const interval = setInterval(() => {
      setMetrics({
        apiSummary: performanceMonitor.getAPIMetricsSummary(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!visible && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <Activity size={24} color={tokens.colors.text.inverse} />
        </TouchableOpacity>
      )}

      {/* Performance Metrics Overlay */}
      {visible && (
        <View style={styles.overlay}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Activity size={20} color={tokens.colors.primary.main} />
              <Text style={styles.headerTitle}>Performance Metrics</Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} activeOpacity={0.7}>
              <X size={24} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* API Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>API Performance</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Total Calls:</Text>
                <Text style={styles.metricValue}>{metrics.apiSummary.totalCalls}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Avg Duration:</Text>
                <Text
                  style={[
                    styles.metricValue,
                    metrics.apiSummary.avgDuration > 500 && styles.metricWarning,
                  ]}
                >
                  {metrics.apiSummary.avgDuration.toFixed(0)}ms
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Errors:</Text>
                <Text
                  style={[
                    styles.metricValue,
                    metrics.apiSummary.errorCount > 0 && styles.metricError,
                  ]}
                >
                  {metrics.apiSummary.errorCount}
                </Text>
              </View>

              {metrics.apiSummary.slowestCall && (
                <>
                  <Text style={styles.subsectionTitle}>Slowest Call</Text>
                  <View style={styles.callDetails}>
                    <Text style={styles.callMethod}>
                      {metrics.apiSummary.slowestCall.method}
                    </Text>
                    <Text style={styles.callEndpoint} numberOfLines={1}>
                      {metrics.apiSummary.slowestCall.endpoint}
                    </Text>
                    <Text style={styles.callDuration}>
                      {metrics.apiSummary.slowestCall.duration.toFixed(0)}ms
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Memory Usage (if available) */}
            {(performance as any).memory && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Memory</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Used JS Heap:</Text>
                  <Text style={styles.metricValue}>
                    {((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1)} MB
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Total JS Heap:</Text>
                  <Text style={styles.metricValue}>
                    {((performance as any).memory.totalJSHeapSize / 1048576).toFixed(1)} MB
                  </Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  performanceMonitor.logSummary();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>Log Summary to Console</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => {
                  performanceMonitor.clearAll();
                  setMetrics({
                    apiSummary: performanceMonitor.getAPIMetricsSummary(),
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>Clear All Metrics</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...tokens.elevation[4],
    zIndex: 9999,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 320,
    maxHeight: '80%',
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    ...tokens.elevation[4],
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  content: {
    padding: tokens.spacing[4],
  },
  section: {
    marginBottom: tokens.spacing[4],
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[2],
  },
  subsectionTitle: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing[1],
  },
  metricLabel: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
  },
  metricValue: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    fontFamily: 'monospace',
  },
  metricWarning: {
    color: tokens.colors.warning,
  },
  metricError: {
    color: tokens.colors.danger,
  },
  callDetails: {
    backgroundColor: tokens.colors.surface.raised,
    padding: tokens.spacing[2],
    borderRadius: tokens.radius.base,
    marginTop: tokens.spacing[1],
  },
  callMethod: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.primary.main,
    fontFamily: 'monospace',
  },
  callEndpoint: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing[1],
    fontFamily: 'monospace',
  },
  callDuration: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[1],
    fontFamily: 'monospace',
  },
  actionButton: {
    backgroundColor: tokens.colors.primary.main,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    marginBottom: tokens.spacing[2],
  },
  actionButtonDanger: {
    backgroundColor: tokens.colors.danger,
  },
  actionButtonText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
    textAlign: 'center',
  },
});
