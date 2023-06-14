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
import { ipc } from '../../../ipc';

export class HttpWebdavFolderRepository implements WebdavFolderRepository {
  private folders: Record<string, WebdavFolder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly traverser: Traverser
  ) {}

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const updatedRemoteItems = await ipc.invoke('GET_UPDATED_REMOTE_ITEMS');

    const files = updatedRemoteItems.files.map<ServerFile>((updatedFile) => {
      return {
        bucket: updatedFile.bucket,
        createdAt: updatedFile.createdAt,
        encrypt_version: '',
        fileId: updatedFile.fileId,
        folderId: updatedFile.folderId,
        id: updatedFile.id,
        modificationTime: updatedFile.modificationTime,
        name: updatedFile.name,
        size: updatedFile.size,
        type: updatedFile.type,
        updatedAt: updatedFile.updatedAt,
        userId: updatedFile.userId,
      };
    });

    const folders = updatedRemoteItems.folders.map<ServerFolder>(
      (updatedFolder) => {
        return {
          bucket: updatedFolder.bucket ?? null,
          created_at: updatedFolder.createdAt,
          id: updatedFolder.id,
          name: updatedFolder.name,
          parent_id: updatedFolder.parentId ?? null,
          updated_at: updatedFolder.updatedAt,
          plain_name: updatedFolder.plainName ?? null,
        };
      }
    );

    return { files, folders };
  }

  public async init(): Promise<void> {
    try {
      const raw = await this.getTree();

      this.traverser.reset();
      const all = this.traverser.run(raw);

      const folders = Object.entries(all).filter(([_key, value]) =>
        value.isFolder()
      ) as Array<[string, WebdavFolder]>;

      this.folders = folders.reduce((items, [key, value]) => {
        items[key] = value;
        return items;
      }, {} as Record<string, WebdavFolder>);
    } catch (err) {
      Logger.error('FOLDER ERRS', err);
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
      name: plainName,
      parentId: serverFolder.parent_id,
      updatedAt: serverFolder.updated_at,
      createdAt: serverFolder.created_at,
      path: path.value,
    });

    this.folders[path.value] = folder;

    return folder;
  }

  async updateName(folder: WebdavFolder): Promise<void> {
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

    delete this.folders[folder.path];
    this.folders[folder.path] = folder;
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
      delete this.folders[folder.path];
      return;
    }

    Logger.error(
      '[FOLDER REPOSITORY] Folder deletion failed with status: ',
      result.status,
      result.statusText
    );
  }
}
