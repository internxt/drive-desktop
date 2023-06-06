import Logger from 'electron-log';
import { ipc } from './ipc';
import { mountDrive, unmountDrive } from './VirtualDrive';
import { InternxtFileSystemFactory } from './worker/InternxtFileSystem/InternxtFileSystemFactory';
import { InternxtStorageManagerFactory } from './worker/InternxtStorageManager/InternxtSotrageManagerFactory';
import { InternxtWebdavServer } from './worker/server';

const PORT = 1900;

async function setUp() {
  const fileSystem = await InternxtFileSystemFactory.build();

  const storageManager = await InternxtStorageManagerFactory.build();

  const server = new InternxtWebdavServer(PORT, storageManager);

  await server.start([{ path: '/', fs: fileSystem }], { debug: true });

  mountDrive()
    .then(() => {
      ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNTED_SUCCESSFULLY');
    })
    .catch((reason: Error) => {
      ipc.send('WEBDAV_VIRTUAL_DRIVE_MOUNT_ERROR', reason);
    });

  ipc.on('STOP_WEBDAV_SERVER_PROCESS', () => {
    unmountDrive();
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
