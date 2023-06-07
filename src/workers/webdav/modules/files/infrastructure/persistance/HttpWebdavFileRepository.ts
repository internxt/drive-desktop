import { Axios } from 'axios';
import { FileCreatedResponseDTO } from 'shared/HttpClient/responses/file-created';
import { Nullable } from 'shared/types/Nullable';
import { ServerFile } from '../../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../../filesystems/domain/ServerFolder';
import crypt from '../../../../../utils/crypt';
import { WebdavFile } from '../../domain/WebdavFile';
import { WebdavFileRepository } from '../../domain/WebdavFileRepository';
import * as uuid from 'uuid';
import { Traverser } from '../../../../modules/items/application/Traverser';
import Logger from 'electron-log';
import { AddFileDTO } from './dtos/AddFileDTO';
import { UpdateFileParentDirDTO } from './dtos/UpdateFileParentDirDTO';
import { UpdateFileNameDTO } from './dtos/UpdateFileNameDTO';

export class HttpWebdavFileRepository implements WebdavFileRepository {
  private items: Record<string, WebdavFile> = {};

  constructor(
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly traverser: Traverser,
    private readonly bucket: string
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
        // no empty
      }
    }

    return { files, folders };
  }

  public async init(): Promise<void> {
    const raw = await this.getTree();

    this.traverser.reset();
    const all = this.traverser.run(raw);

    const files = Object.entries(all).filter(([_key, value]) =>
      value.isFile()
    ) as Array<[string, WebdavFile]>;

    this.items = files.reduce((items, [key, value]) => {
      items[key] = value;
      return items;
    }, {} as Record<string, WebdavFile>);
  }

  search(pathLike: string): Nullable<WebdavFile> {
    const item = this.items[pathLike];

    return item;
  }

  async delete(file: WebdavFile): Promise<void> {
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
      delete this.items[file.path.value];
    }
  }

  async add(file: WebdavFile): Promise<void> {
    const encryptedName = crypt.encryptName(
      file.name,
      file.folderId.toString()
    );

    if (!encryptedName) {
      throw new Error('Failed to encrypt name');
    }

    const body: AddFileDTO = {
      file: {
        bucket: this.bucket,
        encrypt_version: '03-aes',
        fileId: file.fileId,
        file_id: file.fileId,
        folder_id: file.folderId,
        name: encryptedName,
        plain_name: file.name,
        size: file.size.value,
        type: file.type,
        modificationTime: Date.now(),
      },
    };

    // TODO: MAKE SURE ALL FIELDS ARE CORRECT
    const result = await this.httpClient.post<FileCreatedResponseDTO>(
      `${process.env.API_URL}/api/storage/file`,
      body
    );

    if (result.status === 500) {
      //rollback
    }

    const created = WebdavFile.from({
      ...result.data,
      folderId: result.data.folder_id,
      size: parseInt(result.data.size, 10),
      path: file.path.value,
    });

    this.items[file.path.value] = created;
  }

  async updateName(item: WebdavFile): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/file/${item.fileId}/meta`;

    const body: UpdateFileNameDTO = {
      metadata: { itemName: item.name },
      bucketId: this.bucket,
      relativePath: uuid.v4(),
    };

    const res = await this.httpClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(
        `[REPOSITORY] Error updating item metadata: ${res.status}`
      );
    }

    const oldFile = Object.values(this.items).filter(
      (file) => file.fileId === item.fileId
    )[0];

    if (oldFile) {
      delete this.items[oldFile.path.value];
    }

    this.items[item.path.value] = item;
  }

  async updateParentDir(item: WebdavFile): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/file`;
    const body: UpdateFileParentDirDTO = {
      destination: item.folderId,
      fileId: item.fileId,
    };

    const res = await this.httpClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    await this.init();
  }

  searchOnFolder(folderId: number): Array<WebdavFile> {
    return Object.values(this.items).filter((file) => file.hasParent(folderId));
  }
}
