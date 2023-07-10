import Logger from 'electron-log';
import { DependencyContainerFactory } from './dependencyInjection/DependencyContainerFactory';
import { ipc } from './ipc';
import {
  mountDrive,
  retryVirtualDriveMount,
  unmountDrive,
} from './VirtualDrive';
import { InternxtFileSystemFactory } from './worker/InternxtFileSystem/InternxtFileSystemFactory';
import { InternxtStorageManagerFactory } from './worker/InternxtStorageManager/InternxtSotrageManagerFactory';
import { InternxtWebdavServer } from './worker/server';
import { ipcRenderer } from 'electron';

const PORT = 1900;

let retriedMount = false;

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
  ipc.send('WEBDAV_VIRTUAL_DRIVE_STARTING');
  const containerFactory = new DependencyContainerFactory();
  const container = await containerFactory.build();

  const fileSystem = await InternxtFileSystemFactory.build(container);
  const storageManager =
    process.platform !== 'win32'
      ? await InternxtStorageManagerFactory.build(container)
      : undefined;

  const server = new InternxtWebdavServer(PORT, container, storageManager);

  await server.start([{ path: '/', fs: fileSystem }], { debug: false });

  mountDrive()
    .then(() => {
      ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
    })
    .catch((reason: Error) => {
      ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', reason);
      if (!retriedMount) {
        retriedMount = true;
        retryVirtualDriveMountAndSendEvents();
      }
    });

  ipcRenderer.on('RETRY_VIRTUAL_DRIVE_MOUNT', () => {
    retryVirtualDriveMountAndSendEvents();
  });

  ipc.on('STOP_WEBDAV_SERVER_PROCESS', () => {
    unmountDrive().catch((err) => {
      Logger.error('Failed to unmount the Virtual Drive ', err);
    });
    server
      .stop()
      .then(() => {
        Logger.log('[WEBDAB] Server stopped succesfully');
        ipc.send('WEBDAV_SERVER_STOP_SUCCESS');
      })
      .catch((err) => {
        Logger.log('[WEBDAB] Server stopped with error', err);
        ipc.send('WEBDAV_SERVER_STOP_ERROR', err);
      });
  });
}

setUp().catch((err) => {
  Logger.error(err);
});
