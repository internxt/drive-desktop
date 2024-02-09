import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileSyncronizer: FileSyncronizer
  ) {}

  async run(absolutePaths: string[]): Promise<void[]> {
    const promises = absolutePaths.map(
      async (absolutePath) =>
        await this.fileSyncronizer.run(
          absolutePath,
          this.contentsUploader.run.bind(this.contentsUploader)
        )
    );
    return Promise.all(promises);
  }
}
