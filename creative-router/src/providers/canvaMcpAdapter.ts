import type { CreativeProvider } from './creativeProvider.js';
import type { CreativeVariant } from '../models.js';
import type {
  CopyBundle,
  GenerateCreativesRequest,
  PlacementSpec,
  RegenerateCreativesRequest,
} from '../types.js';
import { createVariants } from '../store/memoryStore.js';

export const CANVA_PROVIDER_ID = 'canva';

/** Minimal contract for a Canva MCP backend (e.g. gateway or stub). */
export interface CanvaMcpClient {
  searchTemplates(params: {
    channel: string;
    placements: PlacementSpec[];
  }): Promise<{ templateIds: string[] }>;

  createDesign(params: {
    templateId: string;
    jobId: string;
    brandProfileId: string;
    copy: CopyBundle;
    placement: PlacementSpec;
    variantIndex: number;
  }): Promise<{ designId: string; assetUrl: string }>;
}

/** HTTP client that calls a Canva MCP-compatible endpoint. */
export class CanvaMcpHttpClient implements CanvaMcpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async searchTemplates(params: {
    channel: string;
    placements: PlacementSpec[];
  }): Promise<{ templateIds: string[] }> {
    const res = await fetch(`${this.baseUrl}/templates/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Canva MCP templates/search failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { templateIds?: string[] };
    return { templateIds: data.templateIds ?? [] };
  }

  async createDesign(params: {
    templateId: string;
    jobId: string;
    brandProfileId: string;
    copy: CopyBundle;
    placement: PlacementSpec;
    variantIndex: number;
  }): Promise<{ designId: string; assetUrl: string }> {
    const res = await fetch(`${this.baseUrl}/designs/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Canva MCP designs/create failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { designId?: string; assetUrl?: string };
    if (!data.designId || !data.assetUrl) {
      throw new Error('Canva MCP designs/create returned invalid response');
    }
    return { designId: data.designId, assetUrl: data.assetUrl };
  }
}

/**
 * Canva MCP adapter: implements CreativeProvider using a Canva MCP client.
 * When client is not configured (null), isConfigured() is false and the route layer should use the mock provider.
 */
export class CanvaMcpAdapter implements CreativeProvider {
  readonly id = CANVA_PROVIDER_ID;

  constructor(private readonly client: CanvaMcpClient | null) {}

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateFromRequest(jobId: string, request: GenerateCreativesRequest): Promise<CreativeVariant[]> {
    if (!this.client) {
      throw new Error('CanvaMcpAdapter is not configured');
    }

    const maxVariantsPerPlacement = request.experimentConfig?.maxVariants ?? 3;

    const { templateIds } = await this.client.searchTemplates({
      channel: request.channel,
      placements: request.placements,
    });

    if (!templateIds.length) {
      const err = new Error('NO_TEMPLATES_FOUND') as Error & { code?: string };
      err.code = 'NO_TEMPLATES_FOUND';
      throw err;
    }

    const placementKeys = request.placements.map((p) => `${p.placement}:${p.aspectRatio}`);
    const variantsToCreate: Omit<CreativeVariant, 'status'>[] = [];
    let variantIndex = 0;
    const totalTarget = placementKeys.length * maxVariantsPerPlacement;

    for (let i = 0; i < totalTarget; i++) {
      const placement = request.placements[i % request.placements.length]!;
      const templateId = templateIds[i % templateIds.length]!;
      const { designId, assetUrl } = await this.client.createDesign({
        templateId,
        jobId,
        brandProfileId: request.brandProfileId,
        copy: request.copy,
        placement,
        variantIndex: variantIndex++,
      });
      variantsToCreate.push({
        id: `${jobId}-${designId}`,
        jobId,
        provider: this.id,
        templateId,
        placements: placementKeys,
        assetUrl,
      });
    }

    return createVariants(variantsToCreate);
  }

  async regenerateFromRequest(
    jobId: string,
    request: RegenerateCreativesRequest,
  ): Promise<CreativeVariant[]> {
    if (!this.client) {
      throw new Error('CanvaMcpAdapter is not configured');
    }
    const placementKeys = ['meta_feed:1:1'];
    const baseVariants = Array.from({ length: 2 }).map((_, index) => ({
      id: `${jobId}-regen-v${index + 1}`,
      jobId,
      provider: this.id,
      templateId: 'canva-regen',
      placements: placementKeys,
      assetUrl: `https://example.com/canva/${jobId}/regen-v${index + 1}.png`,
    }));
    return createVariants(baseVariants);
  }
}

/**
 * Create Canva adapter from env: if CANVA_MCP_BASE_URL and CANVA_MCP_API_KEY are set, returns configured adapter; else returns adapter with null client.
 */
export function createCanvaMcpAdapterFromEnv(): CanvaMcpAdapter {
  const baseUrl = process.env.CANVA_MCP_BASE_URL;
  const apiKey = process.env.CANVA_MCP_API_KEY;
  if (baseUrl && apiKey) {
    return new CanvaMcpAdapter(new CanvaMcpHttpClient(baseUrl, apiKey));
  }
  return new CanvaMcpAdapter(null);
}
