import { PartialListing } from '../../sync/Listings/domain/Listing';
import { FileSystem } from '../domain/FileSystem';

export class PullFolderQueueConsumer {
  constructor(private readonly fileSystem: FileSystem<PartialListing>) {}

  async consume(queue: Array<string>): Promise<void> {
    const sortBySubfolderLevel = (pathA: string, pathB: string) =>
      pathA.split('/').length - pathB.split('/').length;

    const sorted = queue.sort(sortBySubfolderLevel);

    const promises = sorted.map(this.fileSystem.pullFolder);

    await Promise.all(promises);
  }
}
