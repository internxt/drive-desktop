import { z } from 'zod';

const EVENT = z.object({
  email: z.string(),
  clientId: z.union([z.literal('drive-desktop'), z.literal('drive-web')]),
  userId: z.string(),
});

const ITEMS_TO_TRASH = EVENT.extend({
  event: z.literal('ITEMS_TO_TRASH'),
  payload: z.array(
    z.object({
      type: z.union([z.literal('file'), z.literal('folder')]),
      uuid: z.string(),
    }),
  ),
});

export type ItemsToTrashEvent = z.infer<typeof ITEMS_TO_TRASH>;

const FILE_CREATED = EVENT.extend({
  event: z.literal('FILE_CREATED'),
  payload: z.object({
    id: z.number(),
    uuid: z.string(),
    fileId: z.string(),
    name: z.string(),
    type: z.string(),
    bucket: z.string(),
    folderId: z.number(),
    status: z.literal('EXISTS'),
  }),
});

const FOLDER_CREATED = EVENT.extend({
  event: z.literal('FOLDER_CREATED'),
  payload: z.object({
    id: z.number(),
    uuid: z.string(),
    name: z.string(),
    plainName: z.string(),
  }),
});

export const FOLDER_DELETED = EVENT.extend({
  event: z.literal('FOLDER_DELETED'),
})

export const NOTIFICATION_SCHEMA = z.union([ITEMS_TO_TRASH, FILE_CREATED, FOLDER_CREATED]);
export type NotificationSchema = z.infer<typeof NOTIFICATION_SCHEMA>;