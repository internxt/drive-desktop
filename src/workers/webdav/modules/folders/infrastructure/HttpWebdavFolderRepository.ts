import { Axios } from 'axios';
import { Nullable } from 'shared/types/Nullable';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { Traverser } from '../../items/application/Traverser';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { WebdavIpc } from '../../../ipc';
import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';
import { FolderStatuses } from '../domain/FolderStatus';

export class HttpWebdavFolderRepository implements WebdavFolderRepository {
  private folders: Record<string, WebdavFolder> = {};
  private optimisticFolders: Record<string, WebdavFolder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly traverser: Traverser,
    private readonly ipc: WebdavIpc
  ) {}

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const remoteItemsGenerator = new RemoteItemsGenerator(this.ipc);
    return remoteItemsGenerator.getAll();
  }

  oldFolderIsBeingUpdated(newFolder: WebdavFolder) {
    const oldFolders = Object.values(this.optimisticFolders);

    return oldFolders.find((oldPolder) => oldPolder.id === newFolder.id)
      ? true
      : false;
  }

  cleanOptimisticFolders(newFolder: WebdavFolder) {
    const optimisticFolders = Object.values(this.optimisticFolders);

    const oldFolder = optimisticFolders.find(
      (folder) => folder.id === newFolder.id
    );

    if (
      oldFolder &&
      newFolder.updatedAt.getTime() > oldFolder?.updatedAt.getTime()
    ) {
      Logger.info('Cleaning optimistic folder', oldFolder);
      delete this.optimisticFolders[oldFolder.path.value];
      if (oldFolder.lastPath?.value) {
        delete this.optimisticFolders[oldFolder.lastPath?.value];
      }
    }
  }

  public async init(): Promise<void> {
    try {
      const raw = await this.getTree();

      this.traverser.reset();
      const all = this.traverser.run(raw);

      const folders = Object.entries(all).filter(([_, value]) => {
        if (!value.isFolder()) return false;

        this.cleanOptimisticFolders(value);
        return (
          value.isFolder() &&
          value.hasStatus(FolderStatuses.EXISTS) &&
          !this.oldFolderIsBeingUpdated(value)
        );
      }) as Array<[string, WebdavFolder]>;

      const serverFolders = folders.reduce((items, [key, value]) => {
        items[key] = value;

        return items;
      }, {} as Record<string, WebdavFolder>);

      const filteredOptimisticFolders: Record<string, WebdavFolder> = {};

      Object.keys(this.optimisticFolders).forEach((optimisticFolderPath) => {
        if (
          this.optimisticFolders[optimisticFolderPath].hasStatus(
            FolderStatuses.EXISTS
          )
        ) {
          filteredOptimisticFolders[optimisticFolderPath] =
            this.optimisticFolders[optimisticFolderPath];
        }
      });

      this.folders = {
        ...serverFolders,
        ...filteredOptimisticFolders,
      };
    } catch (err) {
      Logger.info('FOLDER ERRS', err);
    }
  }

  search(path: string): Nullable<WebdavFolder> {
    const folder = this.optimisticFolders[path] || this.folders[path];
    if (!folder) return;

    if (!folder.hasStatus(FolderStatuses.EXISTS)) return;
    return folder;
  }

  async create(path: FolderPath, parentId: number): Promise<WebdavFolder> {
    const plainName = path.name();

    if (!plainName) {
      throw new Error('Bad folder name');
    }

    const optimisticFolder = WebdavFolder.create({
      id: -1,
      status: FolderStatuses.EXISTS,
      parentId: -1,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: path.value,
    });

    this.optimisticFolders[path.value] = optimisticFolder;
    try {
      const response = await this.driveClient.post(
        `${process.env.API_URL}/api/storage/folder`,
        {
          folderName: plainName,
          parentFolderId: parentId,
        }
      );

      if (response.status !== 201) {
        throw new Error('Folder creation failded');
      }

      const serverFolder = response.data as ServerFolder | null;

      if (!serverFolder) {
        throw new Error('Folder creation failded, no data returned');
      }

      const folder = optimisticFolder.update({
        id: serverFolder.id,
        parentId: serverFolder.parentId,
        updatedAt: serverFolder.updatedAt,
        createdAt: serverFolder.createdAt,
        path: path.value,
      });

      this.optimisticFolders[path.value] = folder;

      return folder;
    } catch (error) {
      delete this.optimisticFolders[path.value];

      throw error;
    }
  }

  async updateName(folder: WebdavFolder): Promise<void> {
    try {
      if (!folder.lastPath)
        throw new Error('Cannot rename without knowing last folder path');

      this.optimisticFolders[folder.path.value] = folder;

      const url = `${process.env.API_URL}/api/storage/folder/${folder.id}/meta`;

      const body: UpdateFolderNameDTO = {
        metadata: { itemName: folder.name },
        relativePath: uuid.v4(),
      };

      const res = await this.driveClient.post(url, body);

      if (res.status !== 200) {
        throw new Error(
          `[REPOSITORY] Error updating item metadata: ${res.status}`
        );
      }
    } catch (error) {
      delete this.optimisticFolders[folder.path.value];

      throw error;
    }
  }

  async updateParentDir(folder: WebdavFolder): Promise<void> {
    try {
      this.optimisticFolders[folder.path.value] = folder;
      const url = `${process.env.API_URL}/api/storage/move/folder`;

      const body = { destination: folder.parentId, folderId: folder.id };

      const res = await this.driveClient.post(url, body);

      if (res.status !== 200) {
        throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
      }

      await this.init();
    } catch (error) {
      delete this.optimisticFolders[folder.path.value];
    }
  }

  async searchOn(folder: WebdavFolder): Promise<Array<WebdavFolder>> {
    await this.init();
    return Object.values(this.folders).filter((f) => f.isIn(folder));
  }

  async trash(folder: WebdavFolder): Promise<void> {
    try {
      this.optimisticFolders[folder.path.value] = folder;

      const result = await this.trashClient.post(
        `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
        {
          items: [{ type: 'folder', id: folder.id }],
        }
      );

      if (result.status === 200) {
        return;
      }

      Logger.error(
        '[FOLDER REPOSITORY] Folder deletion failed with status: ',
        result.status,
        result.statusText
      );

      await this.ipc.invoke('START_REMOTE_SYNC');
    } catch (error) {
      delete this.optimisticFolders[folder.path.value];
    }
  }
}
