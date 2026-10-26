import { z } from 'zod';

/** Keep the sync context's folder root: workspaceId routes API requests and is not a substitute for rootUuid. */
export type RecoveryContext = { readonly rootUuid: string; readonly userUuid: string; readonly workspaceId: string };

export const processSchema = z.object({
  rootUuid: z.string(),
  startedAt: z.iso.datetime(),
  stage: z.enum(['preparing', 'scanning', 'preserving', 'reporting']),
  preservedFileCount: z.number().int().nonnegative(),
});

export const scanSchema = z.object({
  scanId: z.number().int(),
  rootUuid: z.string(),
  userUuid: z.string(),
  workspaceId: z.string(),
  itemType: z.enum(['file', 'folder']),
  checkpoint: z.iso.datetime(),
  preparationAfter: z.string(),
  preparationUpperBound: z.string(),
  stage: z.enum(['preparing', 'scanning', 'completed']),
  updatedAt: z.iso.datetime(),
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
  rootUuid: z.string(),
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
  watcherSettled: z.union([z.literal(0), z.literal(1)]),
});

export type RecoveryScan = z.infer<typeof scanSchema>;
export type RecoveryProcess = z.infer<typeof processSchema>;
export type RecoveryMove = z.infer<typeof moveSchema>;
export type RecoveryDestination = z.infer<typeof destinationSchema>;
export type RecoveryCandidate = Omit<z.infer<typeof candidateSchema>, 'original'> & {
  original: z.infer<typeof fileSchema> | z.infer<typeof folderSchema>;
};
