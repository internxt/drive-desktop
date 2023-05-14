import { Axios } from 'axios';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { Environment } from '@internxt/inxt-js';
import { ServerFile } from '../filesystems/domain/ServerFile';
import { ServerFolder } from '../filesystems/domain/ServerFolder';
import { Traverser } from './application/Traverser';
import crypt from '../utils/crypt';
import { ItemsIndexedByPath } from './domain/ItemsIndexedByPath';
import { Item } from './domain/Item';
import { XPath } from './domain/XPath';
import { XFolder } from './domain/Folder';
import { Nullable } from '../../shared/types/Nullable';
import { XFile } from './domain/File';
import { FileCreatedResponseDTO } from '../../shared/HttpClient/responses/file-created';

export class InMemoryRepository {
  private items: ItemsIndexedByPath = {};

  private readonly baseFolder: XFolder;

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
      const names = Object.values(this.items)
        .filter((i) => i.hasParent(this.baseFolderId))
        .map((i) => i.name);

      return names;
    }

    const item = this.items[folderPath];

    if (!item.isFolder()) {
      throw new Error(`${folderPath} is not a folder`);
    }

    const files = Object.values(this.items)
      .filter((f) => {
        return f.hasParent(item.id);
      })
      .map((f) => f.name);

    return files;
  }

  getItem(pathLike: string): Nullable<Item> {
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
    const parentFolderPath = itemPaths.join('/');

    const item = this.items[parentFolderPath];

    if (item.isFile()) {
      throw new Error(`${itemPath} is not a folder`);
    }

    if (item.isFolder()) {
      return item;
    }

    throw new Error(`Could not retrive the folder containing ${itemPath}`);
  }

  async createFolder(folderPath: string, parentFolder: XFolder) {
    const plainName = folderPath.split('/').at(-1);
    const response = await this.httpClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      {
        folderName: plainName,
        parentFolderId: parentFolder.id,
      }
    );

    const created = response.data as ServerFolder;

    this.items[folderPath] = XFolder.from({
      id: created.id,
      name: folderPath,
      parentId: created.parent_id,
      updatedAt: created.updated_at,
      createdAt: created.created_at,
    });
  }

  async deleteFolder(item: XFolder): Promise<void> {
    const result = await this.trashHttpClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id: item.id }],
      }
    );

    if (result.status === 200) {
      Logger.debug('[REPOSITORY] FOLDER DELETED');
      delete this.items[item.name.value];
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

    const created = XFile.from({
      ...result.data,
      folderId: result.data.folder_id,
      size: parseInt(result.data.size, 10),
    });

    this.items[filePath] = created;
  }
}

class TemporalItem {
  constructor(private readonly filePath: string) {}
}
