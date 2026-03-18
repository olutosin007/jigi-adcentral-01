import type { CreativeJob, CreativeLineage, CreativeVariant } from '../models.js';
import type { JobStatus, JobType } from '../types.js';

const jobs = new Map<string, CreativeJob>();
const variants = new Map<string, CreativeVariant>();
const lineages: CreativeLineage[] = [];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createJob(type: JobType, requestSnapshot: unknown): CreativeJob {
  const id = generateId(type);
  const now = new Date();
  const job: CreativeJob = {
    id,
    type,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    requestSnapshot,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): CreativeJob | undefined {
  return jobs.get(id);
}

export function updateJobStatus(id: string, status: JobStatus): CreativeJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  job.status = status;
  job.updatedAt = new Date();
  jobs.set(id, job);
  return job;
}

export function createVariants(newVariants: Omit<CreativeVariant, 'status'>[]): CreativeVariant[] {
  const result: CreativeVariant[] = [];
  for (const v of newVariants) {
    const variant: CreativeVariant = {
      ...v,
      status: 'pending',
    };
    variants.set(variant.id, variant);
    result.push(variant);
  }
  return result;
}

export function getVariantsByJobId(jobId: string): CreativeVariant[] {
  return Array.from(variants.values()).filter((v) => v.jobId === jobId);
}

export function addLineage(entry: CreativeLineage): void {
  lineages.push(entry);
}

export function setJobError(id: string, error: CreativeJob['error']): CreativeJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  job.error = error;
  job.status = 'failed';
  job.updatedAt = new Date();
  jobs.set(id, job);
  return job;
}

