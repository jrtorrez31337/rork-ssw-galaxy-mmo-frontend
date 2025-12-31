# Scanning & Targeting

## Overview

The scanning system provides sensor detection of nearby entities including ships, stations, asteroids, and anomalies. Targeting allows players to lock onto contacts for combat or interaction.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/actions/scan` | Execute a scan |

## Data Types

### ScanRequest
```typescript
interface ScanRequest {
  ship_id: string;
  scan_type: 'passive' | 'active';
  target_id?: string;
}
```

### ScanResponse
```typescript
interface ScanResponse {
  scan_id: string;
  scanner: ScannerInfo;
  contacts: ContactInfo[];
  sector_info: SectorScanInfo;
  timestamp: number;
}
```

### ScannerInfo
```typescript
interface ScannerInfo {
  range: number;
  resolution: number;
  science_bonus: number;
}
```

### ContactInfo
```typescript
interface ContactInfo {
  entity_id: string;
  entity_type: 'ship' | 'station' | 'asteroid' | 'anomaly';
  position: [number, number, number];
  position_accuracy: number;
  distance: number;
  signal_strength: number;
  velocity?: [number, number, number];
  heading?: number;
  classification: 'unknown' | 'friendly' | 'neutral' | 'hostile';
  details?: ContactDetails;
}
```

### SectorScanInfo
```typescript
interface SectorScanInfo {
  hazards_detected: number;
  anomalies_detected: number;
  resource_nodes: number;
  ships_detected: number;
  stations_detected: number;
}
```

## Scan Types

| Type | Energy | Range | Detail |
|------|--------|-------|--------|
| Passive | Free | Normal | Basic info |
| Active | Cost | Extended | Full details |

## Contact Classification

| Classification | Color | Behavior |
|---------------|-------|----------|
| Friendly | Green | Allied faction |
| Neutral | Yellow | Non-hostile |
| Hostile | Red | Enemy faction |
| Unknown | Gray | Unidentified |

## Source Files

| File | Purpose |
|------|---------|
| `api/scan.ts` | API client methods |
| `stores/targetStore.ts` | Target selection |
| `hooks/useScanEvents.ts` | SSE event handlers |
| `components/hud/MiniMap.tsx` | Minimap display |
| `components/hud/ExpandedRadar.tsx` | Full radar view |
| `components/hud/ScannerDisplay.tsx` | Scan results |

## Scan Flow

1. **Initiate Scan**
   - Passive (continuous, free)
   - Active (on-demand, energy cost)

2. **Process Results**
   - Contacts detected
   - Positions calculated
   - Classifications assigned

3. **Display**
   - Minimap shows contacts
   - Contact list with details
   - Threat indicators

## Target Store

```typescript
interface TargetState {
  selectedTarget: Entity | null;
  lockedTarget: Entity | null;
  contacts: Contact[];
  threatLevel: 'none' | 'low' | 'medium' | 'high';
}
```

## Components

### MiniMap
- Corner minimap
- Shows nearby contacts
- Distance rings
- Heading indicator

### ExpandedRadar
- Full-screen radar view
- 3D representation
- Contact details panel

### ScannerDisplay
- Scan results list
- Contact classification
- Distance and bearing

### ThreatIndicator
- Overall threat level
- Color-coded alert

## Integration Points

- **Combat**: Lock targets for combat
- **Navigation**: Detect stations
- **Mining**: Find resource nodes
- **Missions**: Locate objectives
- **Ship Systems**: Sensor damage affects range
