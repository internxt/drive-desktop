import { z } from 'zod';

import { PinState, SyncState } from '@/node-win/types/placeholder.type';

export const addonZod = {
  addLoggerPath: z.boolean(),
  connectSyncRoot: z.object({ hr: z.literal(0), connectionKey: z.string() }),
  convertToPlaceholder: z.boolean(),
  dehydrateFile: z.boolean(),
  getFileIdentity: z.string(),
  getPlaceholderState: z.object({ pinState: z.nativeEnum(PinState), syncState: z.nativeEnum(SyncState) }),
  getPlaceholderWithStatePending: z.array(z.string()),
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
