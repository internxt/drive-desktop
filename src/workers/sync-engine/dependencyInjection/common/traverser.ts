import { Traverser } from 'workers/sync-engine/modules/items/application/Traverser';
import crypt from '../../../utils/crypt';
import { DependencyInjectionUserProvider } from './user';

export class DependencyInjectionTraverserProvider {
  private static traverser: Traverser;

  static get(): Traverser {
    if (DependencyInjectionTraverserProvider.traverser) {
      return DependencyInjectionTraverserProvider.traverser;
    }

    const user = DependencyInjectionUserProvider.get();

    const traverser = new Traverser(crypt, user.root_folder_id);

    DependencyInjectionTraverserProvider.traverser = traverser;

    return traverser;
  }
}
