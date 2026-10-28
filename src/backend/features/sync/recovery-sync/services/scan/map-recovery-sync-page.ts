import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { z } from 'zod';
import { DriveFile, DriveFolder } from '@/infra/sqlite/schema';

export type RecoverySyncPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type RecoverySyncFile = Omit<DriveFile, 'userUuid' | 'workspaceId'>;
export type RecoverySyncFolder = Omit<DriveFolder, 'userUuid' | 'workspaceId'>;

const itemSchema = z.object({
  id: z.number(),
  uuid: z.string().min(1),
  status: z.enum(['EXISTS', 'TRASHED', 'DELETED']),
  plainName: z.string(),
  createdAt: z.string(),
  updatedAt: z.iso.datetime(),
  creationTime: z.string(),
  modificationTime: z.string(),
});

const fileSchema = itemSchema.extend({
  type: z.string(),
  fileId: z.string(),
  size: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().int().nonnegative()),
  folderId: z.number(),
  folderUuid: z.string(),
});

const folderSchema = itemSchema.extend({
  parentId: z.number().nullable(),
  parentUuid: z.string(),
});

function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), nextCursor: z.string().min(1).nullable() });
}

const filesPageSchema = pageSchema(fileSchema);
const foldersPageSchema = pageSchema(folderSchema);

export function mapRecoverySyncFilesPage({ page }: { page: unknown }): Result<RecoverySyncPage<RecoverySyncFile>, Error> {
  const parsed = filesPageSchema.safeParse(page);
  if (!parsed.success) return Result.err(new Error('Invalid recovery sync files page', { cause: parsed.error }));
  return Result.ok(parsed.data);
}

export function mapRecoverySyncFoldersPage({ page }: { page: unknown }): Result<RecoverySyncPage<RecoverySyncFolder>, Error> {
  const parsed = foldersPageSchema.safeParse(page);
  if (!parsed.success) return Result.err(new Error('Invalid recovery sync folders page', { cause: parsed.error }));
  return Result.ok(parsed.data);
}
