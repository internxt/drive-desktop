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
import { InMemoryTemporalFileMetadataCollection } from './InMemoryTemporalFileMetadataCollection';
import Logger from 'electron-log';
export class HttpWebdavFileRepository implements WebdavFileRepository {
  private files: Record<string, WebdavFile> = {};

  constructor(
    private readonly crypt: Crypt,
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly traverser: Traverser,
    private readonly bucket: string,
    private readonly ipc: WebdavIpc,
    private readonly inMemoryItems: InMemoryTemporalFileMetadataCollection
  ) {}

  private async cleanInMemoryFileIfNeeded(
    path: string,
    serverFile: WebdavFile
  ) {
    const inMemoryFile = this.inMemoryItems.get(path);

    const keepInMemoryItem = inMemoryFile?.visible === false;

    if (
      !keepInMemoryItem &&
      inMemoryFile &&
      inMemoryFile.updatedAt <= serverFile.updatedAt.getTime()
    ) {
      Logger.info(
        `Removing in memory file with a server file at ${path}, InMemory updated at ${new Date(
          inMemoryFile.updatedAt
        ).toISOString()}, server updated at ${serverFile.updatedAt.toISOString()} `
      );
      this.inMemoryItems.remove(path);
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

    const files = Object.entries(all).filter(([_, value]) => {
      if (!value.isFile()) return false;
      return value.hasStatus(FileStatuses.EXISTS);
    }) as Array<[string, WebdavFile]>;

    const serverFiles = files.reduce((items, [path, value]) => {
      this.cleanInMemoryFileIfNeeded(path, value);
      const existsInMemory = this.inMemoryItems.exists(path);

      if (existsInMemory) {
        return items;
      }
      items[path] = value;
      return items;
    }, {} as Record<string, WebdavFile>);

    const inMemoryFiles = this.inMemoryItems.getAllByType('FILE');

    const filteredInMemoryFiles: Record<string, WebdavFile> = {};

    Object.keys(inMemoryFiles).forEach((path) => {
      const inMemoryFile = inMemoryFiles[path];

      if (!inMemoryFile.visible) return;

      filteredInMemoryFiles[path] = WebdavFile.from({
        // temporary_file means this file is being created and doesn't exist yet in the server
        fileId: inMemoryFile.externalMetadata?.fileId || 'temporary_file',
        folderId: inMemoryFile.externalMetadata?.folderId || -1,
        createdAt: new Date(inMemoryFile.createdAt).toISOString(),
        modificationTime: new Date(inMemoryFile.updatedAt).toISOString(),
        path,
        size: inMemoryFile.size,
        updatedAt: new Date(inMemoryFile.updatedAt).toISOString(),
        status: FileStatuses.EXISTS,
      });
    });

    this.files = {
      ...serverFiles,
      ...filteredInMemoryFiles,
    };
  }

  search(path: FilePath): Nullable<WebdavFile> {
    const item = this.files[path.value];

    if (!item) return;

    return WebdavFile.from(item.attributes());
  }

  async delete(file: WebdavFile): Promise<void> {
    await this.trashHttpClient.post(
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
  }

  async add(file: WebdavFile): Promise<void> {
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
  }

  async updateName(file: WebdavFile): Promise<void> {
    if (!file.lastPath)
      throw new Error('Cannot rename without knowing last file path');

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

  async searchOnFolder(folderId: number): Promise<Array<WebdavFile>> {
    await this.init();
    return Object.values(this.files).filter((file) => file.hasParent(folderId));
  }
}
