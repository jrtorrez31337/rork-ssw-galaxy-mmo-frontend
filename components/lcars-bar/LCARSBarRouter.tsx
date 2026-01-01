import React from 'react';
import { useCockpitStore, RailSystem } from '@/stores/cockpitStore';
import { NavLCARSContent } from './content/NavLCARSContent';
import { FleetLCARSContent } from './content/FleetLCARSContent';
import { OpsLCARSContent } from './content/OpsLCARSContent';
import { TacLCARSContent } from './content/TacLCARSContent';
import { EngLCARSContent } from './content/EngLCARSContent';
import { CommsLCARSContent } from './content/CommsLCARSContent';

/**
 * LCARSBarRouter - Routes to appropriate content based on activeRail
 *
 * Rail meanings:
 * - NAV: Navigation (sector/system/galaxy maps, view controls)
 * - FLT: Fleet (ships and characters management)
 * - OPS: Operations (station services, docking, trading)
 * - TAC: Tactical (combat, scanning, targeting)
 * - ENG: Engineering (ship systems, repairs, upgrades)
 * - COM: Communications (chat, messages, faction comms)
 */

const LCARS_CONTENT_MAP: Record<RailSystem, React.ComponentType> = {
  NAV: NavLCARSContent,
  FLT: FleetLCARSContent,
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
