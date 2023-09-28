import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { PlaceholderContainer } from './PlaceholdersContainer';
import { VirtualDrivePlaceholderCreator } from 'workers/sync-engine/modules/placeholders/infrastructure/VirtualDrivePlaceholderCreator';

export function buildPlaceholdersContainer(): PlaceholderContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const placeholderCreator = new VirtualDrivePlaceholderCreator(virtualDrive);

  return { placeholderCreator };
}
