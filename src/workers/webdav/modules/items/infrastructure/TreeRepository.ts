import { Axios } from 'axios';
import Logger from 'electron-log';
import * as uuid from 'uuid';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import crypt from '../../../../utils/crypt';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FileCreatedResponseDTO } from '../../../../../shared/HttpClient/responses/file-created';
import { ItemRepository } from '../domain/ItemRepository';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavPath } from '../../shared/domain/WebdavPath';
import { Traverser } from '../application/Traverser';
import { ItemsIndexedByPath } from '../domain/ItemsIndexedByPath';

/** @deprecated */
export class TreeRepository implements ItemRepository {
  private items: ItemsIndexedByPath = {};

  private readonly remoteFilesTraverser: Traverser;

  constructor(
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly baseFolderId: number,
    private readonly bucket: string
  ) {
    this.remoteFilesTraverser = new Traverser(crypt, baseFolderId);
  }

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const PAGE_SIZE = 5000;

    let thereIsMore = true;
    let offset = 0;

    const files: ServerFile[] = [];
    const folders: ServerFolder[] = [];

    while (thereIsMore) {
      try {
        const response = await this.httpClient.get(
          `${process.env.API_URL}/api/desktop/list/${offset}`
        );

        const batch = response.data;

        // We can't use spread operator with big arrays
        // see: https://anchortagdev.com/range-error-maximum-call-stack-size-exceeded-error-using-spread-operator-in-node-js-javascript/

        for (const file of batch.files)
          files.push({ ...file, size: parseInt(file.size, 10) });

        for (const folder of batch.folders) folders.push(folder);

        thereIsMore = batch.folders.length === PAGE_SIZE;

        if (thereIsMore) offset += PAGE_SIZE;
      } catch (err) {
        Logger.log('[READ ONLY REPO] ERR: ', JSON.stringify(err, null, 2));
      }
    }

