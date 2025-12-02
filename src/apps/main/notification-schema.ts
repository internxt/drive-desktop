import { INTERNXT_CLIENT } from '@/core/utils/utils';
import { z } from 'zod';

const EVENT = z.object({
  email: z.string(),
  clientId: z.union([z.literal(INTERNXT_CLIENT), z.literal('drive-web')]),
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

const FILE_DTO = z.object({
  id: z.number(),
  uuid: z.string(),
  fileId: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.union([z.string(), z.number()]),
  bucket: z.string(),
  folderId: z.number(),
  folderUuid: z.string(),
  encryptVersion: z.literal('03-aes'),
  userId: z.union([z.string(), z.number()]),
  creationTime: z.iso.datetime(),
  modificationTime: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  plainName: z.string(),
  status: z.enum(['EXISTS', 'TRASHED', 'DELETED']),
});

const FILE_EVENT = EVENT.extend({
  event: z.enum(['FILE_CREATED', 'FILE_UPDATED']),
  payload: FILE_DTO,
});

const FOLDER_EVENT = EVENT.extend({
  event: z.enum(['FOLDER_CREATED', 'FOLDER_UPDATED']),
  payload: z.object({
    id: z.number(),
    uuid: z.string(),
    name: z.string(),
    plainName: z.string(),
  }),
});

export const NOTIFICATION_SCHEMA = z.union([ITEMS_TO_TRASH, FILE_EVENT, FOLDER_EVENT]);
