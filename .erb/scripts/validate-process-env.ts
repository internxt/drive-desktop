import 'dotenv/config';
import { z } from 'zod';

const ENV_SCHEMA = z.object({
  ANALYZE: z.union([z.literal('true'), z.literal('false')]),
  BRIDGE_URL: z.url(),
  DESKTOP_HEADER: z.string().min(1),
  DRIVE_URL: z.url(),
  NEW_CRYPTO_KEY: z.string().min(1),
  NODE_ENV: z.union([z.literal('test'), z.literal('development'), z.literal('production')]),
  NOTIFICATIONS_URL: z.url(),
  PAYMENTS_URL: z.url(),
  PORT: z.coerce.number(),
  /* Cleaner */
  APPDATA: z.string().min(1),
  LOCALAPPDATA: z.string().min(1),
  ProgramData: z.string().min(1),
  TEMP: z.string().min(1),
  WINDIR: z.string().min(1),
  /* E2E Testing */
  E2E_TEST: z.union([z.literal('true'), z.literal('false')]).optional(),
  E2E_TEST_USER: z.string().min(1).optional(),
  E2E_TEST_PASSWORD: z.string().min(1).optional(),
  E2E_HOME_PATH: z.string().min(1).optional(),
  E2E_APPDATA_PATH: z.string().min(1).optional(),
});

export type TEnv = z.infer<typeof ENV_SCHEMA>;

export function validateProcessEnv() {
  ENV_SCHEMA.parse(process.env);
}
