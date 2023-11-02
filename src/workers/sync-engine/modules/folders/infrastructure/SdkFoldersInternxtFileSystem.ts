import { Storage } from '@internxt/sdk/dist/drive/storage';
import { Axios } from 'axios';
import * as uuid from 'uuid';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { OfflineFolder } from '../domain/OfflineFolder';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { FolderInternxtFileSystem } from '../domain/FolderInternxtFileSystem';

export class SdkFoldersInternxtFileSystem implements FolderInternxtFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly driveClient: Axios,
    private readonly newClient: Axios
  ) {}
  async trash(folder: Folder): Promise<void> {
    const result = await this.newClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id: folder.id }],
      }
    );

    if (result.status !== 200) {
      throw new Error(`Could not trash the folder with id: ${folder.id}`);
    }

    return Promise.resolve();
  }
  async create(offlineFolder: OfflineFolder): Promise<FolderAttributes> {
    if (!offlineFolder.name) {
      throw new Error('Bad folder name');
    }

    const response = await this.driveClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      {
        folderName: offlineFolder.name,
        parentFolderId: offlineFolder.parentId,
        uuid: offlineFolder.uuid,
      }
    );

    if (response.status !== 201) {
      throw new Error('Folder creation failed');
    }

    const serverFolder = response.data as ServerFolder | null;

    if (!serverFolder) {
      throw new Error('Folder creation failed, no data returned');
    }

    if (!serverFolder.parentId) {
      throw new Error('Folder creation failed, no parent id');
    }

    return {
      id: serverFolder.id,
      uuid: serverFolder.uuid,
      parentId: serverFolder.parentId,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
      path: offlineFolder.path.value,
      status: FolderStatuses.EXISTS,
    };
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
        `[REPOSITORY] Error updating item metadata: ${res.status}`
      );
    }
  }
  async move(folder: Folder): Promise<void> {
    if (!folder.parentId) {
      throw new Error('Cannot move folder to null folder id');
    }

    await this.sdk.moveFolder({
      folderId: folder.id,
      destinationFolderId: folder.parentId,
    });
  }
}
