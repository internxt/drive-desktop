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
import { AddFileDTO } from './dtos/AddFileDTO';
import { UpdateFileParentDirDTO } from './dtos/UpdateFileParentDirDTO';
import { UpdateFileNameDTO } from './dtos/UpdateFileNameDTO';
import { FilePath } from '../../domain/FilePath';
import { ipc } from '../../../../ipc';

export class HttpWebdavFileRepository implements WebdavFileRepository {
  private files: Record<string, WebdavFile> = {};

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
    const updatedRemoteItems = await ipc.invoke('GET_UPDATED_REMOTE_ITEMS');

    const files = updatedRemoteItems.files.map<ServerFile>((updatedFile) => {
      return {
        bucket: updatedFile.bucket,
        createdAt: updatedFile.createdAt,
        encrypt_version: '03-aes',
        fileId: updatedFile.fileId,
        folderId: updatedFile.folderId,
        id: updatedFile.id,
        modificationTime: updatedFile.modificationTime,
        name: updatedFile.name,
        size: updatedFile.size,
        type: updatedFile.type ?? null,
        updatedAt: updatedFile.updatedAt,
        userId: updatedFile.userId,
      };
    });

    const folders = updatedRemoteItems.folders.map<ServerFolder>(
      (updatedFolder) => {
        return {
          bucket: updatedFolder.bucket ?? null,
          created_at: updatedFolder.createdAt,
          id: updatedFolder.id,
          name: updatedFolder.name,
          parent_id: updatedFolder.parentId ?? null,
          updated_at: updatedFolder.updatedAt,
          plain_name: updatedFolder.plainName ?? null,
        };
      }
    );

    return { files, folders };
  }

  public async init(): Promise<void> {
    const raw = await this.getTree();

    this.traverser.reset();
    const all = this.traverser.run(raw);

    const files = Object.entries(all).filter(([_key, value]) =>
      value.isFile()
    ) as Array<[string, WebdavFile]>;

    this.files = files.reduce((items, [key, value]) => {
      items[key] = value;
      return items;
    }, {} as Record<string, WebdavFile>);
  }

  search(path: FilePath): Nullable<WebdavFile> {
    const item = this.files[path.value];

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
      delete this.files[file.path];
      await ipc.invoke('START_REMOTE_SYNC');
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
      path: file.path,
    });

    this.files[file.path] = created;

    await ipc.invoke('START_REMOTE_SYNC');
  }

  async updateName(file: WebdavFile): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/file/${file.fileId}/meta`;

    const body: UpdateFileNameDTO = {
      metadata: { itemName: file.name },
      bucketId: this.bucket,
      relativePath: uuid.v4(),
    };

    const res = await this.httpClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(
        `[REPOSITORY] Error updating item metadata: ${res.status}`
      );
    }

    const oldFile = Object.values(this.files).filter(
      (f) => f.fileId === file.fileId
    )[0];

    if (oldFile) {
      delete this.files[oldFile.path];
    }

    this.files[file.path] = file;

    await ipc.invoke('START_REMOTE_SYNC');
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

    await ipc.invoke('START_REMOTE_SYNC');
  }

  async searchOnFolder(folderId: number): Promise<Array<WebdavFile>> {
    await this.init();
    return Object.values(this.files).filter((file) => file.hasParent(folderId));
  }
}
