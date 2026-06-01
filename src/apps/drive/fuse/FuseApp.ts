import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { VirtualDrive } from '../virtual-drive/VirtualDrive';
import { FuseDriveStatus } from './FuseDriveStatus';
import { CreateCallback } from './callbacks/CreateCallback';
import { GetAttributesCallback } from './callbacks/GetAttributesCallback';
import { GetXAttributeCallback } from './callbacks/GetXAttributeCallback';
import { MakeDirectoryCallback } from './callbacks/MakeDirectoryCallback';
import { OpenCallback } from './callbacks/OpenCallback';
// import { ReadCallback } from './callbacks/ReadCallback';
import { ReaddirCallback } from './callbacks/ReaddirCallback';
import { ReleaseCallback } from './callbacks/ReleaseCallback';
import { RenameMoveOrTrashCallback } from './callbacks/RenameOrMoveCallback';
import { TrashFileCallback } from './callbacks/TrashFileCallback';
import { TrashFolderCallback } from './callbacks/TrashFolderCallback';
import { WriteCallback } from './callbacks/WriteCallback';
// import { mountPromise } from './helpers';
import { execFile } from 'node:child_process';
import { EventEmitter } from 'stream';

export class FuseApp extends EventEmitter {
  private status: FuseDriveStatus = 'UNMOUNTED';
  private static readonly MAX_INT_32 = 2147483647;
  private static readonly MAX_RETRIES = 5;
  // private _fuse: Fuse | undefined;

  constructor(
    private readonly virtualDrive: VirtualDrive,
    private readonly container: Container,
    private readonly localRoot: string,
    // private readonly remoteRoot: number,
    // private readonly remoteRootUuid: string,
  ) {
    super();
  }

  private getOpt() {
    const readdir = new ReaddirCallback(this.container);
    const getattr = new GetAttributesCallback(this.container);
    const open = new OpenCallback(this.virtualDrive, this.container);
    // const read = new ReadCallback(this.container);
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
      // read: read.execute.bind(read),
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

  // async start() {
  //   const ops = this.getOpt();

  //   this._fuse = new Fuse(this.localRoot, ops, {
  //     debug: false,
  //     force: true,
  //     autoUnmount: true,
  //     maxRead: FuseApp.MAX_INT_32,
  //   });

  //   const mountSuccessful = await this.mountWithRetries();
  //   if (!mountSuccessful) {
  //     logger.error({ msg: '[FUSE] mount error after max retries' });
  //     this.emit('mount-error');
  //     return;
  //   }

  //   await this.update();
  // }

  async stop() {
    // if (!this._fuse) {
    //   return;
    // }

    await this.unmountFuse();
    // this._fuse = undefined;
    this.status = 'UNMOUNTED';
  }

  private unmountFuse(): Promise<void> {
    const fusermount = '/usr/bin/fusermount';
    return new Promise((resolve) => {
      execFile(fusermount, ['-u', this.localRoot], (err) => {
        if (!err) {
          resolve();
          return;
        }
        logger.debug({ msg: '[FUSE] non-lazy unmount failed, trying lazy unmount', error: err });
        execFile(fusermount, ['-uz', this.localRoot], (err2) => {
          if (err2) {
            logger.error({ msg: '[FUSE] lazy unmount failed:', error: err2 });
          }
          resolve();
        });
      });
    });
  }

  // async clearCache(): Promise<void> {
  //   clearHydrationState();
  //   await this.container.get(StorageClearer).run();
  // }

  // async update() {
  //   try {
  //     const tree = await this.container.get(RemoteTreeBuilder)
  //     .run(this.remoteRoot, this.remoteRootUuid);

  //     Promise.all([
  //       this.container.get(FileRepositorySynchronizer).run(tree.files),
  //       this.container.get(FolderRepositorySynchronizer).run(tree.folders),
  //       this.container.get(StorageRemoteChangesSyncher).run(),
  //     ]);

  //     logger.debug({ msg: '[FUSE] Tree updated successfully' });
  //   } catch (err) {
  //     logger.error({ msg: '[FUSE] Error Updating the tree:', error: err });
  //   }
  // }

  getStatus() {
    return this.status;
  }

  async mount() {
    if (this.status === 'MOUNTED') {
      logger.debug({ msg: '[FUSE] Already mounted' });
      return this.status;
    }

    // if (!this._fuse) {
    //   logger.error({ msg: '[FUSE] Cannot mount: FUSE instance not initialized' });
    //   return this.status;
    // }

    try {
      // await mountPromise(this._fuse);
      this.status = 'MOUNTED';
      this.emit('mounted');
    } catch (err) {
      this.status = 'ERROR';
      logger.error({ msg: '[FUSE] mount error:', error: err });
    }

    return this.status;
  }

  // private async mountWithRetries(): Promise<boolean> {
  //   for (let attempt = 1; attempt <= FuseApp.MAX_RETRIES; attempt++) {
  //     const status = await this.mount();

  //     if (status === 'MOUNTED') return true;

  //     if (attempt < FuseApp.MAX_RETRIES) {
  //       const delay = Math.min(1000 * attempt, 3000);
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //   }

  //   return false;
  // }
}
