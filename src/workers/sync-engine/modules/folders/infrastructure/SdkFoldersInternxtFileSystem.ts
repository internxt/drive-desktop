import { Storage } from '@internxt/sdk/dist/drive/storage';
import { Axios } from 'axios';
import * as uuid from 'uuid';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { Folder } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { OfflineFolder } from '../domain/OfflineFolder';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { FolderInternxtFileSystem } from '../domain/FolderInternxtFileSystem';

export class SdkFoldersInternxtFileSystem implements FolderInternxtFileSystem {
  constructor(
    private readonly sdk: Storage,
    private readonly driveClient: Axios
  ) {}
  async trash(folder: Folder): Promise<void> {
    await this.sdk.addItemsToTrash({
      items: [{ type: 'folder', id: folder.id as unknown as string }],
    });
  }
  async create(offlineFolder: OfflineFolder): Promise<Folder> {
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

    const folder = Folder.create({
      id: serverFolder.id,
      uuid: serverFolder.uuid,
      parentId: serverFolder.parentId,
      updatedAt: serverFolder.updatedAt,
      createdAt: serverFolder.createdAt,
      path: offlineFolder.path.value,
      status: FolderStatuses.EXISTS,
    });

    return folder;
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
