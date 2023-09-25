import crypt from '../../../utils/crypt';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileFinderByContentsId } from '../../modules/files/application/FileFinderByContentsId';
import { LocalRepositoryRepositoryRefresher } from '../../modules/files/application/LocalRepositoryRepositoryRefresher';
import { HttpFileRepository } from '../../modules/files/infrastructure/HttpFileRepository';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionTraverserProvider } from '../common/traverser';
import { DependencyInjectionUserProvider } from '../common/user';
import { FilesContainer } from './FilesContainer';

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

  const fileByPartialSearcher = new FileByPartialSearcher(fileRepository);

  const container: FilesContainer = {
    fileFinderByContentsId,
    localRepositoryRefresher: localRepositoryRefresher,
    fileDeleter,
    fileByPartialSearcher,
  };

  return container;
}
