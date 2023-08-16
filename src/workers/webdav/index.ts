import Logger from 'electron-log';
import { DependencyContainerFactory } from './dependencyInjection/DependencyContainerFactory';
import { ipc } from './ipc';
import {
  getVirtualDrivePath,
  retryVirtualDriveMount,
  unmountDrive,
} from './VirtualDrive';
import { ipcRenderer } from 'electron';
import { DomainEventSubscribers } from './modules/shared/infrastructure/DomainEventSubscribers';
import { BindingsManager } from './BindingManager';
import PackageJson from '../../../package.json';
import { DumbVirtualDrive } from './Addon';

/**
 * Tries to mount the Virtual Drive again by
 * unmounting and mounting it back
 */
const retryVirtualDriveMountAndSendEvents = () => {
  Logger.info('RETRYING VIRTUAL DRIVE MOUNT FROM WORKER');
  ipc.send('WEBDAV_VIRTUAL_DRIVE_RETRYING_MOUNT');
  ipc.send('WEBDAV_VIRTUAL_DRIVE_STARTING');
  retryVirtualDriveMount()
    .then(() => {
      ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
    })
    .catch((error) => {
      Logger.error(error);
      ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', error);
    });
};

async function setUp() {
  try {
    ipc.send('WEBDAV_VIRTUAL_DRIVE_STARTING');
    const containerFactory = new DependencyContainerFactory();
    const container = await containerFactory.build();

    container.eventBus.addSubscribers(DomainEventSubscribers.from(container));

    const drive = new DumbVirtualDrive();
    const virtuaDrivePath = getVirtualDrivePath();
    const bindingsManager = new BindingsManager(
      drive,
      container,
      virtuaDrivePath
    );

    Logger.debug();

    ipcRenderer.on('RETRY_VIRTUAL_DRIVE_MOUNT', () => {
      Logger.info('Retrying virtual drive mount');
      retryVirtualDriveMountAndSendEvents();
    });

    ipc.on('STOP_WEBDAV_SERVER_PROCESS', () => {
      unmountDrive().catch((err) => {
        Logger.error('Failed to unmount the Virtual Drive ', err);
      });
      bindingsManager.down();
    });

    ipc.on('START_WEBDAV_SERVER_PROCESS', () => {
      Logger.info('skipping on START_WEBDAV_SERVER_PROCESS');
    });

    bindingsManager.up(
      '796f071e-2b87-5271-8809-8769e7dba627', //???
      PackageJson.version
    );
  } catch (error) {
    Logger.debug('ERROR ON SETTING UP', error);
    ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', error as Error);
  }
}

setUp().catch((err) => {
  Logger.error(err);
});
