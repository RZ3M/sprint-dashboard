// utils/supabase/admin.ts — for privileged server-only operations (bypasses RLS)
import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
