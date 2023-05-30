import { InxtFileSystemDependencyContainer } from './InxtFileSystemDependencyContainer';
import { TreeRepository } from './TreeRepository';
import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { getClients } from '../../shared/HttpClient/backgroud-process-clients';
import { Environment } from '@internxt/inxt-js';
import { WebdavFileRepository } from './files/domain/WebdavFileRepository';
import { WebdavFolderRepository } from './folders/domain/WebdavFolderRepository';
import { WebdavFileClonner } from './files/application/WebdavFileClonner';
import { FileClonner } from './files/infrastructure/FileClonner';
import { FileDownloader } from './files/infrastructure/FileDownloader';
import { FileUploader } from './files/infrastructure/FileUploader';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';
import { InMemoryWebdavFileDeletionQueue } from './files/infrastructure/InMemoryWebdavFileDeletionQueue';
import { WebdavFileDeleter } from './files/application/WebdavFileDeleter';
import { HttpWebdavFileRepository } from './files/infrastructure/HttpWebdavFileRepository';

export async function buildContainer(): Promise<InxtFileSystemDependencyContainer> {
  const clients = getClients();
  const user = getUser();
  const mnemonic = configStore.get('mnemonic');

  if (!user) {
    throw new Error('');
  }

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  const repository = new TreeRepository(
    clients.drive,
    clients.newDrive,
    user?.root_folder_id as number,
    user.bucket
  );

  const fileRepository = new HttpWebdavFileRepository(
    clients.drive,
    clients.newDrive,
    user.root_folder_id,
    user.bucket
  );

  await fileRepository.init();

  const folderRepository = {
    search: repository.searchItem.bind(repository),
    delete: repository.deleteFile.bind(repository),
    updateName: repository.updateName.bind(repository),
    updateParentDir: repository.updateParentDir.bind(repository),
  } as unknown as WebdavFolderRepository;

  const clonner = new FileClonner(user.bucket, environment);

  const uploader = new FileUploader(user.bucket, environment);

  const downloader = new FileDownloader(user.bucket, environment);

  const folderFinder = new WebdavFolderFinder(folderRepository);

  return {
    fileClonner: new WebdavFileClonner(fileRepository, folderFinder, clonner),
    fileDeleter: new WebdavFileDeleter(fileRepository),
    folderFinder: folderFinder,
  };
}
