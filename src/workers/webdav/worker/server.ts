import {
  WebDAVServer,
  WebDAVServerStartCallback,
} from 'webdav-server/lib/index.v2';
import { InternxtFileSystem } from './InternxtFileSystem/InternxtFileSystem';
import { v2 as webdav } from 'webdav-server';
import Logger from 'electron-log';

export class InternxtWebdavServer {
  readonly server: WebDAVServer;

  constructor(port: number, private readonly fileSystem: InternxtFileSystem) {
    this.server = new webdav.WebDAVServer({
      hostname: 'localhost',
      port,
      requireAuthentification: false,
    });
  }

  async start(debug: boolean): Promise<void> {
    const mounted = new Promise<void>((resolve, reject) => {
      this.server.setFileSystem('/', this.fileSystem, (success) => {
        if (success) {
          Logger.info('[WEBDAB SERVER] INTERNXT FS MOUNTED');
          return resolve();
        }

        reject();
      });
    });

    await mounted;

    if (debug) {
      this.server.afterRequest((arg, next) => {
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
    }

    return new Promise((resolve, reject) =>
      this.server.start((server: Parameters<WebDAVServerStartCallback>[0]) => {
        if (!server) {
          reject();
          return;
        }

        Logger.info('[WEBDAB SERVER] STARTED');
        Logger.info('[WEBDAB SERVER] http server: ', server.address());
        resolve();
      })
    );
  }

  stop() {
    return this.server.stopAsync();
  }
}
