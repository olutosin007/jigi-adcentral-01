/** Types for async generation_jobs (video scaffold). No UI until VIDEO_ENABLED. */

export type GenerationJobType = 'video' | 'image_batch' | 'other'
export type GenerationJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export interface GenerationJob {
  id: string
  campaign_id: string | null
  created_by: string | null
  job_type: GenerationJobType
  status: GenerationJobStatus
  provider: string | null
  input: Record<string, unknown>
  result: Record<string, unknown>
  error_message: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

/** Client/server shared flag — video UI must stay off when false. */
export function isVideoGenerationEnabled(
  env: Record<string, string | undefined> = {}
): boolean {
  const v = env.VIDEO_ENABLED
  return v === 'true' || v === '1'
}
