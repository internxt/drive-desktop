import { z } from 'zod';

const itemRowSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  status: z.enum(['EXISTS', 'TRASHED', 'DELETED']),
  plainName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  workspaceId: z.string(),
  userUuid: z.string(),
  creationTime: z.string(),
  modificationTime: z.string(),
});

export const fileRowSchema = itemRowSchema.extend({
  type: z.string(),
  folderUuid: z.string(),
  fileId: z.string(),
  size: z.number(),
  folderId: z.number(),
});

export const folderRowSchema = itemRowSchema.extend({
  parentUuid: z.string(),
  parentId: z.number().nullable(),
});
