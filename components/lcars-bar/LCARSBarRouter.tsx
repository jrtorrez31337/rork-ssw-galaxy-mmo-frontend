import React from 'react';
import { useCockpitStore, RailSystem } from '@/stores/cockpitStore';
import { NavLCARSContent } from './content/NavLCARSContent';
import { FlightLCARSContent } from './content/FlightLCARSContent';
import { OpsLCARSContent } from './content/OpsLCARSContent';
import { TacLCARSContent } from './content/TacLCARSContent';
import { EngLCARSContent } from './content/EngLCARSContent';
import { CommsLCARSContent } from './content/CommsLCARSContent';

/**
 * LCARSBarRouter - Routes to appropriate content based on activeRail
 *
 * Similar pattern to the old PanelRouter, but for LCARS bar content.
 */

const LCARS_CONTENT_MAP: Record<RailSystem, React.ComponentType> = {
  NAV: NavLCARSContent,
  FLT: FlightLCARSContent,
  OPS: OpsLCARSContent,
  TAC: TacLCARSContent,
  ENG: EngLCARSContent,
  COM: CommsLCARSContent,
};

export function LCARSBarRouter() {
  const activeRail = useCockpitStore((s) => s.activeRail);
  const Content = LCARS_CONTENT_MAP[activeRail];

  return <Content />;
}
