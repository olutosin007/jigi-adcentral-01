export type Phase = 'test_and_learn' | 'scale';

export type CostProfile = 'template_only' | 'balanced' | 'premium';

export type JobType = 'generate' | 'regenerate' | 'review';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PlacementSpec {
  placement: string; // e.g. 'meta_feed'
  aspectRatio: string; // e.g. '1:1', '4:5'
}

export interface CopyBundle {
  headlines: string[];
  bodies: string[];
  ctas: string[];
}

export interface ExperimentConfig {
  maxVariants?: number;
}

export interface GenerateCreativesRequest {
  campaignId: string;
  channel: 'meta';
  placements: PlacementSpec[];
  phase: Phase;
  costProfile: CostProfile;
  brandProfileId: string;
  brandOverrides?: Record<string, unknown>;
  copy: CopyBundle;
  experimentConfig?: ExperimentConfig;
}

export interface PerformanceSummary {
  impressions?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  summary?: string;
}

export interface RegenerateCreativesRequest {
  campaignId: string;
  originalCreativeId: string;
  performance: PerformanceSummary;
  regenerationIntent: 'optimize_within_concept';
  constraints?: Record<string, unknown>;
}

export interface ReviewConfig {
  slackChannel?: string;
  notionDatabaseId?: string;
  instructions?: string;
  dueDateIso?: string;
}

export interface SendForReviewRequest {
  campaignId: string;
  creativeIds: string[];
  review: ReviewConfig;
}

export interface ErrorResponse {
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface JobAcceptedResponse {
  jobId: string;
  status: 'accepted';
}

export interface CreativeVariantSummary {
  id: string;
  provider: string;
  templateId?: string;
  placements: string[];
  assetUrl?: string;
}

export interface GenerateCreativesResponse extends JobAcceptedResponse {
  variants?: CreativeVariantSummary[];
}

export interface JobStatusResponse {
  jobId: string;
  type: JobType;
  status: JobStatus;
  error?: ErrorResponse;
  resultSummary?: Record<string, unknown>;
}

