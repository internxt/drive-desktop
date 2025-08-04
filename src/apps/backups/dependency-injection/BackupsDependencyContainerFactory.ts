import { Container, Service, ContainerBuilder } from 'diod';
import { registerFilesServices } from './virtual-drive/registerFilesServices';
import { registerLocalFileServices } from './local/registerLocalFileServices';
import { Backup } from '../Backups';
import { BackupInfo } from '../BackupInfo';
import { logger } from '@/apps/shared/logger/logger';

@Service()
export class BackupsDependencyContainerFactory {
  static build(data: BackupInfo): Container {
    logger.debug({ tag: 'BACKUPS', msg: 'Starting to build the container' });

    const builder = new ContainerBuilder();
    logger.debug({ tag: 'BACKUPS', msg: 'Shared infrastructure builder created' });

    try {
      logger.debug({ tag: 'BACKUPS', msg: 'Registering file services' });
      registerFilesServices(builder, data);

      logger.debug({ tag: 'BACKUPS', msg: 'Registering local file services' });
      registerLocalFileServices(builder, data);

      logger.debug({ tag: 'BACKUPS', msg: 'Registering Backup service' });
      builder.registerAndUse(Backup);
      const container = builder.build();
      logger.debug({ tag: 'BACKUPS', msg: 'Container built successfully' });

      return container;
    } catch (error) {
      throw logger.error({ tag: 'BACKUPS', msg: 'Error during service registration', error });
    }
  }
}
