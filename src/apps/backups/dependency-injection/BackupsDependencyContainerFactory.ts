import { Container } from 'diod';
import { backgroundProcessSharedInfraBuilder } from '../../shared/dependency-injection/background/backgroundProcessSharedInfraBuilder';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerFolderServices } from './virtual-drive/registerFolderServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { BackupService } from '../BackupService';
import { registerLocalTreeServices } from './local/registerLocalTreeServices';
import { registerRemoteTreeServices } from './virtual-drive/registerRemoteTreeServices';
import { registerUserUsageServices } from './user/registerUsageServices';

export class BackupsDependencyContainerFactory {
  private static container: Container | null = null;

  static async build(): Promise<Container> {
    if (this.container) {
      return this.container;
    }

    const builder = await backgroundProcessSharedInfraBuilder();

    await registerFilesServices(builder);
    registerFolderServices(builder);
    registerRemoteTreeServices(builder);

    registerLocalFileServices(builder);
    registerLocalTreeServices(builder);

    registerUserUsageServices(builder);

    builder.registerAndUse(BackupService);

    this.container = builder.build();

    return this.container;
  }

  static async reinitialize(): Promise<Container> {
    this.container = null;
    return this.build();
  }
}
