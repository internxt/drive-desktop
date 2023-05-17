import { ipcRenderer as electronIpcRenderer } from 'electron';
import { v2 as webdav } from 'webdav-server';
import Logger from 'electron-log';
import { Environment } from '@internxt/inxt-js';
import { HTTPRequestContext } from 'webdav-server/lib/index.v2';
import { RequestListener } from 'webdav-server/lib/server/v2/webDAVServer/BeforeAfter';
import { InternxtFileSystem } from './InternxtFileSystem';
import { InternxtSerializer } from './InternxtSerializer';
import { httpClient } from './httpClients';
import { Repository } from './Repository';
import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { FileUploader } from './application/FileUploader';

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

async function setUp() {
  try {
    const server = new webdav.WebDAVServer({
      hostname: 'localhost',
    });

    ipcRenderer.on('stop-webdav-server-process', () => {
      server
        .stopAsync()
        .then(() => {
          Logger.log('Server stopped succesfully');
          ipcRenderer.send('WEBDAV_SERVER_STOP_SUCCESS');
        })
        .catch((err) => {
          Logger.log('Server stopped with error', err);
          ipcRenderer.send('WEBDAV_SERVER_STOP_ERROR', err);
        });
    });

    const clients = httpClient();
    const user = getUser();
    const mnemonic = configStore.get('mnemonic');

    if (!user) {
      return;
    }

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      encryptionKey: mnemonic,
    });

    const repo = new Repository(
      clients.drive,
      clients.newDrive,
      environment,
      user?.root_folder_id as number,
      user.bucket
    );

    await repo.init();

    Logger.debug('ABOUT TO SET FILE SYSTEM');

    server.setFileSystem(
      '/',
      new InternxtFileSystem(
        new InternxtSerializer(),
        repo,
        new FileUploader(user.bucket, environment)
      ),
      (su) => {
        Logger.debug('SUCCEDED: ', su);
      }
    );

    const middleware: RequestListener = (
      ctx: HTTPRequestContext,
      next: () => void
    ) => {
      Logger.debug(JSON.stringify(ctx, null, 2));
      next();
    };

    // server.beforeRequest(middleware);

    server.on('create', () => Logger.debug('create'));
    server.on('delete', () => Logger.debug('delete'));
    server.on('openReadStream', () => Logger.debug('openReadStream'));
    server.on('openWriteStream', () => Logger.debug('openWriteStream'));
    server.on('move', () => Logger.debug('move'));
    server.on('copy', () => Logger.debug('copy'));
    server.on('rename', () => Logger.debug('rename'));
    server.on('before-create', () => Logger.debug(' before create'));
    server.on('before-delete', () => Logger.debug(' before delete'));
    server.on('before-openReadStream', () =>
      Logger.debug(' before openReadStream')
    );
    server.on('before-openWriteStream', () =>
      Logger.debug(' before openWriteStream')
    );
    server.on('before-move', () => Logger.debug(' before move'));
    server.on('before-copy', () => Logger.debug(' before copy'));
    server.on('before-rename', () => Logger.debug(' before rename'));

    server.start((s) => Logger.log('Ready on port', s?.address()));
  } catch (err) {
    Logger.error(`[WEBDAV] ERROR: ${JSON.stringify(err, null, 2)}`);
  }

  // addRootFolderToWebDavServer(server, getSyncRoot())
  //   .then(() => {
  //     // Start the server
  //     server
  //       .startAsync(3004)
  //       .then(() => {
  //         Logger.log('Server started succesfully');
  //         ipcRenderer.send('WEBDAV_SERVER_START_SUCCESS');
  //       })
  //       .catch((err) => {
  //         Logger.log('Server started with errorr', err);
  //         ipcRenderer.send('WEBDAV_SERVER_START_ERROR', err);
  //       });
  //   })
  //   .catch((err) => {
  //     Logger.log('addRootFolderToWebDavServererrror', err);
  //     ipcRenderer.send('WEBDAV_SERVER_ADDING_ROOT_FOLDER_ERROR', err);
  //   });
}

Logger.debug('ejh mamon!');

setUp();
