import { Container } from 'diod';
import { backgroundProcessSharedInfraBuilder } from '../../shared/dependency-injection/background/backgroundProcessSharedInfraBuilder';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerFolderServices } from './virtual-drive/registerFolderServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { BackupService } from '../BackupService';
import { registerLocalTreeServices } from './local/registerLocalTreeServices';
import { registerRemoteTreeServices } from './virtual-drive/registerRemoteTreeServices';
import { registerUserUsageServices } from './user/registerUsageServices';
import { DependencyInjectionUserProvider } from '../../shared/dependency-injection/DependencyInjectionUserProvider';
import { DownloaderHandlerFactory } from '../../../context/storage/StorageFiles/domain/download/DownloaderHandlerFactory';
import { EnvironmentFileDownloaderHandlerFactory } from '../../../context/storage/StorageFiles/infrastructure/download/EnvironmentRemoteFileContentsManagersFactory';
import { Environment } from '@internxt/inxt-js';
import { StorageFileService } from '../../../context/storage/StorageFiles/StorageFileService';
import { BackupsDanglingFilesService } from '../BackupsDanglingFilesService';

export class BackupsDependencyContainerFactory {
  private static container: Container | null = null;

  static async build(): Promise<Container> {
    if (this.container) {
      return this.container;
    }

    const builder = await backgroundProcessSharedInfraBuilder();
    const user = DependencyInjectionUserProvider.get();

    await registerFilesServices(builder);
    registerFolderServices(builder);
    registerRemoteTreeServices(builder);

    registerLocalFileServices(builder);
    registerLocalTreeServices(builder);

    registerUserUsageServices(builder);

    builder
      .register(DownloaderHandlerFactory)
      .useFactory(
        (c) =>
          new EnvironmentFileDownloaderHandlerFactory(
            c.get(Environment),
            user.backupsBucket
          )
      );

    builder.register(StorageFileService).useFactory((c) => {
      const env = c.get(Environment);
      return new StorageFileService(
        env,
        user.backupsBucket
      );
    });

    builder.registerAndUse(BackupsDanglingFilesService);

    builder.registerAndUse(BackupService);

    this.container = builder.build();

    return this.container;
  }

  static async reinitialize(): Promise<Container> {
    this.container = null;
    return this.build();
  }
}
