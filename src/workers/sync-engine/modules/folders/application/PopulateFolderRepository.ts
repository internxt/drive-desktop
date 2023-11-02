import { ExistingItemsTraverser } from '../../items/application/ExistingItemsTraverser';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatus } from '../domain/FolderStatus';

export class PopulateFolderRepository {
  constructor(
    private readonly traverser: ExistingItemsTraverser,
    private readonly repository: FolderRepository,
    private readonly userRootFolderId: number
  ) {}

  async run(): Promise<void> {
    const items = await this.traverser.run();

    const folders = Object.values(items).filter((item) =>
      item.isFolder()
    ) as Array<Folder>;

    const addPromises = folders.map((folder) => this.repository.add(folder));

    const rootFolder = Folder.from({
      id: this.userRootFolderId,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
      uuid: 'f58541c6-a8d2-5d5e-923f-c2f91f8169ea',
    });

    await this.repository.add(rootFolder);

    await Promise.all(addPromises);
  }
}
