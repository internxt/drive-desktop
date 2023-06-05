import Logger from 'electron-log';
import { ipc } from './ipc';
import { mountDrive, unmountDrive } from './VirtualDrive';
import { InternxtFileSystemFactory } from './worker/InternxtFileSystem/InternxtFileSystemFactory';
import { InternxtWebdavServer } from './worker/server';

const PORT = 1900;

async function setUp() {
  const fileSystem = await InternxtFileSystemFactory.build();
  const fileSystem2 = await InternxtFileSystemFactory.build();

  const server = new InternxtWebdavServer(PORT);
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
