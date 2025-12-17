import { z } from 'zod';

import { PinState } from '@/node-win/types/placeholder.type';

export const addonZod = {
  connectSyncRoot: z.undefined(),
  getPlaceholderState: z.object({
    placeholderId: z.union([z.string().startsWith('FILE:'), z.string().startsWith('FOLDER:')]),
    pinState: z.enum(PinState),
  }),
  getRegisteredSyncRoots: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      displayName: z.string(),
      version: z.string(),
    }),
  ),
};
