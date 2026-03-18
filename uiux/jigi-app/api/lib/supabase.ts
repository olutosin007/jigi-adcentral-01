import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServerEnv } from './env.js'

let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = getServerEnv('SUPABASE_URL')
    const supabaseServiceKey = getServerEnv('SUPABASE_SERVICE_ROLE_KEY')

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}

export async function getAuthenticatedUser(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return { user: null, error: 'Invalid or expired token' }
  }

  return { user, error: null }
}
