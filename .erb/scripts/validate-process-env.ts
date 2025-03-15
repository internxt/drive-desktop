import 'dotenv/config';
import { z } from 'zod';

const ENV_SCHEMA = z.object({
  ANALYZE: z.union([z.literal('true'), z.literal('false')]),
  API_URL: z.string(),
  BRIDGE_URL: z.string(),
  BUG_REPORTING_URL: z.string(),
  CRYPTO_KEY: z.string(),
  NEW_CRYPTO_KEY: z.string(),
  NEW_DRIVE_URL: z.string(),
  NODE_ENV: z.union([z.literal('development'), z.literal('production')]),
  NOTIFICATIONS_URL: z.string(),
  PAYMENTS_URL: z.string(),
  PORT: z.coerce.number(),
  PROVIDER_ID: z.string().default('E9D7EB38-B229-5DC5-9396-017C449D59CD'),
  ROOT_FOLDER_NAME: z.string().default('InternxtDrive'),
  SENTRY_DSN: z.string(),
});

export function validateProcessEnv() {
  ENV_SCHEMA.parse(process.env);
}
