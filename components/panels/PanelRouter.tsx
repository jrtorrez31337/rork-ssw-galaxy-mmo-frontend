import React from 'react';
import { useCockpitStore, RailSystem } from '@/stores/cockpitStore';
import { NavigationPanel } from './NavigationPanel';
import { OperationsPanel } from './OperationsPanel';
import { TacticalPanel } from './TacticalPanel';
import { EngineeringPanel } from './EngineeringPanel';
import { CommsPanel } from './CommsPanel';

/**
 * PanelRouter - Routes to appropriate panel content based on activeRail
 *
 * Per UI/UX Doctrine:
 * - Rail selection switches panel content without navigation
 * - Content changes are instant (no route transitions)
 * - Player context preserved across all panel switches
 */

const PANEL_MAP: Record<RailSystem, React.ComponentType> = {
  NAV: NavigationPanel,
  OPS: OperationsPanel,
  TAC: TacticalPanel,
  ENG: EngineeringPanel,
  COM: CommsPanel,
};

export function PanelRouter() {
  const activeRail = useCockpitStore((s) => s.activeRail);
  const Panel = PANEL_MAP[activeRail];

  return <Panel />;
}
