/**
 * Scan API client for sensor scanning operations
 */

import { apiClient } from './client';

// Types

export interface ScanRequest {
  ship_id: string;
  scan_type: 'passive' | 'active';
  target_id?: string;
}

export interface ScannerInfo {
  range: number;
  resolution: number;
  science_bonus: number;
}

export interface ContactDetails {
  name?: string;
  ship_type?: string;
  faction?: string;
}

export interface ContactInfo {
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

export interface SectorScanInfo {
  hazards_detected: number;
  anomalies_detected: number;
  resource_nodes: number;
  ships_detected: number;
  stations_detected: number;
}

export interface ScanResponse {
  scan_id: string;
  scanner: ScannerInfo;
  contacts: ContactInfo[];
  sector_info: SectorScanInfo;
  timestamp: number;
}

// API Functions

/**
 * Execute a sector scan from the given ship
 */
export async function executeScan(request: ScanRequest): Promise<ScanResponse> {
  return apiClient.post<ScanResponse>('/actions/scan', request);
}

/**
 * Execute a passive scan (default, no energy cost)
 */
export async function passiveScan(shipId: string): Promise<ScanResponse> {
  return executeScan({
    ship_id: shipId,
    scan_type: 'passive',
  });
}

/**
 * Execute an active scan (more detailed, may have energy cost)
 */
export async function activeScan(shipId: string, targetId?: string): Promise<ScanResponse> {
  return executeScan({
    ship_id: shipId,
    scan_type: 'active',
    target_id: targetId,
  });
}

/**
 * Get classification color for contacts
 */
export function getClassificationColor(classification: ContactInfo['classification']): string {
  switch (classification) {
    case 'friendly':
      return '#22c55e'; // Green
    case 'hostile':
      return '#ef4444'; // Red
    case 'neutral':
      return '#eab308'; // Yellow
    case 'unknown':
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Get entity type icon name
 */
export function getEntityTypeIcon(entityType: ContactInfo['entity_type']): string {
  switch (entityType) {
    case 'ship':
      return 'rocket';
    case 'station':
      return 'building';
    case 'asteroid':
      return 'circle';
    case 'anomaly':
      return 'alert-triangle';
    default:
      return 'help-circle';
  }
}
