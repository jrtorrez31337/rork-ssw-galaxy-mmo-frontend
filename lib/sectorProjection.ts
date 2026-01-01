/**
 * Sector Projection System
 *
 * Converts 3D sector coordinates (20,000³ cube) to 2D screen coordinates
 * with depth cues for pseudo-3D visualization.
 *
 * Sector space: -10,000 to +10,000 on each axis (centered at origin)
 */

import type { SectorViewMode } from '@/stores/settingsStore';

/**
 * Configuration for view projection
 */
interface ProjectionConfig {
  viewSize: number;      // Screen size in pixels
  sectorSize: number;    // Sector dimension (20000 for 20k cube)
  viewMode: SectorViewMode;
  depthCuesEnabled: boolean;
}

/**
 * Result of projecting a 3D point to 2D
 */
export interface ProjectedPoint {
  x: number;           // Screen X coordinate
  y: number;           // Screen Y coordinate
  depth: number;       // Normalized depth (0 = closest, 1 = furthest)
  scale: number;       // Size multiplier based on depth (closer = larger)
  opacity: number;     // Opacity based on depth (further = more transparent)
}

/**
 * View mode projection mappings
 * Each mode defines which 3D axis maps to screen X, Y, and depth
 */
interface ViewProjection {
  screenX: 'x' | 'y' | 'z';
  screenY: 'x' | 'y' | 'z';
  depthAxis: 'x' | 'y' | 'z';
  flipX: boolean;
  flipY: boolean;
  flipDepth: boolean;  // If true, higher values are "closer"
}

const VIEW_PROJECTIONS: Record<SectorViewMode, ViewProjection> = {
  'top-down': {
    screenX: 'x',
    screenY: 'y',
    depthAxis: 'z',
    flipX: false,
    flipY: false,
    flipDepth: true,   // Higher Z is closer (toward camera above)
  },
  'bottom': {
    screenX: 'x',
    screenY: 'y',
    depthAxis: 'z',
    flipX: false,
    flipY: true,       // Looking up from below, Y is flipped
    flipDepth: false,  // Lower Z is closer (toward camera below)
  },
  'side-left': {
    screenX: 'z',
    screenY: 'y',
    depthAxis: 'x',
    flipX: true,       // Looking from left, Z goes right-to-left
    flipY: false,
    flipDepth: false,  // Lower X (left side) is closer
  },
  'side-right': {
    screenX: 'z',
    screenY: 'y',
    depthAxis: 'x',
    flipX: false,
    flipY: false,
    flipDepth: true,   // Higher X (right side) is closer
  },
  'front': {
    screenX: 'x',
    screenY: 'z',
    depthAxis: 'y',
    flipX: false,
    flipY: true,       // Z increases upward on screen
    flipDepth: false,  // Lower Y (front) is closer
  },
  'back': {
    screenX: 'x',
    screenY: 'z',
    depthAxis: 'y',
    flipX: true,       // Looking from back, X is mirrored
    flipY: true,
    flipDepth: true,   // Higher Y (back) is closer
  },
};

/**
 * Depth cue settings
 */
const DEPTH_CONFIG = {
  minScale: 0.6,       // Minimum size at max depth
  maxScale: 1.4,       // Maximum size at min depth
  minOpacity: 0.4,     // Minimum opacity at max depth
  maxOpacity: 1.0,     // Maximum opacity at min depth
};

/**
 * Create a projection function for the given configuration
 */
export function createProjector(config: ProjectionConfig) {
  const { viewSize, sectorSize, viewMode, depthCuesEnabled } = config;
  const projection = VIEW_PROJECTIONS[viewMode];
  const halfSector = sectorSize / 2;
  const scale = viewSize / sectorSize;

  /**
   * Project a 3D point to 2D screen coordinates with depth cues
   */
  return function project(pos: [number, number, number] | { x: number; y: number; z: number }): ProjectedPoint {
    // Normalize input to array format
    const coords = Array.isArray(pos) ? pos : [pos.x, pos.y, pos.z];
    const [x, y, z] = coords;

    // Get axis values based on projection
    const axisValues = { x, y, z };
    let screenX = axisValues[projection.screenX];
    let screenY = axisValues[projection.screenY];
    const depthValue = axisValues[projection.depthAxis];

    // Apply flips
    if (projection.flipX) screenX = -screenX;
    if (projection.flipY) screenY = -screenY;

    // Convert to screen coordinates (center the view)
    const pixelX = (screenX * scale) + (viewSize / 2);
    const pixelY = (screenY * scale) + (viewSize / 2);

    // Calculate normalized depth (0 = closest, 1 = furthest)
    let normalizedDepth = (depthValue + halfSector) / sectorSize;
    if (projection.flipDepth) {
      normalizedDepth = 1 - normalizedDepth;
    }
    // Clamp to valid range
    normalizedDepth = Math.max(0, Math.min(1, normalizedDepth));

    // Calculate depth cues
    let depthScale = 1;
    let depthOpacity = 1;

    if (depthCuesEnabled) {
      // Closer (depth=0) = larger, further (depth=1) = smaller
      depthScale = DEPTH_CONFIG.maxScale - (normalizedDepth * (DEPTH_CONFIG.maxScale - DEPTH_CONFIG.minScale));
      // Closer = more opaque, further = more transparent
      depthOpacity = DEPTH_CONFIG.maxOpacity - (normalizedDepth * (DEPTH_CONFIG.maxOpacity - DEPTH_CONFIG.minOpacity));
    }

    return {
      x: pixelX,
      y: pixelY,
      depth: normalizedDepth,
      scale: depthScale,
      opacity: depthOpacity,
    };
  };
}

/**
 * Sort entities by depth for proper z-ordering
 * Entities further away (higher depth) should render first (behind)
 * Supports both direct depth property and nested projected.depth
 */
export function sortByDepth<T extends { depth: number } | { projected: { depth: number } }>(entities: T[]): T[] {
  return [...entities].sort((a, b) => {
    const depthA = 'projected' in a ? a.projected.depth : a.depth;
    const depthB = 'projected' in b ? b.projected.depth : b.depth;
    return depthB - depthA;
  });
}

/**
 * Get axis labels for the current view mode
 * Useful for displaying on the grid
 */
export function getAxisLabels(viewMode: SectorViewMode): { horizontal: string; vertical: string; depth: string } {
  const projection = VIEW_PROJECTIONS[viewMode];
  return {
    horizontal: projection.screenX.toUpperCase(),
    vertical: projection.screenY.toUpperCase(),
    depth: projection.depthAxis.toUpperCase(),
  };
}

/**
 * Get view mode description
 */
export function getViewModeDescription(viewMode: SectorViewMode): string {
  switch (viewMode) {
    case 'top-down':
      return 'Looking down from above. X is left-right, Y is up-down, Z is depth.';
    case 'bottom':
      return 'Looking up from below. X is left-right, Y is up-down (flipped), Z is depth.';
    case 'side-left':
      return 'Looking from the left. Z is left-right, Y is up-down, X is depth.';
    case 'side-right':
      return 'Looking from the right. Z is left-right, Y is up-down, X is depth.';
    case 'front':
      return 'Looking from the front. X is left-right, Z is up-down, Y is depth.';
    case 'back':
      return 'Looking from behind. X is left-right, Z is up-down, Y is depth.';
  }
}
