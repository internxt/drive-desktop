import { TreePlaceholderCreator } from 'workers/sync-engine/modules/placeholders/application/TreePlaceholderCreator';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { PlaceholderContainer } from './PlaceholdersContainer';
import { VirtualDrivePlaceholderCreator } from 'workers/sync-engine/modules/placeholders/infrastructure/VirtualDrivePlaceholderCreator';
import { ItemsContainer } from '../items/ItemsContainer';

export function buildPlaceholdersContainer(
  itemsContainer: ItemsContainer
): PlaceholderContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const placeholderCreator = new VirtualDrivePlaceholderCreator(virtualDrive);

  const treePlaceholderCreator = new TreePlaceholderCreator(
    itemsContainer.treeBuilder,
    placeholderCreator
  );

  return { placeholderCreator, treePlaceholderCreator };
}
