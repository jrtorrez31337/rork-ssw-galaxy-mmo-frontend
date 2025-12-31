/**
 * SectorView - Sector visualization component
 *
 * Currently renders 2D vector view.
 * 3D WebGL view planned for future when native build is available.
 */

import SectorView2D from '@/components/npc/SectorView2D';
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
  return <SectorView2D {...props} />;
}
