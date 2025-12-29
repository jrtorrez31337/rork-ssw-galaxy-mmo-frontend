/**
 * LCARS Component System
 *
 * Minimal, accessible, performant primitives for LCARS-style UI.
 * All components use centralized tokens from @/ui/theme.
 *
 * Per UI/UX Doctrine:
 * - Color is semantic, not decorative
 * - Touch targets minimum 44pt
 * - Panels, not pages
 * - Alerts escalate, not accumulate
 */

// Panels
export { Panel, PanelSection, PanelRow } from './Panel';
export type { PanelVariant } from './Panel';

// Rails
export { Rail, RailButton } from './Rail';
export type { RailOrientation, RailVariant } from './Rail';

// Status indicators
export { StatusChip, StatusDot, StatusBadge } from './StatusChip';
export type { ChipStatus, ChipSize } from './StatusChip';

// Alerts
export { Alert, AlertBanner, InlineAlert } from './Alert';
export type { AlertPriority } from './Alert';

// Gauges
export { Gauge, GaugeCluster, SegmentedGauge } from './Gauge';
export type { GaugeVariant, GaugeSize } from './Gauge';
