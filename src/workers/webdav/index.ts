import { ipcRenderer as electronIpcRenderer } from 'electron';
import { v2 as webdav } from 'webdav-server';
import Logger from 'electron-log';
import { Environment } from '@internxt/inxt-js';
import { InternxtFileSystem } from './InternxtFileSystem';
import { InternxtSerializer } from './InternxtSerializer';
import { getClients } from '../../shared/HttpClient/backgroud-process-clients';
import { InMemoryRepository } from './InMemoryRepository';
import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';

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

    const clients = getClients();
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

    const repo = new InMemoryRepository(
      clients.drive,
      clients.newDrive,
      environment,
      user?.root_folder_id as number
    );

    await repo.init();

    Logger.debug('ABOUT TO SET FILE SYSTEM');

    server.setFileSystem(
      '/',
      new InternxtFileSystem(new InternxtSerializer(), repo),
      (su) => {
        Logger.debug('SUCCEDED: ', su);
      }
    );

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
