import { Axios } from 'axios';
import Logger from 'electron-log';
import { ServerFile } from '../filesystems/domain/ServerFile';
import { ServerFolder } from '../filesystems/domain/ServerFolder';
import { Traverser } from './application/Traverser';
import crypt from '../utils/crypt';
import { ItemsIndexedByPath } from './domain/ItemsIndexedByPath';
import { Item } from './domain/Item';
import { XPath } from './domain/XPath';
import { XFolder } from './domain/Folder';
import { Nullable } from '../../shared/types/Nullable';

// TODO: ITEMS KEY SHOULD START WITH /
// EXAMPLE: /screenshot.png

export class ReadOnlyInMemoryRepository {
  private items: ItemsIndexedByPath = {};

  private readonly baseFolder: XFolder;

  private readonly remoteFilesTraverser: Traverser;

  constructor(
    private readonly httpClient: Axios,
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

    Logger.debug('ITEM SEARCHED: ', pathLike, JSON.stringify(item, null, 2));

    return item;
  }
}
