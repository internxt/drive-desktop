import { ipcRenderer as electronIpcRenderer } from 'electron';
import Logger from 'electron-log';
import { mountDrive, unmountDrive } from './VirtualDrive';
import { InternxtFileSystemFactory } from './worker/InternxtFileSystem/InternxtFileSystemFactory';
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

  const server = new InternxtWebdavServer(PORT, fileSystem);
  server.server.on('create', () => Logger.debug('create'));
  server.server.on('delete', () => Logger.debug('delete'));
  server.server.on('openReadStream', () => Logger.debug('openReadStream'));
  server.server.on('openWriteStream', () => Logger.debug('openWriteStream'));
  server.server.on('move', () => Logger.debug('move'));
  server.server.on('copy', () => Logger.debug('copy'));
  server.server.on('rename', () => Logger.debug('rename'));
  server.server.on('before-create', () => Logger.debug(' before create'));
  server.server.on('before-delete', () => Logger.debug(' before delete'));
  server.server.on('before-openReadStream', () =>
    Logger.debug(' before openReadStream')
  );
  server.server.on('before-openWriteStream', () =>
    Logger.debug(' before openWriteStream')
  );
  server.server.on('before-move', () => Logger.debug(' before move'));
  server.server.on('before-copy', () => Logger.debug(' before copy'));
  server.server.on('before-rename', () => Logger.debug(' before rename'));

  await server.start(true);

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
