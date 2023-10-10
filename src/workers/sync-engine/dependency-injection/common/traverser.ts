import { ExistingItemsTraverser } from 'workers/sync-engine/modules/items/application/ExistingItemsTraverser';
import crypt from '../../../utils/crypt';
import { DependencyInjectionUserProvider } from './user';

export class DependencyInjectionTraverserProvider {
  private static traverser: ExistingItemsTraverser;

  static get(): ExistingItemsTraverser {
    if (DependencyInjectionTraverserProvider.traverser) {
      return DependencyInjectionTraverserProvider.traverser;
    }

    const user = DependencyInjectionUserProvider.get();

    const traverser = new ExistingItemsTraverser(crypt, user.root_folder_id);

    DependencyInjectionTraverserProvider.traverser = traverser;

    return traverser;
  }
}
