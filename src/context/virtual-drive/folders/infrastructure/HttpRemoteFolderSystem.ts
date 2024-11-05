import axios, { Axios } from 'axios';
import { Service } from 'diod';
import Logger from 'electron-log';
import * as uuidv4 from 'uuid';
import { Either, left, right } from '../../../shared/domain/Either';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { Folder, FolderAttributes } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderUuid } from '../domain/FolderUuid';

import { CreateFolderDTO } from './dtos/CreateFolderDTO';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';
import { FolderStatuses } from '../domain/FolderStatus';
import { OfflineFolder } from '../domain/OfflineFolder';
import { FileStatuses } from '../../files/domain/FileStatus';
import { File } from '../../files/domain/File';
import {
  FolderPersistedDto,
  RemoteFileSystemErrors,
  RemoteFolderSystem,
} from '../domain/file-systems/RemoteFolderSystem';

type NewServerFolder = Omit<ServerFolder, 'plain_name'> & { plainName: string };

@Service()
export class HttpRemoteFolderSystem implements RemoteFolderSystem {
  private readonly PAGE_SIZE = 50;
  public folders: Record<string, Folder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly maxRetries: number = 3
  ) {}

  async searchWith(
    parentId: FolderId,
    folderPath: FolderPath
  ): Promise<Folder | undefined> {
    let page = 0;
    const folders: Array<NewServerFolder> = [];
    let lastNumberOfFolders = 0;

    do {
      const offset = page * this.PAGE_SIZE;

      // eslint-disable-next-line no-await-in-loop
      const result = await this.trashClient.get(
        `${process.env.NEW_DRIVE_URL}/drive/folders/${parentId.value}/folders?offset=${offset}&limit=${this.PAGE_SIZE}`
      );

      const founded = result.data.result as Array<NewServerFolder>;
      folders.push(...founded);
      lastNumberOfFolders = founded.length;

      page++;
    } while (folders.length % this.PAGE_SIZE === 0 && lastNumberOfFolders > 0);

    const name = folderPath.name();

    const folder = folders.find((folder) => folder.plainName === name);

    if (!folder) return;

    return Folder.from({
      ...folder,
      path: folderPath.value,
    });
  }

  async persistv2(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid,
    attempt = 0
  ): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>> {
    const body: CreateFolderDTO = {
      folderName: path.name(),
      parentFolderId: parentId.value,
      uuid: uuid?.value,
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

      return right({
        id: serverFolder.id,
        uuid: serverFolder.uuid,
        parentId: parentId.value,
        updatedAt: serverFolder.updatedAt,
        createdAt: serverFolder.createdAt,
      });
    } catch (err: any) {
      const { status } = err.response;

      if (status === 400 && attempt < this.maxRetries) {
        Logger.debug('Folder Creation failed with code 400');
        await new Promise((resolve) => {
          setTimeout(resolve, 1_000);
        });
        Logger.debug('Retrying');
        return this.persistv2(path, parentId, uuid, attempt + 1);
      }

      if (status === 400) {
        return left('WRONG_DATA');
      }

      if (status === 409) {
        return left('ALREADY_EXISTS');
      }

      return left('UNHANDLED');
    }
  }

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
      Logger.error('[FOLDER FILE SYSTEM] Error creating folder');
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response);
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
      const response = await this.trashClient.post(
        `${process.env.NEW_DRIVE_URL}/drive/folders/content/${offline.parentUuid}/folders/existence`,
        {
          plainNames: [offline.basename],
        }
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
      if (axios.isAxiosError(error)) {
        Logger.error('[Is Axios Error]', error.response?.data);
      }

      throw error;
    }
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
    try {
      const url = `${process.env.API_URL}/storage/folder/${folder.id}/meta`;

      const body: UpdateFolderNameDTO = {
        metadata: { itemName: folder.name },
        relativePath: uuidv4.v4(),
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

  async checkStatusFile(uuid: File['uuid']): Promise<FileStatuses> {
    Logger.info(`Checking status for file 1 ${uuid}`);
    const response = await this.driveClient.get(
      `${process.env.NEW_DRIVE_URL}/drive/files/${uuid}/meta`
    );

    if (response.status === 404) {
      return FileStatuses.DELETED;
    }

    if (response.status !== 200) {
      Logger.error(
        '[FILE FILE SYSTEM] Error checking file status',
        response.status,
        response.statusText
      );
      throw new Error('Error checking file status');
    }

    return response.data.status as FileStatuses;
  }

  async checkStatusFolder(uuid: Folder['uuid']): Promise<FolderStatuses> {
    Logger.info(`Checking status for folder 1 ${uuid}`);
    let response;
    try {
      response = await this.trashClient.get(
        `${process.env.NEW_DRIVE_URL}/drive/folders/${uuid.toString()}/meta`
      );
    } catch (error) {
      return FolderStatuses.DELETED;
    }
    if (response.status === 404 || response.status === 400) {
      return FolderStatuses.DELETED;
    }

    if (response.status > 400) {
      Logger.error(
        '[FOLDER FILE SYSTEM] Error getting folder metadata',
        response.status,
        response.statusText
      );
      throw new Error('Error getting folder metadata');
    }

    return response.data.status as FolderStatuses;
  }
}
