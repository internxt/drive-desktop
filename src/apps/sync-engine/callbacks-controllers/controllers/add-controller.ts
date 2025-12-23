import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '../../config';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { FileCreator } from '@/context/virtual-drive/files/application/FileCreator';
import { addSyncIssue } from '@/apps/main/background-processes/issues';

export class AddController {
  static async createFile({ ctx, path, stats }: { ctx: ProcessSyncContext; path: AbsolutePath; stats: Stats }) {
    ctx.logger.debug({ msg: 'Create file', path });

    const { size } = stats;

    if (size === 0) {
      ctx.logger.warn({ msg: 'File is empty', path });
      return;
    }

    if (size > SyncModule.MAX_FILE_SIZE) {
      ctx.logger.warn({ msg: 'File size is too big', path, size });
      addSyncIssue({ error: 'FILE_SIZE_TOO_BIG', name: path });
      return;
    }

    const tempFile = isTemporaryFile({ path });

    if (tempFile) {
      ctx.logger.debug({ msg: 'File is temporary, skipping', path });
      return;
    }

    await FileCreator.run({ ctx, path, size });
  }
}
