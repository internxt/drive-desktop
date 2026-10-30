import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { z } from 'zod';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { fileRowSchema, folderRowSchema } from '../common/item-row-schemas';
import { SqliteError } from '../common/sqlite-error';
import { parseData as parseFile } from '../file/parse-data';
import { parseData as parseFolder } from '../folder/parse-data';

export type ItemToPreserve<T> = {
  item: T;
  removalStatus: 'TRASHED' | 'DELETED';
};

const removalStatusSchema = z.enum(['TRASHED', 'DELETED']);
const fileToPreserveSchema = fileRowSchema.extend({ removalStatus: removalStatusSchema });
const folderToPreserveSchema = folderRowSchema.extend({ removalStatus: removalStatusSchema });

export function mapFileToPreserve({ row }: { row: unknown }): Result<ItemToPreserve<SimpleDriveFile>, SqliteError> {
  const parsed = fileToPreserveSchema.safeParse(row);
  if (!parsed.success) return Result.err(new SqliteError('INVALID_ROW', parsed.error));

  const { removalStatus, ...data } = parsed.data;
  return Result.ok({ item: parseFile({ data }), removalStatus });
}

export function mapFolderToPreserve({ row }: { row: unknown }): Result<ItemToPreserve<SimpleDriveFolder>, SqliteError> {
  const parsed = folderToPreserveSchema.safeParse(row);
  if (!parsed.success) return Result.err(new SqliteError('INVALID_ROW', parsed.error));

  const { removalStatus, ...data } = parsed.data;
  return Result.ok({ item: parseFolder({ data }), removalStatus });
}
