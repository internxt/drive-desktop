import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';
import { simpleFileOverride } from '@/context/virtual-drive/files/application/override/SimpleFileOverrider';
import { BackupsContext } from '@/apps/backups/BackupInfo';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { uploadFile } from '../upload-file';

@Service()
export class FileBatchUpdater {
  constructor(private readonly uploader: EnvironmentFileUploader) {}

  async run(context: BackupsContext, remoteTree: RemoteTree, batch: Array<LocalFile>): Promise<void> {
    for (const localFile of batch) {
      const contentsId = await uploadFile({ context, localFile, uploader: this.uploader });

      if (!contentsId) continue;

      const file = remoteTree.files[localFile.relativePath];

      /**
       * v2.5.3 Daniel Jiménez
       * TODO: Check file can be null or contentsId maybe continue???
       */

      await simpleFileOverride(file, contentsId, localFile.size.value);
    }
  }
}
