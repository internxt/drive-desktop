import { Axios } from 'axios';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { Environment } from '@internxt/inxt-js';
import * as uuid from 'uuid';
import { ServerFile } from '../filesystems/domain/ServerFile';
import { ServerFolder } from '../filesystems/domain/ServerFolder';
import { Traverser } from './application/Traverser';
import crypt from '../utils/crypt';
import { ItemsIndexedByPath } from './domain/ItemsIndexedByPath';
import { XPath } from './domain/XPath';
import { XFolder } from './domain/Folder';
import { Nullable } from '../../shared/types/Nullable';
import { XFile } from './domain/File';
import { FileCreatedResponseDTO } from '../../shared/HttpClient/responses/file-created';

export class Repository {
  private items: ItemsIndexedByPath = {};

  public readonly baseFolder: XFolder;

  private readonly remoteFilesTraverser: Traverser;

  constructor(
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly environment: Environment,
    private readonly baseFolderId: number,
    private readonly bucket: string
  ) {
    this.remoteFilesTraverser = new Traverser(crypt, baseFolderId);
    this.baseFolder = XFolder.from({
      id: baseFolderId,
      name: '/',
      path: '/',
      parentId: null,
      updatedAt: new Date().toDateString(),
      createdAt: new Date().toDateString(),
    });
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

        for (const file of batch.files) files.push(file);

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

    this.items = this.remoteFilesTraverser.run(raw);
  }

  listContents(folderPath: string): Array<XPath> {
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

  getItem(pathLike: string): Nullable<XFile | XFolder> {
    if (pathLike === '/') {
      return this.baseFolder;
    }
    const item = this.items[pathLike];

    return item;
  }

  getReadable(filePath: string): Promise<Nullable<Readable>> {
    const item = this.items[filePath];

    if (!item) return Promise.resolve(undefined);

    if (item.isFile()) {
      return new Promise((resolve, reject) => {
        this.environment.download(
          this.bucket,
          item.fileId,
          {
            progressCallback: (progess: number) => {
              Logger.debug('[PROGESS] FILE: ', item.name, progess);
            },
            finishedCallback: async (err: any, stream: Readable) => {
              if (err) {
                Logger.debug('[REPO] ERR: ', err);
                reject(err);
              } else {
                resolve(stream);
              }
            },
          },
          {
            label: 'Dynamic',
            params: {
              useProxy: false,
              concurrency: 10,
            },
          }
        );
      });
    }

    return Promise.resolve(undefined);
  }

  getParentFolder(itemPath: string): Nullable<XFolder> {
    const itemPaths = itemPath.split('/');
    itemPaths.splice(itemPaths.length - 1, 1);
    const parentFolderPath = itemPaths.join('/') || '/';

    Logger.error('[Repository] path', parentFolderPath);
    const item = this.getItem(parentFolderPath);

    if (!item) {
      return;
    }

    Logger.error('[Repository] item', JSON.stringify(item));

    if (item.isFile()) {
      Logger.error('[Repository] XXX');
      throw new Error(`${itemPath} is not a folder`);
    }

    if (item.isFolder()) {
      return item;
    }

    Logger.error('[Repository] Folder not found');

    throw new Error(`Could not retrive the folder containing ${itemPath}`);
  }

  async createFolder(folderPath: string, parentFolder: XFolder) {
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

    this.items[folderPath] = XFolder.from({
      id: created.id,
      name: plainName,
      parentId: created.parent_id,
      updatedAt: created.updated_at,
      createdAt: created.created_at,
      path: folderPath,
    });

    Logger.debug('CREATE FOLDER FINISHED');
  }

  async deleteFolder(item: XFolder): Promise<void> {
    const result = await this.trashHttpClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id: item.id }],
      }
    );

    Logger.debug(JSON.stringify(result));

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

  async deleteFile(item: XFile): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async addFile(
    filePath: string,
    file: {
      fileId: string;
      folderId: number;
      createdAt: Date;
      name: string;
      size: number;
      type: string;
      updatedAt: Date;
    },
    parentItem: XFolder
  ): Promise<void> {
    Logger.debug('[REPOSIOTRY] ADD: ', JSON.stringify(file, null, 2));
    const encryptedName = crypt.encryptName(
      file.name,
      parentItem.id.toString()
    );

    // TODO: MAKE SURE ALL FIELDS ARE CORRECT
    const result = await this.httpClient.post<FileCreatedResponseDTO>(
      `${process.env.API_URL}/api/storage/file`,
      {
        file: {
          bucket: this.bucket,
          encrypt_version: '03-aes',
          fileId: file.fileId,
          file_id: file.fileId,
          folder_id: parentItem.id,
          name: encryptedName,
          plain_name: file.name,
          size: file.size,
          type: file.type,
          modificationTime: Date.now(),
        },
      }
    );

    Logger.debug('RESULT', JSON.stringify(result, null, 2));

    const created = XFile.from({
      ...result.data,
      folderId: result.data.folder_id,
      size: parseInt(result.data.size, 10),
      path: filePath,
    });

    this.items[filePath] = created;
  }

  async updateName(item: XFile | XFolder): Promise<void> {
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

  async updateParentDir(item: XFile | XFolder): Promise<void> {
    const request = item.isFile()
      ? {
          url: `${process.env.API_URL}/api/storage/move/file`,
          body: { destination: item.folderId, fileId: item.fileId },
        }
      : {
          url: `${process.env.API_URL}/api/storage/move/folder`,
          body: { destination: item.parentId, folderId: item.id },
        };

    Logger.debug('MAKING THE CHANGE');

    const res = await this.httpClient.post(request.url, request.body);

    Logger.debug('CHANGE DONE', res.status, res.statusText);
    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    delete this.items[item.path.value];
    this.items[item.path.value] = item;
  }
}

class TemporalItem {
  constructor(private readonly filePath: string) {}
}