    return { files, folders };
  }

  public async init(): Promise<void> {
    const raw = await this.getTree();

    Logger.info(
      'Tree retrived with ',
      raw.files.length,
      ' files and ',
      raw.folders.length,
      ' folders'
    );

    this.remoteFilesTraverser.reset();
    this.items = this.remoteFilesTraverser.run(raw);
  }

  listContents(folderPath: string): Array<WebdavPath> {
    Logger.debug('LIST CONTENTS: ', folderPath);

    if (folderPath === '/') {
      const paths = Object.values(this.items)
        .filter((i) => i.hasParent(this.baseFolderId))
        .map((i) => i.path);

      return paths;
    }

    const item = this.items[folderPath];

    if (!item.isFolder()) {
      throw new Error(`${folderPath} is not a folder`);
    }

    const files = Object.values(this.items)
      .filter((f) => {
        return f.hasParent(item.id);
      })
      .map((f) => f.path);

    return files;
  }

  searchItem(pathLike: string): Nullable<WebdavFile | WebdavFolder> {
    Logger.debug('REPO SEARCHING ', pathLike);

    const item = this.items[pathLike];

    return item;
  }

  searchParentFolder(itemPath: string): Nullable<WebdavFolder> {
    const itemPaths = itemPath.split('/');
    itemPaths.splice(itemPaths.length - 1, 1);
    const parentFolderPath = itemPaths.join('/') || '/';

    Logger.error('[Repository] path', parentFolderPath);
    const item = this.searchItem(parentFolderPath);

    if (!item) {
      return;
    }

    Logger.error('[Repository] item', JSON.stringify(item));

    if (item.isFile()) {
      throw new Error(`${itemPath} is not a folder`);
    }

    if (item.isFolder()) {
      return item;
    }

    Logger.error('[Repository] Folder not found');

    throw new Error(`Could not retrive the folder containing ${itemPath}`);
  }

  async createFolder(folderPath: string, parentFolder: WebdavFolder) {
    const plainName = folderPath.split('/').at(-1);

    if (!plainName) {
      throw new Error('Bad folder name');
    }

    const response = await this.httpClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      {
        folderName: plainName,
        parentFolderId: parentFolder.id,
      }
    );

    Logger.debug(JSON.stringify(response, null, 2));

    Logger.debug(
      'CREATED FOLDER STATUS: ',
      response.status,
      response.statusText
    );

    const created = response.data as ServerFolder | null;

    if (!created) {
      Logger.debug('[FOLDER CREATED] NULL');
      throw new Error('Folder not created');
    }

    Logger.debug('CREATED FOLDER', JSON.stringify(created, null, 2));

    this.items[folderPath] = WebdavFolder.from({
      id: created.id,
      name: plainName,
      parentId: created.parent_id,
      updatedAt: created.updated_at,
      createdAt: created.created_at,
      path: folderPath,
    });

    Logger.debug('CREATE FOLDER FINISHED');
  }

  async deleteFolder(item: WebdavFolder): Promise<void> {
    const result = await this.trashHttpClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id: item.id }],
      }
    );

    if (result.status === 200) {
      Logger.debug('[REPOSITORY] FOLDER DELETED');
      delete this.items[item.path.value];
      return;
    }

    Logger.error(
      '[REPOSITORY] FOLDER DELETION FAILED WITH STATUS: ',
      result.status,
      result.statusText
    );
  }

  async deleteFile(file: WebdavFile): Promise<void> {
    const result = await this.trashHttpClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [
          {
            type: 'file',
            id: file.fileId,
          },
        ],
      }
    );

    if (result.status === 200) {
      Logger.debug('[REPOSITORY] FILE DELETED');
      delete this.items[file.path.value];
    }
  }

  async addFile(file: WebdavFile): Promise<void> {
    const encryptedName = crypt.encryptName(
      file.name,
      file.folderId.toString()
    );

    Logger.debug('[REPOSITORY]', JSON.stringify(file, null, 2));

    // TODO: MAKE SURE ALL FIELDS ARE CORRECT
    const result = await this.httpClient.post<FileCreatedResponseDTO>(
      `${process.env.API_URL}/api/storage/file`,
      {
        file: {
          bucket: this.bucket,
          encrypt_version: '03-aes',
          fileId: file.fileId,
          file_id: file.fileId,
          folder_id: file.folderId,
          name: encryptedName,
          plain_name: file.name,
          size: file.size,
          type: file.type,
          modificationTime: Date.now(),
        },
      }
    );

    if (result.status === 500) {
      //rollback
    }

    Logger.debug(JSON.stringify(result));

    const created = WebdavFile.from({
      ...result.data,
      folderId: result.data.folder_id,
      size: parseInt(result.data.size, 10),
      path: file.path.value,
    });

    this.items[file.path.value] = created;
  }

  async updateName(item: WebdavFile | WebdavFolder): Promise<void> {
    const url = item.isFile()
      ? `${process.env.API_URL}/api/storage/file/${item.fileId}/meta`
      : `${process.env.API_URL}/api/storage/folder/${item.id}/meta`;

    const res = await this.httpClient.post(url, {
      metadata: { itemName: item.name },
      bucketId: this.bucket,
      relativePath: uuid.v4(),
    });

    if (res.status !== 200) {
      throw new Error(
        `[REPOSITORY] Error updating item metadata: ${res.status}`
      );
    }

    delete this.items[item.path.value];
    this.items[item.path.value] = item;
  }

  async updateParentDir(item: WebdavFile | WebdavFolder): Promise<void> {
    const request = item.isFile()
      ? {
          url: `${process.env.API_URL}/api/storage/move/file`,
          body: { destination: item.folderId, fileId: item.fileId },
        }
      : {
          url: `${process.env.API_URL}/api/storage/move/folder`,
          body: { destination: item.parentId, folderId: item.id },
        };

    const res = await this.httpClient.post(request.url, request.body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    this.items[item.path.value] = item;
  }

  deleteCachedItem(file: WebdavFile | WebdavFolder): void {
    delete this.items[file.path.value];
  }
}
