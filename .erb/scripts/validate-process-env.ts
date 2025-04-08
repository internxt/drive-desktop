import 'dotenv/config';
import { z } from 'zod';

const ENV_SCHEMA = z.object({
  ANALYZE: z.union([z.literal('true'), z.literal('false')]),
  BRIDGE_URL: z.string(),
  BUG_REPORTING_URL: z.string(),
  CRYPTO_KEY: z.string(),
  NEW_CRYPTO_KEY: z.string(),
  NEW_DRIVE_URL: z.string(),
  DRIVE_URL: z.string(),
  NODE_ENV: z.union([z.literal('development'), z.literal('production')]),
  NOTIFICATIONS_URL: z.string(),
  PAYMENTS_URL: z.string(),
  PORT: z.coerce.number(),
  ROOT_FOLDER_NAME: z.string(),
  SENTRY_DSN: z.string(),
  USE_LOCAL_NODE_WIN: z.union([z.literal('true'), z.literal('false')]),
  DESKTOP_HEADER: z.string(),
});

export type TEnv = z.infer<typeof ENV_SCHEMA>;

export function validateProcessEnv() {
  ENV_SCHEMA.parse(process.env);
}
