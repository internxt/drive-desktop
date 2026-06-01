import { Container } from 'diod';
import { Environment } from '@internxt/inxt-js';
import { backgroundProcessSharedInfraBuilder } from '../../shared/dependency-injection/background/backgroundProcessSharedInfraBuilder';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerFolderServices } from './virtual-drive/registerFolderServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { BackupService } from '../BackupService';
import { registerRemoteTreeServices } from './virtual-drive/registerRemoteTreeServices';
import { DependencyInjectionUserProvider } from '../../shared/dependency-injection/DependencyInjectionUserProvider';
import { DownloaderHandlerFactory } from '../../../context/storage/StorageFiles/domain/download/DownloaderHandlerFactory';
import { EnvironmentFileDownloaderHandlerFactory } from '../../../context/storage/StorageFiles/infrastructure/download/EnvironmentRemoteFileContentsManagersFactory';
import { RemoteTreeBuilder } from '../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { SimpleFolderCreator } from '../../../context/virtual-drive/folders/application/create/SimpleFolderCreator';

export class BackupsDependencyContainerFactory {
  private static container: Container | null = null;

  static async build(): Promise<Container> {
    if (this.container) {
      return this.container;
    }

    const builder = await backgroundProcessSharedInfraBuilder();
    const user = DependencyInjectionUserProvider.get();

    registerFilesServices(builder);
    registerFolderServices(builder);
    registerRemoteTreeServices(builder);

    registerLocalFileServices(builder);

    builder
      .register(DownloaderHandlerFactory)
      .useFactory((c) => new EnvironmentFileDownloaderHandlerFactory(c.get(Environment), user.backupsBucket));

    builder.register(BackupService).useFactory((c) => {
      return new BackupService(
        c.get(RemoteTreeBuilder),
        c.get(SimpleFolderCreator),
        c.get(Environment),
        user.backupsBucket,
      );
    });

    this.container = builder.build();

    return this.container;
  }

  static async reinitialize(): Promise<Container> {
    this.container = null;
    return this.build();
  }
}
