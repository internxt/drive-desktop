import { Axios } from 'axios';
import Logger from 'electron-log';
import nodePath from 'path';
import { Nullable } from 'shared/types/Nullable';
import * as uuid from 'uuid';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';
import { Traverser } from '../../items/application/Traverser';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatuses } from '../domain/FolderStatus';
import { ManagedFolderRepository } from '../domain/ManagedFolderRepository';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';

export class HttpFolderRepository
  implements FolderRepository, ManagedFolderRepository
{
  public folders: Record<string, Folder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly traverser: Traverser,
    private readonly ipc: SyncEngineIpc
  ) {}

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const remoteItemsGenerator = new RemoteItemsGenerator(this.ipc);
    return remoteItemsGenerator.getAll();
  }

  public async init(
    startingFolders: Record<string, Folder> = {}
  ): Promise<void> {
    const raw = await this.getTree();

    this.traverser.reset();
    const all = this.traverser.run(raw);

    const folders = Object.entries(all).filter(
      ([_key, value]) =>
        value instanceof Folder && value.hasStatus(FolderStatuses.EXISTS)
    ) as Array<[string, Folder]>;

    this.folders = folders.reduce((items, [key, value]) => {
      if (items[key] === undefined) {
        items[key] = value;
      } else if (value.updatedAt > items[key].updatedAt) {
        items[key] = value;
      }

      return items;
    }, startingFolders);
  }

  private async reload(): Promise<void> {
    await this.init(this.folders);
  }

  search(path: string): Nullable<Folder> {
    return this.folders[path];
  }

  searchByPartial(partial: Partial<FolderAttributes>): Nullable<Folder> {
    const keys = Object.keys(partial) as Array<keyof Partial<FolderAttributes>>;

    const folder = Object.values(this.folders).find((folder) => {
      return keys.every((key) => folder.attributes()[key] === partial[key]);
    });

    if (folder) {
      return Folder.from(folder.attributes());
    }

    return undefined;
  }

  async create(
    path: FolderPath,
    parentId: number,
    uuid: Folder['uuid']
  ): Promise<Folder> {
    const plainName = path.name();

    if (!plainName) {
      throw new Error('Bad folder name');
    }

    const response = await this.driveClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      {
        folderName: plainName,
        parentFolderId: parentId,
        uuid,
      }
    );

    if (response.status !== 201) {
      throw new Error('Folder creation failed');
    }

    const serverFolder = response.data as ServerFolder | null;

    if (!serverFolder) {
      throw new Error('Folder creation failed, no data returned');
    }

    const folder = Folder.create({
      id: serverFolder.id,
      uuid: serverFolder.uuid,
      parentId: serverFolder.parentId,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
      path: path.value,
      status: FolderStatuses.EXISTS,
    });

    const normalized = nodePath.normalize(folder.path.value);
    const posix = PlatformPathConverter.winToPosix(normalized);
    this.folders[posix] = folder;

    return folder;
  }

  async updateName(folder: Folder): Promise<void> {
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

    const old = this.searchByPartial({ uuid: folder.uuid });

    if (old) {
      delete this.folders[old?.path.value];
    }

    this.folders[folder.path.value] = folder;
  }

  async updateParentDir(folder: Folder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/folder`;

    const body = { destination: folder.parentId, folderId: folder.id };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    const old = this.searchByPartial({ uuid: folder.uuid });

    if (old) {
      delete this.folders[old?.path.value];
    }

    this.folders[folder.path.value] = folder;
  }

  async searchOn(folder: Folder): Promise<Array<Folder>> {
    await this.reload();
    return Object.values(this.folders).filter((f) => f.isIn(folder));
  }

  async trash(folder: Folder): Promise<void> {
    const result = await this.trashClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id: folder.id }],
      }
    );

    if (result.status !== 200) {
      Logger.error(
        '[FOLDER REPOSITORY] Folder deletion failed with status: ',
        result.status,
        result.statusText
      );
      return;
    }

    const normalized = nodePath.normalize(folder.path.value);
    const posix = PlatformPathConverter.winToPosix(normalized);
    this.folders[posix] = folder;
  }

  /** @deprecated */
  clear(): void {
    this.folders = {};
  }

  insert(folder: Folder): Promise<void> {
    if (this.folders[folder.path.value]) {
      throw new Error('Insert file only should insert non existent');
    }
    this.folders[folder.path.value] = folder;
    return Promise.resolve();
  }
  overwrite(oldFolder: Folder, newFolder: Folder): Promise<void> {
    delete this.folders[oldFolder.path.value];

    this.folders[newFolder.path.value] = newFolder;
    return Promise.resolve();
  }
}
