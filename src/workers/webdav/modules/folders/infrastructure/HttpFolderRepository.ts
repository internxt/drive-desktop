import { Axios } from 'axios';
import { Nullable } from 'shared/types/Nullable';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { Traverser } from '../../items/application/Traverser';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { VirtualDriveIpc } from '../../../ipc';
import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';
import { FolderStatuses } from '../domain/FolderStatus';

export class HttpFolderRepository implements FolderRepository {
  public folders: Record<string, Folder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly traverser: Traverser,
    private readonly ipc: VirtualDriveIpc
  ) {}

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const remoteItemsGenerator = new RemoteItemsGenerator(this.ipc);
    return remoteItemsGenerator.getAll();
  }

  public async init(): Promise<void> {
    const raw = await this.getTree();

    this.traverser.reset();
    const all = this.traverser.run(raw);

    const folders = Object.entries(all).filter(
      ([_key, value]) =>
        value instanceof Folder && value.hasStatus(FolderStatuses.EXISTS)
    ) as Array<[string, Folder]>;

    this.folders = folders.reduce((items, [key, value]) => {
      items[key] = value;

      return items;
    }, {} as Record<string, Folder>);
  }

  search(path: string): Nullable<Folder> {
    return this.folders[path];
  }

  async create(path: FolderPath, parentId: number): Promise<Folder> {
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

    const folder = Folder.create({
      id: serverFolder.id,
      uuid: serverFolder.uuid,
      parentId: serverFolder.parentId,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
      path: path.value,
      status: FolderStatuses.EXISTS,
    });

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
  }

  async updateParentDir(folder: Folder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/folder`;

    const body = { destination: folder.parentId, folderId: folder.id };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    await this.init();
  }

  async searchOn(folder: Folder): Promise<Array<Folder>> {
    await this.init();
    return Object.values(this.folders).filter((f) => f.isIn(folder));
  }

  async trash(folder: Folder): Promise<void> {
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
  }
}
