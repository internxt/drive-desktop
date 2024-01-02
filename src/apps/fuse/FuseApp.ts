import _path from 'path';
import Logger from 'electron-log';
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
import { WriteCallback } from './callbacks/WriteCallback';
import { ReleaseCallback } from './callbacks/ReleaseCallback';
import { FuseDependencyContainer } from './dependency-injection/FuseDependencyContainer';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class FuseApp {
  private _fuse: any;

  constructor(
    private readonly fuseContainer: FuseDependencyContainer,
    private readonly paths: {
      root: string;
      local: string;
    }
  ) {}

  private getOpt() {
    const listXAttributes = new ListXAttributes();
    const getXAttribute = new GetXAttribute();
    const readdir = new Readdir(this.fuseContainer.virtualDriveContainer);
    const getattr = new GetAttributes(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const open = new Open(this.fuseContainer.virtualDriveContainer);
    const read = new Read(this.fuseContainer.virtualDriveContainer);
    const renameOrMove = new RenameOrMove(
      this.fuseContainer.virtualDriveContainer
    );
    const createFile = new CreateFile(this.fuseContainer.offlineDriveContainer);
    const createFolder = new CreateFolder(
      this.fuseContainer.virtualDriveContainer
    );
    const trashFile = new TrashFile(this.fuseContainer.virtualDriveContainer);
    const trashFolder = new TrashFolder(
      this.fuseContainer.virtualDriveContainer
    );
    const write = new WriteCallback(this.fuseContainer.offlineDriveContainer);
    const release = new ReleaseCallback(
      this.fuseContainer.offlineDriveContainer
    );

    return {
      listxattr: listXAttributes.execute.bind(listXAttributes),
      getxattr: getXAttribute.export.bind(getXAttribute),
      getattr: getattr.execute.bind(getattr),
      readdir: readdir.execute.bind(readdir),
      open: open.execute.bind(open),
      read: read.execute.bind(read),
      rename: renameOrMove.execute.bind(renameOrMove),
      create: createFile.execute.bind(createFile),
      write: write.execute.bind(write),
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
