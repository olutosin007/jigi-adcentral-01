import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Single-flight wrapper around `supabase.auth.getSession()`.
 *
 * Without this, `initialize()` and `api-client.getAuthToken()` can call `getSession()` at the
 * same time (e.g. React Strict Mode + user hits Generate before hydration settles). GoTrue then
 * competes for the same storage lock and logs "Lock ... was not released within 5000ms".
 */
let inFlight: Promise<{ session: Session | null; error: Error | null }> | null = null

export function getSupabaseSessionSingleFlight(): Promise<{
  session: Session | null
  error: Error | null
}> {
  if (!inFlight) {
    inFlight = supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => ({
        session: session ?? null,
        error: error ?? null,
      }))
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}
