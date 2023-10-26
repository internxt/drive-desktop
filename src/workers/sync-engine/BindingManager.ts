import Logger from 'electron-log';
import { buildControllers } from './callbacks-controllers/buildControllers';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { FilePlaceholderId } from './modules/placeholders/domain/FilePlaceholderId';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { PlatformPathConverter } from './modules/shared/application/PlatformPathConverter';
import { ItemsSearcher } from './modules/items/application/ItemsSearcher';
import * as fs from 'fs';

export type CallbackDownload = (
  success: boolean,
  filePath: string
) => Promise<{ finished: boolean; progress: number }>;
export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  private fuse: any | null = null;

  constructor(
    private readonly paths: {
      root: string;
      icon: string;
    }
  ) {}

  async start(version: string, providerId: string) {
    const fuse = require('fuse-native');
    const ops = {
      getattr: (path: string, cb: (code: number, params?: any) => void) => {
        if (path === '/') {
          cb(0, { mode: 16877, size: 0 });
        } else if (path === '/hello.txt') {
          cb(0, { mode: 33188, size: 12 });
        } else {
          cb(Fuse.ENOENT);
        }
      },
      readdir: (path: string, cb: (code: number, params?: any) => void) => {
        if (path === '/') {
          cb(0, ['.', '..', 'hello.txt']);
        } else {
          cb(Fuse.ENOENT);
        }
      },
      open: (path: string, flags, cb: (code: number, params?: any) => void) => {
        if (path === '/hello.txt') {
          cb(0, 123); // Use a unique file descriptor (123 in this example)
        } else {
          cb(Fuse.ENOENT);
        }
      },
      read: (
        path: string,
        fd,
        buf,
        len,
        pos,
        cb: (code: number, params?: any) => void
      ) => {
        if (path === '/hello.txt') {
          const data = Buffer.from('Hello, FUSE!');
          if (pos >= data.length) {
            cb(0);
          } else {
            const slice = data.slice(pos, pos + len);
            slice.copy(buf);
            cb(slice.length);
          }
        } else {
          cb(Fuse.ENOENT);
        }
      },
      release: function (
        readPath: string,
        fd: number,
        cb: (status: number) => void
      ): void {
        throw new Error('Function not implemented.');
      },
    };
    // this.fuse = new fuse(this.paths.root, ops, { debug: true });
    // this.fuse.mount((err: any) => {
    //   if (err) {
    //     Logger.error(`FUSE mount error: ${err}`);
    //   }
    // });

    Logger.debug('FUSE: ', { fuse });

    fuse.isConfigured((isConfigured: boolean) => {
      Logger.info(`FUSE is configured: ${isConfigured}`);

      if (!isConfigured) {
        fuse.configure((...params: any[]) => {
          Logger.debug(`FUSE configure cb params: ${{ params }}`);
        });
      }
    });
  }

  watch() {}

  async stop() {
    this.fuse?.unmount((err: any) => {
      if (err) {
        Logger.error(`FUSE unmount error: ${err}`);
      }
    });
  }

  async cleanUp() {}
}
