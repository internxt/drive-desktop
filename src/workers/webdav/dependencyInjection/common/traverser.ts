import { Traverser } from 'workers/webdav/modules/items/application/Traverser';
import crypt from '../../../utils/crypt';
import { DepenedencyInjectionUserProvider } from './user';

export class DependencyInjectionTraverserProvider {
  private static traverser: Traverser;

  static get(): Traverser {
    if (DependencyInjectionTraverserProvider.traverser) {
      return DependencyInjectionTraverserProvider.traverser;
    }

    const user = DepenedencyInjectionUserProvider.get();

    const traverser = new Traverser(crypt, user.root_folder_id);

    DependencyInjectionTraverserProvider.traverser = traverser;

    return traverser;
  }
}
