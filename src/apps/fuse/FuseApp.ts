import fs, { unlink } from 'fs';
import _path from 'path';
import Logger from 'electron-log';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { Readdir } from './callbacks/Readdir';
import { GetAttributes } from './callbacks/GetAttributes';
import { Open } from './callbacks/Open';
import { Read } from './callbacks/Read';
import { RenameOrMove } from './callbacks/RenameAndMove';
import { ListXAttributes } from './callbacks/ListXAttributes';
import { GetXAttribute } from './callbacks/GetXAttribute';
import { CreateFile } from './callbacks/CreateFile';
import { CreateFolder } from './callbacks/CreateFolder';
import { TrashFile } from './callbacks/TrashFile';
import { TrashFolder } from './callbacks/TrashFolder';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class FuseApp {
  private _fuse: any;

  constructor(
    private readonly container: DependencyContainer,
    private readonly paths: {
      root: string;
      local: string;
    }
  ) {}

  private getOpt() {
    const listXAttributes = new ListXAttributes();
    const getXAttribute = new GetXAttribute();
    const readdir = new Readdir(this.container);
    const getattr = new GetAttributes(this.container);
    const open = new Open(this.container);
    const read = new Read(this.container);
    const renameOrMove = new RenameOrMove(this.container);
    const createFile = new CreateFile(this.container);
    const createFolder = new CreateFolder(this.container);
    const trashFile = new TrashFile(this.container);
    const trashFolder = new TrashFolder(this.container);

    return {
      listxattr: listXAttributes.execute.bind(listXAttributes),
      getxattr: getXAttribute.export.bind(getXAttribute),
      getattr: getattr.execute.bind(getattr),
      readdir: readdir.execute.bind(readdir),
      open: open.execute.bind(open),
      read: read.execute.bind(read),
      rename: renameOrMove.execute.bind(renameOrMove),
      create: createFile.execute.bind(createFile),
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
      mkdir: createFolder.execute.bind(createFolder),
      release: function (
        readPath: string,
        fd: number,
        cb: (status: number) => void
      ): void {
        Logger.debug(`RELEASE ${readPath}`);
        cb(0);
      },
      unlink: trashFile.execute.bind(trashFile),
      rmdir: trashFolder.execute.bind(trashFolder),
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
