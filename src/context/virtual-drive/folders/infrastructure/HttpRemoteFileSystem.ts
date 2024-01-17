import axios, { Axios } from 'axios';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { Folder } from '../domain/Folder';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import {
  FolderPersistedDto,
  RemoteFileSystem,
} from '../domain/file-systems/RemoteFileSystem';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { CreateFolderDTO } from './dtos/CreateFolderDTO';
import { FolderPath } from '../domain/FolderPath';
import { FolderUuid } from '../domain/FolderUuid';
import { FolderId } from '../domain/FolderId';

export class HttpRemoteFileSystem implements RemoteFileSystem {
  public folders: Record<string, Folder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios
  ) {}

  async persist(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid
  ): Promise<FolderPersistedDto> {
    const body: CreateFolderDTO = {
      folderName: path.name(),
      parentFolderId: parentId.value,
      uuid: uuid?.value,
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
      parentId: parentId.value,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
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
