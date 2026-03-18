import { describe, expect, it } from 'vitest';
import { createJob, getJob, updateJobStatus } from '../src/store/memoryStore.js';

describe('memoryStore', () => {
  it('creates and retrieves a job', () => {
    const job = createJob('generate', { foo: 'bar' });
    const fetched = getJob(job.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(job.id);
    expect(fetched?.type).toBe('generate');
  });

  it('updates job status', () => {
    const job = createJob('generate', {});
    updateJobStatus(job.id, 'completed');
    const fetched = getJob(job.id);
    expect(fetched?.status).toBe('completed');
  });
});

