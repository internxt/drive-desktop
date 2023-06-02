import { ipcRenderer as electronIpcRenderer } from 'electron';
import Logger from 'electron-log';
import { mountDrive, unmountDrive } from './VirtualDrive';
import { InternxtFileSystemFactory } from './worker/InternxtFileSystem/InternxtFileSystemFactory';
import { InternxtStorageManagerFactory } from './worker/InternxtStorageManager/InternxtSotrageManagerFactory';
import { InternxtWebdavServer } from './worker/server';

interface WebDavServerEvents {
  WEBDAV_SERVER_START_SUCCESS: () => void;
  WEBDAV_SERVER_START_ERROR: (err: Error) => void;
  WEBDAV_SERVER_STOP_SUCCESS: () => void;
  WEBDAV_SERVER_STOP_ERROR: (err: Error) => void;
  WEBDAV_SERVER_ADDING_ROOT_FOLDER_ERROR: (err: Error) => void;
}

interface IpcRenderer {
  send<U extends keyof WebDavServerEvents>(
    event: U,
    ...args: Parameters<WebDavServerEvents[U]>
  ): void;
  on: (
    event: keyof WebDavServerEvents | 'stop-webdav-server-process',
    listener: (...args: any[]) => void
  ) => void;
}

const ipcRenderer = electronIpcRenderer as IpcRenderer;

const PORT = 1900;

async function setUp() {
  const fileSystem = await InternxtFileSystemFactory.build();

  const storageManager = await InternxtStorageManagerFactory.build();

  const server = new InternxtWebdavServer(PORT, storageManager);

  await server.start([{ path: '/', fs: fileSystem }], { debug: true });

  mountDrive();

  ipcRenderer.on('stop-webdav-server-process', () => {
    unmountDrive();
    server
      .stop()
      .then(() => {
        Logger.log('[WEBDAB] Server stopped succesfully');
        ipcRenderer.send('WEBDAV_SERVER_STOP_SUCCESS');
      })
      .catch((err) => {
        Logger.log('[WEBDAB] Server stopped with error', err);
        ipcRenderer.send('WEBDAV_SERVER_STOP_ERROR', err);
      });
  });
}

setUp().catch((err) => {
  Logger.error(err);
});
