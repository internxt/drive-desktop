import Logger from 'electron-log';
import eventBus from '../event-bus';
import { getRootVirtualDrive } from '../virutal-root-folder/service';
import fs from 'fs';
import { error } from 'console';
import { resolve } from 'path';
import { PassThrough } from 'stream';
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

const folders: Record<string, any> = {
  '/folder': {
    uid: 12340,
    gid: 12340,
    mtime: new Date(),
    atime: new Date(),
    ctime: new Date(),
    nlink: 1,
    size: 12,
    mode: 16877,
  },
};

function spawnSyncEngineWorker() {
  const ops = {
    getattr: (path: string, cb: (code: number, params?: any) => void) => {
      if (path === '/') {
        cb(0, { mode: 16877, size: 0 });
      } else if (files[path] !== undefined) {
        return process.nextTick(cb, 0, files[path]);
      } else if (folders[path]) {
        return cb(0, folders[path]);
      } else {
        cb(fuse.ENOENT);
      }
    },
    readdir: (path: string, cb: (code: number, params?: any) => void) => {
      if (path === '/') {
        const filesNames = Object.keys(files).map((n) => n.split('/').join(''));
        const foldersNames = Object.keys(folders).map((n) =>
          n.split('/').join('')
        );
        cb(0, ['.', '..', ...filesNames, ...foldersNames]);
      } else {
        cb(fuse.ENOENT);
      }
    },
    open: (path: string, flags, cb: (code: number, params?: any) => void) => {
      const file = files[path];

      if (!file) {
        return cb(fuse.ENOENT);
      }

      cb(0, file.uid);
    },
    read: (
      path: string,
      fd: any,
      buf: Buffer,
      len: number,
      pos: number,
      cb: (code: number, params?: any) => void
    ) => {
      const file = files[path];

      if (!file) {
        return cb(fuse.ENOENT);
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
    },
    create: async (path: string, mode: number, cb: any) => {},
    mkdir: async (path: string, mode: number, cb: any) => {
      folders[path] = {
        uid: 123401,
        gid: 123401,
        mode: 16877,
      };

      cb(0);
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
