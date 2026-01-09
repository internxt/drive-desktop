import { z } from 'zod';

import { InSyncState, PinState } from '@/node-win/types/placeholder.type';

export const addonZod = {
  connectSyncRoot: z.bigint(),
  getPlaceholderState: z.object({
    placeholderId: z.union([z.string().startsWith('FILE:'), z.string().startsWith('FOLDER:')]),
    uuid: z.uuid(),
    pinState: z.enum(PinState),
    inSyncState: z.enum(InSyncState),
    onDiskSize: z.number(),
  }),
  watchPath: z.object(),
  getRegisteredSyncRoots: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      displayName: z.string(),
      version: z.string(),
    }),
  ),
};
