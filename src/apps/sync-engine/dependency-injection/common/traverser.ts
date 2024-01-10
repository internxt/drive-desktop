import crypt from '../../../../context/shared/infrastructure/crypt';
import { Traverser } from '../../../../context/virtual-drive/items/application/Traverser';
import { DependencyInjectionUserProvider } from './user';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';

export class DependencyInjectionTraverserProvider {
  private static traverser: Traverser;

  static get(): Traverser {
    if (DependencyInjectionTraverserProvider.traverser) {
      return DependencyInjectionTraverserProvider.traverser;
    }

    const user = DependencyInjectionUserProvider.get();

    const traverser = Traverser.existingItems(
      crypt,
      ipcRendererSyncEngine,
      user.root_folder_id
    );

    DependencyInjectionTraverserProvider.traverser = traverser;

    return traverser;
  }
}
