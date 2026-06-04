import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DASHBOARD_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  JWT_SECRET: z.string().default('dev_secret_change_me'),
  DASHBOARD_USERNAME: z.string().default('admin'),
  DASHBOARD_PASSWORD: z.string().default('admin123'),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  TEST_PROMPT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  TEST_PROMPT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DB_SCHEMA: z.string().default('public'),
  WA_AUTH_DIR: z.string().default('./whatsapp-auth'),
  WA_QR_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000)
});

const parsedEnv = envSchema.parse(process.env);

if (
  parsedEnv.NODE_ENV !== 'test' &&
  (!parsedEnv.SUPABASE_URL || !parsedEnv.SUPABASE_SERVICE_ROLE_KEY)
) {
  throw new Error(
    'SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi untuk menjalankan server di mode non-test.'
  );
}

export const env = parsedEnv;
