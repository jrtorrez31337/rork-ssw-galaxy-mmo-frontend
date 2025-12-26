import { apiClient } from './client';
import type {
  ResourceNodesResponse,
  ExtractionRequest,
  ExtractionResult,
} from '@/types/mining';

/**
 * Mining API client for resource extraction operations
 * Phase 2: Mining System Integration
 */

export const miningApi = {
  /**
   * Get resource nodes in a sector
   * Returns procedurally-generated asteroid fields and planetary deposits
   *
   * @param sector - Sector coordinates in "x.y.z" format
   * @param resourceType - Optional filter by resource type (e.g., "iron_ore")
   * @returns List of resource nodes in the sector
   */
  getNodes: async (
    sector: string,
    resourceType?: string
  ): Promise<ResourceNodesResponse> => {
    const params = new URLSearchParams({ sector });
    if (resourceType) {
      params.set('resource_type', resourceType);
    }

    return apiClient.get<ResourceNodesResponse>(
      `/mining/nodes?${params.toString()}`
    );
  },

  /**
   * Extract resources from a node
   * Ship must be within 1000 units and have cargo space
   *
   * @param request - Extraction details (ship_id, node_id, quantity)
   * @returns Extraction result with quality and cargo info
   * @throws MiningError if validation fails (out of range, cargo full, etc.)
   */
  extractResources: async (
    request: ExtractionRequest
  ): Promise<ExtractionResult> => {
    return apiClient.post<ExtractionResult>('/mining/extract', request);
  },

  /**
   * Get a specific resource node by ID (if endpoint exists)
   * Note: This endpoint may not be implemented yet in backend
   */
  getNode: async (nodeId: string): Promise<any> => {
    return apiClient.get(`/mining/nodes/${nodeId}`);
  },
};
