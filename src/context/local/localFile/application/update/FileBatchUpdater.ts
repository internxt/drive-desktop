import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { simpleFileOverride } from '@/context/virtual-drive/files/application/override/SimpleFileOverrider';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { uploadFile } from '../upload-file';
import { File } from '@/context/virtual-drive/files/domain/File';
import { logger } from '@/apps/shared/logger/logger';

@Service()
export class FileBatchUpdater {
  constructor(private readonly uploader: EnvironmentFileUploader) {}

  async run(context: BackupsContext, modified: Map<LocalFile, File>): Promise<void> {
    const promises = modified.entries().map(async ([localFile, file]) => {
      try {
        const contentsId = await uploadFile({ context, localFile, uploader: this.uploader });

        if (!contentsId) return;

        await simpleFileOverride(file, contentsId, localFile.size.value);
      } catch (exc) {
        logger.error({
          tag: 'BACKUPS',
          msg: 'Error updating file',
          path: localFile.relativePath,
          exc,
        });
      }
    });

    await Promise.all(promises);
  }
}
