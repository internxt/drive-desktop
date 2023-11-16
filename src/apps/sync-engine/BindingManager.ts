import Logger from 'electron-log';
import * as fs from 'fs';
import { VirtualDrive } from 'virtual-drive/dist';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { ItemsSearcher } from '../../context/virtual-drive/items/application/ItemsSearcher';
import { PlatformPathConverter } from '../../context/virtual-drive/shared/application/PlatformPathConverter';
import { buildControllers } from './callbacks-controllers/buildControllers';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';

export type CallbackDownload = (
  success: boolean,
  filePath: string
) => Promise<{ finished: boolean; progress: number }>;
export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  private fuse: any | null = null;

  constructor(
    private readonly paths: {
      root: string;
      icon: string;
    }
  ) {}

  async load(): Promise<void> {
    const tree = await this.container.existingItemsTreeBuilder.run();

    await this.container.repositoryPopulator.run(tree.files);
    await this.container.filesPlaceholderCreator.run(tree.files);

    await this.container.folderRepositoryInitiator.run(tree.folders);
    await this.container.foldersPlaceholderCreator.run(tree.folders);
  }

  async start(version: string, providerId: string) {
    const fuse = require('fuse-native');
    const ops = {
      getattr: (path: string, cb: (code: number, params?: any) => void) => {
        if (path === '/') {
          cb(0, { mode: 16877, size: 0 });
        } else if (path === '/hello.txt') {
          cb(0, { mode: 33188, size: 12 });
        } else {
          cb(Fuse.ENOENT);
        }
      },
      readdir: (path: string, cb: (code: number, params?: any) => void) => {
        if (path === '/') {
          cb(0, ['.', '..', 'hello.txt']);
        } else {
          cb(Fuse.ENOENT);
        }
      },
      open: (path: string, flags, cb: (code: number, params?: any) => void) => {
        if (path === '/hello.txt') {
          cb(0, 123); // Use a unique file descriptor (123 in this example)
        } else {
          cb(Fuse.ENOENT);
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
        if (path === '/hello.txt') {
          const data = Buffer.from('Hello, FUSE!');
          if (pos >= data.length) {
            cb(0);
          } else {
            const slice = data.slice(pos, pos + len);
            slice.copy(buf);
            cb(slice.length);
          }
        } else {
          cb(Fuse.ENOENT);
        }
      },
      release: function (
        readPath: string,
        fd: number,
        cb: (status: number) => void
      ): void {
        throw new Error('Function not implemented.');
      },
    };
    // this.fuse = new fuse(this.paths.root, ops, { debug: true });
    // this.fuse.mount((err: any) => {
    //   if (err) {
    //     Logger.error(`FUSE mount error: ${err}`);
    //   }
    // });

    Logger.debug('FUSE: ', { fuse });

<<<<<<< HEAD:src/workers/sync-engine/BindingManager.ts
    fuse.isConfigured((isConfigured: boolean) => {
      Logger.info(`FUSE is configured: ${isConfigured}`);

      if (!isConfigured) {
        fuse.configure((...params: any[]) => {
          Logger.debug(`FUSE configure cb params: ${{ params }}`);
        });
      }
    });
=======
    await this.container.virtualDrive.connectSyncRoot();

    await this.load();
>>>>>>> windows:src/apps/sync-engine/BindingManager.ts
  }

  watch() {}

  async stop() {
<<<<<<< HEAD:src/workers/sync-engine/BindingManager.ts
    this.fuse?.unmount((err: any) => {
      if (err) {
        Logger.error(`FUSE unmount error: ${err}`);
=======
    await this.container.virtualDrive.disconnectSyncRoot();
  }

  async cleanUp() {
    await VirtualDrive.unregisterSyncRoot(this.paths.root);

    const itemsSearcher = new ItemsSearcher();
    const remainingItems = itemsSearcher.listFilesAndFolders(this.paths.root);

    const files = await this.container.retrieveAllFiles.run();
    const folders = await this.container.retrieveAllFolders.run();

    const items = [...files, ...folders];

    const win32AbsolutePaths = items.map((item) => {
      const posixRelativePath = item.path;
      // este path es relativo al root y en formato posix

      const win32RelativePaths =
        PlatformPathConverter.posixToWin(posixRelativePath);

      return this.container.relativePathToAbsoluteConverter.run(
        win32RelativePaths
      );
    });

    Logger.debug('remainingItems', remainingItems);
    Logger.debug('win32AbsolutePaths', win32AbsolutePaths);
    // find all common string in remainingItems and win32AbsolutePaths
    // and delete them
    const commonItems = remainingItems.filter((item) =>
      win32AbsolutePaths.includes(item)
    );

    const toDeleteFolder: string[] = [];

    commonItems.forEach((item) => {
      try {
        const stat = fs.statSync(item);
        if (stat.isDirectory()) {
          toDeleteFolder.push(item);
        } else if (stat.isFile()) {
          fs.unlinkSync(item);
        }
      } catch (error) {
        Logger.error(error);
      }
    });

    toDeleteFolder.forEach((item) => {
      try {
        fs.rmdirSync(item, { recursive: true });
      } catch (error) {
        Logger.error(error);
>>>>>>> windows:src/apps/sync-engine/BindingManager.ts
      }
    });
  }

<<<<<<< HEAD:src/workers/sync-engine/BindingManager.ts
  async cleanUp() {}
=======
  async update() {
    Logger.info('[SYNC ENGINE]: Updating placeholders');

    try {
      const tree = await this.container.existingItemsTreeBuilder.run();

      await this.container.filesPlaceholderUpdater.run(tree.files);
      await this.container.folderPlaceholderUpdater.run(tree.folders);
    } catch (error) {
      Logger.error('[SYNC ENGINE] ', error);
    }
  }
>>>>>>> windows:src/apps/sync-engine/BindingManager.ts
}
