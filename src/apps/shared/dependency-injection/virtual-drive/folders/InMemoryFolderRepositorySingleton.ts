/** TODO: DELETE DEAD CODE */
import { InMemoryFolderRepository } from '../../../../../context/virtual-drive/folders/infrastructure/InMemoryFolderRepository';

export class InMemoryFolderRepositorySingleton {
  private static _repo: InMemoryFolderRepository | null = null;

  static get instance(): InMemoryFolderRepository {
    if (!InMemoryFolderRepositorySingleton._repo) {
      InMemoryFolderRepositorySingleton._repo = new InMemoryFolderRepository();
    }

    return InMemoryFolderRepositorySingleton._repo;
  }
}
