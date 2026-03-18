import fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerRoutes } from '../src/routes.js';

function buildTestApp() {
  const app = fastify();
  app.get('/health', async () => ({ status: 'ok' }));
  registerRoutes(app);
  return app;
}

describe('creative-router API', () => {
  it('responds to /health', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('accepts a generate-creatives request and creates a job', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/generate-creatives',
      payload: {
        campaignId: 'camp_123',
        channel: 'meta',
        placements: [{ placement: 'meta_feed', aspectRatio: '1:1' }],
        phase: 'test_and_learn',
        costProfile: 'template_only',
        brandProfileId: 'brand_abc',
        copy: {
          headlines: ['Headline'],
          bodies: ['Body'],
          ctas: ['Sign up'],
        },
      },
    });

    expect(res.statusCode).toBe(202);
    const body = res.json() as { jobId: string; status: string; variants?: unknown[] };
    expect(body.status).toBe('accepted');
    expect(body.jobId).toContain('generate');
    expect(Array.isArray(body.variants)).toBe(true);
    expect((body.variants ?? []).length).toBeGreaterThan(0);
  });

  it('returns 400 on invalid generate-creatives payload', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/generate-creatives',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 and BRAND_PROFILE_INVALID when brandProfileId is empty', async () => {
    const app = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/generate-creatives',
      payload: {
        campaignId: 'c1',
        channel: 'meta',
        placements: [{ placement: 'meta_feed', aspectRatio: '1:1' }],
        phase: 'test_and_learn',
        costProfile: 'template_only',
        brandProfileId: '   ',
        copy: { headlines: ['H'], bodies: ['B'], ctas: ['C'] },
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { errorCode?: string };
    expect(body.errorCode).toBe('BRAND_PROFILE_INVALID');
  });
});

