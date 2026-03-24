import { createClient } from "@supabase/supabase-js";
import { assertSupabaseServerEnv, supabaseServiceRoleKey, supabaseUrl } from "./env.mjs";

assertSupabaseServerEnv();

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
