/**
 * Performance Monitoring Utilities
 * Tracks render times, API latency, component lifecycle, and memory usage
 * for troubleshooting and optimization
 */

interface PerformanceMark {
  name: string;
  timestamp: number;
  duration?: number;
}

interface ComponentMetrics {
  mountTime: number;
  renderCount: number;
  lastRenderDuration: number;
  avgRenderDuration: number;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  status?: number;
  error?: boolean;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private apiMetrics: APIMetrics[] = [];
  private enabled: boolean = __DEV__; // Only enable in development by default

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled) return;

    this.marks.set(name, {
      name,
      timestamp: performance.now(),
    });
  }

  /**
   * Measure duration since mark was created
   */
  measure(name: string): number | null {
    if (!this.enabled) return null;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`[Performance] No mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - mark.timestamp;
    mark.duration = duration;

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Clear a performance mark
   */
  clearMark(name: string): void {
    this.marks.delete(name);
  }

  /**
   * Track component mount time
   */
  trackComponentMount(componentName: string): void {
    if (!this.enabled) return;

    const metrics = this.componentMetrics.get(componentName) || {
      mountTime: performance.now(),
      renderCount: 0,
      lastRenderDuration: 0,
      avgRenderDuration: 0,
    };

    this.componentMetrics.set(componentName, metrics);
    console.log(`[Performance] ${componentName} mounted at ${metrics.mountTime.toFixed(2)}ms`);
  }

  /**
   * Track component render
   */
  trackComponentRender(componentName: string, duration: number): void {
    if (!this.enabled) return;

    const metrics = this.componentMetrics.get(componentName);
    if (!metrics) {
      console.warn(`[Performance] No metrics found for component: ${componentName}`);
      return;
    }

    metrics.renderCount++;
    metrics.lastRenderDuration = duration;
    metrics.avgRenderDuration =
      (metrics.avgRenderDuration * (metrics.renderCount - 1) + duration) / metrics.renderCount;

    if (duration > 16) {
      // Warn if render took longer than 1 frame (16ms at 60fps)
      console.warn(
        `[Performance] Slow render in ${componentName}: ${duration.toFixed(2)}ms (render #${metrics.renderCount})`
      );
    }
  }

  /**
   * Get component metrics
   */
  getComponentMetrics(componentName: string): ComponentMetrics | null {
    return this.componentMetrics.get(componentName) || null;
  }

  /**
   * Track API call performance
   */
  trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status?: number,
    error?: boolean
  ): void {
    if (!this.enabled) return;

    const metric: APIMetrics = {
      endpoint,
      method,
      duration,
      timestamp: performance.now(),
      status,
      error,
    };

    this.apiMetrics.push(metric);

    // Keep only last 100 API calls
    if (this.apiMetrics.length > 100) {
      this.apiMetrics.shift();
    }

    const statusStr = status ? ` (${status})` : '';
    const errorStr = error ? ' [ERROR]' : '';
    console.log(
      `[Performance] API ${method} ${endpoint}${statusStr}: ${duration.toFixed(2)}ms${errorStr}`
    );

    // Warn on slow API calls (>1000ms)
    if (duration > 1000) {
      console.warn(`[Performance] Slow API call: ${method} ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get API metrics summary
   */
  getAPIMetricsSummary(): {
    totalCalls: number;
    avgDuration: number;
    slowestCall: APIMetrics | null;
    errorCount: number;
  } {
    if (this.apiMetrics.length === 0) {
      return {
        totalCalls: 0,
        avgDuration: 0,
        slowestCall: null,
        errorCount: 0,
      };
    }

    const totalDuration = this.apiMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgDuration = totalDuration / this.apiMetrics.length;
    const slowestCall = this.apiMetrics.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );
    const errorCount = this.apiMetrics.filter((m) => m.error).length;

    return {
      totalCalls: this.apiMetrics.length,
      avgDuration,
      slowestCall,
      errorCount,
    };
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!this.enabled) return;

    console.log('\n=== Performance Summary ===');

    // Component metrics
    console.log('\nComponents:');
    this.componentMetrics.forEach((metrics, name) => {
      console.log(
        `  ${name}: ${metrics.renderCount} renders, avg ${metrics.avgRenderDuration.toFixed(2)}ms, last ${metrics.lastRenderDuration.toFixed(2)}ms`
      );
    });

    // API metrics
    const apiSummary = this.getAPIMetricsSummary();
    console.log('\nAPI Calls:');
    console.log(`  Total: ${apiSummary.totalCalls}`);
    console.log(`  Avg duration: ${apiSummary.avgDuration.toFixed(2)}ms`);
    console.log(`  Errors: ${apiSummary.errorCount}`);
    if (apiSummary.slowestCall) {
      console.log(
        `  Slowest: ${apiSummary.slowestCall.method} ${apiSummary.slowestCall.endpoint} (${apiSummary.slowestCall.duration.toFixed(2)}ms)`
      );
    }

    console.log('========================\n');
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.marks.clear();
    this.componentMetrics.clear();
    this.apiMetrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook to track component render performance
 */
export function usePerformanceTracking(componentName: string): void {
  if (!__DEV__) return;

  // Track mount
  React.useEffect(() => {
    performanceMonitor.trackComponentMount(componentName);
  }, [componentName]);

  // Track renders
  const renderStartTime = React.useRef(performance.now());
  React.useEffect(() => {
    const duration = performance.now() - renderStartTime.current;
    performanceMonitor.trackComponentRender(componentName, duration);
    renderStartTime.current = performance.now();
  });
}

/**
 * Utility to wrap async functions with performance tracking
 */
export function trackPerformance<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    performanceMonitor.mark(name);
    try {
      const result = await fn(...args);
      performanceMonitor.measure(name);
      return result;
    } catch (error) {
      performanceMonitor.measure(name);
      throw error;
    } finally {
      performanceMonitor.clearMark(name);
    }
  }) as T;
}

/**
 * Memory usage monitoring (if available)
 */
export function logMemoryUsage(): void {
  if (!__DEV__) return;

  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    console.log('[Performance] Memory:');
    console.log(`  Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
  } else {
    console.log('[Performance] Memory API not available');
  }
}

// Auto-log summary on app background (development only)
if (__DEV__) {
  // Note: In React Native, we'd use AppState listener here
  // This is a placeholder for the pattern
}

// Add React import for the hook
import React from 'react';
