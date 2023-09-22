import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { FilesContainer } from './FilesContainer';
import { HttpFileRepository } from '../../modules/files/infrastructure/HttpFileRepository';
import crypt from '../../../utils/crypt';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionUserProvider } from '../common/user';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { FileDeleter } from '../../modules/files/application/FileDeleter';

export async function buildFilesContainer(): Promise<FilesContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const traverser = DependencyInjectionTraverserProvider.get();
  const user = DependencyInjectionUserProvider.get();

  const fileRepository = new HttpFileRepository(
    crypt,
    clients.drive,
    clients.newDrive,
    traverser,
    user.bucket,
    ipcRendererSyncEngine
  );

  await fileRepository.init();

  const fileFinderByContentsId = new FileFinderByContentsId(fileRepository);

  const localRepositoryRefresher = new LocalRepositoryRepositoryRefresher(
    ipcRendererSyncEngine,
    fileRepository
  );

  const fileDeleter = new FileDeleter(
    fileRepository,
    fileFinderByContentsId,
    ipcRendererSyncEngine
  );

  const container: FilesContainer = {
    fileFinderByContentsId,
    localRepositoryRefresher: localRepositoryRefresher,
    fileDeleter,
  };

  return container;
}
