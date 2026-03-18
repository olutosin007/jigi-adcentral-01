import type { SupabaseClient } from '@supabase/supabase-js'

let contractCheckPromise: Promise<void> | null = null

const REQUIRED_MIGRATION_PATHS = [
  'uiux/jigi-app/supabase/migrations (001-014)',
  'supabase/migrations (015-016)',
]

function isMissingColumnError(message: string, table: string, column: string): boolean {
  return message.includes(column) && message.includes(table)
}

function buildContractError(detail: string): Error {
  return new Error(
    `Database schema contract check failed: ${detail}. ` +
      `Ensure migrations are applied from both locations: ${REQUIRED_MIGRATION_PATHS.join(' and ')}.`
  )
}

async function assertColumnPresence(
  supabaseAdmin: SupabaseClient,
  table: string,
  selectClause: string,
  missingHint: string
) {
  const { error } = await supabaseAdmin
    .from(table)
    .select(selectClause)
    .limit(1)

  if (!error) return

  const message = error.message || ''
  if (missingHint.split(',').some((column) => isMissingColumnError(message, table, column.trim()))) {
    throw buildContractError(`Missing expected column(s) on "${table}": ${missingHint}`)
  }

  throw buildContractError(`Could not validate "${table}" (${message})`)
}

async function assertTablePresence(supabaseAdmin: SupabaseClient, table: string) {
  const { error } = await supabaseAdmin.from(table).select('id').limit(1)

  if (!error) return

  const message = error.message || ''
  if (message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('not found')) {
    throw buildContractError(`Missing expected table "${table}"`)
  }

  throw buildContractError(`Could not validate "${table}" (${message})`)
}

export async function ensureDatabaseContract(supabaseAdmin: SupabaseClient): Promise<void> {
  if (!contractCheckPromise) {
    contractCheckPromise = (async () => {
      await assertColumnPresence(
        supabaseAdmin,
        'campaigns',
        'id,generation_mode',
        'generation_mode'
      )
      await assertColumnPresence(
        supabaseAdmin,
        'generation_log',
        'id,image_provider,image_tier,routing_reason,cost_bucket',
        'image_provider, image_tier, routing_reason, cost_bucket'
      )
      await assertTablePresence(supabaseAdmin, 'image_routing_events')
    })().catch((error) => {
      contractCheckPromise = null
      throw error
    })
  }

  return contractCheckPromise
}

