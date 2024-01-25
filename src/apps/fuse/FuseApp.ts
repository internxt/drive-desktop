import Logger from 'electron-log';
import { ReaddirCallback } from './callbacks/ReaddirCallback';
import { GetAttributesCallback } from './callbacks/GetAttributesCallback';
import { OpenCallback } from './callbacks/OpenCallback';
import { ReadCallback } from './callbacks/ReadCallback';
import { RenameOrMoveCallback } from './callbacks/RenameOrMoveCallback';
import { ListXAttributesCallback } from './callbacks/ListXAttributesCallback';
import { GetXAttributeCallback } from './callbacks/GetXAttributeCallback';
import { CreateCallback } from './callbacks/CreateCallback';
import { MakeDirectoryCallback } from './callbacks/MakeDirectoryCallback';
import { TrashFileCallback } from './callbacks/TrashFileCallback';
import { TrashFolderCallback } from './callbacks/TrashFolderCallback';
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

  private async getOpt() {
    const listXAttributes = new ListXAttributesCallback();
    const getXAttribute = new GetXAttributeCallback('GetXAttribute');
    const readdir = new ReaddirCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const getattr = new GetAttributesCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const open = new OpenCallback(this.fuseContainer.virtualDriveContainer);
    const read = new ReadCallback(this.fuseContainer.virtualDriveContainer);
    const renameOrMove = new RenameOrMoveCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const create = new CreateCallback(this.fuseContainer.offlineDriveContainer);
    const makeDirectory = new MakeDirectoryCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const trashFile = new TrashFileCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const trashFolder = new TrashFolderCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const write = new WriteCallback(this.fuseContainer.offlineDriveContainer);
    const release = new ReleaseCallback(
      this.fuseContainer.offlineDriveContainer
    );

    return {
      listxattr: listXAttributes.execute.bind(listXAttributes),
      getxattr: getXAttribute.execute.bind(getXAttribute),
      getattr: getattr.handle.bind(getattr),
      readdir: readdir.handle.bind(readdir),
      open: open.handle.bind(open),
      read: read.execute.bind(read),
      rename: renameOrMove.handle.bind(renameOrMove),
      create: create.handle.bind(create),
      write: write.execute.bind(write),
      mkdir: makeDirectory.handle.bind(makeDirectory),
      release: release.handle.bind(release),
      unlink: trashFile.handle.bind(trashFile),
      rmdir: trashFolder.handle.bind(trashFolder),
      // statfs: statfs.execute.bind(statfs),
    };
  }

  async start(): Promise<void> {
    const ops = await this.getOpt();

    this._fuse = new fuse(this.paths.root, ops, {
      debug: false,
      mkdir: true,
      force: true,
    });

    this._fuse.mount((err: any) => {
      if (err) {
        Logger.error(`[FUSE] mount error: ${err}`);
      }
    });
  }

  async stop(): Promise<void> {
    this._fuse?.unmount((err: any) => {
      if (err) {
        Logger.error(`[FUSE] unmount error: ${err}`);
      }
    });
  }

  async clearCache(): Promise<void> {
    await this.fuseContainer.virtualDriveContainer.allLocalContentsDeleter.run();
  }

  async update(): Promise<void> {
    Logger.info('[FUSE] Updating tree');

    const tree =
      await this.fuseContainer.virtualDriveContainer.existingNodesTreeBuilder.run();

    await this.fuseContainer.virtualDriveContainer.repositoryPopulator.run(
      tree.files
    );

    await this.fuseContainer.virtualDriveContainer.folderRepositoryInitiator.run(
      tree.folders
    );

    Logger.info('[FUSE] Tree updated successfully');
  }
}
