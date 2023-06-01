import { Axios } from 'axios';
import { Nullable } from 'shared/types/Nullable';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { Traverser } from '../../items/application/Traverser';
import { FolderPath } from '../domain/FolderPath';
import { WebdavFolder, WebdavFolderAttributes } from '../domain/WebdavFolder';
import { WebdavFolderRepository } from '../domain/WebdavFolderRepository';
import Logger from 'electron-log';
import * as uuid from 'uuid';

export class HttpWebdavFolderRepository implements WebdavFolderRepository {
  private items: Record<string, WebdavFolder> = {};

  constructor(
    private readonly driveClient: Axios,
    private readonly trashClient: Axios,
    private readonly traverser: Traverser
  ) {}

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
        const response = await this.driveClient.get(
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
        // no empty
      }
    }

    return { files, folders };
  }

  public async init(): Promise<void> {
    try {
      const raw = await this.getTree();

      this.traverser.reset();
      const all = this.traverser.run(raw);

      const folders = Object.entries(all).filter(([_key, value]) =>
        value.isFolder()
      ) as Array<[string, WebdavFolder]>;

      this.items = folders.reduce((items, [key, value]) => {
        items[key] = value;
        return items;
      }, {} as Record<string, WebdavFolder>);
    } catch (err) {
      Logger.error('FOLDER ERRS', err);
    }
  }

  search(path: string): Nullable<WebdavFolder> {
    return this.items[path];
  }

  async create(path: FolderPath, parentId: number): Promise<WebdavFolder> {
    const plainName = path.name();

    if (!plainName) {
      throw new Error('Bad folder name');
    }

    const response = await this.driveClient.post(
      `${process.env.API_URL}/api/storage/folder`,
      {
        folderName: plainName,
        parentFolderId: parentId,
      }
    );

    if (response.status !== 201) {
      throw new Error('Folder creation failded');
    }

    const serverFolder = response.data as ServerFolder | null;

    if (!serverFolder) {
      throw new Error('Folder creation failded, no data returned');
    }

    const folder = WebdavFolder.create({
      id: serverFolder.id,
      name: plainName,
      parentId: serverFolder.parent_id,
      updatedAt: serverFolder.updated_at,
      createdAt: serverFolder.created_at,
      path: path.value,
    });

    this.items[path.value] = folder;

    await this.init();

    return folder;
  }

  async updateName(folder: WebdavFolder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/folder/${folder.id}/meta`;

    const res = await this.driveClient.post(url, {
      metadata: { itemName: folder.name },
      relativePath: uuid.v4(),
    });

    if (res.status !== 200) {
      throw new Error(
        `[REPOSITORY] Error updating item metadata: ${res.status}`
      );
    }

    delete this.items[folder.path.value];
    this.items[folder.path.value] = folder;
  }

  async updateParentDir(folder: WebdavFolder): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/folder`;

    const body = { destination: folder.parentId, folderId: folder.id };

    const res = await this.driveClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    this.items[folder.path.value] = folder;
  }

  searchOnFolder(folderId: WebdavFolderAttributes['id']): Array<WebdavFolder> {
    return Object.values(this.items).filter((folder) =>
      folder.hasParent(folderId)
    );
  }

  async trash(folder: WebdavFolder): Promise<void> {
    const result = await this.trashClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [{ type: 'folder', id: folder.id }],
      }
    );

    if (result.status === 200) {
      delete this.items[folder.path.value];
      return;
    }

    Logger.error(
      '[FOLDER REPOSITORY] Folder deletion failed with status: ',
      result.status,
      result.statusText
    );
  }
}
