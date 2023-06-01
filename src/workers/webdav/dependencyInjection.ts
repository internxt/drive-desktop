import { InxtFileSystemDependencyContainer } from './InxtFileSystemDependencyContainer';
import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { getClients } from '../../shared/HttpClient/backgroud-process-clients';
import { Environment } from '@internxt/inxt-js';
import { WebdavFileClonner } from './files/application/WebdavFileClonner';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';
import { WebdavFileDeleter } from './files/application/WebdavFileDeleter';
import { HttpWebdavFileRepository } from './files/infrastructure/persistance/HttpWebdavFileRepository';
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
import { InMemoryTemporalFileMetadataCollection } from './files/infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { EnvironmentFileContentRepository } from './files/infrastructure/storage/EnvironmentFileContentRepository';
import { WebdavFileCreator } from './files/application/WebdavFileCreator';
import { WebdavFileDownloader } from './files/application/WebdavFileDownloader';
import { WebdavUnkownItemMetadataDealer } from './shared/application/WebdavUnkownItemMetadataDealer';
import { WebdavFileMimeTypeResolver } from './files/application/WebdavFileMimeTypeResolver';

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

  const fileContentRepository = new EnvironmentFileContentRepository(
    environment,
    user.bucket
  );

  const folderFinder = new WebdavFolderFinder(folderRepository);

  const temporalFileCollection = new InMemoryTemporalFileMetadataCollection();

  const unknownItemSearcher = new WebdavUnknownItemTypeSearcher(
      fileRepository,
      folderRepository
    ),
    container = {
      fileExists: new WebdavFileExists(fileRepository),
      fileClonner: new WebdavFileClonner(
        fileRepository,
        folderFinder,
        fileContentRepository
      ),
      fileDeleter: new WebdavFileDeleter(fileRepository),
      fileMover: new WebdavFileMover(fileRepository, folderFinder),
      fileCreator: new WebdavFileCreator(
        fileRepository,
        folderFinder,
        fileContentRepository,
        temporalFileCollection
      ),
      fileDonwloader: new WebdavFileDownloader(
        fileRepository,
        fileContentRepository
      ),
      fileMimeTypeResolver: new WebdavFileMimeTypeResolver(),

      folderFinder,
      folderCreator: new WebdavFolderCreator(folderRepository, folderFinder),
      folderMover: new WebdavFolderMover(folderRepository, folderFinder),
      folderDeleter: new WebdavFolderDeleter(folderRepository),

      itemMetadataDealer: new WebdavUnkownItemMetadataDealer(
        unknownItemSearcher,
        temporalFileCollection
      ),
      allItemsLister: new AllWebdavItemsNameLister(
        fileRepository,
        folderRepository,
        folderFinder
      ),
      itemSearcher: unknownItemSearcher,

      reposiotry: treeRepository,
    };

  return container;
}
