import { Container } from 'diod';
import { backgroundProcessSharedInfraBuilder } from '../../shared/dependency-injection/background/backgroundProcessSharedInfraBuilder';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerFolderServices } from './virtual-drive/registerFolderServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { Backup } from '../Backup';
import { registerLocalTreeServices } from './local/registerLocalTreeServices';
import { registerRemoteTreeServices } from './virtual-drive/registerRemoteTreeServices';
import { registerUserUsageServices } from './user/registerUsageServices';

export class BackupsDependencyContainerFactory {
  static async build(): Promise<Container> {
    const builder = await backgroundProcessSharedInfraBuilder();

    await registerFilesServices(builder);
    registerFolderServices(builder);
    registerRemoteTreeServices(builder);

    registerLocalFileServices(builder);
    registerLocalTreeServices(builder);

    registerUserUsageServices(builder);

    builder.registerAndUse(Backup);

    const container = builder.build();

    return container;
  }
}
