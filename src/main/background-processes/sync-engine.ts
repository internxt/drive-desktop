import Logger from 'electron-log';
import eventBus from '../event-bus';
import { getRootVirtualDrive } from '../virutal-root-folder/service';
import fs from 'fs';
import { error } from 'console';
import { resolve } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fuse = require('@cocalc/fuse-native');
const fuse = require('@gcas/fuse');

let _fuse: {
  unmount(arg0: (err: any) => void): unknown;
  mount: (arg0: (err: any) => void) => void;
};

const files: Record<string, any> = {
  '/hello.txt': {
    mtime: new Date(),
    atime: new Date(),
    ctime: new Date(),
    nlink: 1,
    size: 12,
    mode: 33188,
    uid: 1234,
    gid: 1234,
  },
};

function spawnSyncEngineWorker() {
  const ops = {
    getattr: (path: string, cb: (code: number, params?: any) => void) => {
      if (path === '/') {
        cb(0, { mode: 16877, size: 0 });
      } else if (files[path] !== undefined) {
        return process.nextTick(cb, 0, files[path]);
      } else {
        cb(fuse.ENOENT);
      }
    },
    readdir: (path: string, cb: (code: number, params?: any) => void) => {
      if (path === '/') {
        const filesNames = Object.keys(files).map((n) => n.split('/').join(''));
        cb(0, ['.', '..', ...filesNames]);
      } else {
        cb(fuse.ENOENT);
      }
    },
    open: (path: string, flags, cb: (code: number, params?: any) => void) => {
      if (path === '/hello.txt') {
        cb(0, 123); // Use a unique file descriptor (123 in this example)
      } else {
        cb(fuse.ENOENT);
      }
    },
    read: (
      path: string,
      fd: any,
      buf: Buffer,
      len: number,
      pos: number,
      cb: (code: number, params?: any) => void
    ) => {
      Logger.debug(path, fd, buf, len, pos);
      if (path !== '/hello.txt') {
        return process.nextTick(cb, fuse.ENOENT);
      }
      const str = 'hello world\n'.slice(pos);

      if (!str) return process.nextTick(cb, 0);
      buf.write(str);

      return process.nextTick(cb, str.length);
    },
    rename: async (src: string, dest: string, cb: any) => {
      if (files[src] === undefined) {
        return cb(fuse.ENOENT);
      }

      const srcFile = files[src];

      const destFile = { ...srcFile };

      delete files[src];
      files[dest] = destFile;

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      cb(0);
      // fs.rename(src, dest, (error) => {
      //   if (error) {
      //     Logger.error('RENAME ERROR: ', error);
      //     return cb(fuse.ENOENT);
      //   }
      // });
    },
    // release: function (
    //   readPath: string,
    //   fd: number,
    //   cb: (status: number) => void
    // ): void {
    //   throw new Error('Function not implemented.');
    // },
  };

  const root = getRootVirtualDrive();

  Logger.debug('ROOT FOLDER: ', root);

  _fuse = new fuse(root, ops, {
    debug: true,
    mkdir: true,
    force: true,
  });

  _fuse.mount((err: any) => {
    if (err) {
      Logger.error(`FUSE mount error: ${err}`);
    }
  });

  // fuse.isConfigured((err: Error | null, isConfigured: boolean) => {
  //   if (err) {
  //     Logger.error('FUSE ERROR: ', err);
  //   }

  //   Logger.info(`FUSE is configured: ${isConfigured}`);

  //   if (!isConfigured) {
  //     fuse.configure((...params: any[]) => {
  //       Logger.debug(`FUSE configure cb params: ${{ params }}`);
  //     });
  //   }
  // });
}

export async function stopSyncEngineWatcher() {
  _fuse?.unmount((err: any) => {
    if (err) {
      Logger.error(`FUSE unmount error: ${err}`);
    }
  });
}

async function stopAndClearSyncEngineWatcher() {
  stopSyncEngineWatcher();
}

export function updateSyncEngine() {}

eventBus.on('USER_LOGGED_OUT', stopAndClearSyncEngineWatcher);
eventBus.on('USER_WAS_UNAUTHORIZED', stopAndClearSyncEngineWatcher);
eventBus.on('INITIAL_SYNC_READY', spawnSyncEngineWorker);
