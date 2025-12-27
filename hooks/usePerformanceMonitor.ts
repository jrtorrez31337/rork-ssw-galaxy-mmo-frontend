import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/utils/performance';

/**
 * Hook to track component render performance
 * Automatically logs mount time and render durations
 *
 * @param componentName - Name of the component for logging
 * @param enabled - Whether to enable tracking (defaults to __DEV__)
 *
 * @example
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   // Component logic...
 * }
 */
export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = __DEV__
): void {
  const renderStartTime = useRef(performance.now());
  const mountedRef = useRef(false);

  // Track component mount
  useEffect(() => {
    if (!enabled) return;

    if (!mountedRef.current) {
      performanceMonitor.trackComponentMount(componentName);
      mountedRef.current = true;
    }
  }, [componentName, enabled]);

  // Track renders
  useEffect(() => {
    if (!enabled) return;

    const duration = performance.now() - renderStartTime.current;
    performanceMonitor.trackComponentRender(componentName, duration);
    renderStartTime.current = performance.now();
  });

  // Log on unmount
  useEffect(() => {
    return () => {
      if (enabled) {
        const metrics = performanceMonitor.getComponentMetrics(componentName);
        if (metrics) {
          console.log(
            `[Performance] ${componentName} unmounted after ${metrics.renderCount} renders`
          );
        }
      }
    };
  }, [componentName, enabled]);
}

/**
 * Hook to track async operation performance
 * Returns a wrapper function that tracks execution time
 *
 * @param operationName - Name of the operation for logging
 *
 * @example
 * function MyComponent() {
 *   const trackAsync = useAsyncPerformance('fetchData');
 *
 *   const fetchData = trackAsync(async () => {
 *     const response = await api.getData();
 *     return response;
 *   });
 * }
 */
export function useAsyncPerformance(operationName: string) {
  return useRef(<T extends (...args: any[]) => Promise<any>>(fn: T): T => {
    return (async (...args: any[]) => {
      const markName = `${operationName}_${Date.now()}`;
      performanceMonitor.mark(markName);

      try {
        const result = await fn(...args);
        performanceMonitor.measure(markName);
        return result;
      } catch (error) {
        performanceMonitor.measure(markName);
        throw error;
      } finally {
        performanceMonitor.clearMark(markName);
      }
    }) as T;
  }).current;
}
