import { describe, expect, it } from 'vitest';
import { MetaMcpAdapter } from '../src/providers/metaMcpAdapter.js';
import type { CreativeVariant } from '../src/models.js';

describe('MetaMcpAdapter', () => {
  it('isConfigured returns false when client is null', () => {
    const adapter = new MetaMcpAdapter(null);
    expect(adapter.isConfigured()).toBe(false);
  });

  it('validateVariants returns valid when client is null', async () => {
    const adapter = new MetaMcpAdapter(null);
    const result = await adapter.validateVariants([]);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('validateVariants returns valid for empty list', async () => {
    const adapter = new MetaMcpAdapter(null);
    const result = await adapter.validateVariants([]);
    expect(result.valid).toBe(true);
  });

  it('validateVariants calls client when configured and returns result', async () => {
    const adapter = new MetaMcpAdapter({
      validateAssets: async () => ({
        results: [{ valid: true, issues: [] }, { valid: false, issues: ['Size too large'] }],
      }),
    });
    const variants: CreativeVariant[] = [
      {
        id: 'v1',
        jobId: 'j1',
        provider: 'canva',
        placements: ['meta_feed:1:1'],
        status: 'pending',
        assetUrl: 'https://example.com/1.png',
      },
      {
        id: 'v2',
        jobId: 'j1',
        provider: 'canva',
        placements: ['meta_feed:4:5'],
        status: 'pending',
        assetUrl: 'https://example.com/2.png',
      },
    ];
    const result = await adapter.validateVariants(variants);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Size too large');
  });
});
