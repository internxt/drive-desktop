import { Service } from 'diod';
import { OfflineContentsCreator } from '../../contents/application/OfflineContentsCreator';
import { OfflineFileCreator } from '../../files/application/OfflineFileCreator';

@Service()
export class OfflineFileAndContentsCreator {
  constructor(
    private readonly offlineFileCreator: OfflineFileCreator,
    private readonly offlineContentsCreator: OfflineContentsCreator
  ) {}

  async run(path: string): Promise<void> {
    const file = await this.offlineFileCreator.run(path);

    await this.offlineContentsCreator.run(file.id);
  }
}
