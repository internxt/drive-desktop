import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { z } from 'zod';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SqliteError } from '../common/sqlite-error';
import { parseData as parseFile } from '../file/parse-data';
import { parseData as parseFolder } from '../folder/parse-data';

export type ItemToPreserve<T> = {
  item: T;
  removalStatus: 'TRASHED' | 'DELETED';
};

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
  removalStatus: z.enum(['TRASHED', 'DELETED']),
});

const fileRowSchema = itemRowSchema.extend({
  type: z.string(),
  folderUuid: z.string(),
  fileId: z.string(),
  size: z.number(),
  folderId: z.number(),
});

const folderRowSchema = itemRowSchema.extend({
  parentUuid: z.string(),
  parentId: z.number().nullable(),
});

export function mapFileToPreserve({ row }: { row: unknown }): Result<ItemToPreserve<SimpleDriveFile>, SqliteError> {
  const parsed = fileRowSchema.safeParse(row);
  if (!parsed.success) return Result.err(new SqliteError('INVALID_ROW', parsed.error));

  const { removalStatus, ...data } = parsed.data;
  return Result.ok({ item: parseFile({ data }), removalStatus });
}

export function mapFolderToPreserve({ row }: { row: unknown }): Result<ItemToPreserve<SimpleDriveFolder>, SqliteError> {
  const parsed = folderRowSchema.safeParse(row);
  if (!parsed.success) return Result.err(new SqliteError('INVALID_ROW', parsed.error));

  const { removalStatus, ...data } = parsed.data;
  return Result.ok({ item: parseFolder({ data }), removalStatus });
}
