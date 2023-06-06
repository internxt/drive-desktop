import {
  WebDAVServer,
  WebDAVServerStartCallback,
  FileSystem,
  IStorageManager,
} from 'webdav-server/lib/index.v2';
import { v2 as webdav } from 'webdav-server';
import Logger from 'electron-log';
import { DependencyContainer } from '../dependencyInjection/DependencyContainer';
import { DomainEventSubscribers } from '../modules/shared/infrastructure/DomainEventSubscribers';

export class InternxtWebdavServer {
  private readonly container: DependencyContainer;
  readonly server: WebDAVServer;

  constructor(
    port: number,
    container: DependencyContainer,
    storageManager?: IStorageManager
  ) {
    this.server = new webdav.WebDAVServer({
      hostname: 'localhost',
      port,
      requireAuthentification: false,
      storageManager: storageManager,
    });
    this.container = container;
  }

  private configureEventBus() {
    this.container.eventBus.addSubscribers(
      DomainEventSubscribers.from(this.container)
    );
  }

  async start(
    fileSystems: { path: string; fs: FileSystem }[],
    options: { debug: boolean }
  ): Promise<void> {
    this.configureEventBus();

    const fileSystemsMounted = fileSystems.map(
      (params: { path: string; fs: FileSystem }) => {
        return new Promise<void>((resolve, reject) => {
          this.server.setFileSystem(params.path, params.fs, (success) => {
            if (success) {
              Logger.info('[WEBDAB SERVER] INTERNXT FS MOUNTED');
              return resolve();
            }

            reject();
          });
        });
      }
    );

    await Promise.allSettled(fileSystemsMounted);

    if (options.debug) {
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
