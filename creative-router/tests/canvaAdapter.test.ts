import { describe, expect, it } from 'vitest';
import { CanvaMcpAdapter, type CanvaMcpClient } from '../src/providers/canvaMcpAdapter.js';
import type { GenerateCreativesRequest } from '../src/types.js';

const baseRequest: GenerateCreativesRequest = {
  campaignId: 'c1',
  channel: 'meta',
  placements: [{ placement: 'meta_feed', aspectRatio: '1:1' }],
  phase: 'test_and_learn',
  costProfile: 'template_only',
  brandProfileId: 'b1',
  copy: { headlines: ['H'], bodies: ['B'], ctas: ['C'] },
};

describe('CanvaMcpAdapter', () => {
  it('isConfigured returns false when client is null', () => {
    const adapter = new CanvaMcpAdapter(null);
    expect(adapter.isConfigured()).toBe(false);
  });

  it('isConfigured returns true when client is set', () => {
    const client: CanvaMcpClient = {
      searchTemplates: async () => ({ templateIds: ['t1'] }),
      createDesign: async () => ({ designId: 'd1', assetUrl: 'https://example.com/1.png' }),
    };
    const adapter = new CanvaMcpAdapter(client);
    expect(adapter.isConfigured()).toBe(true);
  });

  it('generateFromRequest throws when client is null', async () => {
    const adapter = new CanvaMcpAdapter(null);
    await expect(adapter.generateFromRequest('job-1', baseRequest)).rejects.toThrow('not configured');
  });

  it('generateFromRequest returns variants when client returns templates and designs', async () => {
    const client: CanvaMcpClient = {
      searchTemplates: async () => ({ templateIds: ['t1', 't2'] }),
      createDesign: async ({ variantIndex }) => ({
        designId: `d-${variantIndex}`,
        assetUrl: `https://example.com/${variantIndex}.png`,
      }),
    };
    const adapter = new CanvaMcpAdapter(client);
    const variants = await adapter.generateFromRequest('job-1', baseRequest);
    expect(variants.length).toBeGreaterThan(0);
    expect(variants[0]?.provider).toBe('canva');
    expect(variants[0]?.jobId).toBe('job-1');
    expect(variants[0]?.assetUrl).toBeDefined();
  });

  it('generateFromRequest throws NO_TEMPLATES_FOUND when no templates returned', async () => {
    const client: CanvaMcpClient = {
      searchTemplates: async () => ({ templateIds: [] }),
      createDesign: async () => ({ designId: 'd1', assetUrl: 'https://example.com/1.png' }),
    };
    const adapter = new CanvaMcpAdapter(client);
    await expect(adapter.generateFromRequest('job-1', baseRequest)).rejects.toMatchObject({
      code: 'NO_TEMPLATES_FOUND',
    });
  });
});
