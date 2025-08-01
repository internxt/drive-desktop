import { z } from 'zod';

import { PinState } from '@/node-win/types/placeholder.type';

export const addonZod = {
  addLoggerPath: z.boolean(),
  connectSyncRoot: z.object({ hr: z.literal(0), connectionKey: z.string() }),
  convertToPlaceholder: z.object({ success: z.boolean(), errorMessage: z.string().optional() }),
  createEntry: z.object({ success: z.boolean(), errorMessage: z.string().optional() }),
  createPlaceholderFile: z.object({ success: z.boolean(), errorMessage: z.string().optional() }),
  dehydrateFile: z.boolean(),
  getFileIdentity: z.union([z.literal(''), z.string().startsWith('FILE:'), z.string().startsWith('FOLDER:')]),
  getPlaceholderState: z.object({ pinState: z.nativeEnum(PinState) }),
  hydrateFile: z.undefined(),
  registerSyncRoot: z.literal(0),
  updateSyncStatus: z.boolean(),
  unregisterSyncRoot: z.number(),
  getRegisteredSyncRoots: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      displayName: z.string(),
      version: z.string(),
    }),
  ),
};
