import { Axios } from 'axios';
import { FileCreatedResponseDTO } from 'shared/HttpClient/responses/file-created';
import { Nullable } from 'shared/types/Nullable';
import { File } from '../../domain/File';
import { FileRepository } from '../../domain/FileRepository';
import * as uuid from 'uuid';
import { AddFileDTO } from './dtos/AddFileDTO';
import { UpdateFileParentDirDTO } from './dtos/UpdateFileParentDirDTO';
import { UpdateFileNameDTO } from './dtos/UpdateFileNameDTO';
import { Crypt } from '../../../shared/domain/Crypt';
import { VirtualDriveIpc } from '../../../../ipc';

export class HttpFileRepository implements FileRepository {
  constructor(
    private readonly crypt: Crypt,
    private readonly httpClient: Axios,
    private readonly trashHttpClient: Axios,
    private readonly bucket: string,
    private readonly ipc: VirtualDriveIpc
  ) {}

  async searchByUuid(uuid: string): Promise<Nullable<File>> {
    const driveFile = await this.ipc.invoke('GET_FILE_BY_UUID', uuid);

    if (!driveFile) return;

    return File.from({
      contentsId: driveFile.fileId,
      name: driveFile.name,
      type: driveFile.type,
      folderId: driveFile.folderId,
      createdAt: driveFile.createdAt,
      modificationTime: driveFile.modificationTime,
      size: driveFile.size,
      updatedAt: driveFile.updatedAt,
      status: driveFile.status,
    });
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
        type: file.extension,
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

    await this.ipc.invoke('START_REMOTE_SYNC');
  }
}
