import fs, { unlink } from 'fs';
import _path from 'path';
import Logger from 'electron-log';
import { DependencyContainer } from './dependency-injection/virtual-drive/DependencyContainer';
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
import { OfflineDriveDependencyContainer } from './dependency-injection/offline/OfflineDriveDependencyContainer';
import { WriteFile } from './callbacks/WriteFile';
import { ReleaseCallback } from './callbacks/ReleaseCallback';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class FuseApp {
  private _fuse: any;

  constructor(
    private readonly virtualDriveContainer: DependencyContainer,
    private readonly offlineDriveContainer: OfflineDriveDependencyContainer,
    private readonly paths: {
      root: string;
      local: string;
    }
  ) {}

  private getOpt() {
    const listXAttributes = new ListXAttributes();
    const getXAttribute = new GetXAttribute();
    const readdir = new Readdir(this.virtualDriveContainer);
    const getattr = new GetAttributes(
      this.virtualDriveContainer,
      this.offlineDriveContainer
    );
    const open = new Open(this.virtualDriveContainer);
    const read = new Read(this.virtualDriveContainer);
    const renameOrMove = new RenameOrMove(this.virtualDriveContainer);
    const createFile = new CreateFile(this.offlineDriveContainer);
    const createFolder = new CreateFolder(this.virtualDriveContainer);
    const trashFile = new TrashFile(this.virtualDriveContainer);
    const trashFolder = new TrashFolder(this.virtualDriveContainer);
    const writeFile = new WriteFile(this.offlineDriveContainer);
    const release = new ReleaseCallback(this.offlineDriveContainer);

    return {
      listxattr: listXAttributes.execute.bind(listXAttributes),
      getxattr: getXAttribute.export.bind(getXAttribute),
      getattr: getattr.execute.bind(getattr),
      readdir: readdir.execute.bind(readdir),
      open: open.execute.bind(open),
      read: read.execute.bind(read),
      rename: renameOrMove.execute.bind(renameOrMove),
      create: createFile.execute.bind(createFile),
      write: writeFile.execute.bind(writeFile),
      mkdir: createFolder.execute.bind(createFolder),
      release: release.execute.bind(release),
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
