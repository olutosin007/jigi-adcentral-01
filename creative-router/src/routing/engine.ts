import type { GenerateCreativesRequest } from '../types.js';

export type PrimaryCreativeProvider = 'canva' | 'mock';

export interface RoutingDecision {
  primaryProvider: PrimaryCreativeProvider;
  useMetaValidation: boolean;
  maxVariantsPerPlacement: number;
  inScope: boolean;
}

const DEFAULT_MAX_VARIANTS_PER_PLACEMENT = 3;

/**
 * Routing Engine v1: chooses provider and options for generate-creatives
 * based on channel, phase, and cost profile.
 * For Sprint 2, Meta + test_and_learn + template_only => Canva + Meta validation.
 */
export function routeGenerateCreatives(request: GenerateCreativesRequest): RoutingDecision {
  const isMeta = request.channel === 'meta';
  const isTestAndLearn = request.phase === 'test_and_learn';
  const isTemplateOnly = request.costProfile === 'template_only';

  const inScope = isMeta && isTestAndLearn && isTemplateOnly;

  const maxVariantsPerPlacement =
    request.experimentConfig?.maxVariants ?? DEFAULT_MAX_VARIANTS_PER_PLACEMENT;

  if (inScope) {
    return {
      primaryProvider: 'canva',
      useMetaValidation: true,
      maxVariantsPerPlacement: Math.max(1, Math.min(maxVariantsPerPlacement, 10)),
      inScope: true,
    };
  }

  // Fallback for other channels/phases: use mock, no Meta validation
  return {
    primaryProvider: 'mock',
    useMetaValidation: false,
    maxVariantsPerPlacement: Math.max(1, Math.min(maxVariantsPerPlacement, 10)),
    inScope: false,
  };
}
