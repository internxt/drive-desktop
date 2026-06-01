import { Stats } from 'node:fs';
import { AbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';

export type ExtendedDirent = { path: AbsolutePath; stats: Stats };
export type ProcessedDirents = {
  files: Array<ExtendedDirent>;
  folders: Array<ExtendedDirent>;
  skippedItems: Array<{ path: AbsolutePath; error: DriveDesktopError }>;
};
