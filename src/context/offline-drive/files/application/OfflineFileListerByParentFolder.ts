import { dirname } from 'path';
import { OfflineFile } from '../domain/OfflineFile';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class OfflineFilesByParentPathLister {
  constructor(private readonly repository: OfflineFileRepository) {}

  async run(path: string): Promise<Array<OfflineFile>> {
    const parentPath = dirname(path);

    const all = await this.repository.all();

    return all.filter((file) => file.path.dirname() === parentPath);
  }
}
