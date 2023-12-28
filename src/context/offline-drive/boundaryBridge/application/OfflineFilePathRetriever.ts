import { OfflineContentsPathCalculator } from '../../contents/application/OfflineContentsPathCalculator';
import { OfflineFileFinder } from '../../files/application/OfflineFileFinder';

export class OfflineFilePathRetriever {
  constructor(
    private readonly finder: OfflineFileFinder,
    private readonly pathCalculator: OfflineContentsPathCalculator
  ) {}

  async run(path: string): Promise<string> {
    const file = await this.finder.run({ path });

    return await this.pathCalculator.run(file.id);
  }
}
