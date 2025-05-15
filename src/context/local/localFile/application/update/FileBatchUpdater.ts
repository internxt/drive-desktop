import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { RemoteTree } from '../../../../../apps/backups/remote-tree/domain/RemoteTree';
import { EnvironmentLocalFileUploader } from '../../infrastructure/EnvironmentLocalFileUploader';
import { simpleFileOverride } from '@/context/virtual-drive/files/application/override/SimpleFileOverrider';
import { BackupsContext } from '@/apps/backups/BackupInfo';

@Service()
export class FileBatchUpdater {
  constructor(private readonly uploader: EnvironmentLocalFileUploader) {}

  async run(context: BackupsContext, remoteTree: RemoteTree, batch: Array<LocalFile>): Promise<void> {
    for (const localFile of batch) {
      const upload = await this.uploader.upload(localFile.path, localFile.size, context.abortController.signal);

      if (upload.isLeft()) {
        throw upload.getLeft();
      }

      const contentsId = upload.getRight();

      if (!contentsId) {
        return;
      }

      const file = remoteTree.get(localFile.relativePath);

      if (file.isFolder()) {
        throw new Error(`Expected file, found folder on ${file.path}`);
      }

      await simpleFileOverride(file, contentsId, localFile.size);
    }
  }
}
