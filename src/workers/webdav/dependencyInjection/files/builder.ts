import { FileFinderByContentsId } from 'workers/webdav/modules/files/application/FileFinderByContentsId';
import { FilesContainer } from './FilesContainer';
import { HttpFileRepository } from 'workers/webdav/modules/files/infrastructure/HttpFileRepository';
import crypt from '../../../utils/crypt';
import { DependencyInjectionHttpClientsProvider } from '../common/clients';
import { DependencyInjectionUserProvider } from '../common/user';
import { ipc } from '../../ipc';
import { DependencyInjectionTraverserProvider } from '../common/traverser';

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
    ipc
  );

  await fileRepository.init();

  const fileFinderByContentsId = new FileFinderByContentsId(fileRepository);

  return {
    fileFinderByContentsId,
  };
}
