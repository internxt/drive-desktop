import Logger from 'electron-log';
import { DependencyContainerFactory } from './dependencyInjection/DependencyContainerFactory';
import { ipc } from './ipc';
import {
  getVirtualDrivePath,
  mountDrive,
  retryVirtualDriveMount,
  unmountDrive,
} from './VirtualDrive';
import { ipcRenderer } from 'electron';
import { DomainEventSubscribers } from './modules/shared/infrastructure/DomainEventSubscribers';
import { BindingsManager } from './BindingManager';
import PackageJson from '../../../package.json';
import { VirtualDrive } from 'virtual-drive/dist';
import fs from 'fs/promises';

/**
 * Tries to mount the Virtual Drive again by
 * unmounting and mounting it back
 */
const retryVirtualDriveMountAndSendEvents = () => {
  Logger.info('RETRYING VIRTUAL DRIVE MOUNT FROM WORKER');
  ipc.send('WEBDAV_VIRTUAL_DRIVE_RETRYING_MOUNT');
  ipc.send('WEBDAV_VIRTUAL_DRIVE_STARTING');
  return retryVirtualDriveMount()
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
    const containerFactory = new DependencyContainerFactory();
    const container = await containerFactory.build();

    container.eventBus.addSubscribers(DomainEventSubscribers.from(container));

    const virtuaDrivePath = getVirtualDrivePath();

    void fs.mkdir(virtuaDrivePath);

    const drive = new VirtualDrive(virtuaDrivePath);

    const bindingsManager = new BindingsManager(
      drive,
      container,
    );

    // ipcRenderer.on("RETRY_VIRTUAL_DRIVE_MOUNT", () => {
    //   Logger.info("Retrying virtual drive mount");
    //   retryVirtualDriveMountAndSendEvents();
    // });

    ipc.on('STOP_WEBDAV_SERVER_PROCESS', async (event) => {
      await bindingsManager.down();
      event.sender.send('WEBDAV_SERVER_STOP_SUCCESS');
    });

    ipc.on('START_WEBDAV_SERVER_PROCESS', () => {
      Logger.info('skipping on START_WEBDAV_SERVER_PROCESS');
    });

    bindingsManager.up(
      PackageJson.version,
      '{12345678-1234-1234-1234-123456789012}'
    );
  } catch (error) {
    Logger.debug('ERROR ON SETTING UP', error);
    ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', error as Error);
  }
}

setUp().catch((err) => {
  Logger.error(err);
});
