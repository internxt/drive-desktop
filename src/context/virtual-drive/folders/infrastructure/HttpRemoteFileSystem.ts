import { Axios } from 'axios';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { OfflineFolder } from '../domain/OfflineFolder';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { CreateFolderDTO } from './dtos/CreateFolderDTO';

export class HttpRemoteFileSystem implements RemoteFileSystem {
  public folders: Record<string, Folder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios
  ) {}

  async persist(offline: OfflineFolder): Promise<FolderAttributes> {
    if (!offline.name) {
      throw new Error('Bad folder name');
    }

    const body: CreateFolderDTO = {
      folderName: offline.name,
      parentFolderId: offline.parentId,
      uuid: offline.uuid,
    };

    const response = await this.driveClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      body
    );

    if (response.status !== 201) {
      throw new Error('Folder creation failed');
    }

    const serverFolder = response.data as ServerFolder | null;

    if (!serverFolder) {
      throw new Error('Folder creation failed, no data returned');
    }

    return {
      id: serverFolder.id,
      uuid: serverFolder.uuid,
      parentId: serverFolder.parentId,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
      path: offline.path.value,
      status: FolderStatuses.EXISTS,
    };
  }

  async trash(id: Folder['id']): Promise<void> {
    const result = await this.trashClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id }],
      }
    );

    if (result.status !== 200) {
      Logger.error(
        '[FOLDER FILE SYSTEM] Folder deletion failed with status: ',
        result.status,
        result.statusText
      );

      throw new Error('Error when deleting folder');
    }
  }

  async rename(folder: Folder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/folder/${folder.id}/meta`;

    const body: UpdateFolderNameDTO = {
      metadata: { itemName: folder.name },
      relativePath: uuid.v4(),
    };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(
        `[FOLDER FILE SYSTEM] Error updating item metadata: ${res.status}`
      );
    }
  }

  async move(folder: Folder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/folder`;

    const body = { destination: folder.parentId, folderId: folder.id };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[FOLDER FILE SYSTEM] Error moving item: ${res.status}`);
    }
  }
}
