import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
