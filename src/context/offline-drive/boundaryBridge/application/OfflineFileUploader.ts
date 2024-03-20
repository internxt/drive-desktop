import { FuseIOError } from '../../../../apps/fuse/callbacks/FuseErrors';
import { OfflineContentsUploader } from '../../contents/application/OfflineContentsUploader';
import { OfflineFileSearcher } from '../../files/application/OfflineFileSearcher';

export class OfflineFileUploader {
  constructor(
    private readonly offlineFileSearcher: OfflineFileSearcher,
    private readonly offlineContentsUploader: OfflineContentsUploader
  ) {}

  async run(path: string): Promise<Error | undefined> {
    const offlineFile = await this.offlineFileSearcher.run({ path });

    if (!offlineFile) {
      return;
    }

    try {
      await this.offlineContentsUploader.run(offlineFile.id, offlineFile.path);
      return undefined;
    } catch (err: unknown) {
      if (err instanceof Error) {
        return err;
      }

      return new FuseIOError();
    }
  }
}
