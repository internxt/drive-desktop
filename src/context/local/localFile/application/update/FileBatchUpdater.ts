import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { EnvironmentLocalFileUploader } from '../../infrastructure/EnvironmentLocalFileUploader';
import { simpleFileOverride } from '@/context/virtual-drive/files/application/override/SimpleFileOverrider';
import { BackupsContext } from '@/apps/backups/BackupInfo';

@Service()
export class FileBatchUpdater {
  constructor(private readonly uploader: EnvironmentLocalFileUploader) {}

  async run(context: BackupsContext, remoteTree: RemoteTree, batch: Array<LocalFile>): Promise<void> {
    for (const localFile of batch) {
      const upload = await this.uploader.upload(localFile.absolutePath, localFile.size.value, context.abortController.signal);

      if (upload.isLeft()) {
        throw upload.getLeft();
      }

      const contentsId = upload.getRight();

      if (!contentsId) {
        continue;
      }

      const file = remoteTree.files[localFile.relativePath];

      /**
       * v2.5.3 Daniel Jiménez
       * TODO: Check file can be null or contentsId maybe continue???
       */

      await simpleFileOverride(file, contentsId, localFile.size.value);
    }
  }
}
