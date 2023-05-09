import { Axios } from 'axios';
import Logger from 'electron-log';
import { ServerFile } from '../filesystems/domain/ServerFile';
import { ServerFolder } from '../filesystems/domain/ServerFolder';
import { RemoteFilesTraverser } from './RemoteFilesTraverser';

type Item = {
  id: number;
  parentId: number;
  isFolder: boolean;
  bucket: string | null;
  fileId?: string;
  folderId?: number;
  modificationTime?: number;
  size?: number;
};

type Items = Record<string, Item>;

// TODO: ITEMS KEY SHOULD START WITH /
// EXAMPLE: /screenshot.png

export class ReadOnlyRemoteRepository {
  private items: Items = {};

  private readonly remoteFilesTraverser: RemoteFilesTraverser;

  constructor(private readonly httpClient: Axios, baseFolderId: number) {
    this.remoteFilesTraverser = new RemoteFilesTraverser(baseFolderId);
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

  get(pathLike: string): Array<string> {
    // Logger.debug(JSON.stringify(this.items, null, 2));

    const fix = pathLike.startsWith('/') ? pathLike.slice(1) : pathLike;

    const item = this.items[fix];

    if (pathLike === '/') {
      // TODO: IMPROVE THIS CHECK
      const names = Object.keys(this.items).filter(
        (name: string) => !name.includes('/')
      );

      return names;
    }

    if (item.isFolder) {
      const files = Object.entries(this.items)
        .filter(([_, data]) => {
          return data.parentId === item.id;
        })
        .map(([name, _]) => name);

      return files;
    }

    return [];
  }

  getMetadata(pathLike: string): Item {
    // Logger.debug('ITEMS', JSON.stringify(this.items, null, 2));
    const fix = pathLike.startsWith('/') ? pathLike.slice(1) : pathLike;
    return this.items[fix];
  }
}
