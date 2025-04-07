import { Container, Service } from 'diod';
import Logger from 'electron-log';
import { backgroundProcessSharedInfraBuilder } from '../../shared/dependency-injection/background/backgroundProcessSharedInfraBuilder';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerFolderServices } from './virtual-drive/registerFolderServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { Backup } from '../Backups';
import { registerLocalTreeServices } from './local/registerLocalTreeServices';
import { registerRemoteTreeServices } from './virtual-drive/registerRemoteTreeServices';
import { registerUserUsageServices } from './user/registerUsageServices';

@Service()
export class BackupsDependencyContainerFactory {
  static async build(): Promise<Container> {
    Logger.info('[BackupsDependencyContainerFactory] Starting to build the container.');

    const builder = await backgroundProcessSharedInfraBuilder();
    Logger.info('[BackupsDependencyContainerFactory] Shared infrastructure builder created.');

    try {
      Logger.info('[BackupsDependencyContainerFactory] Registering file services.');
      await registerFilesServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering folder services.');
      await registerFolderServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering remote tree services.');
      await registerRemoteTreeServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering local file services.');
      await registerLocalFileServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering local tree services.');
      await registerLocalTreeServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering user usage services.');
      await registerUserUsageServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering Backup service.');
      await builder.registerAndUse(Backup);
      const container = builder.build();
      Logger.info('[BackupsDependencyContainerFactory] Container built successfully.');

      return container;
    } catch (error) {
      Logger.error('[BackupsDependencyContainerFactory] Error during service registration:', error);
      Logger.error(error);
      throw error; // Rethrow the error after logging it
    }
  }
}
