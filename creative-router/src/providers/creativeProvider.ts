import type { CreativeVariant } from '../models.js';
import type { GenerateCreativesRequest, RegenerateCreativesRequest } from '../types.js';
import { createVariants } from '../store/memoryStore.js';

export interface CreativeProvider {
  readonly id: string;

  generateFromRequest(jobId: string, request: GenerateCreativesRequest): Promise<CreativeVariant[]>;

  regenerateFromRequest(jobId: string, request: RegenerateCreativesRequest): Promise<CreativeVariant[]>;
}

/**
 * Mock implementation used in Sprint 1. Does not call any real MCP providers.
 */
export class MockCreativeProvider implements CreativeProvider {
  readonly id = 'mock';

  async generateFromRequest(jobId: string, request: GenerateCreativesRequest): Promise<CreativeVariant[]> {
    const placementKeys = request.placements.map((p) => `${p.placement}:${p.aspectRatio}`);

    const baseVariants = Array.from({ length: 3 }).map((_, index) => ({
      id: `${jobId}-v${index + 1}`,
      jobId,
      provider: this.id,
      templateId: 'mock-template',
      placements: placementKeys,
      assetUrl: `https://example.com/mock/${jobId}/v${index + 1}.png`,
    }));

    return createVariants(baseVariants);
  }

  async regenerateFromRequest(jobId: string, request: RegenerateCreativesRequest): Promise<CreativeVariant[]> {
    // For Sprint 1, treat regeneration the same as generation but with a different template id.
    const placementKeys = ['meta_feed:1:1'];
    const baseVariants = Array.from({ length: 2 }).map((_, index) => ({
      id: `${jobId}-regen-v${index + 1}`,
      jobId,
      provider: this.id,
      templateId: 'mock-template-regen',
      placements: placementKeys,
      assetUrl: `https://example.com/mock/${jobId}/regen-v${index + 1}.png`,
    }));

    return createVariants(baseVariants);
  }
}

