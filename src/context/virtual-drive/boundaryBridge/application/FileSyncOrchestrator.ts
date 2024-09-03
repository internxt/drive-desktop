import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileSyncronizer: FileSyncronizer
  ) {}

  async run(absolutePaths: string[]): Promise<void> {
    for (const absolutePath of absolutePaths) {
      try {
        await this.fileSyncronizer.run(
          absolutePath,
          this.contentsUploader.run.bind(this.contentsUploader)
        );
      } catch (error) {
        console.error(error);
      }
    }
  }
}
