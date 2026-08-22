import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const supabaseAuth = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
