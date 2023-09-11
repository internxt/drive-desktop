import { Axios } from 'axios';
import { FileCreatedResponseDTO } from 'shared/HttpClient/responses/file-created';
import { Nullable } from 'shared/types/Nullable';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import * as uuid from 'uuid';
import { Traverser } from '../../items/application/Traverser';
import { AddFileDTO } from './dtos/AddFileDTO';
import { UpdateFileParentDirDTO } from './dtos/UpdateFileParentDirDTO';
import { UpdateFileNameDTO } from './dtos/UpdateFileNameDTO';
import { FilePath } from '../domain/FilePath';
import { RemoteItemsGenerator } from '../../items/application/RemoteItemsGenerator';
import { FileStatuses } from '../domain/FileStatus';
import { Crypt } from '../../shared/domain/Crypt';
import { VirtualDriveIpc } from '../../../ipc';

export class HttpFileRepository implements FileRepository {
  public files: Record<string, File> = {};

  constructor(
    private readonly crypt: Crypt,
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly traverser: Traverser,
    private readonly bucket: string,
    private readonly ipc: VirtualDriveIpc
  ) {}

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

    const files = Object.entries(all).filter(
      ([_, value]) =>
        value instanceof File && value.hasStatus(FileStatuses.EXISTS)
    ) as Array<[string, File]>;

    this.files = files.reduce((items, [key, value]) => {
      items[key] = value;
      return items;
    }, {} as Record<string, File>);
  }

  search(path: FilePath): Nullable<File> {
    const item = this.files[path.value];

    if (!item) return;

    return File.from(item.attributes());
  }

  searchByPartial(partial: Partial<File>): Nullable<File> {
    const file = Object.values(this.files).find((file) => {
      const keys = Object.keys(partial) as Array<keyof Partial<File>>;

      return keys.every((key) => file[key] === partial[key]);
    });

    if (file) {
      return File.from(file.attributes());
    }

    return undefined;
  }

  async delete(file: File): Promise<void> {
    const result = await this.trashHttpClient.post(
      `${process.env.NEW_DRIVE_URL}/drive/storage/trash/add`,
      {
        items: [
          {
            type: 'file',
            id: file.contentsId,
          },
        ],
      }
    );

    if (result.status === 200) {
      await this.ipc.invoke('START_REMOTE_SYNC');
    }
  }

  async add(file: File): Promise<void> {
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
        fileId: file.contentsId,
        file_id: file.contentsId,
        folder_id: file.folderId,
        name: encryptedName,
        plain_name: file.name,
        size: file.size,
        type: file.type,
        modificationTime: Date.now(),
      },
    };

    const result = await this.httpClient.post<FileCreatedResponseDTO>(
      `${process.env.API_URL}/api/storage/file`,
      body
    );

    if (result.status === 500) {
      throw new Error('Invalid response creating file');
    }

    const created = File.from({
      ...result.data,
      contentsId: result.data.fileId,
      folderId: result.data.folder_id,
      size: parseInt(result.data.size, 10),
      path: file.path.value,
      status: FileStatuses.EXISTS,
    });

    this.files[file.path.value] = created;

    await this.ipc.invoke('START_REMOTE_SYNC');
  }

  async updateName(file: File): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/file/${file.contentsId}/meta`;

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

    const oldFileEntry = Object.entries(this.files).find(
      ([_, f]) => f.contentsId === file.contentsId && f.name !== file.name
    );

    if (oldFileEntry) {
      delete this.files[oldFileEntry[0]];
    }

    this.files[file.path.value] = File.from(file.attributes());

    await this.ipc.invoke('START_REMOTE_SYNC');
  }

  async updateParentDir(item: File): Promise<void> {
    const url = `${process.env.API_URL}/api/storage/move/file`;
    const body: UpdateFileParentDirDTO = {
      destination: item.folderId,
      fileId: item.contentsId,
    };

    const res = await this.httpClient.post(url, body);

    if (res.status !== 200) {
      throw new Error(`[REPOSITORY] Error moving item: ${res.status}`);
    }

    await this.init();

    await this.ipc.invoke('START_REMOTE_SYNC');
  }

  async searchOnFolder(folderId: number): Promise<Array<File>> {
    await this.init();
    return Object.values(this.files).filter((file) => file.hasParent(folderId));
  }
}
