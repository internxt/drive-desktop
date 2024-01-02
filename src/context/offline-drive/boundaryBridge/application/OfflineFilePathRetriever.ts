import { OfflineContentsPathCalculator } from '../../contents/application/OfflineContentsPathCalculator';
import { OfflineFile } from '../../files/domain/OfflineFile';

export class OfflineFilePathRetriever {
  constructor(private readonly pathCalculator: OfflineContentsPathCalculator) {}

  async run(file: OfflineFile): Promise<string> {
    return await this.pathCalculator.run(file.id);
  }
}
