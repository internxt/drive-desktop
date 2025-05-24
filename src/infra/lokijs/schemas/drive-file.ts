import { z } from 'zod';

export const DriveFileSchema = z.object({
  fileId: z.string(),
  id: z.number(),
  uuid: z.string().uuid(),
  workspaceId: z.string(),
  type: z.string().optional().default(''),
  size: z.number(),
  bucket: z.string(),
  folderId: z.number(),
  folderUuid: z.string().optional(),
  userId: z.number(),
  userUuid: z.string(),
  modificationTime: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  plainName: z.string(),
  name: z.string(),
  status: z.union([z.literal('EXISTS'), z.literal('TRASHED'), z.literal('DELETED')]),
  isDangledStatus: z.boolean().default(true),
});

export type DriveFile = z.infer<typeof DriveFileSchema>;
