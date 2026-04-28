import { createClient } from "@supabase/supabase-js";

const readEnvValue = (...keys) => {
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const getSupabasePublicConfig = () => ({
  url: readEnvValue("VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
  publishableKey: readEnvValue(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ),
});

export const isSupabaseConfigured = () => {
  const { url, publishableKey } = getSupabasePublicConfig();
  return Boolean(url && publishableKey);
};

let supabaseClient = null;

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, publishableKey } = getSupabasePublicConfig();
  if (!url || !publishableKey) {
    return null;
  }

  supabaseClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
};

export default getSupabaseClient;
