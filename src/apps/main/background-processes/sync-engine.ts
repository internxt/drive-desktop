import Logger from 'electron-log';
import eventBus from '../event-bus';
import { getRootVirtualDrive } from '../virutal-root-folder/service';
import fs, { unlink } from 'fs';
import _path from 'path';
import { app } from 'electron';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fuse = require('@cocalc/fuse-native');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chance = require('chance');

let _fuse: {
  unmount(arg0: (err: any) => void): unknown;
  mount: (arg0: (err: any) => void) => void;
};

const temp = app.getPath('temp');

const tempFolder = _path.join(temp, 'InternxtDrive');

const files: Record<string, any> = {};

const folders: Record<string, any> = {};

const chance = new Chance();

async function spawnSyncEngineWorker() {
  await new Promise<void>((resolve) =>
    fs.stat(tempFolder, (err) => {
      if (err) {
        fs.mkdirSync(tempFolder);
      }
      resolve();
    })
  );

  const renameFile = async (src: string, dest: string) => {
    const srcFile = files[src];

    const destFile = { ...srcFile };

    delete files[src];
    files[dest] = destFile;

    const oldPath = _path.join(tempFolder, src);
    const newPath = _path.join(tempFolder, dest);

    fs.renameSync(oldPath, newPath);
  };

  const renameFolder = async (src: string, dest: string) => {
    const srcFolder = folders[src];

    const destFolder = { ...srcFolder };

    delete folders[src];
    folders[dest] = destFolder;

    const oldPath = _path.join(tempFolder, src);
    const newPath = _path.join(tempFolder, dest);

    fs.renameSync(oldPath, newPath);
  };

  const ops = {
    listxattr: (path: string, cb: (err: number, list?: string[]) => void) => {
      cb(0, ['sync_status', 'b']);
    },
    getxattr: (
      path: string,
      name: string,
      size: number,
      cb: (err: number, data: Buffer) => void
    ) => {
      Logger.debug('GETXATTR', path, name, size, cb);
      const buff = Buffer.from('in sync');
      cb(0, buff);
    },
    getattr: (path: string, cb: (code: number, params?: any) => void) => {
      Logger.debug(`GETATTR ${path}`);
      if (path === '/') {
        cb(0, { mode: 16877, size: 0 });
      } else if (files[path] !== undefined) {
        const file = files[path];

        const getSize = () => {
          try {
            const { size } = fs.statSync(_path.join(tempFolder, path));
            return size;
          } catch {
            return 0;
          }
        };

        const size = getSize();

        return process.nextTick(cb, 0, {
          ...file,
          size,
          sync_status: 'online',
        });
      } else if (folders[path]) {
        return cb(0, { ...folders[path], sync_status: 'online' });
      } else {
        cb(fuse.ENOENT);
      }
    },
    readdir: (path: string, cb: (code: number, params?: any) => void) => {
      Logger.debug(`READDIR ${path}`);
      if (path === '/') {
        const filesNames = Object.keys(files)
          .filter((f) => {
            return f.includes('f', 1);
          })
          .map((n) => n.split('/')[-1]);
        const foldersNames = Object.keys(folders)
          .filter((f) => !f.startsWith('/.Trash-'))
          .map((n) => n.split('/').join(''));
        cb(0, ['.', '..', ...filesNames, ...foldersNames]);
      } else {
        const isFolder = Object.keys(folders).includes(path);

        if (!isFolder) {
          return cb(fuse.ENOENT);
        }

        const filesNames = Object.keys(files)
          .filter((f) => {
            return f.includes(_path.dirname(path));
          })
          .map((f) => {
            return _path.basename(f);
          });

        const foldersNames = Object.keys(folders)
          .filter((f) => {
            return f.includes(_path.dirname(path));
          })
          .map((f) => {
            return _path.basename(f);
          });

        cb(0, ['.', '..', ...filesNames, ...foldersNames]);
      }
    },
    open: (path: string, flags, cb: (code: number, params?: any) => void) => {
      Logger.debug(`OPEN ${path}`);
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
      Logger.debug(`READ ${path}`);
      const fullPath = _path.join(tempFolder, path);
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          console.error(`Error reading file: ${err}`);
          cb(fuse.ENOENT); // Indicate an error code, e.g., if the file doesn't exist
          return;
        }

        // Convert the data to a Buffer
        const dataBuffer = Buffer.from(data);

        // Determine the number of bytes to read based on the length and position
        const bytesRead = Math.min(dataBuffer.length - pos, len);

        // Copy the data to the provided buffer
        dataBuffer.copy(buf, 0, pos, pos + bytesRead);

        cb(bytesRead); // Indicate the number of bytes read
      });
    },
    rename: async (src: string, dest: string, cb: any) => {
      Logger.debug(`RENAME ${src} -> ${dest}`);
      // ALSO HANDLES THE MOVE ACTION
      if (files[src] !== undefined) {
        await renameFile(src, dest);
        cb(0);
      }

      if (folders[src] !== undefined) {
        await renameFolder(src, dest);
        cb(0);
      }

      return cb(fuse.ENOENT);
    },
    create: async (path: string, mode: number, cb: any) => {
      Logger.debug(`CREATE ${path}`);
      files[path] = {
        uid: chance.integer({ min: 100 }),
        gid: chance.integer({ min: 100 }),
        mode: 33188,
      };

      cb(0);
    },
    write: (
      path: string,
      fd: string,
      buffer: Buffer,
      len: number,
      pos: number,
      cb: any
    ) => {
      Logger.debug(`WRITE ${path}`);
      const fullPath = _path.join(tempFolder, path);
      fs.open(fullPath, 'w', (err, fileDescriptor) => {
        if (err) {
          console.error(`Error opening file for writing: ${err}`);
          cb(fuse.ENOENT); // Indicate an error code, e.g., if the file doesn't exist
          return;
        }

        // Create a Buffer from the incoming data
        const dataBuffer = Buffer.from(buffer.slice(0, len));

        // Write data to the file at the specified position
        fs.write(fileDescriptor, dataBuffer, 0, len, pos, (writeErr) => {
          if (writeErr) {
            console.error(`Error writing to file: ${writeErr}`);
            cb(fuse.EIO); // Indicate an error code, e.g., EIO for I/O error
          } else {
            cb(len); // Indicate success by returning the number of bytes written
          }

          // Close the file
          fs.close(fileDescriptor, () => {
            if (writeErr) {
              console.error(`Error closing file: ${writeErr}`);
            }
          });
        });
      });
    },
    mkdir: async (path: string, mode: number, cb: any) => {
      Logger.debug(`MKDIR ${path}`);
      folders[path] = {
        uid: 123401,
        gid: 123401,
        mode: 16877,
      };

      fs.mkdirSync(_path.join(tempFolder, path));

      cb(0);
    },
    release: function (
      readPath: string,
      fd: number,
      cb: (status: number) => void
    ): void {
      Logger.debug(`RELEASE ${readPath}`);
      cb(0);
    },
    unlink: (path: string, cb: (code: number) => void) => {
      Logger.debug(`UNLINK ${path}`);
      delete files[path];

      unlink(_path.join(tempFolder, path), (err) => {
        if (err) {
          Logger.error('ERROR DELETING FILE', err);
          return cb(fuse.EIO);
        }

        cb(0);
      });
    },
    rmdir: (path: string, cb: (code: number) => void) => {
      Logger.debug(`RMDIR ${path}`);
      delete folders[path];

      fs.rmdirSync(_path.join(tempFolder, path));

      cb(0);
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
