import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const assertSupabaseEnv = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.",
    );
  }
};

assertSupabaseEnv();

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: "eventhub.supabase.auth",
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
