import Logger from 'electron-log';
import { ReaddirCallback } from './callbacks/ReaddirCallback';
import { GetAttributesCallback } from './callbacks/GetAttributesCallback';
import { OpenCallback } from './callbacks/OpenCallback';
import { ReadCallback } from './callbacks/ReadCallback';
import { RenameOrMoveCallback } from './callbacks/RenameOrMoveCallback';
import { CreateCallback } from './callbacks/CreateCallback';
import { MakeDirectoryCallback } from './callbacks/MakeDirectoryCallback';
import { TrashFileCallback } from './callbacks/TrashFileCallback';
import { TrashFolderCallback } from './callbacks/TrashFolderCallback';
import { WriteCallback } from './callbacks/WriteCallback';
import { ReleaseCallback } from './callbacks/ReleaseCallback';
import { FuseDependencyContainer } from './dependency-injection/FuseDependencyContainer';
import { ensureFolderExists } from './../shared/fs/ensure-folder-exists';
import { mountPromise, unmountPromise } from './helpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class FuseApp {
  private static readonly MAX_INT_32 = 2147483647;
  private _fuse: any;

  constructor(
    private readonly fuseContainer: FuseDependencyContainer,
    private readonly paths: {
      root: string;
      local: string;
    }
  ) {}

  private async getOpt() {
    const readdir = new ReaddirCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const getattr = new GetAttributesCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const open = new OpenCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const read = new ReadCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const renameOrMove = new RenameOrMoveCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const create = new CreateCallback(this.fuseContainer.offlineDriveContainer);
    const makeDirectory = new MakeDirectoryCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const trashFile = new TrashFileCallback(
      this.fuseContainer.virtualDriveContainer,
      this.fuseContainer.offlineDriveContainer
    );
    const trashFolder = new TrashFolderCallback(
      this.fuseContainer.virtualDriveContainer
    );
    const write = new WriteCallback(this.fuseContainer.offlineDriveContainer);
    const release = new ReleaseCallback(
      this.fuseContainer.offlineDriveContainer,
      this.fuseContainer.virtualDriveContainer
    );

    return {
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
    };
  }

  async start(): Promise<void> {
    const ops = await this.getOpt();
    ensureFolderExists(this.paths.root);
    ensureFolderExists(this.paths.local);

    this._fuse = new fuse(this.paths.root, ops, {
      debug: false,
      force: true,
      maxRead: FuseApp.MAX_INT_32,
    });

    try {
      await mountPromise(this._fuse);
      Logger.info('[FUSE] mounted');
    } catch (firstMountError) {
      Logger.error(`[FUSE] mount error: ${firstMountError}`);
      try {
        await unmountPromise(this._fuse);
        await mountPromise(this._fuse);
      } catch (err) {
        Logger.error(`[FUSE] mount error: ${err}`);
      }
    }
  }

  async stop(): Promise<void> {
    //no-op
  }

  async clearCache(): Promise<void> {
    await this.fuseContainer.virtualDriveContainer.allLocalContentsDeleter.run();
  }

  async update(): Promise<void> {
    try {
      const tree =
        await this.fuseContainer.virtualDriveContainer.existingNodesTreeBuilder.run();

      await this.fuseContainer.virtualDriveContainer.repositoryPopulator.run(
        tree.files
      );

      await this.fuseContainer.virtualDriveContainer.folderRepositoryInitiator.run(
        tree.folders
      );

      Logger.info('[FUSE] Tree updated successfully');
    } catch (err) {
      Logger.error('[FUSE] Updating the tree ', err);
    }
  }
}
