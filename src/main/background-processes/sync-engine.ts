import Logger from 'electron-log';
import eventBus from '../event-bus';
import { getRootVirtualDrive } from '../virutal-root-folder/service';
import fuse from '@cocalc/fuse-native';

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
        cb(0, { mode: 33188, size: 12 });
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
      fd,
      buf,
      len,
      pos,
      cb: (code: number, params?: any) => void
    ) => {
      if (path !== '/hello.txt') {
        return cb(fuse.ENOENT);
      }

      const data = Buffer.from('Hello, FUSE!');

      if (pos >= data.length) {
        return cb(0);
      }

      const slice = data.slice(pos, pos + len);
      slice.copy(buf);
      cb(slice.length);
    },
    release: function (
      readPath: string,
      fd: number,
      cb: (status: number) => void
    ): void {
      throw new Error('Function not implemented.');
    },
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

  fuse.isConfigured((isConfigured: boolean) => {
    Logger.info(`FUSE is configured: ${isConfigured}`);

    if (!isConfigured) {
      fuse.configure((...params: any[]) => {
        Logger.debug(`FUSE configure cb params: ${{ params }}`);
      });
    }
  });
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
