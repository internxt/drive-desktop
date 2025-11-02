import { z } from 'zod';

import { PinState } from '@/node-win/types/placeholder.type';

export const addonZod = {
  connectSyncRoot: z.object({ hr: z.literal(0), connectionKey: z.string() }),
  convertToPlaceholder: z.undefined(),
  createFolderPlaceholder: z.undefined(),
  createFilePlaceholder: z.undefined(),
  dehydrateFile: z.undefined(),
  disconnectSyncRoot: z.undefined(),
  getPlaceholderState: z.object({
    placeholderId: z.union([z.string().startsWith('FILE:'), z.string().startsWith('FOLDER:')]),
    pinState: z.nativeEnum(PinState),
  }),
  hydrateFile: z.undefined(),
  registerSyncRoot: z.undefined(),
  updateSyncStatus: z.undefined(),
  unregisterSyncRoot: z.undefined(),
  getRegisteredSyncRoots: z.array(
    z.object({
      id: z.string(),
      path: z.string(),
      displayName: z.string(),
      version: z.string(),
    }),
  ),
};
