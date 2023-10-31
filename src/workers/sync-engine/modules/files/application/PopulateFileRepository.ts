import { FileRepository } from '../domain/FileRepository';
import { ExistingItemsTraverser } from '../../items/application/ExistingItemsTraverser';
import { File } from '../domain/File';

export class PopulateFileRepository {
  constructor(
    private readonly traverser: ExistingItemsTraverser,
    private readonly repository: FileRepository
  ) {}

  async run(): Promise<void> {
    const items = await this.traverser.run();

    const files = Object.values(items).filter((item) =>
      item.isFile()
    ) as Array<File>;

    const addPromises = files.map((file: File) => this.repository.add(file));

    await Promise.all(addPromises);
  }
}
