import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabaseAdmin =
  env.NODE_ENV === 'test'
    ? null
    : createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: env.SUPABASE_DB_SCHEMA
        }
      });
