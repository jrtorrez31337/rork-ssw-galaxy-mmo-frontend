import { performanceMonitor } from './performance';

/**
 * API Performance Tracker
 * Wraps fetch calls to automatically track API performance
 */

interface APICallOptions {
  url: string;
  method: string;
  startTime: number;
}

const activeCalls = new Map<string, APICallOptions>();

/**
 * Track API call start
 */
export function trackAPIStart(url: string, method: string): string {
  const callId = `${method}_${url}_${Date.now()}`;
  activeCalls.set(callId, {
    url,
    method,
    startTime: performance.now(),
  });
  return callId;
}

/**
 * Track API call end
 */
export function trackAPIEnd(callId: string, status?: number, error?: boolean): void {
  const call = activeCalls.get(callId);
  if (!call) {
    console.warn('[Performance] API call not found:', callId);
    return;
  }

  const duration = performance.now() - call.startTime;
  performanceMonitor.trackAPICall(call.url, call.method, duration, status, error);
  activeCalls.delete(callId);
}

/**
 * Wrapper for fetch that automatically tracks performance
 */
export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';

  const callId = trackAPIStart(url, method);

  try {
    const response = await fetch(input, init);
    trackAPIEnd(callId, response.status, !response.ok);
    return response;
  } catch (error) {
    trackAPIEnd(callId, undefined, true);
    throw error;
  }
}

/**
 * Create a performance-tracking wrapper for API client
 * Works with axios, fetch, or any HTTP client
 */
export function createAPIPerformanceWrapper<T extends (...args: any[]) => Promise<any>>(
  endpoint: string,
  method: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const callId = trackAPIStart(endpoint, method);

    try {
      const result = await fn(...args);
      trackAPIEnd(callId, 200, false);
      return result;
    } catch (error: any) {
      const status = error?.response?.status || error?.status;
      trackAPIEnd(callId, status, true);
      throw error;
    }
  }) as T;
}

/**
 * Decorator for class methods to add performance tracking
 * Usage:
 *
 * class API {
 *   @trackAPI('users/list', 'GET')
 *   async getUsers() { ... }
 * }
 */
export function trackAPI(endpoint: string, method: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const callId = trackAPIStart(endpoint, method);

      try {
        const result = await originalMethod.apply(this, args);
        trackAPIEnd(callId, 200, false);
        return result;
      } catch (error: any) {
        const status = error?.response?.status || error?.status;
        trackAPIEnd(callId, status, true);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Log API performance summary
 */
export function logAPIPerformanceSummary(): void {
  const summary = performanceMonitor.getAPIMetricsSummary();

  console.log('\n=== API Performance Summary ===');
  console.log(`Total API calls: ${summary.totalCalls}`);
  console.log(`Average duration: ${summary.avgDuration.toFixed(2)}ms`);
  console.log(`Error count: ${summary.errorCount}`);

  if (summary.slowestCall) {
    console.log('\nSlowest API call:');
    console.log(`  ${summary.slowestCall.method} ${summary.slowestCall.endpoint}`);
    console.log(`  Duration: ${summary.slowestCall.duration.toFixed(2)}ms`);
    if (summary.slowestCall.status) {
      console.log(`  Status: ${summary.slowestCall.status}`);
    }
  }

  console.log('==============================\n');
}
