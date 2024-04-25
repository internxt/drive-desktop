import { Container } from 'diod';
import Logger from 'electron-log';
import { StorageClearer } from '../../../context/storage/StorageFiles/application/delete/StorageClearer';
import { FileRepositoryInitializer } from '../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { FolderRepositoryInitializer } from '../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { TreeBuilder } from '../../../context/virtual-drive/tree/application/TreeBuilder';
import { VirtualDrive } from '../VirtualDrive';
import { FuseDriveStatus } from './FuseDriveStatus';
import { CreateCallback } from './callbacks/CreateCallback';
import { GetAttributesCallback } from './callbacks/GetAttributesCallback';
import { GetXAttributeCallback } from './callbacks/GetXAttributeCallback';
import { MakeDirectoryCallback } from './callbacks/MakeDirectoryCallback';
import { OpenCallback } from './callbacks/OpenCallback';
import { ReadCallback } from './callbacks/ReadCallback';
import { ReaddirCallback } from './callbacks/ReaddirCallback';
import { ReleaseCallback } from './callbacks/ReleaseCallback';
import { RenameMoveOrTrashCallback } from './callbacks/RenameOrMoveCallback';
import { TrashFileCallback } from './callbacks/TrashFileCallback';
import { TrashFolderCallback } from './callbacks/TrashFolderCallback';
import { WriteCallback } from './callbacks/WriteCallback';
import { mountPromise, unmountPromise } from './helpers';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export class FuseApp {
  private status: FuseDriveStatus = 'UNMOUNTED';
  private static readonly MAX_INT_32 = 2147483647;
  private _fuse: any;

  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly container: Container,
    private readonly root: string
  ) {}

  private async getOpt() {
    const readdir = new ReaddirCallback(this.container);
    const getattr = new GetAttributesCallback(this.container);
    const open = new OpenCallback(this.virtualDrive);
    const read = new ReadCallback(this.container);
    const renameOrMove = new RenameMoveOrTrashCallback(this.container);
    const create = new CreateCallback(this.container);
    const makeDirectory = new MakeDirectoryCallback(this.container);
    const trashFile = new TrashFileCallback(this.container);
    const trashFolder = new TrashFolderCallback(this.container);
    const write = new WriteCallback(this.container);
    const release = new ReleaseCallback(this.container);
    const getXAttributes = new GetXAttributeCallback(this.virtualDrive);

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
      getxattr: getXAttributes.handle.bind(getXAttributes),
    };
  }

  async start(): Promise<void> {
    const ops = await this.getOpt();

    this._fuse = new fuse(this.root, ops, {
      debug: false,
      force: true,
      maxRead: FuseApp.MAX_INT_32,
    });

    try {
      await mountPromise(this._fuse);
      this.status = 'MOUNTED';
      Logger.info('[FUSE] mounted');
    } catch (firstMountError) {
      Logger.error(`[FUSE] mount error: ${firstMountError}`);
      try {
        await unmountPromise(this._fuse);
        await mountPromise(this._fuse);
        this.status = 'MOUNTED';
        Logger.info('[FUSE] mounted');
      } catch (err) {
        this.status = 'ERROR';
        Logger.error(`[FUSE] mount error: ${err}`);
      }
    }
  }

  async stop(): Promise<void> {
    //no-op
  }

  async clearCache(): Promise<void> {
    await this.container.get(StorageClearer).run();
  }

  async update(): Promise<void> {
    try {
      const tree = await this.container.get(TreeBuilder).run();

      await this.container.get(FileRepositoryInitializer).run(tree.files);

      await this.container.get(FolderRepositoryInitializer).run(tree.folders);

      Logger.info('[FUSE] Tree updated successfully');
    } catch (err) {
      Logger.error('[FUSE] Updating the tree ', err);
    }
  }

  getStatus() {
    return this.status;
  }

  async mount() {
    try {
      await unmountPromise(this._fuse);
      await mountPromise(this._fuse);
      this.status = 'MOUNTED';
    } catch (err) {
      this.status = 'ERROR';
      Logger.error(`[FUSE] mount error: ${err}`);
    }

    return this.status;
  }
}
