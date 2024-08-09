import { InMemoryFileRepository } from '../../../../../context/virtual-drive/files/infrastructure/InMemoryFileRepository';

export class InMemoryFileRepositorySingleton {
  private static _repo: InMemoryFileRepository | null = null;

  static get instance(): InMemoryFileRepository {
    if (!InMemoryFileRepositorySingleton._repo) {
      InMemoryFileRepositorySingleton._repo = new InMemoryFileRepository();
    }

    return InMemoryFileRepositorySingleton._repo;
  }
}
