import type { CreativeVariant } from '../models.js';
import type { ValidationProvider, ValidationResult } from './validationProvider.js';

/** Minimal contract for Meta MCP validation (e.g. gateway or stub). */
export interface MetaMcpClient {
  validateAssets(params: {
    assets: Array<{ url: string; placement: string; aspectRatio?: string }>;
  }): Promise<{ results: Array<{ valid: boolean; issues: string[] }> }>;
}

/** HTTP client that calls a Meta MCP-compatible validation endpoint. */
export class MetaMcpHttpClient implements MetaMcpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async validateAssets(params: {
    assets: Array<{ url: string; placement: string; aspectRatio?: string }>;
  }): Promise<{ results: Array<{ valid: boolean; issues: string[] }> }> {
    const res = await fetch(`${this.baseUrl}/creatives/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Meta MCP creatives/validate failed: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { results?: Array<{ valid: boolean; issues: string[] }> };
    return { results: data.results ?? [] };
  }
}

/**
 * Meta MCP adapter: implements ValidationProvider for asset validation and optional previews.
 * When client is null, isConfigured() is false and the route layer can skip validation or use mock.
 */
export class MetaMcpAdapter implements ValidationProvider {
  readonly id = 'meta-mcp';

  constructor(private readonly client: MetaMcpClient | null) {}

  isConfigured(): boolean {
    return this.client !== null;
  }

  async validateVariants(variants: CreativeVariant[]): Promise<ValidationResult> {
    if (!this.client) {
      return { valid: true, issues: [] };
    }

    if (variants.length === 0) {
      return { valid: true, issues: [] };
    }

    const assets = variants.map((v) => ({
      url: v.assetUrl ?? '',
      placement: v.placements[0] ?? 'meta_feed',
      aspectRatio: v.placements[0]?.includes(':') ? v.placements[0].split(':')[1] : undefined,
    }));

    const { results } = await this.client.validateAssets({ assets });
    const allValid = results.every((r) => r.valid);
    const issues = results.flatMap((r) => r.issues);

    return { valid: allValid, issues };
  }
}

/**
 * Create Meta adapter from env: if META_MCP_BASE_URL and META_MCP_API_KEY are set, returns configured adapter; else returns adapter with null client.
 */
export function createMetaMcpAdapterFromEnv(): MetaMcpAdapter {
  const baseUrl = process.env.META_MCP_BASE_URL;
  const apiKey = process.env.META_MCP_API_KEY;
  if (baseUrl && apiKey) {
    return new MetaMcpAdapter(new MetaMcpHttpClient(baseUrl, apiKey));
  }
  return new MetaMcpAdapter(null);
}
