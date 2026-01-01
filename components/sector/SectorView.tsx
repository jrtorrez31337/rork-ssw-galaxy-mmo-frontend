/**
 * SectorView - Sector visualization component
 *
 * Currently renders 2D vector view via SectorGrid.
 * 3D WebGL view planned for future when native build is available.
 */

import { SectorGrid } from '@/components/viewport/SectorGrid';
import type { NPCEntity } from '@/types/combat';
import type { Station } from '@/types/movement';
import type { SectorShip } from '@/api/sectorEntities';

interface SectorViewProps {
  npcs: NPCEntity[];
  playerPosition?: [number, number, number];
  onNPCPress?: (npc: NPCEntity) => void;
  selectedNPCId?: string;
  sectorId?: string;
  showProcgen?: boolean;
  dbStations?: Station[];
  otherShips?: SectorShip[];
  currentShipId?: string;
}

export default function SectorView(props: SectorViewProps) {
  return <SectorGrid {...props} />;
}
