import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileSyncronizer: FileSyncronizer
  ) {}

  run(absolutePaths: string[]): Promise<void[]> {
    return Promise.all(
      absolutePaths.map(async (absolutePath) => {
        await this.fileSyncronizer.run(
          absolutePath,
          this.contentsUploader.run.bind(this.contentsUploader)
        );
      })
    );
  }
}
