import { Container, Service, ContainerBuilder } from 'diod';
import Logger from 'electron-log';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerFolderServices } from './virtual-drive/registerFolderServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { Backup } from '../Backups';
import { DangledFilesService } from '../dangled-files/DangledFilesService';
import { BackupInfo } from '../BackupInfo';

@Service()
export class BackupsDependencyContainerFactory {
  static async build(data: BackupInfo): Promise<Container> {
    Logger.info('[BackupsDependencyContainerFactory] Starting to build the container.');

    const builder = new ContainerBuilder();
    Logger.info('[BackupsDependencyContainerFactory] Shared infrastructure builder created.');

    try {
      Logger.info('[BackupsDependencyContainerFactory] Registering file services.');
      await registerFilesServices(builder, data);

      Logger.info('[BackupsDependencyContainerFactory] Registering folder services.');
      await registerFolderServices(builder);

      Logger.info('[BackupsDependencyContainerFactory] Registering local file services.');
      await registerLocalFileServices(builder, data);

      Logger.info('[BackupsDependencyContainerFactory] Registering dangled files service.');
      builder.registerAndUse(DangledFilesService);

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
