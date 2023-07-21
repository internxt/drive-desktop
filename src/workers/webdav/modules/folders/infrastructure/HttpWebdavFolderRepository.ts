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
import { FileMetadataCollection } from '../../files/domain/FileMetadataCollection';

export class HttpWebdavFolderRepository implements WebdavFolderRepository {
  private folders: Record<string, WebdavFolder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly traverser: Traverser,
    private readonly ipc: WebdavIpc,
    private readonly inMemoryItems: FileMetadataCollection
  ) {}

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const remoteItemsGenerator = new RemoteItemsGenerator(this.ipc);
    return remoteItemsGenerator.getAll();
  }

  private async cleanInMemoryFolderIfNeeded(
    path: string,
    serverFolder: WebdavFolder
  ) {
    const inMemoryFolder =
      this.inMemoryItems.get(path) || this.inMemoryItems.getByLastPath(path);

    const keepInMemoryItem = inMemoryFolder?.visible === false;

    if (
      !keepInMemoryItem &&
      inMemoryFolder &&
      inMemoryFolder.updatedAt <= serverFolder.updatedAt.getTime()
    ) {
      Logger.info(
        `Removing in memory folder with a server folder at ${path}, InMemory updated at ${new Date(
          inMemoryFolder.updatedAt
        ).toISOString()}, server updated at ${serverFolder.updatedAt.toISOString()} `
      );
      this.inMemoryItems.remove(path);
    }
  }

  public async init(): Promise<void> {
    try {
      const raw = await this.getTree();

      this.traverser.reset();
      const all = this.traverser.run(raw);

      const folders = Object.entries(all).filter(([_, value]) => {
        if (!value.isFolder()) return false;

        return value.isFolder() && value.hasStatus(FolderStatuses.EXISTS);
      }) as Array<[string, WebdavFolder]>;

      const serverFolders = folders.reduce((items, [path, value]) => {
        this.cleanInMemoryFolderIfNeeded(path, value);
        const existsInMemory =
          this.inMemoryItems.exists(path) ||
          this.inMemoryItems.existsByLastPath(path);
        if (existsInMemory) {
          return items;
        }
        items[path] = value;

        return items;
      }, {} as Record<string, WebdavFolder>);

      const inMemoryFolders = this.inMemoryItems.getAllByType('FOLDER');

      const filteredInMemoryFolders: Record<string, WebdavFolder> = {};

      Object.keys(inMemoryFolders).forEach((path) => {
        const inMemoryFolder = inMemoryFolders[path];
        if (!inMemoryFolder.visible) return;

        filteredInMemoryFolders[path] = WebdavFolder.from({
          // -1 means this folder is being created and doesn't exist yet in the server
          id: inMemoryFolder.externalMetadata?.id || -1,
          path: path,
          parentId: inMemoryFolder.externalMetadata?.parentId ?? null,
          updatedAt: new Date(inMemoryFolder.updatedAt).toISOString(),
          createdAt: new Date(inMemoryFolder.createdAt).toISOString(),
          status: FolderStatuses.EXISTS,
        });
      });

      this.folders = {
        ...serverFolders,
        ...filteredInMemoryFolders,
      };
    } catch (err) {
      Logger.info('FOLDER ERRS', err);
    }
  }

  search(path: string): Nullable<WebdavFolder> {
    return this.folders[path];
  }

  async create(path: FolderPath, parentId: number): Promise<WebdavFolder> {
    const plainName = path.name();

    if (!plainName) {
      throw new Error('Bad folder name');
    }

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

    const folder = WebdavFolder.create({
      id: serverFolder.id,
      status: FolderStatuses.EXISTS,
      parentId: serverFolder.parentId,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
      path: path.value,
    });

    return folder;
  }

  async updateName(folder: WebdavFolder): Promise<void> {
    if (!folder.lastPath)
      throw new Error('Cannot rename without knowing last folder path');

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
  }

  async updateParentDir(folder: WebdavFolder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/folder`;

    const body = { destination: folder.parentId, folderId: folder.id };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    await this.init();
  }

  async searchOn(folder: WebdavFolder): Promise<Array<WebdavFolder>> {
    await this.init();
    return Object.values(this.folders).filter((f) => f.isIn(folder));
  }

  async trash(folder: WebdavFolder): Promise<void> {
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
  }

  async runRemoteSync() {
    await this.ipc.invoke('START_REMOTE_SYNC');
  }
}
