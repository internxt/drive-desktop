import { Environment } from '@internxt/inxt-js';
import { getUser } from 'main/auth/service';
import configStore from 'main/config';
import { getClients } from 'shared/HttpClient/backgroud-process-clients';
import crypt from '../../utils/crypt';
import { WebdavFileClonner } from '../modules/files/application/WebdavFileClonner';
import { WebdavFileCreator } from '../modules/files/application/WebdavFileCreator';
import { WebdavFileDeleter } from '../modules/files/application/WebdavFileDeleter';
import { WebdavFileDownloader } from '../modules/files/application/WebdavFileDownloader';
import { WebdavFileExists } from '../modules/files/application/WebdavFileExists';
import { WebdavFileMimeTypeResolver } from '../modules/files/application/WebdavFileMimeTypeResolver';
import { WebdavFileMover } from '../modules/files/application/WebdavFileMover';
import { HttpWebdavFileRepository } from '../modules/files/infrastructure/persistance/HttpWebdavFileRepository';
import { InMemoryTemporalFileMetadataCollection } from '../modules/files/infrastructure/persistance/InMemoryTemporalFileMetadataCollection';
import { EnvironmentFileContentRepository } from '../modules/files/infrastructure/storage/EnvironmentFileContentRepository';
import { WebdavFolderCreator } from '../modules/folders/application/WebdavFolderCreator';
import { WebdavFolderDeleter } from '../modules/folders/application/WebdavFolderDeleter';
import { WebdavFolderFinder } from '../modules/folders/application/WebdavFolderFinder';
import { WebdavFolderMover } from '../modules/folders/application/WebdavFolderMover';
import { HttpWebdavFolderRepository } from '../modules/folders/infrastructure/HttpWebdavFolderRepository';
import { Traverser } from '../modules/items/application/Traverser';
import { AllWebdavItemsNameLister } from '../modules/shared/application/AllWebdavItemsSearcher';
import { WebdavUnknownItemTypeSearcher } from '../modules/shared/application/WebdavUnknownItemTypeSearcher';
import { WebdavUnkownItemMetadataDealer } from '../modules/shared/application/WebdavUnkownItemMetadataDealer';
import { InternxtFileSystemDependencyContainer } from '../worker/InternxtFileSystem/InternxtFileSystemDependencyContainer';
import { DependencyContainerFactory } from './DependencyContainerFactory';
import { sharedDepenciesContainerFactory } from './SharedDepenciesContainerFactory';

class FileSystemDependencyContainerFactory extends DependencyContainerFactory<InternxtFileSystemDependencyContainer> {
  async create(): Promise<InternxtFileSystemDependencyContainer> {
    const shared = await sharedDepenciesContainerFactory.build();

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

    const fileRepository = new HttpWebdavFileRepository(
      shared.drive,
      shared.newDrive,
      traverser,
      user.bucket
    );

    const folderRepository = new HttpWebdavFolderRepository(
      shared.drive,
      shared.newDrive,
      traverser
    );

    await fileRepository.init();
    await folderRepository.init();

    const fileContentRepository = new EnvironmentFileContentRepository(
      environment,
      user.bucket
    );

    const folderFinder = new WebdavFolderFinder(folderRepository);

    const temporalFileCollection = new InMemoryTemporalFileMetadataCollection();

    const unknownItemSearcher = new WebdavUnknownItemTypeSearcher(
      fileRepository,
      folderRepository
    );

    return {
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
    };
  }
}

export const fileSystemDependencyContainerFactory =
  new FileSystemDependencyContainerFactory();
