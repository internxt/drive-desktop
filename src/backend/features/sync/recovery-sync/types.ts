import { z } from 'zod';

export type RecoveryScope = { userUuid: string; workspaceId: string; itemType: 'file' | 'folder' };

export const processSchema = z.object({
  processId: z.string(),
  startedAt: z.iso.datetime(),
  stage: z.enum(['preparing', 'scanning', 'preserving', 'reporting', 'completed']),
  outcome: z.enum(['succeeded', 'failed', 'cancelled']).nullable(),
  outcomeMessage: z.string().nullable(),
  notification: z.enum(['pending', 'claimed', 'delivered']),
  preservedFileCount: z.number().int().nonnegative(),
});

export const scanSchema = z.object({
  scanId: z.number().int(),
  processId: z.string(),
  userUuid: z.string(),
  workspaceId: z.string(),
  itemType: z.enum(['file', 'folder']),
  checkpoint: z.iso.datetime(),
  preparationAfter: z.string(),
  preparationUpperBound: z.string(),
  stage: z.enum(['preparing', 'scanning', 'completed']),
  updatedAt: z.iso.datetime(),
  active: z.union([z.literal(0), z.literal(1)]),
});

const commonItem = {
  id: z.number().int(),
  uuid: z.string(),
  status: z.enum(['EXISTS', 'TRASHED', 'DELETED']),
  plainName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  workspaceId: z.string(),
  userUuid: z.string(),
  creationTime: z.string(),
  modificationTime: z.string(),
};

export const fileSchema = z.object({
  ...commonItem,
  type: z.string(),
  folderUuid: z.string(),
  fileId: z.string(),
  size: z.number(),
  folderId: z.number().int(),
});

export const folderSchema = z.object({ ...commonItem, parentUuid: z.string(), parentId: z.number().int().nullable() });

export const candidateSchema = z.object({
  scanId: z.number().int(),
  uuid: z.string(),
  original: z.string(),
  observed: z.union([z.literal(0), z.literal(1)]),
  removedStatus: z.enum(['TRASHED', 'DELETED']).nullable(),
  removedAt: z.string().nullable(),
});

export const destinationSchema = z.object({
  processId: z.string(),
  volume: z.string(),
  path: z.string(),
  created: z.union([z.literal(0), z.literal(1)]),
});

export const moveSchema = z.object({
  moveId: z.number().int(),
  scanId: z.number().int(),
  uuid: z.string(),
  volume: z.string(),
  source: z.string(),
  destination: z.string(),
  expected: z.string(),
  removalStatus: z.enum(['TRASHED', 'DELETED']),
  stage: z.enum(['pending', 'moved', 'completed', 'conflict']),
  preservedFileCount: z.number().int().nonnegative().nullable(),
});

export type RecoveryScan = z.infer<typeof scanSchema>;
export type RecoveryProcess = z.infer<typeof processSchema>;
export type RecoveryMove = z.infer<typeof moveSchema>;
