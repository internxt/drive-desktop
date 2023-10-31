import { ExistingItemsTraverser } from 'workers/sync-engine/modules/items/application/ExistingItemsTraverser';
import crypt from '../../../utils/crypt';
import { DependencyInjectionUserProvider } from './user';
import { IpcRemoteItemsRepository } from 'workers/sync-engine/modules/items/infrastructure/IpcRemoteItemsRepository';

export class DependencyInjectionExistingItemsTraverser {
  private static traverser: ExistingItemsTraverser;

  static get(
    remoteItemsRepository: IpcRemoteItemsRepository
  ): ExistingItemsTraverser {
    if (DependencyInjectionExistingItemsTraverser.traverser) {
      return DependencyInjectionExistingItemsTraverser.traverser;
    }

    const user = DependencyInjectionUserProvider.get();

    const traverser = new ExistingItemsTraverser(
      crypt,
      user.root_folder_id,
      remoteItemsRepository
    );

    DependencyInjectionExistingItemsTraverser.traverser = traverser;

    return traverser;
  }
}
