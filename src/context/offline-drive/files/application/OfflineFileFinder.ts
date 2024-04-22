import { Service } from 'diod';
import { OfflineFile, OfflineFileAttributes } from '../domain/OfflineFile';
import { OfflineFileSearcher } from './OfflineFileSearcher';

@Service()
export class OfflineFileFinder {
  constructor(private readonly searcher: OfflineFileSearcher) {}

  async run(partial: Partial<OfflineFileAttributes>): Promise<OfflineFile> {
    const file = await this.searcher.run(partial);

    if (!file) {
      throw new Error('Offline file not founded');
    }

    return file;
  }
}
