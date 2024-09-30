import axios, { Axios } from 'axios';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderStatuses } from '../domain/FolderStatus';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { RemoteFolderSystem } from '../domain/file-systems/RemoteFolderSystem';
import { OfflineFolder } from '../domain/OfflineFolder';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { CreateFolderDTO } from './dtos/CreateFolderDTO';
import * as Sentry from '@sentry/electron/renderer';

export class HttpRemoteFolderSystem implements RemoteFolderSystem {
  public folders: Record<string, Folder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios
  ) {}

  async persist(offline: OfflineFolder): Promise<FolderAttributes> {
    if (!offline.name || !offline.basename) {
      throw new Error('Bad folder name');
    }

    const body: CreateFolderDTO = {
      folderName: offline.basename,
      parentFolderId: offline.parentId,
      uuid: offline.uuid, // TODO: Maybe we can avoid errors sending the uuid, because it's optional
    };

    try {
      const response = await this.driveClient.post(
        `${process.env.API_URL}/storage/folder`,
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
    } catch (error: unknown) {
      Logger.error('[FOLDER FILE SYSTEM] Error creating folder', error);
      Sentry.captureException(error);
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
        const existing = await this.existFolder(offline);
        return existing.status !== FolderStatuses.EXISTS
          ? Promise.reject(error)
          : existing;
      }

      throw error;
    }
  }

  private async existFolder(offline: OfflineFolder): Promise<FolderAttributes> {
    try {
      const response = await this.trashClient.get(
        `${process.env.NEW_DRIVE_URL}/drive/folders/content/${offline.parentUuid}/folders/existence?plainName=${offline.basename}`
      );
      Logger.debug('[FOLDER FILE SYSTEM] Folder already exists', response.data);

      const serverFolder = response.data
        .existentFolders[0] as ServerFolder | null;

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
        status: serverFolder.removed
          ? FolderStatuses.TRASHED
          : FolderStatuses.EXISTS,
      };
    } catch (error) {
      Logger.error('[FOLDER FILE SYSTEM] Error creating folder');
      Sentry.captureException(error);
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
      }

      throw error;
    }
  }

  async checkStatusFolder(uuid: Folder['uuid']): Promise<FolderStatuses> {
    let response;
    try {
      response = await this.trashClient.get(
        `${process.env.NEW_DRIVE_URL}/drive/folders/${uuid}/meta`
      );
    } catch (error) {
      return FolderStatuses.DELETED;
    }

    if (response.status !== 200) {
      Logger.error(
        '[FOLDER FILE SYSTEM] Error getting folder metadata',
        response.status,
        response.statusText
      );
      Sentry.captureException(new Error('Error getting folder metadata'));
      throw new Error('Error getting folder metadata');
    }

    return response.data.status as FolderStatuses;
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
      Sentry.captureException(new Error('Error when deleting folder'));

      throw new Error('Error when deleting folder');
    }
  }

  async rename(folder: Folder): Promise<void> {
    try {
      const url = `${process.env.API_URL}/storage/folder/${folder.id}/meta`;

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
    } catch (error) {
      Logger.error('[FOLDER FILE SYSTEM] Error renaming folder');
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
      }
      Sentry.captureException(error);
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
