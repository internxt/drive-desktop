import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { NotifyMainProcessHydrationFinished } from '../../modules/placeholders/application/NotifyMainProcessHydrationFinished';
import { VirtualDrivePlaceholderCreator } from '../../modules/placeholders/infrastructure/VirtualDrivePlaceholderCreator';
import { DependencyInjectionEventRepository } from '../common/eventRepository';
import { DependencyInjectionVirtualDrive } from '../common/virtualDrive';
import { PlaceholderContainer } from './PlaceholdersContainer';

export function buildPlaceholdersContainer(): PlaceholderContainer {
  const { virtualDrive } = DependencyInjectionVirtualDrive;
  const eventRepository = DependencyInjectionEventRepository.get();

  const placeholderCreator = new VirtualDrivePlaceholderCreator(virtualDrive);

  const notifyMainProcessHydrationFinished =
    new NotifyMainProcessHydrationFinished(
      eventRepository,
      ipcRendererSyncEngine
    );

  return { placeholderCreator, notifyMainProcessHydrationFinished };
}
