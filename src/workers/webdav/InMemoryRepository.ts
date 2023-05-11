import { Axios } from 'axios';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { Environment } from '@internxt/inxt-js';
import path from 'path';
import { ServerFile } from '../filesystems/domain/ServerFile';
import { ServerFolder } from '../filesystems/domain/ServerFolder';
import { Traverser } from './application/Traverser';
import crypt from '../utils/crypt';
import { ItemsIndexedByPath } from './domain/ItemsIndexedByPath';
import { Item } from './domain/Item';
import { XPath } from './domain/XPath';
import { XFolder } from './domain/Folder';
import { Nullable } from '../../shared/types/Nullable';

export class InMemoryRepository {
  private items: ItemsIndexedByPath = {};

  private temporalFiles: Record<string, TemporalItem> = {};

  private temporalFolders: Record<string, TemporalItem> = {};

  private readonly baseFolder: XFolder;

  private readonly remoteFilesTraverser: Traverser;

  constructor(
    private readonly httpClient: Axios,
    private readonly environment: Environment,
    private readonly baseFolderId: number
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
          item.bucket,
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

  createFile(filePath: string) {
    this.temporalFiles[filePath] = new TemporalItem(filePath);
  }

  getParentFolder(itemPath: string): Nullable<number> {
    const itemPaths = itemPath.split('/');
    itemPaths.splice(itemPaths.length - 1, 1);
    const parentFolderPath = itemPaths.join('/');

    const item = this.items[parentFolderPath];

    if (item.isFile()) {
      throw new Error(`${itemPath} is not a folder`);
    }

    if (item.isFolder()) {
      return item.id;
    }

    throw new Error(`Could not retrive the folder containing ${itemPath}`);
  }

  async createFolder(folderPath: string, parentFolderId: number) {
    const plainName = folderPath.split('/').at(-1);
    const response = await this.httpClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      {
        folderName: plainName,
        parentFolderId,
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
}

class TemporalItem {
  constructor(private readonly filePath: string) {}
}
