import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { LocalFolder } from '../../../localFolder/domain/LocalFolder';
import { relativeV2 } from '../../../../../apps/backups/utils/relative';
import { EnvironmentLocalFileUploader } from '../../infrastructure/EnvironmentLocalFileUploader';
import { simpleFileOverride } from '@/context/virtual-drive/files/application/override/SimpleFileOverrider';
import { RemoteTree } from '@/apps/backups/remote-tree/traverser';

@Service()
export class FileBatchUpdater {
  constructor(private readonly uploader: EnvironmentLocalFileUploader) {}

  async run(localRoot: LocalFolder, remoteTree: RemoteTree, batch: Array<LocalFile>, signal: AbortSignal): Promise<void> {
    for (const localFile of batch) {
      const upload = await this.uploader.upload(localFile.path, localFile.size, signal);

      if (upload.isLeft()) {
        throw upload.getLeft();
      }

      const contentsId = upload.getRight();

      const remotePath = relativeV2(localRoot.path, localFile.path);

      const file = remoteTree.files[remotePath];

      await simpleFileOverride(file, contentsId, localFile.size);
    }
  }
}
