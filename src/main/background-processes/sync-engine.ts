import Logger from 'electron-log';
import eventBus from '../event-bus';
import { getRootVirtualDrive } from '../virutal-root-folder/service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fuse = require('@cocalc/fuse-native');
const fuse = require('@gcas/fuse');

let _fuse: {
  unmount(arg0: (err: any) => void): unknown;
  mount: (arg0: (err: any) => void) => void;
};

function spawnSyncEngineWorker() {
  const ops = {
    getattr: (path: string, cb: (code: number, params?: any) => void) => {
      if (path === '/') {
        cb(0, { mode: 16877, size: 0 });
      } else if (path === '/hello.txt') {
        Logger.debug('HELLO');
        return process.nextTick(cb, 0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          nlink: 1,
          size: 12,
          mode: 33188,
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0,
        });
      } else {
        cb(fuse.ENOENT);
      }
    },
    readdir: (path: string, cb: (code: number, params?: any) => void) => {
      if (path === '/') {
        cb(0, ['.', '..', 'hello.txt']);
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
