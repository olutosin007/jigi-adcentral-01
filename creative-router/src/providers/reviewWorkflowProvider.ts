import type { SendForReviewRequest } from '../types.js';

export interface ReviewJobMetadata {
  externalThreadId?: string;
  externalRecordId?: string;
}

export interface ReviewWorkflowProvider {
  readonly id: string;

  sendForReview(jobId: string, request: SendForReviewRequest): Promise<ReviewJobMetadata>;
}

/**
 * Mock implementation that simulates a review workflow without external side effects.
 */
export class MockReviewWorkflowProvider implements ReviewWorkflowProvider {
  readonly id = 'mock-review';

  async sendForReview(jobId: string, request: SendForReviewRequest): Promise<ReviewJobMetadata> {
    return {
      externalThreadId: `mock-thread-${jobId}`,
      externalRecordId: `mock-record-${jobId}`,
    };
  }
}

