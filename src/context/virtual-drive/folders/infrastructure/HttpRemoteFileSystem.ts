import { Axios } from 'axios';
import { Service } from 'diod';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { Either, left, right } from '../../../shared/domain/Either';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { Folder } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderUuid } from '../domain/FolderUuid';
import {
  FolderPersistedDto,
  RemoteFileSystem,
  RemoteFileSystemErrors,
} from '../domain/file-systems/RemoteFileSystem';
import { CreateFolderDTO } from './dtos/CreateFolderDTO';
import { UpdateFolderNameDTO } from './dtos/UpdateFolderNameDTO';

type NewServerFolder = Omit<ServerFolder, 'plain_name'> & { plainName: string };

@Service()
export class HttpRemoteFileSystem implements RemoteFileSystem {
  private static PAGE_SIZE = 50;
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
      const offset = page * HttpRemoteFileSystem.PAGE_SIZE;

      // eslint-disable-next-line no-await-in-loop
      const result = await this.trashClient.get(
        `${process.env.NEW_DRIVE_URL}/drive/folders/${parentId.value}/folders?offset=${offset}&limit=${HttpRemoteFileSystem.PAGE_SIZE}`
      );

      const founded = result.data.result as Array<NewServerFolder>;
      folders.push(...founded);
      lastNumberOfFolders = founded.length;

      page++;
    } while (
      folders.length % HttpRemoteFileSystem.PAGE_SIZE === 0 &&
      lastNumberOfFolders > 0
    );

    const name = folderPath.name();

    const folder = folders.find((folder) => folder.plainName === name);

    if (!folder) return;

    return Folder.from({
      ...folder,
      path: folderPath.value,
    });
  }

  async persist(
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
        return this.persist(path, parentId, uuid, attempt + 1);
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
