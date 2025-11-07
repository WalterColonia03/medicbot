import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Cliente de Supabase para uso en el servidor con service role key
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default supabaseServer;
