import { InxtFileSystemDependencyContainer } from './InxtFileSystemDependencyContainer';
import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { getClients } from '../../shared/HttpClient/backgroud-process-clients';
import { Environment } from '@internxt/inxt-js';
import { WebdavFileClonner } from './files/application/WebdavFileClonner';
import { FileClonner } from './files/infrastructure/FileClonner';
import { FileDownloader } from './files/infrastructure/FileDownloader';
import { FileUploader } from './files/infrastructure/FileUploader';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';
import { WebdavFileDeleter } from './files/application/WebdavFileDeleter';
import { HttpWebdavFileRepository } from './files/infrastructure/HttpWebdavFileRepository';
import { WebdavFolderCreator } from './folders/application/WebdavFolderCreator';
import { HttpWebdavFolderRepository } from './folders/infrastructure/HttpWebdavFolderRepository';
import crypt from '../utils/crypt';
import { Traverser } from './application/Traverser';
import { WebdavFileExists } from './files/application/WebdavFileExists';
import { TreeRepository } from './TreeRepository';
import { WebdavUnknownItemTypeSearcher } from './shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavFileMover } from './files/application/WebdavFileMover';
import { WebdavFolderMover } from './folders/application/WebdavFolderMover';
import { AllWebdavItemsNameLister } from './shared/application/AllWebdavItemsSearcher';
import { WebdavFolderDeleter } from './folders/application/WebdavFolderDeleter';

let container: InxtFileSystemDependencyContainer | null = null;

export async function buildContainer(): Promise<InxtFileSystemDependencyContainer> {
  if (container) return container;

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

  const traverser = new Traverser(crypt, user.root_folder_id);

  const treeRepository = new TreeRepository(
    clients.drive,
    clients.newDrive,
    user.root_folder_id,
    user.bucket
  );

  const fileRepository = new HttpWebdavFileRepository(
    clients.drive,
    clients.newDrive,
    traverser,
    user.bucket
  );

  const folderRepository = new HttpWebdavFolderRepository(
    clients.drive,
    clients.newDrive,
    traverser
  );

  await fileRepository.init();
  await folderRepository.init();
  await treeRepository.init();

  const clonner = new FileClonner(user.bucket, environment);

  const uploader = new FileUploader(user.bucket, environment);

  const downloader = new FileDownloader(user.bucket, environment);

  const folderFinder = new WebdavFolderFinder(folderRepository);

  container = {
    fileExists: new WebdavFileExists(fileRepository),
    fileClonner: new WebdavFileClonner(fileRepository, folderFinder, clonner),
    fileDeleter: new WebdavFileDeleter(fileRepository),
    fileMover: new WebdavFileMover(fileRepository, folderFinder),

    folderFinder,
    folderCreator: new WebdavFolderCreator(folderRepository, folderFinder),
    folderMover: new WebdavFolderMover(folderRepository, folderFinder),
    folderDeleter: new WebdavFolderDeleter(folderRepository),

    allItemsLister: new AllWebdavItemsNameLister(
      fileRepository,
      folderRepository,
      folderFinder
    ),
    itemSearcher: new WebdavUnknownItemTypeSearcher(
      fileRepository,
      folderRepository
    ),

    reposiotry: treeRepository,
  };

  return container;
}
