import type { JobStatus, JobType } from './types.js';

export interface CreativeJob {
  id: string;
  type: JobType;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  requestSnapshot: unknown;
  error?: {
    errorCode: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface CreativeVariant {
  id: string;
  jobId: string;
  provider: string;
  templateId?: string;
  placements: string[];
  assetUrl?: string;
  status: 'pending' | 'generated' | 'failed';
}

export interface CreativeLineage {
  originalVariantId: string;
  replacementVariantId: string;
  relationshipType: 'replacement' | 'regen';
}

