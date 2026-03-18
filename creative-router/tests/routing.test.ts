import { describe, expect, it } from 'vitest';
import { routeGenerateCreatives } from '../src/routing/engine.js';
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

describe('routing engine v1', () => {
  it('returns canva + meta validation for meta test_and_learn template_only', () => {
    const decision = routeGenerateCreatives(baseRequest);
    expect(decision.primaryProvider).toBe('canva');
    expect(decision.useMetaValidation).toBe(true);
    expect(decision.inScope).toBe(true);
    expect(decision.maxVariantsPerPlacement).toBeGreaterThanOrEqual(1);
  });

  it('returns mock and no meta validation for scale phase', () => {
    const decision = routeGenerateCreatives({
      ...baseRequest,
      phase: 'scale',
    });
    expect(decision.primaryProvider).toBe('mock');
    expect(decision.useMetaValidation).toBe(false);
    expect(decision.inScope).toBe(false);
  });

  it('returns mock for balanced cost profile', () => {
    const decision = routeGenerateCreatives({
      ...baseRequest,
      costProfile: 'balanced',
    });
    expect(decision.primaryProvider).toBe('mock');
    expect(decision.inScope).toBe(false);
  });

  it('respects experimentConfig.maxVariants', () => {
    const decision = routeGenerateCreatives({
      ...baseRequest,
      experimentConfig: { maxVariants: 5 },
    });
    expect(decision.maxVariantsPerPlacement).toBe(5);
  });
});
