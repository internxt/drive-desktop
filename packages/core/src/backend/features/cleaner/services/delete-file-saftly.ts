import { unlink } from 'node:fs/promises';

import { logger } from '@/backend/core/logger/logger';
import { FileSystemModule } from '@/backend/infra/file-system/file-system.module';

import { cleanerStore } from '../stores/cleaner.store';

type Props = {
  absolutePath: string;
};

export async function deleteFileSafely({ absolutePath }: Props) {
  try {
    const { size } = await FileSystemModule.statThrow({ absolutePath });

    await unlink(absolutePath);

    cleanerStore.state.deletedFilesCount++;
    cleanerStore.state.totalSpaceGained += size;
  } catch (error) {
    logger.warn({
      tag: 'CLEANER',
      msg: 'Failed to delete file, continuing with next file',
      absolutePath,
      error,
    });
  }
}
