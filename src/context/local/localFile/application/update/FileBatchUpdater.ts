import { Service } from 'diod';
import { LocalFile } from '../../domain/LocalFile';
import { RemoteTree } from '../../../../virtual-drive/remoteTree/domain/RemoteTree';
import { SimpleFileOverrider } from '../../../../virtual-drive/files/application/override/SimpleFileOverrider';
import { LocalFolder } from '../../../localFolder/domain/LocalFolder';
import { relativeV2 } from '../../../../../apps/backups/utils/relative';
import { EnvironmentLocalFileUploader } from '../../infrastructure/EnvironmentLocalFileUploader';

@Service()
export class FileBatchUpdater {
  constructor(
    private readonly uploader: EnvironmentLocalFileUploader,
    private readonly simpleFileOverrider: SimpleFileOverrider,
  ) {}

  async run(localRoot: LocalFolder, remoteTree: RemoteTree, batch: Array<LocalFile>, signal: AbortSignal): Promise<void> {
    for (const localFile of batch) {
      // eslint-disable-next-line no-await-in-loop
      const upload = await this.uploader.upload(localFile.path, localFile.size, signal);

      if (upload.isLeft()) {
        throw upload.getLeft();
      }

      const contentsId = upload.getRight();

      const remotePath = relativeV2(localRoot.path, localFile.path);

      const file = remoteTree.get(remotePath);

      if (file.isFolder()) {
        throw new Error(`Expected file, found folder on ${file.path}`);
      }

      // eslint-disable-next-line no-await-in-loop
      await this.simpleFileOverrider.run(file, contentsId, localFile.size);
    }
  }
}
