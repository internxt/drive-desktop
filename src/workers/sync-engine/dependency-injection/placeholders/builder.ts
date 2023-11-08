import { VirtualDrivePlaceholderCreator } from '../../modules/placeholders/infrastructure/VirtualDrivePlaceholderCreator';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { PlaceholderContainer } from './PlaceholdersContainer';

export function buildPlaceholdersContainer(): PlaceholderContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;

  const placeholderCreator = new VirtualDrivePlaceholderCreator(virtualDrive);

  return { placeholderCreator };
}
