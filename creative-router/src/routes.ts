import type { FastifyInstance } from 'fastify';
import type {
  GenerateCreativesRequest,
  GenerateCreativesResponse,
  JobStatusResponse,
  RegenerateCreativesRequest,
  SendForReviewRequest,
} from './types.js';
import {
  createJob,
  getJob,
  getVariantsByJobId,
  setJobError,
  updateJobStatus,
} from './store/memoryStore.js';
import { MockCreativeProvider } from './providers/creativeProvider.js';
import { CanvaMcpAdapter, createCanvaMcpAdapterFromEnv } from './providers/canvaMcpAdapter.js';
import { MockValidationProvider } from './providers/validationProvider.js';
import { MetaMcpAdapter, createMetaMcpAdapterFromEnv } from './providers/metaMcpAdapter.js';
import { MockReviewWorkflowProvider } from './providers/reviewWorkflowProvider.js';
import { routeGenerateCreatives } from './routing/engine.js';
import {
  brandProfileInvalid,
  noTemplatesFound,
  providerUnavailable,
} from './errors.js';

const mockCreativeProvider = new MockCreativeProvider();
const canvaAdapter = createCanvaMcpAdapterFromEnv();
const mockValidationProvider = new MockValidationProvider();
const metaAdapter = createMetaMcpAdapterFromEnv();
const reviewWorkflowProvider = new MockReviewWorkflowProvider();

function validateBrandProfile(request: GenerateCreativesRequest): string[] | null {
  const missing: string[] = [];
  if (!request.brandProfileId?.trim()) {
    missing.push('brandProfileId');
  }
  return missing.length ? missing : null;
}

export function registerRoutes(app: FastifyInstance) {
  app.post('/generate-creatives', async (request, reply) => {
    const body = request.body as Partial<GenerateCreativesRequest>;

    if (!body || !body.campaignId || !body.channel || !body.placements || !body.copy) {
      return reply.code(400).send({
        errorCode: 'BAD_REQUEST',
        message: 'Missing required fields on GenerateCreativesRequest',
        details: { received: body },
      });
    }

    const req = body as GenerateCreativesRequest;
    const missingBrand = validateBrandProfile(req);
    if (missingBrand) {
      return reply.code(400).send(brandProfileInvalid(missingBrand));
    }

    const job = createJob('generate', body);
    try {
      updateJobStatus(job.id, 'running');
    } catch {
      // ignore
    }

    const decision = routeGenerateCreatives(req);
    let variants: Awaited<ReturnType<typeof mockCreativeProvider.generateFromRequest>>;

    try {
      const useCanva =
        decision.primaryProvider === 'canva' && canvaAdapter.isConfigured();

      if (useCanva) {
        variants = await canvaAdapter.generateFromRequest(job.id, req);
      } else {
        variants = await mockCreativeProvider.generateFromRequest(job.id, req);
      }

      const validationProvider =
        decision.useMetaValidation && metaAdapter.isConfigured()
          ? metaAdapter
          : mockValidationProvider;
      await validationProvider.validateVariants(variants);

      updateJobStatus(job.id, 'completed');
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      const message = (err as Error).message ?? 'Unknown error';

      if (code === 'NO_TEMPLATES_FOUND' || message.includes('NO_TEMPLATES_FOUND')) {
        setJobError(job.id, noTemplatesFound());
        return reply.code(400).send(noTemplatesFound());
      }
      if (
        message.includes('not configured') ||
        message.includes('failed') ||
        message.includes('PROVIDER_UNAVAILABLE')
      ) {
        const provider =
          decision.primaryProvider === 'canva' ? 'Canva MCP' : 'Meta MCP';
        setJobError(job.id, providerUnavailable(provider, { originalMessage: message }));
        return reply.code(502).send(providerUnavailable(provider, { originalMessage: message }));
      }
      setJobError(job.id, {
        errorCode: 'PROVIDER_UNAVAILABLE',
        message,
        details: { originalMessage: message },
      });
      return reply.code(502).send(providerUnavailable('creative provider', { originalMessage: message }));
    }

    const variantSummaries = getVariantsByJobId(job.id).map((v) => ({
      id: v.id,
      provider: v.provider,
      templateId: v.templateId,
      placements: v.placements,
      assetUrl: v.assetUrl,
    }));

    const response: GenerateCreativesResponse = {
      jobId: job.id,
      status: 'accepted',
      variants: variantSummaries,
    };

    return reply.code(202).send(response);
  });

  app.post('/regenerate-creatives', async (request, reply) => {
    const body = request.body as Partial<RegenerateCreativesRequest>;

    if (!body || !body.campaignId || !body.originalCreativeId || !body.performance) {
      return reply.code(400).send({
        errorCode: 'BAD_REQUEST',
        message: 'Missing required fields on RegenerateCreativesRequest',
        details: { received: body },
      });
    }

    const job = createJob('regenerate', body);

    await mockCreativeProvider.regenerateFromRequest(job.id, body as RegenerateCreativesRequest);

    return reply.code(202).send({
      jobId: job.id,
      status: 'accepted',
    });
  });

  app.post('/send-for-review', async (request, reply) => {
    const body = request.body as Partial<SendForReviewRequest>;

    if (!body || !body.campaignId || !body.creativeIds || !body.review) {
      return reply.code(400).send({
        errorCode: 'BAD_REQUEST',
        message: 'Missing required fields on SendForReviewRequest',
        details: { received: body },
      });
    }

    const job = createJob('review', body);

    await reviewWorkflowProvider.sendForReview(job.id, body as SendForReviewRequest);

    return reply.code(202).send({
      jobId: job.id,
      status: 'accepted',
    });
  });

  app.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = getJob(id);

    if (!job) {
      return reply.code(404).send({
        errorCode: 'NOT_FOUND',
        message: `Job ${id} not found`,
      });
    }

    const variants = getVariantsByJobId(id);
    const response: JobStatusResponse = {
      jobId: job.id,
      type: job.type,
      status: job.status,
      error: job.error,
      resultSummary:
        variants.length > 0
          ? { variantCount: variants.length, variantIds: variants.map((v) => v.id) }
          : undefined,
    };

    return reply.send(response);
  });
}
