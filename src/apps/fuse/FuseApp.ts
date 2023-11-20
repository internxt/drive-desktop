import fs, { unlink } from 'fs';
import _path from 'path';
import Logger from 'electron-log';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { Readdir } from './callbacks/Readdir';
import { Getattr } from './callbacks/Getattr';
import { Open } from './callbacks/Open';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class FuseApp {
  private files: Record<string, any>;
  private folders: Record<string, any>;

  private _fuse: any;

  constructor(
    private readonly container: DependencyContainer,
    private readonly paths: {
      root: string;
      local: string;
    }
  ) {
    this.files = {};
    this.folders = {};
  }

  private getOpt() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Chance = require('chance');
    const chance = new Chance();

    const renameFile = async (src: string, dest: string) => {
      const srcFile = this.files[src];

      const destFile = { ...srcFile };

      delete this.files[src];
      this.files[dest] = destFile;

      const oldPath = _path.join(this.paths.local, src);
      const newPath = _path.join(this.paths.local, dest);

      fs.renameSync(oldPath, newPath);
    };

    const renameFolder = async (src: string, dest: string) => {
      const srcFolder = this.folders[src];

      const destFolder = { ...srcFolder };

      delete this.folders[src];
      this.folders[dest] = destFolder;

      const oldPath = _path.join(this.paths.local, src);
      const newPath = _path.join(this.paths.local, dest);

      fs.renameSync(oldPath, newPath);
    };

    const readdir = new Readdir(this.container);
    const getattr = new Getattr(this.container);
    const open = new Open(this.container);

    return {
      listxattr: (path: string, cb: (err: number, list?: string[]) => void) => {
        cb(0, []);
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
      getattr: getattr.execute.bind(getattr),
      readdir: readdir.execute.bind(readdir),
      open: open.execute.bind(open),
      read: (
        path: string,
        fd: any,
        buf: Buffer,
        len: number,
        pos: number,
        cb: (code: number, params?: any) => void
      ) => {
        Logger.debug(`READ ${path}`);
        const fullPath = _path.join(this.paths.local, path);

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
        if (this.files[src] !== undefined) {
          await renameFile(src, dest);
          cb(0);
        }

        if (this.folders[src] !== undefined) {
          await renameFolder(src, dest);
          cb(0);
        }

        return cb(fuse.ENOENT);
      },
      create: async (path: string, mode: number, cb: any) => {
        Logger.debug(`CREATE ${path}`);
        this.files[path] = {
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
        const fullPath = _path.join(this.paths.local, path);
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
        this.folders[path] = {
          uid: 123401,
          gid: 123401,
          mode: 16877,
        };

        Logger.debug('Folder created:', path);

        fs.mkdirSync(_path.join(this.paths.local, path));

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
        delete this.files[path];

        unlink(_path.join(this.paths.local, path), (err) => {
          if (err) {
            Logger.error('ERROR DELETING FILE', err);
            return cb(fuse.EIO);
          }

          cb(0);
        });
      },
      rmdir: (path: string, cb: (code: number) => void) => {
        Logger.debug(`RMDIR ${path}`);
        delete this.folders[path];

        fs.rmdirSync(_path.join(this.paths.local, path));

        cb(0);
      },
    };
  }

  async start(): Promise<void> {
    const ops = this.getOpt();

    this._fuse = new fuse(this.paths.root, ops, {
      debug: false,
      mkdir: true,
      force: true,
    });

    this._fuse.mount((err: any) => {
      if (err) {
        Logger.error(`FUSE mount error: ${err}`);
      }
    });
  }

  async stop(): Promise<void> {
    this._fuse?.unmount((err: any) => {
      if (err) {
        Logger.error(`FUSE unmount error: ${err}`);
      }
    });
  }
}
