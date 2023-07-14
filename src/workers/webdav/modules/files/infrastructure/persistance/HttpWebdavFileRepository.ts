import { Axios } from 'axios';
import { FileCreatedResponseDTO } from 'shared/HttpClient/responses/file-created';
import { Nullable } from 'shared/types/Nullable';
import { ServerFile } from '../../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../../filesystems/domain/ServerFolder';
import { WebdavFile } from '../../domain/WebdavFile';
import { WebdavFileRepository } from '../../domain/WebdavFileRepository';
import * as uuid from 'uuid';
import { Traverser } from '../../../../modules/items/application/Traverser';
import { AddFileDTO } from './dtos/AddFileDTO';
import { UpdateFileParentDirDTO } from './dtos/UpdateFileParentDirDTO';
import { UpdateFileNameDTO } from './dtos/UpdateFileNameDTO';
import { FilePath } from '../../domain/FilePath';
import { WebdavIpc } from '../../../../ipc';
import { RemoteItemsGenerator } from '../../../items/application/RemoteItemsGenerator';
import { FileStatuses } from '../../domain/FileStatus';
import { Crypt } from '../../../shared/domain/Crypt';
import Logger from 'electron-log';
export class HttpWebdavFileRepository implements WebdavFileRepository {
  private files: Record<string, WebdavFile> = {};
  private optimisticFiles: Record<string, WebdavFile> = {};

  constructor(
    private readonly crypt: Crypt,
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly traverser: Traverser,
    private readonly bucket: string,
    private readonly ipc: WebdavIpc
  ) {}

  oldFileIsBeingUpdated(newFile: WebdavFile) {
    const oldFiles = Object.values(this.optimisticFiles);

    return oldFiles.find((oldFile) => oldFile.fileId === newFile.fileId)
      ? true
      : false;
  }

  cleanOptimisticFiles(newFile: WebdavFile) {
    const optimisticFiles = Object.values(this.optimisticFiles);

    const oldFile = optimisticFiles.find(
      (files) => files.fileId === newFile.fileId
    );

    if (oldFile && newFile.updatedAt.getTime() > oldFile?.updatedAt.getTime()) {
      delete this.optimisticFiles[oldFile.path.value];
      if (oldFile.lastPath?.value) {
        delete this.optimisticFiles[oldFile.lastPath?.value];
      }
    }
  }

  private async getTree(): Promise<{
    files: ServerFile[];
    folders: ServerFolder[];
  }> {
    const remoteItemsGenerator = new RemoteItemsGenerator(this.ipc);
    return remoteItemsGenerator.getAll();
  }

  public async init(): Promise<void> {
    const raw = await this.getTree();

    this.traverser.reset();
    const all = this.traverser.run(raw);

    const files = Object.entries(all).filter(([_key, value]) => {
      if (!value.isFile()) return;
      this.cleanOptimisticFiles(value);
      return (
        value.hasStatus(FileStatuses.EXISTS) &&
        !this.oldFileIsBeingUpdated(value)
      );
    }) as Array<[string, WebdavFile]>;

    const serverFiles = files.reduce((items, [key, value]) => {
      items[key] = value;
      return items;
    }, {} as Record<string, WebdavFile>);

    const filteredOptimisticFiles: Record<string, WebdavFile> = {};

    Object.keys(this.optimisticFiles).forEach((optimisticFolderPath) => {
      if (
        this.optimisticFiles[optimisticFolderPath].hasStatus(
          FileStatuses.EXISTS
        )
      ) {
        filteredOptimisticFiles[optimisticFolderPath] =
          this.optimisticFiles[optimisticFolderPath];
      }
    });
    this.files = {
      ...serverFiles,
      ...filteredOptimisticFiles,
    };

    Logger.info(
      'Optimistic files',
      JSON.stringify(filteredOptimisticFiles, null, 2)
    );
    Logger.info('Generated files', JSON.stringify(this.files, null, 2));
  }

  search(path: FilePath): Nullable<WebdavFile> {
    const item = this.files[path.value];

    if (!item) return;

    return WebdavFile.from(item.attributes());
  }

  async delete(file: WebdavFile): Promise<void> {
    try {
      const currentFile =
        this.files[file.path.value] || this.optimisticFiles[file.path.value];

      this.optimisticFiles[file.path.value] = currentFile.update({
        status: FileStatuses.TRASHED,
      });
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
        await this.ipc.invoke('START_REMOTE_SYNC');
      }
    } catch (error) {
      delete this.optimisticFiles[file.path.value];
      throw error;
    }
  }

  async add(file: WebdavFile): Promise<void> {
    try {
      this.optimisticFiles[file.path.value] = file;
      const encryptedName = this.crypt.encryptName(
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
          size: file.size,
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
        throw new Error('Invalid response creating file');
      }

      const created = WebdavFile.from({
        ...result.data,
        folderId: result.data.folder_id,
        size: parseInt(result.data.size, 10),
        path: file.path.value,
        status: FileStatuses.EXISTS,
      });

      this.optimisticFiles[file.path.value] = created;

      await this.ipc.invoke('START_REMOTE_SYNC');
    } catch (error) {
      delete this.optimisticFiles[file.path.value];

      throw error;
    }
  }

  async updateName(file: WebdavFile): Promise<void> {
    try {
      if (!file.lastPath)
        throw new Error('Cannot rename without knowing last file path');

      Logger.info(
        'Right now optimistic files: ',
        JSON.stringify(this.optimisticFiles, null, 2)
      );
      if (this.optimisticFiles[file.lastPath.value]) {
        delete this.optimisticFiles[file.lastPath.value];
      }
      this.optimisticFiles[file.path.value] = file;
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

      await this.ipc.invoke('START_REMOTE_SYNC');
    } catch (error) {
      delete this.optimisticFiles[file.path.value];
      throw error;
    }
  }

  async updateParentDir(item: WebdavFile): Promise<void> {
    try {
      this.optimisticFiles[item.path.value] = item;
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

      await this.ipc.invoke('START_REMOTE_SYNC');
    } catch (error) {
      delete this.optimisticFiles[item.path.value];
      throw error;
    }
  }

  async searchOnFolder(folderId: number): Promise<Array<WebdavFile>> {
    await this.init();
    return Object.values(this.files).filter((file) => file.hasParent(folderId));
  }
}
