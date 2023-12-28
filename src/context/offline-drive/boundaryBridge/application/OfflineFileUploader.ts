import { OfflineContentsUploader } from '../../contents/application/OfflineContentsUploader';
import { OfflineFilePathRetriever } from './OfflineFilePathRetriever';

export class OfflineFileUploader {
  constructor(
    private readonly offlineFilePathRetriever: OfflineFilePathRetriever,
    private readonly contentsUploader: OfflineContentsUploader
  ) {}

  async run(path: string): Promise<void> {
    const absolutePath = await this.offlineFilePathRetriever.run(path);

    await this.contentsUploader.run(absolutePath);
  }
}
