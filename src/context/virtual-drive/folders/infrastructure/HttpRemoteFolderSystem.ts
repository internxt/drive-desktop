import axios, { Axios } from 'axios';
import { Service } from 'diod';
import Logger from 'electron-log';
import * as uuidv4 from 'uuid';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { Folder, FolderAttributes } from '../domain/Folder';
import { CreateFolderDTO } from './dtos/CreateFolderDTO';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { FolderStatuses } from '../domain/FolderStatus';
import { OfflineFolder } from '../domain/OfflineFolder';

@Service()
export class HttpRemoteFolderSystem {
  constructor(private readonly driveClient: Axios, private readonly trashClient: Axios, private readonly maxRetries: number = 3) {}

  async persist(offline: OfflineFolder): Promise<FolderAttributes> {
    if (!offline.name || !offline.basename) {
      throw new Error('Bad folder name');
    }

    const body: CreateFolderDTO = {
      folderName: offline.basename,
      parentFolderId: offline.parentId,
      uuid: offline.uuid,
    };

    try {
      const response = await this.driveClient.post(`${process.env.API_URL}/storage/folder`, body);
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
        parentUuid: serverFolder.parentUuid || '',
        updatedAt: serverFolder.updatedAt,
        createdAt: serverFolder.createdAt,
        path: offline.path.value,
        status: FolderStatuses.EXISTS,
      };
    } catch (error: unknown) {
      Logger.error('[FOLDER FILE SYSTEM] Error creating folder');
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response);
        const existing = await this.existFolder(offline);
        return existing.status !== FolderStatuses.EXISTS ? Promise.reject(error) : existing;
      }

      throw error;
    }
  }

  private async existFolder(offline: OfflineFolder): Promise<FolderAttributes> {
    try {
      const response = await this.trashClient.post(
        `${process.env.NEW_DRIVE_URL}/drive/folders/content/${offline.parentUuid}/folders/existence`,
        {
          plainNames: [offline.basename],
        },
      );
      Logger.debug('[FOLDER FILE SYSTEM] Folder already exists', response.data);

      const serverFolder = response.data.existentFolders[0] as ServerFolder | null;

      if (!serverFolder) {
        throw new Error('Folder creation failed, no data returned');
      }
      return {
        id: serverFolder.id,
        uuid: serverFolder.uuid,
        parentId: serverFolder.parentId,
        parentUuid: serverFolder.parentUuid || '',
        updatedAt: serverFolder.updatedAt,
        createdAt: serverFolder.createdAt,
        path: offline.path.value,
        status: serverFolder.removed ? FolderStatuses.TRASHED : FolderStatuses.EXISTS,
      };
    } catch (error) {
      Logger.error('[FOLDER FILE SYSTEM] Error creating folder');
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
      }

      throw error;
    }
  }

  async trash(id: Folder['id']): Promise<void> {
    const result = await this.trashClient.post(`${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`, {
      items: [{ type: 'folder', id }],
    });

    if (result.status !== 200) {
      Logger.error('[FOLDER FILE SYSTEM] Folder deletion failed with status: ', result.status, result.statusText);

      throw new Error('Error when deleting folder');
    }
  }

  async getFolderMetadata(folder: Folder): Promise<any> {
    try {
      const url = `${process.env.NEW_DRIVE_URL}/drive/folders/${folder.uuid}/meta`;

      const res = await this.trashClient.get(url);

      if (res.status !== 200) {
        throw new Error(`[FOLDER FILE SYSTEM] Error getting folder metadata: ${res.status}`);
      }

      const serverFolder = res.data as ServerFolder;
      Logger.debug('[FOLDER FILE SYSTEM] Folder metadata', serverFolder);
      return serverFolder;
    } catch (error) {
      Logger.error('[FOLDER FILE SYSTEM] Error getting folder metadata');
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
      }
      throw error;
    }
  }

  async rename(folder: Folder): Promise<void> {
    try {
      const url = `${process.env.API_URL}/storage/folder/${folder.id}/meta`;

      const metadata = await this.getFolderMetadata(folder);

      if (metadata.plainName === folder.name) return;

      const body: UpdateFolderNameDTO = {
        metadata: { itemName: folder.name },
        relativePath: uuidv4.v4(),
      };

      const res = await this.driveClient.post(url, body);

      if (res.status !== 200) {
        throw new Error(`[FOLDER FILE SYSTEM] Error updating item metadata: ${res.status}`);
      }
    } catch (error) {
      Logger.error('[FOLDER FILE SYSTEM] Error renaming folder');
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
      }
      throw error;
    }
  }

  async move(folder: Folder): Promise<void> {
    const url = `${process.env.API_URL}/storage/move/folder`;

    const body = { destination: folder.parentId, folderId: folder.id };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[FOLDER FILE SYSTEM] Error moving item: ${res.status}`);
    }
  }
}
