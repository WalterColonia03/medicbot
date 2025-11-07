import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';
import type { Database } from './database.types';

// Cliente de Supabase para uso en el navegador
export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

export default supabase;
