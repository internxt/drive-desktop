import 'dotenv/config';
import { z } from 'zod';

const ENV_SCHEMA = z.object({
  ANALYZE: z.union([z.literal('true'), z.literal('false')]),
  BRIDGE_URL: z.string(),
  CRYPTO_KEY: z.string(),
  DESKTOP_HEADER: z.string(),
  DRIVE_URL: z.string(),
  NEW_CRYPTO_KEY: z.string(),
  NODE_ENV: z.union([z.literal('test'), z.literal('development'), z.literal('production')]),
  NOTIFICATIONS_URL: z.string(),
  PAYMENTS_URL: z.string(),
  PORT: z.coerce.number(),
  /* Cleaner */
  APPDATA: z.string(),
  LOCALAPPDATA: z.string(),
  ProgramData: z.string(),
  TEMP: z.string(),
  WINDIR: z.string(),
});

export type TEnv = z.infer<typeof ENV_SCHEMA>;

export function validateProcessEnv() {
  ENV_SCHEMA.parse(process.env);
}
