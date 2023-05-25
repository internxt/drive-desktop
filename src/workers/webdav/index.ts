/* eslint-disable no-underscore-dangle */
import { ipcRenderer as electronIpcRenderer } from 'electron';
import {
  BasicPrivilege,
  IUser,
  PrivilegeManagerCallback,
  v2 as webdav,
} from 'webdav-server';
import Logger from 'electron-log';
import { Environment } from '@internxt/inxt-js';
import {
  HTTPAuthentication,
  WebDAVServerOptions,
  Errors,
  PrivilegeManager,
  Path,
  Resource,
} from 'webdav-server/lib/index.v2';
import { v4 } from 'uuid';
import { TreeRepository } from './Repository';
import { getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { FileUploader } from './application/FileUploader';
import { mountDrive, unmountDrive } from './VirtualDrive';
import { FileClonner } from './application/FileClonner';
import { InxtFileSystem } from './InxtFileSystem';
import { FileOverrider } from './application/FileOverrider';
import { FileDownloader } from './application/FileDownloader';
import { getClients } from '../../shared/HttpClient/backgroud-process-clients';

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

class HttpAutenticator implements HTTPAuthentication {
  askForAuthentication(ctx: webdav.HTTPRequestContext): {
    [headeName: string]: string;
  } {
    return {};
  }

  getUser(
    ctx: webdav.HTTPRequestContext,
    callback: (error: Error, user?: webdav.IUser | undefined) => void
  ): void {
    callback(Errors.None, {
      uid: v4(),
      isAdministrator: true,
      isDefaultUser: true,
      username: 'username',
      password: 'password',
    });
  }
}

class AllowAll extends PrivilegeManager {
  _can(
    fullPath: Path,
    user: IUser,
    resource: Resource,
    privilege: BasicPrivilege | string,
    callback: PrivilegeManagerCallback
  ): void {
    callback(Errors.None, true);
  }
}

// User manager (tells who are the users)
const userManager = new webdav.SimpleUserManager();
// const WDuser = userManager.addUser('username', 'password', false);

// Privilege manager (tells which users can access which files/folders)
const privilegeManager = new AllowAll();

export const webdavOptions: WebDAVServerOptions = {
  hostname: 'localhost',
  port: 1900,
  requireAuthentification: false,
  // privilegeManager,
};

async function setUp() {
  try {
    const server = new webdav.WebDAVServer(webdavOptions);

    server.afterRequest((arg, next) => {
      Logger.debug(
        '>>',
        arg.request.method,
        arg.request.url,
        '>',
        arg.response.statusCode,
        arg.response.statusMessage,
        arg.responseBody
      );
      next();
    });

    ipcRenderer.on('stop-webdav-server-process', () => {
      unmountDrive();
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

    const repository = new TreeRepository(
      clients.drive,
      clients.newDrive,
      user?.root_folder_id as number,
      user.bucket
    );

    await repository.init();

    Logger.debug('[WEBDAB] ABOUT TO SET FILE SYSTEM');

    const clonner = new FileClonner(user.bucket, environment);

    const uploader = new FileUploader(user.bucket, environment);

    const overrider = new FileOverrider(user.bucket, environment, clonner);

    const downloader = new FileDownloader(user.bucket, environment);

    server.setFileSystem(
      '/',
      new InxtFileSystem(uploader, overrider, downloader, repository),
      (su) => {
        Logger.debug('SUCCEDED: ', su);
      }
    );

    server.start((s) => {
      Logger.log('Ready on port', s?.address());
      mountDrive();
    });

    if (process.env.NODE_ENV === 'development') {
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
    }
  } catch (err) {
    unmountDrive();
    Logger.error(`[WEBDAV] ERROR: ${JSON.stringify(err, null, 2)}`);
  }
}

setUp();
